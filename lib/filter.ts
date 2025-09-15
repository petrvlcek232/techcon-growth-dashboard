import { CustomerSummary, CustomerMonthly, MonthId } from './types';
import { CustomerTrendFilterValue } from '@/components/CustomerTrendFilter';

// Filtruje měsíční data podle rozsahu období
export function filterMonthsByRange(
  months: CustomerMonthly[],
  startMonth: MonthId | null,
  endMonth: MonthId | null
): CustomerMonthly[] {
  if (!startMonth && !endMonth) {
    return months;
  }

  return months.filter(month => {
    if (startMonth && month.period < startMonth) return false;
    if (endMonth && month.period > endMonth) return false;
    return true;
  });
}

// Vypočítá metriky pro zákazníka v daném období
export function calculateCustomerMetricsForPeriod(
  customer: CustomerSummary,
  startMonth: MonthId | null,
  endMonth: MonthId | null
): {
  totalRevenue: number;
  totalProfit: number;
  avgMarginPct: number | null;
  hasActivity: boolean;
} {
  const filteredMonths = filterMonthsByRange(customer.months, startMonth, endMonth);
  
  const totalRevenue = filteredMonths.reduce((sum, m) => sum + m.revenue, 0);
  const totalProfit = filteredMonths.reduce((sum, m) => sum + m.profit, 0);
  
  // Výpočet váženého průměru marže
  const monthsWithMargin = filteredMonths.filter(m => m.marginPct !== null && m.revenue > 0);
  let avgMarginPct: number | null = null;
  
  if (monthsWithMargin.length > 0) {
    const totalRevenueWithMargin = monthsWithMargin.reduce((sum, m) => sum + m.revenue, 0);
    if (totalRevenueWithMargin > 0) {
      const weightedSum = monthsWithMargin.reduce((sum, m) => sum + (m.marginPct! * m.revenue), 0);
      avgMarginPct = weightedSum / totalRevenueWithMargin;
    }
  }
  
  const hasActivity = totalRevenue > 0;
  
  return {
    totalRevenue,
    totalProfit,
    avgMarginPct,
    hasActivity
  };
}

// Vypočítá agregované metriky pro skupinu zákazníků v daném období
export function calculateAggregatedMetrics(
  customers: CustomerSummary[],
  startMonth: MonthId | null,
  endMonth: MonthId | null
): {
  totalRevenue: number;
  totalProfit: number;
  avgMarginPct: number | null;
  activeCustomers: number;
  growingCustomers: number;
  decliningCustomers: number;
  stableCustomers: number;
} {
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalRevenueForMargin = 0;
  let weightedMarginSum = 0;
  let activeCustomers = 0;
  let growingCustomers = 0;
  let decliningCustomers = 0;
  let stableCustomers = 0;

  customers.forEach(customer => {
    const metrics = calculateCustomerMetricsForPeriod(customer, startMonth, endMonth);
    
    totalRevenue += metrics.totalRevenue;
    totalProfit += metrics.totalProfit;
    
    if (metrics.hasActivity) {
      activeCustomers++;
      
      if (metrics.avgMarginPct !== null) {
        weightedMarginSum += metrics.avgMarginPct * metrics.totalRevenue;
        totalRevenueForMargin += metrics.totalRevenue;
      }
      
      // Vypočítáme trend pro vybrané období
      const trendData = calculateTrendForFiltering(customer, startMonth, endMonth);
      if (trendData.trend === 'UP') growingCustomers++;
      else if (trendData.trend === 'DOWN') decliningCustomers++;
      else stableCustomers++;
    }
  });

  const avgMarginPct = totalRevenueForMargin > 0 
    ? weightedMarginSum / totalRevenueForMargin 
    : null;

  return {
    totalRevenue,
    totalProfit,
    avgMarginPct,
    activeCustomers,
    growingCustomers,
    decliningCustomers,
    stableCustomers
  };
}

