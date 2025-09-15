import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { z } from 'zod';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { RawMonthlyRow, AggregatedData, MonthId } from './types';
import { COLUMN_MAPPING, DATA_DIR } from './config';
import { normalizeHeader, parseNumberCz, parsePeriodFromFilename } from './format';
import { aggregateData } from './compute';

// Zod schéma pro validaci řádků
const RawRowSchema = z.object({
  customer: z.string().min(1),
  revenue: z.number().min(0),
  profit: z.number(),
  marginPct: z.number().min(0).max(100),
  period: z.string().regex(/^\d{4}-\d{2}$/) as z.ZodType<MonthId>,
});

// Mapování sloupců na základě normalizovaných hlaviček
function mapColumns(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    
    // Najdi odpovídající sloupec
    for (const [key, patterns] of Object.entries(COLUMN_MAPPING)) {
      if (patterns.some(pattern => normalized.includes(pattern))) {
        mapping[key] = index;
        break;
      }
    }
  });
  
  return mapping;
}

// Parsování Excel souboru
async function parseExcelFile(filePath: string): Promise<RawMonthlyRow[]> {
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
    const mapping = mapColumns(headers);
    
    
    if (mapping.customer === undefined || mapping.revenue === undefined) {
      console.warn(`Chybí povinné sloupce v souboru ${filePath}:`, headers);
      return [];
    }
    
    const period = parsePeriodFromFilename(filePath);
    if (!period) {
      console.warn(`Nelze parsovat období z názvu souboru ${filePath}`);
      return [];
    }
    
    const rows: RawMonthlyRow[] = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      if (!row || row.length === 0) continue;
      
      try {
        const customer = String(row[mapping.customer] || '').trim();
        if (!customer) continue;
        
        const revenue = parseNumberCz(row[mapping.revenue] || 0);
        const profit = mapping.profit !== undefined ? parseNumberCz(row[mapping.profit] || 0) : 0;
        const marginPct = mapping.marginPct !== undefined ? parseNumberCz(row[mapping.marginPct] || 0) : 0;
        
        const rawRow: RawMonthlyRow = {
          customer,
          revenue,
          profit,
          marginPct,
          period: period as MonthId,
        };
        
        // Validace přes Zod
        const validatedRow = RawRowSchema.parse(rawRow);
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

// Parsování CSV souboru
async function parseCsvFile(filePath: string): Promise<RawMonthlyRow[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    return new Promise((resolve) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn(`Chyby při parsování CSV ${filePath}:`, results.errors);
          }
          
          const headers = Object.keys(results.data[0] || {});
          const mapping = mapColumns(headers);
          
          if (mapping.customer === undefined || mapping.revenue === undefined) {
            console.warn(`Chybí povinné sloupce v CSV souboru ${filePath}:`, headers);
            resolve([]);
            return;
          }
          
          const period = parsePeriodFromFilename(filePath);
          if (!period) {
            console.warn(`Nelze parsovat období z názvu souboru ${filePath}`);
            resolve([]);
            return;
          }
          
          const rows: RawMonthlyRow[] = [];
          
          (results.data as any[]).forEach((row, index) => {
            try {
              const customer = String(row[headers[mapping.customer]] || '').trim();
              if (!customer) return;
              
              const revenue = parseNumberCz(row[headers[mapping.revenue]] || 0);
              const profit = mapping.profit !== undefined ? parseNumberCz(row[headers[mapping.profit]] || 0) : 0;
              const marginPct = mapping.marginPct !== undefined ? parseNumberCz(row[headers[mapping.marginPct]] || 0) : 0;
              
              const rawRow: RawMonthlyRow = {
                customer,
                revenue,
                profit,
                marginPct,
                period: period as MonthId,
              };
              
              const validatedRow = RawRowSchema.parse(rawRow);
              rows.push(validatedRow);
              
            } catch (error) {
              console.warn(`Chyba při parsování řádku ${index + 1} v CSV souboru ${filePath}:`, error);
            }
          });
          
          resolve(rows);
        }
      });
    });
    
  } catch (error) {
    console.error(`Chyba při čtení CSV souboru ${filePath}:`, error);
    return [];
  }
}

// Seznam souborů v adresáři
async function listFiles(dir: string): Promise<string[]> {
  try {
    const files = await readdir(dir);
    return files.filter(file => 
      /\.(xls|xlsx|csv)$/i.test(file)
    );
  } catch (error) {
    console.error(`Chyba při čtení adresáře ${dir}:`, error);
    return [];
  }
}

// Hlavní funkce pro ingest dat
export async function ingestDirectory(dir: string = DATA_DIR): Promise<AggregatedData> {
  console.log(`Spouštím ingest z adresáře: ${dir}`);
  
  const files = await listFiles(dir);
  console.log(`Nalezeno ${files.length} souborů:`, files);
  
  if (files.length === 0) {
    console.warn('Žádné soubory k ingestování');
    return {
      monthsAvailable: [],
      customers: [],
      generatedAt: new Date().toISOString(),
    };
  }
  
  const allRows: RawMonthlyRow[] = [];
  const processedFiles: string[] = [];
  
  for (const file of files) {
    const filePath = join(dir, file);
    console.log(`Zpracovávám soubor: ${file}`);
    
    let rows: RawMonthlyRow[] = [];
    
    if (/\.(xls|xlsx)$/i.test(file)) {
      rows = await parseExcelFile(filePath);
    } else if (/\.csv$/i.test(file)) {
      rows = await parseCsvFile(filePath);
    }
    
    if (rows.length > 0) {
      allRows.push(...rows);
      processedFiles.push(file);
      console.log(`Úspěšně zpracováno ${rows.length} řádků z ${file}`);
    } else {
      console.warn(`Žádné platné řádky v souboru ${file}`);
    }
  }
  
  console.log(`Celkem zpracováno ${allRows.length} řádků z ${processedFiles.length} souborů`);
  
  // Agregace dat
  const aggregatedData = aggregateData(allRows);
  
  console.log(`Ingest dokončen. Zpracováno ${aggregatedData.customers.length} zákazníků pro ${aggregatedData.monthsAvailable.length} měsíců`);
  
  return aggregatedData;
}
