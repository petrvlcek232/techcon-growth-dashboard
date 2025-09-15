'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/src/components/ui/input';
import { CustomerSummary, MonthId } from '@/lib/types';
import { CustomerRow } from './CustomerRow';
import { normalizeForSearch } from '@/lib/format';
import { Search } from 'lucide-react';

interface CustomerListProps {
  customers: CustomerSummary[];
  startMonth: MonthId | null;
  endMonth: MonthId | null;
  onCustomerClick: (customer: CustomerSummary) => void;
}

export function CustomerList({ 
  customers, 
  startMonth, 
  endMonth, 
  onCustomerClick 
}: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrovaní zákazníci podle vyhledávání
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    
    const normalizedQuery = normalizeForSearch(searchQuery);
    return customers.filter(customer => 
      normalizeForSearch(customer.name).includes(normalizedQuery)
    );
  }, [customers, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Vyhledat zákazníka..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'Žádní zákazníci neodpovídají vyhledávání' : 'Žádní zákazníci'}
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <CustomerRow
              key={customer.slug}
              customer={customer}
              startMonth={startMonth}
              endMonth={endMonth}
              onClick={() => onCustomerClick(customer)}
            />
          ))
        )}
      </div>

      {searchQuery && (
        <div className="text-sm text-gray-500 text-center">
          Zobrazeno {filteredCustomers.length} z {customers.length} zákazníků
        </div>
      )}
    </div>
  );
}
