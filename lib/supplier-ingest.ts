import * as XLSX from 'xlsx';
import { z } from 'zod';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { RawSupplierRow, SupplierData, MonthId, SupplierSummary, SupplierMonthly } from './types.js';
import { SUPPLIER_COLUMN_MAPPING, SUPPLIER_DATA_DIR } from './config.js';
import { normalizeHeader, parseNumberCz, parsePeriodFromFilename } from './format.js';

// Zod schéma pro validaci řádků dodavatelů
const RawSupplierRowSchema = z.object({
  supplier: z.string().min(1),
  turnover: z.number().min(0),
  items: z.number().min(0),
  period: z.string().regex(/^\d{4}-\d{2}$/) as z.ZodType<MonthId>,
});

// Mapování sloupců pro dodavatele
function mapSupplierColumns(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    
    // Najdi odpovídající sloupec
    for (const [key, patterns] of Object.entries(SUPPLIER_COLUMN_MAPPING)) {
      if (patterns.some(pattern => normalized.includes(pattern))) {
        mapping[key] = index;
        break;
      }
    }
  });
  
  return mapping;
}

// Parsování Excel souboru pro dodavatele
async function parseSupplierExcelFile(filePath: string): Promise<RawSupplierRow[]> {
  try {
    const buffer = await readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.warn(`Žádný list v souboru ${filePath}`);
      return [];
    }
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      console.warn(`Příliš málo řádků v souboru ${filePath}`);
      return [];
    }
    
    const headers = (jsonData[0] as string[]).map(h => String(h || ''));
    const mapping = mapSupplierColumns(headers);
    
    if (mapping.supplier === undefined || mapping.turnover === undefined) {
      console.warn(`Chybí povinné sloupce v souboru ${filePath}:`, headers);
      return [];
    }
    
    const filename = filePath.split('/').pop() || '';
    const period = parsePeriodFromFilename(filename);
    if (!period) {
      console.warn(`Nelze parsovat období z názvu souboru ${filePath}`);
      return [];
    }
    
    const rows: RawSupplierRow[] = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];
      if (!row || row.length === 0) continue;
      
      try {
        const supplier = String(row[mapping.supplier] || '').trim();
        if (!supplier) continue;
        
        const turnover = parseNumberCz(String(row[mapping.turnover] || 0));
        const items = mapping.items !== undefined ? parseNumberCz(String(row[mapping.items] || 0)) : 0;
        
        const rawRow: RawSupplierRow = {
          supplier,
          turnover,
          items,
          period: period as MonthId,
        };
        
        // Validace přes Zod
        const validatedRow = RawSupplierRowSchema.parse(rawRow);
        rows.push(validatedRow);
        
      } catch (error) {
        console.warn(`Chyba při parsování řádku ${i + 1} v souboru ${filePath}:`, error);
      }
    }
    
    return rows;
    
  } catch (error) {
    console.error(`Chyba při čtení Excel souboru ${filePath}:`, error);
    return [];
  }
}

// Seznam souborů v adresáři
async function listSupplierFiles(dir: string): Promise<string[]> {
  try {
    const files = await readdir(dir);
    return files.filter(file => 
      /\.(xls|xlsx)$/i.test(file)
    );
  } catch (error) {
    console.error(`Chyba při čtení adresáře ${dir}:`, error);
    return [];
  }
}

