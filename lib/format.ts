import { MonthId } from './types';

// Normalizace hlaviček - odstraní diakritiku, převede na lowercase, odstraní mezery a nové řádky
export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // odstraní diakritiku
    .replace(/\s+/g, '') // odstraní mezery a nové řádky
    .replace(/\n/g, '') // explicitně odstraní nové řádky
    .trim();
}

// Parsování čísel s podporou českých formátů (čárky, tečky, oddělovače tisíců)
export function parseNumberCz(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  
  const str = String(value).trim();
  if (str === '' || str === '-') return 0;
  
  // Pokud je to už číslo, vrať ho
  if (!isNaN(Number(str))) {
    return Number(str);
  }
  
  // Odstraní oddělovače tisíců (mezery, tečky na začátku)
  let cleaned = str.replace(/\s/g, '').replace(/\.(?=\d{3})/g, '');
  
  // Nahradí poslední čárku tečkou (desetinný oddělovač)
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length === 2) {
      cleaned = parts[0] + '.' + parts[1];
    }
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Formátování měny v CZK
export function formatCurrencyCZK(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Formátování procent
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('cs-CZ', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

// Formátování čísel bez měny
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('cs-CZ').format(value);
}

// Vytvoření slug z názvu zákazníka
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // odstraní diakritiku
    .replace(/[^a-z0-9\s-]/g, '') // odstraní speciální znaky
    .replace(/\s+/g, '-') // mezery na pomlčky
    .replace(/-+/g, '-') // více pomlček na jednu
    .replace(/^-|-$/g, ''); // odstraní pomlčky na začátku/konci
}

// Parsování období z názvu souboru
export function parsePeriodFromFilename(filename: string): MonthId | null {
  const name = filename.toLowerCase().replace(/\.(xls|xlsx|csv)$/, '');
  
  // Pattern pro formát MM_YYYY (01_2024)
  const monthYearPattern = /^(\d{2})[\._-](\d{4})$/;
  const monthYearMatch = name.match(monthYearPattern);
  if (monthYearMatch) {
    const month = monthYearMatch[1];
    const year = monthYearMatch[2];
    const monthNum = parseInt(month, 10);
    if (monthNum >= 1 && monthNum <= 12) {
      return `${year}-${month.padStart(2, '0')}` as MonthId;
    }
  }
  
  // Původní patterny pro zpětnou kompatibilitu
  for (const pattern of [/^dvur[\._-]?(\d{2})[\._-]?(\d{2})$/, /(\d{2})[\._-]?(\d{2})/, /(\d{4})[\._-]?(\d{2})/]) {
    const match = name.match(pattern);
    if (match) {
      let year: string, month: string;
      
      if (match[1].length === 4) {
        // 2024-01 format
        year = match[1];
        month = match[2];
      } else {
        // 24-01 format
        year = '20' + match[1];
        month = match[2];
      }
      
      // Validace měsíce
      const monthNum = parseInt(month, 10);
      if (monthNum >= 1 && monthNum <= 12) {
        return `${year}-${month.padStart(2, '0')}` as MonthId;
      }
    }
  }
  
  return null;
}

// Porovnání názvů bez diakritiky (pro vyhledávání)
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
