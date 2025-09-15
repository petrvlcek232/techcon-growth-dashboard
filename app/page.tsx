'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { SummaryCards } from '@/components/SummaryCards';
import { CustomerList } from '@/components/CustomerList';
import { MonthRangePicker } from '@/components/MonthRangePicker';
import { CustomerTrendFilter, CustomerTrendFilterValue } from '@/components/CustomerTrendFilter';
import { AggregatedData, CustomerSummary, MonthId } from '@/lib/types';
import { filterAndSortCustomersByTrend } from '@/lib/filter';
import { loadStoredDateRange, saveDateRange, loadStoredTrendFilter, saveTrendFilter, loadCardMinimizedState, saveCardMinimizedState } from '@/lib/localStorage';
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, Percent } from 'lucide-react';
import { OverviewCard } from '@/components/OverviewCard';
import { MonthlyDetailCard } from '@/components/MonthlyDetailCard';
import PasswordGateway from '@/components/PasswordGateway';

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<AggregatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState<MonthId | null>(null);
  const [endMonth, setEndMonth] = useState<MonthId | null>(null);
  const [dateRangeLoaded, setDateRangeLoaded] = useState(false);
  const [customerTrendFilter, setCustomerTrendFilter] = useState<CustomerTrendFilterValue>('all');
  const [isDataOverviewMinimized, setIsDataOverviewMinimized] = useState(false);
  const [isCustomerListMinimized, setIsCustomerListMinimized] = useState(false);

  // Kontrola autentizace při mount
  useEffect(() => {
    const authenticated = sessionStorage.getItem('authenticated') === 'true';
    setIsAuthenticated(authenticated);
  }, []);

  // Načtení stavu karet z localStorage při mount
  useEffect(() => {
    if (dateRangeLoaded) {
      const storedState = loadCardMinimizedState('DATA_OVERVIEW_MINIMIZED');
      const customerListState = loadCardMinimizedState('CUSTOMER_LIST_MINIMIZED');
      setIsDataOverviewMinimized(storedState);
      setIsCustomerListMinimized(customerListState);
    }
  }, [dateRangeLoaded]);

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
        
        // Načtení uloženého období a filtru z localStorage
        if (!dateRangeLoaded) {
          const stored = loadStoredDateRange();
          const storedFilter = loadStoredTrendFilter();
          setStartMonth(stored.startMonth);
          setEndMonth(stored.endMonth);
          setCustomerTrendFilter(storedFilter);
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

  // Filtrovaní zákazníci podle období a trendu
  const filteredCustomers = useMemo(() => {
    if (!data) return [];
    
    return filterAndSortCustomersByTrend(
      data.customers,
      customerTrendFilter,
      startMonth,
      endMonth
    );
  }, [data, customerTrendFilter, startMonth, endMonth]);

  // Funkce pro změnu období a jeho uložení
  const handleDateRangeChange = (start: MonthId | null, end: MonthId | null) => {
    setStartMonth(start);
    setEndMonth(end);
    saveDateRange(start, end);
  };

  // Navigace na detail zákazníka
  const handleCustomerClick = (customer: CustomerSummary) => {
    window.location.href = `/customer/${customer.slug}`;
  };

  // Handler pro minimalizaci karty Přehled dat - stejný jako u grafů
  const handleDataOverviewToggle = useCallback(() => {
    const newState = !isDataOverviewMinimized;
    setIsDataOverviewMinimized(newState);
    saveCardMinimizedState('DATA_OVERVIEW_MINIMIZED', newState);
  }, [isDataOverviewMinimized]);

  // Handler pro minimalizaci karty seznamu zákazníků
  const handleCustomerListToggle = useCallback(() => {
    const newState = !isCustomerListMinimized;
    setIsCustomerListMinimized(newState);
    saveCardMinimizedState('CUSTOMER_LIST_MINIMIZED', newState);
  }, [isCustomerListMinimized]);


  // Zobrazit password gateway, pokud uživatel není autentizován
  if (!isAuthenticated) {
    return <PasswordGateway onAuthenticated={() => setIsAuthenticated(true)} />;
  }

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
            onRangeChange={handleDateRangeChange}
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
            <div className="bg-white rounded-lg shadow-sm border p-6 overflow-x-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Zákazníci ({filteredCustomers.length})
                </h2>
                {/* Minimalizace pouze na mobilních zařízeních */}
                <div 
                  className="lg:hidden cursor-pointer"
                  onClick={handleCustomerListToggle}
                >
                  {isCustomerListMinimized ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
              
              <div className={`${isCustomerListMinimized ? 'lg:block hidden' : 'block'}`}>
                <>
                  {/* Filtr zákazníků */}
                  <div className="mb-4">
                    <CustomerTrendFilter
                      value={customerTrendFilter}
                      onValueChange={(value) => {
                        setCustomerTrendFilter(value);
                        saveTrendFilter(value);
                      }}
                    />
                  </div>
                  
                  <CustomerList
                    customers={filteredCustomers}
                    startMonth={startMonth}
                    endMonth={endMonth}
                    onCustomerClick={handleCustomerClick}
                  />
                </>
              </div>
            </div>
          </div>

          {/* Pravý sloupec - Přehled dat a metriky */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informace o datech */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={handleDataOverviewToggle}
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  Přehled dat
                </h2>
                {isDataOverviewMinimized ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {!isDataOverviewMinimized && (
                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Dostupná období</h3>
                    <p className="text-sm text-gray-600">
                      {data?.monthsAvailable.length} měsíců od {data?.monthsAvailable[0]} do {data?.monthsAvailable[data?.monthsAvailable.length - 1]}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Poslední aktualizace</h3>
                    <p className="text-sm text-gray-600">
                      {data?.generatedAt ? new Date(data.generatedAt).toLocaleString('cs-CZ') : ''}
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
              )}
            </div>

            {/* Karty pro celkové přehledy - stejné velikosti */}
            {data && (
              <div className="grid grid-cols-1 gap-6">
                {/* Celkové tržby */}
                <OverviewCard
                  title="Celkové tržby"
                  icon={<DollarSign className="h-5 w-5 text-gray-500" />}
                  data={data}
                  startMonth={startMonth}
                  endMonth={endMonth}
                  storageKey="REVENUE_CARD_MINIMIZED"
                  type="revenue"
                />

                {/* Celkový zisk */}
                <OverviewCard
                  title="Celkový zisk"
                  icon={<TrendingUp className="h-5 w-5 text-gray-500" />}
                  data={data}
                  startMonth={startMonth}
                  endMonth={endMonth}
                  storageKey="PROFIT_CARD_MINIMIZED"
                  type="profit"
                />

                {/* Průměrná marže */}
                <OverviewCard
                  title="Průměrná marže"
                  icon={<Percent className="h-5 w-5 text-gray-500" />}
                  data={data}
                  startMonth={startMonth}
                  endMonth={endMonth}
                  storageKey="MARGIN_CARD_MINIMIZED"
                  type="margin"
                />

                {/* Detailní přehled po měsících */}
                <MonthlyDetailCard
                  data={data}
                  startMonth={startMonth}
                  endMonth={endMonth}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
