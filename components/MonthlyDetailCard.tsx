'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Table, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { AggregatedData, MonthId } from '@/lib/types';
import { formatCurrencyCZK, formatPct } from '@/lib/format';
import { loadCardMinimizedState, saveCardMinimizedState } from '@/lib/localStorage';

interface MonthlyDetailCardProps {
  data: AggregatedData;
  startMonth: MonthId | null;
  endMonth: MonthId | null;
}

type SortField = 'period' | 'revenue' | 'profit' | 'marginPct';
type SortDirection = 'asc' | 'desc' | null;

export function MonthlyDetailCard({ data, startMonth, endMonth }: MonthlyDetailCardProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Načtení stavu z localStorage při mount
  useEffect(() => {
    const storedState = loadCardMinimizedState('MONTHLY_DETAIL_MINIMIZED');
    setIsMinimized(storedState);
  }, []);

  // Uložení stavu do localStorage při změně
  const handleToggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    saveCardMinimizedState('MONTHLY_DETAIL_MINIMIZED', newState);
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

  // Příprava dat pro tabulku s řazením
  const tableData = useMemo(() => {
    let data = filteredData.map(month => ({
      period: month.period,
      revenue: month.totalRevenue,
      profit: month.totalProfit,
      marginPct: month.avgMarginPct,
    }));

    // Aplikace řazení
    if (sortField && sortDirection) {
      data = [...data].sort((a, b) => {
              const aValue: string | number | null = a[sortField];
            const bValue: string | number | null = b[sortField];

        // Pro period řadíme jako string
        if (sortField === 'period') {
          const aStr = String(aValue || '');
          const bStr = String(bValue || '');
          return sortDirection === 'desc' 
            ? bStr.localeCompare(aStr)
            : aStr.localeCompare(bStr);
        }

        // Pro číselné hodnoty
        const aNum = Number(aValue || 0);
        const bNum = Number(bValue || 0);
        
        return sortDirection === 'desc' 
          ? bNum - aNum
          : aNum - bNum;
      });
    }

    return data;
  }, [filteredData, sortField, sortDirection]);

  // Funkce pro řazení
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Pokud klikneme na stejné pole, změníme směr
      if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      } else if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    } else {
      // Nové pole - začneme s desc (od největšího)
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Funkce pro získání ikony řazení
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4 text-gray-600" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 text-gray-600" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  };

  // Funkce pro formátování měsíce
  const formatMonth = (period: string) => {
    const [year, monthNum] = period.split('-');
    const shortYear = year.slice(-2);
    return `${monthNum}/${shortYear}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={handleToggleMinimize}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          Detailní přehled po měsících
        </h2>
        {isMinimized ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        )}
      </div>
      
      {!isMinimized && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Table className="h-5 w-5 text-gray-500" />
            <p className="text-sm text-gray-600">
              Agregovaná data za {filteredData.length} měsíců
            </p>
          </div>
          
          <div className="border rounded-lg">
            <UITable>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('period')}
                  >
                    <div className="flex items-center gap-2">
                      Měsíc
                      {getSortIcon('period')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('revenue')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Tržby
                      {getSortIcon('revenue')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('profit')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Zisk
                      {getSortIcon('profit')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('marginPct')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Marže
                      {getSortIcon('marginPct')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.period}>
                    <TableCell className="font-medium">
                      {formatMonth(row.period)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyCZK(row.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyCZK(row.profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPct(row.marginPct)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </UITable>
          </div>
        </div>
      )}
    </div>
  );
}
