'use client';

import { CustomerSummary, MonthId } from '@/lib/types';
import { formatCurrencyCZK, formatPct } from '@/lib/format';
import { calculateCustomerMetricsForPeriod, calculateTrendForFiltering } from '@/lib/filter';
import { TrendBadge } from './TrendBadge';
import { Sparkline } from './Sparkline';
import { Card, CardContent } from '@/src/components/ui/card';
import { useMemo } from 'react';

interface CustomerRowProps {
  customer: CustomerSummary;
  startMonth: MonthId | null;
  endMonth: MonthId | null;
  onClick: () => void;
}

export function CustomerRow({ customer, startMonth, endMonth, onClick }: CustomerRowProps) {
  // Vypočítáme metriky pro vybrané období
  const periodMetrics = useMemo(() => {
    return calculateCustomerMetricsForPeriod(customer, startMonth, endMonth);
  }, [customer, startMonth, endMonth]);

  // Vypočítáme trend pro filtrování (s procenty)
  const trendData = useMemo(() => {
    return calculateTrendForFiltering(customer, startMonth, endMonth);
  }, [customer, startMonth, endMonth]);

  // Filtrované měsíce pro výpočet delt a sparkline
  const filteredMonths = useMemo(() => {
    return customer.months.filter(month => {
      if (startMonth && month.period < startMonth) return false;
      if (endMonth && month.period > endMonth) return false;
      return true;
    });
  }, [customer.months, startMonth, endMonth]);

  // Delta pro filtrované období
  const firstActiveMonth = filteredMonths.find(m => m.revenue > 0);
  const lastActiveMonth = [...filteredMonths].reverse().find(m => m.revenue > 0);
  
  let periodDelta = 0;
  if (firstActiveMonth && lastActiveMonth && firstActiveMonth.period !== lastActiveMonth.period) {
    periodDelta = lastActiveMonth.revenue - firstActiveMonth.revenue;
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2 flex-wrap">
              <h3 className="font-medium text-gray-900 break-words">
                {customer.name}
              </h3>
              <TrendBadge 
                trend={trendData.trend} 
                percentage={trendData.percentage} 
              />
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
              <div>
                <span className="font-medium">{formatCurrencyCZK(periodMetrics.totalRevenue)}</span>
                {periodDelta !== 0 && (
                  <span className={`ml-1 ${periodDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({periodDelta > 0 ? '+' : ''}{formatCurrencyCZK(periodDelta)})
                  </span>
                )}
              </div>
              
              {periodMetrics.avgMarginPct !== null && (
                <div>
                  Marže: <span className="font-medium">{formatPct(periodMetrics.avgMarginPct)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-20 h-12 flex-shrink-0">
            <Sparkline data={customer.months} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
