'use client';

import { CustomerSummary, MonthId } from '@/lib/types';
import { formatCurrencyCZK, formatPct } from '@/lib/format';
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
  // Filtrované měsíce pro výpočet delt
  const filteredMonths = useMemo(() => {
    return customer.months.filter(month => {
      if (startMonth && month.period < startMonth) return false;
      if (endMonth && month.period > endMonth) return false;
      return true;
    });
  }, [customer.months, startMonth, endMonth]);

  // Výpočet delt pro filtrované období
  const filteredRevenue = filteredMonths.reduce((sum, m) => sum + m.revenue, 0);
  const filteredProfit = filteredMonths.reduce((sum, m) => sum + m.profit, 0);

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
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-gray-900 truncate">
                {customer.name}
              </h3>
              <TrendBadge trend={customer.revenueTrend} />
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">{formatCurrencyCZK(filteredRevenue)}</span>
                {periodDelta !== 0 && (
                  <span className={`ml-1 ${periodDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({periodDelta > 0 ? '+' : ''}{formatCurrencyCZK(periodDelta)})
                  </span>
                )}
              </div>
              
              {customer.avgMarginPct !== null && (
                <div>
                  Marže: <span className="font-medium">{formatPct(customer.avgMarginPct)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="ml-4 w-24">
            <Sparkline data={customer.months} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