// Pomocná funkce pro výpočet trendu pouze pro filtrování
export function calculateTrendForFiltering(
  customer: CustomerSummary,
  startMonth: MonthId | null,
  endMonth: MonthId | null
): {
  trend: "UP" | "DOWN" | "FLAT";
  percentage: number | null;
} {
  // Najdi skutečné období zákazníka (kdy začal a skončil mít tržby)
  const customerActiveMonths = customer.months.filter(m => m.revenue > 0);
  
  if (customerActiveMonths.length < 2) {
    return { trend: "FLAT", percentage: null };
  }
  
  const customerFirstMonth = customerActiveMonths[0].period;
  const customerLastMonth = customerActiveMonths[customerActiveMonths.length - 1].period;
  
  // Urči skutečné období pro výpočet
  let actualStartMonth: MonthId;
  let actualEndMonth: MonthId;
  
  if (startMonth && endMonth) {
    // Pokud je vybráno konkrétní období, použij ho
    actualStartMonth = startMonth;
    actualEndMonth = endMonth;
  } else {
    // Pokud je "Vše-Vše", použij skutečné období zákazníka
    actualStartMonth = customerFirstMonth;
    actualEndMonth = customerLastMonth;
  }
  
  // Najdi aktivní měsíce v tomto období
  const filteredMonths = filterMonthsByRange(customer.months, actualStartMonth, actualEndMonth);
  const activeMonths = filteredMonths.filter(m => m.revenue > 0);
  
  if (activeMonths.length < 2) {
    return { trend: "FLAT", percentage: null };
  }
  
  const firstMonth = activeMonths[0];
  const lastMonth = activeMonths[activeMonths.length - 1];
  
  if (firstMonth.revenue <= 0) {
    return { trend: "FLAT", percentage: null };
  }
  
  const percentage = (lastMonth.revenue / firstMonth.revenue - 1) * 100;
  
  let trend: "UP" | "DOWN" | "FLAT";
  if (percentage >= 0.1) {
    trend = "UP";
  } else if (percentage <= -0.1) {
    trend = "DOWN";
  } else {
    trend = "FLAT";
  }
  
  return { trend, percentage };
}

// Filtruje a řadí zákazníky podle trendového filtru
export function filterAndSortCustomersByTrend(
  customers: CustomerSummary[],
  trendFilter: CustomerTrendFilterValue,
  startMonth: MonthId | null,
  endMonth: MonthId | null
): CustomerSummary[] {
  // Nejprve vypočítáme metriky pro všechny zákazníky v daném období
  const customersWithMetrics = customers.map(customer => {
    const metrics = calculateCustomerMetricsForPeriod(customer, startMonth, endMonth);
    const trendData = calculateTrendForFiltering(customer, startMonth, endMonth);
    return {
      customer,
      metrics,
      trendData
    };
  }).filter(item => item.metrics.hasActivity);

  // Pak aplikujeme trendový filtr a řadíme podle procent
  let filteredCustomers: typeof customersWithMetrics;
  
  switch (trendFilter) {
    case 'growing-desc':
      filteredCustomers = customersWithMetrics
        .filter(item => item.trendData.trend === 'UP')
        .sort((a, b) => (b.trendData.percentage || 0) - (a.trendData.percentage || 0));
      break;
      
    case 'growing-asc':
      filteredCustomers = customersWithMetrics
        .filter(item => item.trendData.trend === 'UP')
        .sort((a, b) => (a.trendData.percentage || 0) - (b.trendData.percentage || 0));
      break;
      
    case 'declining-desc':
      filteredCustomers = customersWithMetrics
        .filter(item => item.trendData.trend === 'DOWN')
        .sort((a, b) => (a.trendData.percentage || 0) - (b.trendData.percentage || 0)); // Nejméně záporné -> nejvíce záporné
      break;
      
    case 'declining-asc':
      filteredCustomers = customersWithMetrics
        .filter(item => item.trendData.trend === 'DOWN')
        .sort((a, b) => (b.trendData.percentage || 0) - (a.trendData.percentage || 0)); // Nejvíce záporné -> nejméně záporné
      break;
      
    case 'name-asc':
      filteredCustomers = customersWithMetrics
        .sort((a, b) => a.customer.name.localeCompare(b.customer.name, 'cs'));
      break;
      
    case 'name-desc':
      filteredCustomers = customersWithMetrics
        .sort((a, b) => b.customer.name.localeCompare(a.customer.name, 'cs'));
      break;
      
    case 'all':
    default:
      filteredCustomers = customersWithMetrics
        .sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue); // Defaultně seřazeno od největšího
      break;
  }
  
  return filteredCustomers.map(item => item.customer);
}
