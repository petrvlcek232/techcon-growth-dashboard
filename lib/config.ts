// Mapování názvů sloupců a konfigurace
export const COLUMN_MAPPING = {
  customer: ['odběratel', 'odberatel', 'customer', 'zakaznik', 'zákazník'],
  revenue: ['obrat výdej zboží bez dph', 'obrat vydej zbozi bez dph', 'obrat', 'revenue', 'tržby', 'trzby', 'bez dph', 'bez_dph', 'obrat/výdej', 'obrat/vydej'],
  profit: ['zisk', 'profit', 'výsledek', 'vysledek', 'zisk výdej', 'zisk vydej'],
  marginPct: ['marže %', 'marze %', 'marže', 'marze', 'margin', 'margin %', 'margin%', 'marže/výdej', 'marze/vydej']
} as const;

// Mapování pro dodavatele
export const SUPPLIER_COLUMN_MAPPING = {
  supplier: ['dodavatel', 'supplier', 'firma', 'název', 'nazev', 'zkratka'],
  turnover: ['obrat', 'turnover', 'tržby', 'trzby', 'částka', 'castka', 'suma'],
  items: ['položky', 'polozky', 'items', 'ks', 'počet', 'pocet', 'množství', 'mnozstvi']
} as const;

export const DATA_DIR = 'data/dvur';
export const SUPPLIER_DATA_DIR = 'data/dodavatele';
export const PROCESSED_DATA_PATH = 'public/data/processed.json';
export const PROCESSED_SUPPLIER_DATA_PATH = 'public/data/suppliers.json';

// Regex pro parsování názvů souborů
export const FILENAME_PATTERNS = [
  /(\d{2})[\._-]?(\d{2})/,  // 24_01, 24.01, 24-01
  /(\d{4})[\._-]?(\d{2})/,  // 2024_01, 2024.01, 2024-01
] as const;

// Thresholdy pro klasifikaci trendů
export const TREND_THRESHOLDS = {
  UP: 5,    // >= +5%
  DOWN: -5, // <= -5%
} as const;
