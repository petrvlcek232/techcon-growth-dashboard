'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';

export type CustomerTrendFilterValue = 
  | 'all'
  | 'growing-desc'     // Rostoucí od největšího
  | 'growing-asc'      // Rostoucí od nejmenšího
  | 'declining-desc'   // Klesající od největšího
  | 'declining-asc'    // Klesající od nejmenšího
  | 'name-asc'         // Podle jména A-Z
  | 'name-desc';       // Podle jména Z-A

interface CustomerTrendFilterProps {
  value: CustomerTrendFilterValue;
  onValueChange: (value: CustomerTrendFilterValue) => void;
}

const FILTER_OPTIONS = [
  { value: 'all' as const, label: 'Všichni zákazníci' },
  { value: 'growing-desc' as const, label: 'Rostoucí - od největšího' },
  { value: 'growing-asc' as const, label: 'Rostoucí - od nejmenšího' },
  { value: 'declining-desc' as const, label: 'Klesající - od největšího' },
  { value: 'declining-asc' as const, label: 'Klesající - od nejmenšího' },
  { value: 'name-asc' as const, label: 'Podle jména A-Z' },
  { value: 'name-desc' as const, label: 'Podle jména Z-A' },
];

export function CustomerTrendFilter({ value, onValueChange }: CustomerTrendFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">
        Filtr zákazníků
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
