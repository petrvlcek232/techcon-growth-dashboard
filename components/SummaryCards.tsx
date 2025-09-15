'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { CustomerSummary, MonthId } from '@/lib/types';
import { formatCurrencyCZK, formatPct } from '@/lib/format';
import { calculateAggregatedMetrics } from '@/lib/filter';
import { TrendingUp, TrendingDown, Users, DollarSign, Percent } from 'lucide-react';

interface SummaryCardsProps {
  customers: CustomerSummary[];
  filteredCustomers: CustomerSummary[];
  startMonth: MonthId | null;
  endMonth: MonthId | null;
}

export function SummaryCards({ 
  customers, 
  startMonth, 
  endMonth 
}: SummaryCardsProps) {
  // Vypočítáme metriky pro všechny zákazníky v celém období (pro srovnání)
  const allMetrics = calculateAggregatedMetrics(customers, null, null);
  
  // Vypočítáme metriky pro vybrané období
  const periodMetrics = calculateAggregatedMetrics(customers, startMonth, endMonth);
  
  const isFiltered = startMonth || endMonth;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Celkové tržby</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrencyCZK(periodMetrics.totalRevenue)}</div>
          {isFiltered && (
            <p className="text-xs text-muted-foreground">
              z {formatCurrencyCZK(allMetrics.totalRevenue)} celkem
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Celkový zisk</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrencyCZK(periodMetrics.totalProfit)}</div>
          {isFiltered && (
            <p className="text-xs text-muted-foreground">
              z {formatCurrencyCZK(allMetrics.totalProfit)} celkem
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Průměrná marže</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPct(periodMetrics.avgMarginPct)}</div>
          <p className="text-xs text-muted-foreground">
            vážený průměr
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Zákazníci</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{periodMetrics.activeCustomers}</div>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <Badge variant="default" className="bg-green-100 text-green-800 text-xs whitespace-nowrap">
              <TrendingUp className="h-3 w-3 mr-1" />
              {periodMetrics.growingCustomers} rostoucí
            </Badge>
            <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs whitespace-nowrap">
              <TrendingDown className="h-3 w-3 mr-1" />
              {periodMetrics.decliningCustomers} klesající
            </Badge>
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              {periodMetrics.stableCustomers} stabilní
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
