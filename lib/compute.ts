import { sortBy, groupBy, sum } from 'lodash';
import { RawMonthlyRow, CustomerSummary, CustomerMonthly, AggregatedData, MonthId } from './types';
import { TREND_THRESHOLDS } from './config';
import { slugify } from './format';

// Výpočet trendu na základě procentuální změny
function calculateTrend(deltaPct: number | null, deltaAbs: number, firstValue: number): "UP" | "DOWN" | "FLAT" {
  if (deltaPct === null) {
    // Speciální případy pro nové zákazníky
    if (firstValue === 0 && deltaAbs > 0) return "UP";
    if (firstValue > 0 && deltaAbs < 0) return "DOWN";
    return "FLAT";
  }
  
  if (deltaPct >= TREND_THRESHOLDS.UP) return "UP";
  if (deltaPct <= TREND_THRESHOLDS.DOWN) return "DOWN";
  return "FLAT";
}

// Výpočet váženého průměru marže podle revenue
function calculateWeightedMargin(months: CustomerMonthly[]): number | null {
  const validMonths = months.filter(m => m.marginPct !== null && m.revenue > 0);
  
  if (validMonths.length === 0) return null;
  
  const totalRevenue = sum(validMonths.map(m => m.revenue));
  if (totalRevenue === 0) return null;
  
  const weightedSum = sum(validMonths.map(m => m.marginPct! * m.revenue));
  return weightedSum / totalRevenue;
}

// Doplní chybějící měsíce s nulovými hodnotami
function fillMissingMonths(
  customerMonths: CustomerMonthly[],
  allMonths: MonthId[]
): CustomerMonthly[] {
  const monthMap = new Map(customerMonths.map(m => [m.period, m]));
  
  return allMonths.map(period => {
    const existing = monthMap.get(period);
    if (existing) return existing;
    
    return {
      period,
      revenue: 0,
      profit: 0,
      marginPct: null,
    };
  });
}

// Výpočet metrik pro jednoho zákazníka
function calculateCustomerMetrics(
  customerName: string,
  months: CustomerMonthly[],
  allMonths: MonthId[]
): CustomerSummary {
  const filledMonths = fillMissingMonths(months, allMonths);
  
  // Najdi první a poslední měsíc s aktivitou
  const activeMonths = filledMonths.filter(m => m.revenue > 0);
  const firstMonth = activeMonths.length > 0 ? activeMonths[0].period : null;
  const lastMonth = activeMonths.length > 0 ? activeMonths[activeMonths.length - 1].period : null;
  
  // Celkové sumy
  const totalRevenue = sum(filledMonths.map(m => m.revenue));
  const totalProfit = sum(filledMonths.map(m => m.profit));
  const avgMarginPct = calculateWeightedMargin(filledMonths);
  
  // Výpočet delt
  let revenueDeltaAbs = 0;
  let revenueDeltaPct: number | null = null;
  let profitDeltaAbs = 0;
  let profitDeltaPct: number | null = null;
  
  if (firstMonth && lastMonth && firstMonth !== lastMonth) {
    const firstMonthData = filledMonths.find(m => m.period === firstMonth)!;
    const lastMonthData = filledMonths.find(m => m.period === lastMonth)!;
    
    revenueDeltaAbs = lastMonthData.revenue - firstMonthData.revenue;
    profitDeltaAbs = lastMonthData.profit - firstMonthData.profit;
    
    if (firstMonthData.revenue > 0) {
      revenueDeltaPct = (lastMonthData.revenue / firstMonthData.revenue - 1) * 100;
    }
    
    if (firstMonthData.profit !== 0) {
      profitDeltaPct = (lastMonthData.profit / firstMonthData.profit - 1) * 100;
    }
  }
  
  // Klasifikace trendů
  const revenueTrend = calculateTrend(revenueDeltaPct, revenueDeltaAbs, activeMonths[0]?.revenue || 0);
  const profitTrend = calculateTrend(profitDeltaPct, profitDeltaAbs, activeMonths[0]?.profit || 0);
  
  return {
    slug: slugify(customerName),
    name: customerName,
    firstMonth,
    lastMonth,
    months: filledMonths,
    totalRevenue,
    totalProfit,
    avgMarginPct,
    revenueDeltaAbs,
    revenueDeltaPct,
    profitDeltaAbs,
    profitDeltaPct,
    revenueTrend,
    profitTrend,
  };
}

// Hlavní funkce pro agregaci dat
export function aggregateData(rawRows: RawMonthlyRow[]): AggregatedData {
  if (rawRows.length === 0) {
    return {
      monthsAvailable: [],
      customers: [],
      generatedAt: new Date().toISOString(),
    };
  }
  
  // Seřaď měsíce vzestupně
  const allMonths = sortBy(
    Array.from(new Set(rawRows.map(r => r.period))),
    (month: MonthId) => month
  );
  
  // Seskupení podle zákazníků
  const customerGroups = groupBy(rawRows, 'customer');
  
  // Výpočet metrik pro každého zákazníka
  const customers: CustomerSummary[] = Object.entries(customerGroups).map(([customerName, rows]) => {
    const months: CustomerMonthly[] = rows.map(row => ({
      period: row.period,
      revenue: row.revenue,
      profit: row.profit,
      marginPct: row.marginPct,
    }));
    
    return calculateCustomerMetrics(customerName, months, allMonths);
  });
  
  // Vytvoř unikátní slugy
  const usedSlugs = new Set<string>();
  customers.forEach(customer => {
    const baseSlug = customer.slug;
    let finalSlug = baseSlug;
    let counter = 1;
    
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    usedSlugs.add(finalSlug);
    customer.slug = finalSlug;
  });
  
  // Seřaď zákazníky podle celkového revenue (sestupně)
  const sortedCustomers = sortBy(customers, c => -c.totalRevenue);
  
  return {
    monthsAvailable: allMonths,
    customers: sortedCustomers,
    generatedAt: new Date().toISOString(),
  };
}
