'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MonthId } from '@/lib/types';

interface MonthRangePickerProps {
  availableMonths: MonthId[];
  selectedStartMonth: MonthId | null;
  selectedEndMonth: MonthId | null;
  onRangeChange: (start: MonthId | null, end: MonthId | null) => void;
  className?: string;
}

export function MonthRangePicker({
  availableMonths,
  selectedStartMonth,
  selectedEndMonth,
  onRangeChange,
  className
}: MonthRangePickerProps) {
  const [startMonth, setStartMonth] = useState<MonthId | null>(selectedStartMonth);
  const [endMonth, setEndMonth] = useState<MonthId | null>(selectedEndMonth);

  useEffect(() => {
    setStartMonth(selectedStartMonth);
    setEndMonth(selectedEndMonth);
  }, [selectedStartMonth, selectedEndMonth]);

  const handleStartChange = (value: string) => {
    const newStart = value === 'all' ? null : value as MonthId;
    setStartMonth(newStart);
    
    // Automaticky uprav konec, pokud je před začátkem
    if (newStart && endMonth && newStart > endMonth) {
      setEndMonth(newStart);
      onRangeChange(newStart, newStart);
    } else {
      onRangeChange(newStart, endMonth);
    }
  };

  const handleEndChange = (value: string) => {
    const newEnd = value === 'all' ? null : value as MonthId;
    setEndMonth(newEnd);
    
    // Automaticky uprav začátek, pokud je po konci
    if (newEnd && startMonth && startMonth > newEnd) {
      setStartMonth(newEnd);
      onRangeChange(newEnd, newEnd);
    } else {
      onRangeChange(startMonth, newEnd);
    }
  };

  const formatMonth = (month: MonthId) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('cs-CZ', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const getAvailableEndMonths = () => {
    if (!startMonth) return availableMonths;
    return availableMonths.filter(month => month >= startMonth);
  };

  const getAvailableStartMonths = () => {
    if (!endMonth) return availableMonths;
    return availableMonths.filter(month => month <= endMonth);
  };

  if (availableMonths.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Od:</label>
        <Select value={startMonth || 'all'} onValueChange={handleStartChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Začátek" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Vše</SelectItem>
            {getAvailableStartMonths().map(month => (
              <SelectItem key={month} value={month}>
                {formatMonth(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Do:</label>
        <Select value={endMonth || 'all'} onValueChange={handleEndChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Konec" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Vše</SelectItem>
            {getAvailableEndMonths().map(month => (
              <SelectItem key={month} value={month}>
                {formatMonth(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
