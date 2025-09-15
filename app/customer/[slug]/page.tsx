'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { TrendBadge } from '@/components/TrendBadge';
import { MonthRangePicker } from '@/components/MonthRangePicker';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { AggregatedData, CustomerSummary, MonthId } from '@/lib/types';
import { formatCurrencyCZK, formatPct } from '@/lib/format';
import { loadStoredDateRange, saveDateRange } from '@/lib/localStorage';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [data, setData] = useState<AggregatedData | null>(null);
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState<MonthId | null>(null);
  const [endMonth, setEndMonth] = useState<MonthId | null>(null);
  const [dateRangeLoaded, setDateRangeLoaded] = useState(false);

  // Načtení dat
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/processed.json');
        if (!response.ok) {
          throw new Error('Nepodařilo se načíst data');
        }
        const jsonData = await response.json();
        setData(jsonData);
        
        // Najdi zákazníka podle slug
        const foundCustomer = jsonData.customers.find((c: CustomerSummary) => c.slug === slug);
        if (!foundCustomer) {
          throw new Error('Zákazník nenalezen');
        }
        setCustomer(foundCustomer);
        
        // Načtení uloženého období z localStorage
        if (!dateRangeLoaded) {
          const stored = loadStoredDateRange();
          setStartMonth(stored.startMonth);
          setEndMonth(stored.endMonth);
          setDateRangeLoaded(true);
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Neznámá chyba');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // Filtrovaná data podle období
  const filteredData = useMemo(() => {
    if (!customer) return [];
    
    return customer.months.filter(month => {
      if (startMonth && month.period < startMonth) return false;
      if (endMonth && month.period > endMonth) return false;
      return true;
    });
  }, [customer, startMonth, endMonth]);

  // Výpočet metrik pro vybrané období
  const periodMetrics = useMemo(() => {
    if (!customer) return { 
      totalRevenue: 0, 
      totalProfit: 0, 
      avgMarginPct: null, 
      revenueDeltaPct: null, 
      profitDeltaPct: null 
    };
    
    // Součty pro vybrané období
    const totalRevenue = filteredData.reduce((sum, m) => sum + m.revenue, 0);
    const totalProfit = filteredData.reduce((sum, m) => sum + m.profit, 0);
    
    // Výpočet váženého průměru marže pro vybrané období
    const monthsWithMargin = filteredData.filter(m => m.marginPct !== null && m.revenue > 0);
    let avgMarginPct: number | null = null;
    
    if (monthsWithMargin.length > 0) {
      const totalRevenueWithMargin = monthsWithMargin.reduce((sum, m) => sum + m.revenue, 0);
      if (totalRevenueWithMargin > 0) {
        const weightedSum = monthsWithMargin.reduce((sum, m) => sum + (m.marginPct! * m.revenue), 0);
        avgMarginPct = weightedSum / totalRevenueWithMargin;
      }
    }
    
    // Výpočet procent pro vybrané období
    const activeMonths = filteredData.filter(m => m.revenue > 0);
    let revenueDeltaPct: number | null = null;
    let profitDeltaPct: number | null = null;
    
    if (activeMonths.length >= 2) {
      const firstMonth = activeMonths[0];
      const lastMonth = activeMonths[activeMonths.length - 1];
      
      if (firstMonth.revenue > 0) {
        revenueDeltaPct = (lastMonth.revenue / firstMonth.revenue - 1) * 100;
      }
      
      if (firstMonth.profit > 0) {
        profitDeltaPct = (lastMonth.profit / firstMonth.profit - 1) * 100;
      }
    }
    
    return { 
      totalRevenue, 
      totalProfit, 
      avgMarginPct, 
      revenueDeltaPct, 
      profitDeltaPct 
    };
  }, [customer, filteredData]);

  // Příprava dat pro grafy
  const chartData = useMemo(() => {
    return filteredData.map(month => {
      const [year, monthNum] = month.period.split('-');
      const shortYear = year.slice(-2); // Vezme poslední 2 číslice roku
      const shortMonth = `${parseInt(monthNum)}/${shortYear}`;
      
      return {
        period: month.period,
        month: shortMonth,
        revenue: month.revenue,
        profit: month.profit,
        marginPct: month.marginPct || 0,
      };
    });
  }, [filteredData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Načítám data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Chyba</h2>
            <p className="text-red-600 mb-4">{error || 'Zákazník nenalezen'}</p>
            <Button onClick={() => router.push('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zpět na dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Navigace */}
        <div className="mb-6">
          <Button onClick={() => router.push('/')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět na dashboard
          </Button>
        </div>

        {/* Header zákazníka */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <TrendBadge trend={customer.revenueTrend} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Celkové tržby
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrencyCZK(periodMetrics.totalRevenue)}</div>
                {periodMetrics.revenueDeltaPct !== null && (
                  <p className={`text-xs ${periodMetrics.revenueDeltaPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {periodMetrics.revenueDeltaPct > 0 ? '+' : ''}{periodMetrics.revenueDeltaPct.toFixed(1)}% změna
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Celkový zisk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrencyCZK(periodMetrics.totalProfit)}</div>
                {periodMetrics.profitDeltaPct !== null && (
                  <p className={`text-xs ${periodMetrics.profitDeltaPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {periodMetrics.profitDeltaPct > 0 ? '+' : ''}{periodMetrics.profitDeltaPct.toFixed(1)}% změna
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Průměrná marže</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPct(periodMetrics.avgMarginPct)}</div>
                <p className="text-xs text-muted-foreground">vážený průměr</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Aktivní období
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {customer.firstMonth && customer.lastMonth ? (
                    <>
                      <div>{customer.firstMonth} - {customer.lastMonth}</div>
                      <p className="text-xs text-muted-foreground">
                        {customer.months.filter(m => m.revenue > 0).length} aktivních měsíců
                      </p>
                    </>
                  ) : (
                    <div className="text-muted-foreground">Žádná aktivita</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtry */}
        <div className="mb-6">
          <MonthRangePicker
            availableMonths={data?.monthsAvailable || []}
            selectedStartMonth={startMonth}
            selectedEndMonth={endMonth}
            onRangeChange={(start, end) => {
              setStartMonth(start);
              setEndMonth(end);
              saveDateRange(start, end);
            }}
          />
        </div>

        {/* Grafy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue a Profit */}
          <Card>
            <CardHeader>
              <CardTitle>Tržby a zisk</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrencyCZK(value), 
                      name === 'revenue' ? 'Tržby' : 'Zisk'
                    ]}
                    labelFormatter={(label) => `Měsíc: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Marže */}
          <Card>
            <CardHeader>
              <CardTitle>Marže %</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatPct(value), 'Marže']}
                    labelFormatter={(label) => `Měsíc: ${label}`}
                  />
                  <Bar dataKey="marginPct" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabulka */}
        <Card>
          <CardHeader>
            <CardTitle>Detailní data po měsících</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable data={filteredData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
