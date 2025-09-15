'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, Percent } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AggregatedData, MonthId } from '@/lib/types';
import { formatCurrencyCZK, formatPct } from '@/lib/format';
import { loadCardMinimizedState, saveCardMinimizedState } from '@/lib/localStorage';

interface OverviewCardProps {
  title: string;
  icon: React.ReactNode;
  data: AggregatedData;
  startMonth: MonthId | null;
  endMonth: MonthId | null;
  storageKey: 'DATA_OVERVIEW_MINIMIZED' | 'REVENUE_CARD_MINIMIZED' | 'PROFIT_CARD_MINIMIZED' | 'MARGIN_CARD_MINIMIZED';
  type: 'revenue' | 'profit' | 'margin';
}

export function OverviewCard({ title, icon, data, startMonth, endMonth, storageKey, type }: OverviewCardProps) {
  const [isMinimized, setIsMinimized] = useState(false); // Výchozí stav je rozbalené

  // Načtení stavu z localStorage při mount
  useEffect(() => {
    const storedState = loadCardMinimizedState(storageKey);
    setIsMinimized(storedState);
  }, [storageKey]);

  // Uložení stavu do localStorage při změně
  const handleToggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    saveCardMinimizedState(storageKey, newState);
  };

  // Filtrovaná data podle období - vytvoříme agregovaná data z customers
  const filteredData = useMemo(() => {
    if (!data || !data.customers) return [];
    
    // Vytvoříme mapu měsíců s agregovanými daty
    const monthlyMap = new Map<string, { totalRevenue: number; totalProfit: number; avgMarginPct: number | null; count: number }>();
    
    data.customers.forEach(customer => {
      customer.months.forEach(month => {
        // Filtrujeme podle období
        if (startMonth && month.period < startMonth) return;
        if (endMonth && month.period > endMonth) return;
        
        const existing = monthlyMap.get(month.period) || { totalRevenue: 0, totalProfit: 0, avgMarginPct: 0, count: 0 };
        existing.totalRevenue += month.revenue;
        existing.totalProfit += month.profit;
        existing.count += 1;
        
        // Výpočet váženého průměru marže
        if (month.marginPct !== null && month.revenue > 0) {
          if (existing.avgMarginPct === null) existing.avgMarginPct = 0;
          existing.avgMarginPct += month.marginPct * month.revenue;
        }
        
        monthlyMap.set(month.period, existing);
      });
    });
    
    // Převedeme na pole a seřadíme
    return Array.from(monthlyMap.entries())
      .map(([period, data]) => ({
        period,
        totalRevenue: data.totalRevenue,
        totalProfit: data.totalProfit,
        avgMarginPct: data.avgMarginPct !== null ? data.avgMarginPct / Math.max(data.totalRevenue, 1) : null
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [data, startMonth, endMonth]);

  // Příprava dat pro grafy
  const chartData = useMemo(() => {
    return filteredData.map(month => {
      const [year, monthNum] = month.period.split('-');
      const shortYear = year.slice(-2); // Vezme poslední 2 číslice roku
      const shortMonth = `${monthNum}/${shortYear}`;
      
      return {
        period: month.period,
        month: shortMonth,
        revenue: month.totalRevenue,
        profit: month.totalProfit,
        marginPct: month.avgMarginPct || 0,
      };
    });
  }, [filteredData]);

  // Výpočet celkových hodnot pro vybrané období
  const periodTotals = useMemo(() => {
    const totalRevenue = filteredData.reduce((sum, m) => sum + m.totalRevenue, 0);
    const totalProfit = filteredData.reduce((sum, m) => sum + m.totalProfit, 0);
    
    // Výpočet váženého průměru marže
    const monthsWithMargin = filteredData.filter(m => m.avgMarginPct !== null && m.totalRevenue > 0);
    let avgMarginPct: number | null = null;
    
    if (monthsWithMargin.length > 0) {
      const totalRevenueWithMargin = monthsWithMargin.reduce((sum, m) => sum + m.totalRevenue, 0);
      if (totalRevenueWithMargin > 0) {
        const weightedSum = monthsWithMargin.reduce((sum, m) => sum + (m.avgMarginPct! * m.totalRevenue), 0);
        avgMarginPct = weightedSum / totalRevenueWithMargin;
      }
    }

    return { totalRevenue, totalProfit, avgMarginPct };
  }, [filteredData]);


  const getValue = () => {
    switch (type) {
      case 'revenue':
        return formatCurrencyCZK(periodTotals.totalRevenue);
      case 'profit':
        return formatCurrencyCZK(periodTotals.totalProfit);
      case 'margin':
        return formatPct(periodTotals.avgMarginPct);
      default:
        return '';
    }
  };

  const getChartDataKey = () => {
    switch (type) {
      case 'revenue':
        return 'revenue';
      case 'profit':
        return 'profit';
      case 'margin':
        return 'marginPct';
      default:
        return 'revenue';
    }
  };

  const getChartColor = () => {
    switch (type) {
      case 'revenue':
        return '#3b82f6';
      case 'profit':
        return '#10b981';
      case 'margin':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const ChartComponent = type === 'margin' ? BarChart : LineChart;
  const ChartElement = type === 'margin' ? Bar : Line;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={handleToggleMinimize}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        {isMinimized ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        )}
      </div>
      
      {!isMinimized && (
        <div className="mt-6 space-y-4">
          {/* Celková hodnota */}
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-gray-900 break-words">
              {getValue()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {type === 'margin' ? 'vážený průměr' : 'celkem za vybrané období'}
            </p>
          </div>

          {/* Graf */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ChartComponent data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  width={35}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}k`;
                    }
                    return value.toString();
                  }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    type === 'margin' ? formatPct(value) : formatCurrencyCZK(value), 
                    type === 'revenue' ? 'Tržby' : type === 'profit' ? 'Zisk' : 'Marže'
                  ]}
                  labelFormatter={() => `Měsíc`}
                />
                <ChartElement 
                  type="monotone" 
                  dataKey={getChartDataKey()} 
                  stroke={getChartColor()}
                  fill={type === 'margin' ? getChartColor() : undefined}
                  strokeWidth={2}
                />
              </ChartComponent>
            </ResponsiveContainer>
          </div>

        </div>
      )}
    </div>
  );
}
