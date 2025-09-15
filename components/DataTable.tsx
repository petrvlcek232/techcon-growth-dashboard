'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { CustomerMonthly } from '@/lib/types';
import { formatCurrencyCZK, formatPct } from '@/lib/format';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'period' | 'revenue' | 'profit' | 'marginPct';
type SortDirection = 'asc' | 'desc' | null;

interface DataTableProps {
  data: CustomerMonthly[];
  className?: string;
}

export function DataTable({ data, className }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Příprava dat pro tabulku s řazením
  const tableData = useMemo(() => {
    let sortedData = data.map(month => ({
      period: month.period,
      revenue: month.revenue,
      profit: month.profit,
      marginPct: month.marginPct,
    }));

    // Aplikace řazení
    if (sortField && sortDirection) {
      sortedData = [...sortedData].sort((a, b) => {
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

    return sortedData;
  }, [data, sortField, sortDirection]);

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

  const formatMonth = (period: string) => {
    const [year, monthNum] = period.split('-');
    const shortYear = year.slice(-2); // Vezme poslední 2 číslice roku
    return `${monthNum}/${shortYear}`;
  };

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className || ''}`}>
        Žádná data k zobrazení
      </div>
    );
  }

  return (
    <div className={`border rounded-lg ${className || ''}`}>
      <Table>
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
      </Table>
    </div>
  );
}
