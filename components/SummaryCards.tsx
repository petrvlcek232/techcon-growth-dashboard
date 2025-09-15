'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CustomerSummary, MonthId } from '@/lib/types';
import { formatCurrencyCZK, formatPct } from '@/lib/format';
import { TrendingUp, TrendingDown, Users, DollarSign, Percent } from 'lucide-react';

interface SummaryCardsProps {
  customers: CustomerSummary[];
  filteredCustomers: CustomerSummary[];
  startMonth: MonthId | null;
  endMonth: MonthId | null;
}

export function SummaryCards({ 
  customers, 
  filteredCustomers, 
  startMonth, 
  endMonth 
}: SummaryCardsProps) {
  // Celkové metriky (všechny zákazníci, celé období)
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0);
  const totalProfit = customers.reduce((sum, c) => sum + c.totalProfit, 0);
  const avgMarginPct = customers.length > 0 
    ? customers.reduce((sum, c) => sum + (c.avgMarginPct || 0), 0) / customers.length 
    : 0;

  // Filtrované metriky
  const filteredRevenue = filteredCustomers.reduce((sum, c) => sum + c.totalRevenue, 0);
  const filteredProfit = filteredCustomers.reduce((sum, c) => sum + c.totalProfit, 0);

  // Trendy
  const growingCustomers = customers.filter(c => c.revenueTrend === 'UP').length;
  const decliningCustomers = customers.filter(c => c.revenueTrend === 'DOWN').length;
  const stableCustomers = customers.filter(c => c.revenueTrend === 'FLAT').length;

  const isFiltered = startMonth || endMonth;
  const displayRevenue = isFiltered ? filteredRevenue : totalRevenue;
  const displayProfit = isFiltered ? filteredProfit : totalProfit;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Celkové tržby</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrencyCZK(displayRevenue)}</div>
          {isFiltered && (
            <p className="text-xs text-muted-foreground">
              z {formatCurrencyCZK(totalRevenue)} celkem
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
          <div className="text-2xl font-bold">{formatCurrencyCZK(displayProfit)}</div>
          {isFiltered && (
            <p className="text-xs text-muted-foreground">
              z {formatCurrencyCZK(totalProfit)} celkem
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
          <div className="text-2xl font-bold">{formatPct(avgMarginPct)}</div>
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
          <div className="text-2xl font-bold">{customers.length}</div>
          <div className="flex items-center gap-1 mt-1">
            <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              {growingCustomers}
            </Badge>
            <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">
              <TrendingDown className="h-3 w-3 mr-1" />
              {decliningCustomers}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {stableCustomers}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
