'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { SummaryCards } from '@/components/SummaryCards';
import { CustomerList } from '@/components/CustomerList';
import { MonthRangePicker } from '@/components/MonthRangePicker';
import { AggregatedData, CustomerSummary, MonthId } from '@/lib/types';

export default function Dashboard() {
  const [data, setData] = useState<AggregatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState<MonthId | null>(null);
  const [endMonth, setEndMonth] = useState<MonthId | null>(null);

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
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Neznámá chyba');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh dat
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data/refresh', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Nepodařilo se aktualizovat data');
      }
      
      // Znovu načti data
      const dataResponse = await fetch('/data/processed.json');
      if (dataResponse.ok) {
        const jsonData = await dataResponse.json();
        setData(jsonData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba');
    } finally {
      setLoading(false);
    }
  };

  // Filtrovaní zákazníci podle období
  const filteredCustomers = useMemo(() => {
    if (!data) return [];
    
    return data.customers.filter(customer => {
      // Pokud není nastaven filtr, zobraz všechny
      if (!startMonth && !endMonth) return true;
      
      // Zkontroluj, zda má zákazník aktivitu v daném období
      return customer.months.some(month => {
        if (startMonth && month.period < startMonth) return false;
        if (endMonth && month.period > endMonth) return false;
        return month.revenue > 0;
      });
    });
  }, [data, startMonth, endMonth]);

  // Navigace na detail zákazníka
  const handleCustomerClick = (customer: CustomerSummary) => {
    window.location.href = `/customer/${customer.slug}`;
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onRefresh={handleRefresh} />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Chyba při načítání dat</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Zkusit znovu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.customers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onRefresh={handleRefresh} />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Žádná data</h2>
            <p className="text-yellow-600 mb-4">
              Nebyla nalezena žádná data k zobrazení. Zkontrolujte, zda jsou soubory v adresáři data/dvur/.
            </p>
            <button
              onClick={handleRefresh}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Aktualizovat data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onRefresh={handleRefresh} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Filtry */}
        <div className="mb-6">
          <MonthRangePicker
            availableMonths={data.monthsAvailable}
            selectedStartMonth={startMonth}
            selectedEndMonth={endMonth}
            onRangeChange={(start, end) => {
              setStartMonth(start);
              setEndMonth(end);
            }}
          />
        </div>

        {/* Summary karty */}
        <SummaryCards
          customers={data.customers}
          filteredCustomers={filteredCustomers}
          startMonth={startMonth}
          endMonth={endMonth}
        />

        {/* Hlavní obsah */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seznam zákazníků */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Zákazníci ({filteredCustomers.length})
              </h2>
              <CustomerList
                customers={filteredCustomers}
                startMonth={startMonth}
                endMonth={endMonth}
                onCustomerClick={handleCustomerClick}
              />
            </div>
          </div>

          {/* Informace o datech */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Přehled dat
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Dostupná období</h3>
                  <p className="text-sm text-gray-600">
                    {data.monthsAvailable.length} měsíců od {data.monthsAvailable[0]} do {data.monthsAvailable[data.monthsAvailable.length - 1]}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Poslední aktualizace</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(data.generatedAt).toLocaleString('cs-CZ')}
                  </p>
                </div>

                {(startMonth || endMonth) && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Aktivní filtr</h3>
                    <p className="text-sm text-gray-600">
                      {startMonth || 'začátek'} - {endMonth || 'konec'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