// Vytvoření slug z názvu dodavatele
function createSupplierSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// Agregace dat dodavatelů
function aggregateSupplierData(rows: RawSupplierRow[]): SupplierData {
  const supplierMap = new Map<string, SupplierMonthly[]>();
  const monthsSet = new Set<MonthId>();
  
  // Seskupení dat podle dodavatele
  rows.forEach(row => {
    if (!supplierMap.has(row.supplier)) {
      supplierMap.set(row.supplier, []);
    }
    
    supplierMap.get(row.supplier)!.push({
      period: row.period,
      turnover: row.turnover,
      items: row.items,
    });
    
    monthsSet.add(row.period);
  });
  
  const monthsAvailable = Array.from(monthsSet).sort();
  
  // Vytvoření sumarizovaných dat pro každého dodavatele
  const suppliers: SupplierSummary[] = [];
  const usedSlugs = new Set<string>();
  
  supplierMap.forEach((months, supplierName) => {
    // Seřazení měsíců
    months.sort((a, b) => a.period.localeCompare(b.period));
    
    const firstMonth = months[0]?.period || null;
    const lastMonth = months[months.length - 1]?.period || null;
    
    // Výpočet celkových hodnot
    const totalTurnover = months.reduce((sum, m) => sum + m.turnover, 0);
    const totalItems = months.reduce((sum, m) => sum + m.items, 0);
    const avgItemsPerMonth = months.length > 0 ? totalItems / months.length : 0;
    
    // Výpočet trendů
    const firstNonZero = months.find(m => m.turnover > 0);
    const lastNonZero = months.slice().reverse().find(m => m.turnover > 0);
    
    const turnoverDeltaAbs = lastNonZero && firstNonZero ? lastNonZero.turnover - firstNonZero.turnover : 0;
    const turnoverDeltaPct = firstNonZero && firstNonZero.turnover > 0 
      ? (turnoverDeltaAbs / firstNonZero.turnover) * 100 
      : null;
    
    const firstItemsNonZero = months.find(m => m.items > 0);
    const lastItemsNonZero = months.slice().reverse().find(m => m.items > 0);
    
    const itemsDeltaAbs = lastItemsNonZero && firstItemsNonZero ? lastItemsNonZero.items - firstItemsNonZero.items : 0;
    const itemsDeltaPct = firstItemsNonZero && firstItemsNonZero.items > 0 
      ? (itemsDeltaAbs / firstItemsNonZero.items) * 100 
      : null;
    
    // Klasifikace trendů
    const turnoverTrend = turnoverDeltaPct === null ? "FLAT" : 
      turnoverDeltaPct >= 5 ? "UP" : 
      turnoverDeltaPct <= -5 ? "DOWN" : "FLAT";
    
    const itemsTrend = itemsDeltaPct === null ? "FLAT" : 
      itemsDeltaPct >= 5 ? "UP" : 
      itemsDeltaPct <= -5 ? "DOWN" : "FLAT";
    
    // Vytvoření zkratky (první slova názvu)
    const abbreviation = supplierName
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    
    // Vytvoření unikátního slug
    let slug = createSupplierSlug(supplierName);
    let counter = 1;
    while (usedSlugs.has(slug)) {
      slug = `${createSupplierSlug(supplierName)}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);
    
    suppliers.push({
      slug,
      name: supplierName,
      abbreviation,
      firstMonth,
      lastMonth,
      months,
      totalTurnover,
      totalItems,
      avgItemsPerMonth,
      turnoverDeltaAbs,
      turnoverDeltaPct,
      itemsDeltaAbs,
      itemsDeltaPct,
      turnoverTrend,
      itemsTrend,
    });
  });
  
  // Seřazení podle celkového obratu
  suppliers.sort((a, b) => b.totalTurnover - a.totalTurnover);
  
  return {
    monthsAvailable,
    suppliers,
    generatedAt: new Date().toISOString(),
  };
}

// Hlavní funkce pro ingest dat dodavatelů
export async function ingestSupplierDirectory(dir: string = SUPPLIER_DATA_DIR): Promise<SupplierData> {
  console.log(`Spouštím ingest dodavatelů z adresáře: ${dir}`);
  
  const files = await listSupplierFiles(dir);
  console.log(`Nalezeno ${files.length} souborů:`, files);
  
  if (files.length === 0) {
    console.warn('Žádné soubory k ingestování');
    return {
      monthsAvailable: [],
      suppliers: [],
      generatedAt: new Date().toISOString(),
    };
  }
  
  const allRows: RawSupplierRow[] = [];
  const processedFiles: string[] = [];
  
  for (const file of files) {
    const filePath = join(dir, file);
    console.log(`Zpracovávám soubor: ${file}`);
    
    const rows = await parseSupplierExcelFile(filePath);
    
    allRows.push(...rows);
    processedFiles.push(file);
    if (rows.length > 0) {
      console.log(`Úspěšně zpracováno ${rows.length} řádků z ${file}`);
    } else {
      console.warn(`Žádné platné řádky v souboru ${file} - všechny řádky měly chyby v datech`);
    }
  }
  
  console.log(`Celkem zpracováno ${allRows.length} řádků z ${processedFiles.length} souborů`);
  
  // Agregace dat
  const aggregatedData = aggregateSupplierData(allRows);
  
  console.log(`Ingest dodavatelů dokončen. Zpracováno ${aggregatedData.suppliers.length} dodavatelů pro ${aggregatedData.monthsAvailable.length} měsíců`);
  
  return aggregatedData;
}
