import { MonthId } from './types';
import { CustomerTrendFilterValue } from '@/components/CustomerTrendFilter';

// Klíče pro localStorage
const STORAGE_KEYS = {
  START_MONTH: 'abc-dily-start-month',
  END_MONTH: 'abc-dily-end-month',
  TREND_FILTER: 'abc-dily-trend-filter',
  DATA_OVERVIEW_MINIMIZED: 'abc-dily-data-overview-minimized',
  REVENUE_CARD_MINIMIZED: 'abc-dily-revenue-card-minimized',
  PROFIT_CARD_MINIMIZED: 'abc-dily-profit-card-minimized',
  MARGIN_CARD_MINIMIZED: 'abc-dily-margin-card-minimized',
  CUSTOMER_LIST_MINIMIZED: 'abc-dily-customer-list-minimized',
  MONTHLY_DETAIL_MINIMIZED: 'abc-dily-monthly-detail-minimized',
  SUPPLIER_TABLE_MINIMIZED: 'abc-dily-supplier-table-minimized',
} as const;

// Načtení uloženého období z localStorage
export function loadStoredDateRange(): {
  startMonth: MonthId | null;
  endMonth: MonthId | null;
} {
  if (typeof window === 'undefined') {
    return { startMonth: null, endMonth: null };
  }

  try {
    const startMonth = localStorage.getItem(STORAGE_KEYS.START_MONTH);
    const endMonth = localStorage.getItem(STORAGE_KEYS.END_MONTH);
    
    return {
      startMonth: (startMonth === 'null' || startMonth === null) ? null : (startMonth as MonthId),
      endMonth: (endMonth === 'null' || endMonth === null) ? null : (endMonth as MonthId),
    };
  } catch (error) {
    console.warn('Chyba při načítání uloženého období:', error);
    return { startMonth: null, endMonth: null };
  }
}

// Uložení vybraného období do localStorage
export function saveDateRange(startMonth: MonthId | null, endMonth: MonthId | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.START_MONTH, startMonth || 'null');
    localStorage.setItem(STORAGE_KEYS.END_MONTH, endMonth || 'null');
  } catch (error) {
    console.warn('Chyba při ukládání období:', error);
  }
}

// Načtení uloženého trendového filtru
export function loadStoredTrendFilter(): CustomerTrendFilterValue {
  if (typeof window === 'undefined') {
    return 'all';
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TREND_FILTER) as CustomerTrendFilterValue | null;
    return stored || 'all';
  } catch (error) {
    console.warn('Chyba při načítání trendového filtru:', error);
    return 'all';
  }
}

// Uložení trendového filtru
export function saveTrendFilter(filter: CustomerTrendFilterValue): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.TREND_FILTER, filter);
  } catch (error) {
    console.warn('Chyba při ukládání trendového filtru:', error);
  }
}

// Načtení stavu minimalizace karty
export function loadCardMinimizedState(key: keyof typeof STORAGE_KEYS): boolean {
  if (typeof window === 'undefined') {
    return false; // Výchozí stav je rozbalené (false = není minimalizované)
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS[key]);
    if (stored === null) {
      return false; // Pokud není uloženo, výchozí stav je rozbalené
    }
    return stored === 'true';
  } catch (error) {
    console.warn('Chyba při načítání stavu karty:', error);
    return false; // Výchozí stav je rozbalené
  }
}

// Uložení stavu minimalizace karty
export function saveCardMinimizedState(key: keyof typeof STORAGE_KEYS, minimized: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEYS[key], minimized.toString());
  } catch (error) {
    console.warn('Chyba při ukládání stavu karty:', error);
  }
}

// Vymazání uloženého období
export function clearStoredDateRange(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEYS.START_MONTH);
    localStorage.removeItem(STORAGE_KEYS.END_MONTH);
    localStorage.removeItem(STORAGE_KEYS.TREND_FILTER);
  } catch (error) {
    console.warn('Chyba při mazání dat:', error);
  }
}
