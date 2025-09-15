'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { CustomerMonthly } from '@/lib/types';
import { formatCurrencyCZK, formatPct } from '@/lib/format';

interface DataTableProps {
  data: CustomerMonthly[];
  className?: string;
}

export function DataTable({ data, className }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className || ''}`}>
        Žádná data k zobrazení
      </div>
    );
  }

  const formatMonth = (period: string) => {
    const [year, monthNum] = period.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('cs-CZ', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <div className={`border rounded-lg ${className || ''}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Měsíc</TableHead>
            <TableHead className="text-right">Tržby</TableHead>
            <TableHead className="text-right">Zisk</TableHead>
            <TableHead className="text-right">Marže</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
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
