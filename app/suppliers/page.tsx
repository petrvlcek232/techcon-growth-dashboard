'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MonthRangePicker } from '@/components/MonthRangePicker';
import { SupplierData, MonthId, SupplierSummary } from '@/lib/types';
import { ChevronDown, ChevronUp, DollarSign, Package, TrendingUp, Truck, Search } from 'lucide-react';
import { loadStoredDateRange, saveDateRange, loadCardMinimizedState, saveCardMinimizedState } from '@/lib/localStorage';
import { formatCurrencyCZK, formatNumber } from '@/lib/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Komponenta pro tabulku dodavatelů
function SupplierTable({ suppliers, startMonth, endMonth }: { 
  suppliers: SupplierSummary[], 
  startMonth: MonthId | null, 
  endMonth: MonthId | null 
}) {
  const [sortField, setSortField] = useState<keyof SupplierSummary | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isMinimized, setIsMinimized] = useState(false);

  // Načtení uloženého stavu minimalizace
  useEffect(() => {
    const storedState = loadCardMinimizedState('SUPPLIER_TABLE_MINIMIZED');
    setIsMinimized(storedState);
  }, []);

  // Funkce pro přepnutí minimalizace
  const handleToggleMinimize = useCallback(() => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    saveCardMinimizedState('SUPPLIER_TABLE_MINIMIZED', newState);
  }, [isMinimized]);

  // Filtrování dodavatelů podle období
  const filteredSuppliers = useMemo(() => {
    return suppliers.map(supplier => {
      // Filtruj měsíční data dodavatele podle období
      const filteredMonths = supplier.months.filter(month => {
        if (startMonth && month.period < startMonth) return false;
        if (endMonth && month.period > endMonth) return false;
        return true;
      });

      // Pokud nemá žádná data v rozmezí, vrať null (bude vyfiltrováno)
      if (filteredMonths.length === 0) return null;

      // Přepočítej celkové hodnoty pro filtrované období
      const totalTurnover = filteredMonths.reduce((sum, m) => sum + m.turnover, 0);
      const totalItems = filteredMonths.reduce((sum, m) => sum + m.items, 0);
      const avgItemsPerMonth = filteredMonths.length > 0 ? totalItems / filteredMonths.length : 0;

      // Výpočet trendů pro filtrované období
      const firstNonZero = filteredMonths.find(m => m.turnover > 0);
      const lastNonZero = filteredMonths.slice().reverse().find(m => m.turnover > 0);
      
      const turnoverDeltaAbs = lastNonZero && firstNonZero ? lastNonZero.turnover - firstNonZero.turnover : 0;
      const turnoverDeltaPct = firstNonZero && firstNonZero.turnover > 0 
        ? (turnoverDeltaAbs / firstNonZero.turnover) * 100 
        : null;

      const firstItemsNonZero = filteredMonths.find(m => m.items > 0);
      const lastItemsNonZero = filteredMonths.slice().reverse().find(m => m.items > 0);
      
      const itemsDeltaAbs = lastItemsNonZero && firstItemsNonZero ? lastItemsNonZero.items - firstItemsNonZero.items : 0;
      const itemsDeltaPct = firstItemsNonZero && firstItemsNonZero.items > 0 
        ? (itemsDeltaAbs / firstItemsNonZero.items) * 100 
        : null;

      // Klasifikace trendů
      const turnoverTrend = turnoverDeltaPct === null ? "FLAT" : 
        turnoverDeltaPct >= 5 ? "UP" : 
        turnoverDeltaPct <= -5 ? "DOWN" : "FLAT";
      
      const itemsTrend = itemsDeltaPct === null ? "FLAT" : 
        itemsDeltaPct >= 5 ? "UP" : 
        itemsDeltaPct <= -5 ? "DOWN" : "FLAT";

      return {
        ...supplier,
        months: filteredMonths,
        totalTurnover,
        totalItems,
        avgItemsPerMonth,
        turnoverDeltaAbs,
        turnoverDeltaPct,
        itemsDeltaAbs,
        itemsDeltaPct,
        turnoverTrend,
        itemsTrend,
        firstMonth: filteredMonths[0]?.period || null,
        lastMonth: filteredMonths[filteredMonths.length - 1]?.period || null,
      };
    }).filter((supplier): supplier is NonNullable<typeof supplier> => supplier !== null);
  }, [suppliers, startMonth, endMonth]);

  // Řazení dodavatelů
  const sortedSuppliers = useMemo(() => {
    if (!sortField) return filteredSuppliers;

    return [...filteredSuppliers].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Speciální logika pro řazení podle názvu
      if (sortField === 'name') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredSuppliers, sortField, sortDirection]);

  const handleSort = (field: keyof SupplierSummary) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  const getSortIcon = (field: keyof SupplierSummary) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirection === 'asc' ? <span className="text-blue-600">↑</span> : <span className="text-blue-600">↓</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Dodavatelé ({sortedSuppliers.length})
          </h2>
          <button
            onClick={handleToggleMinimize}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={isMinimized ? "Rozbalit tabulku" : "Sbalit tabulku"}
          >
            {isMinimized ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Dodavatel</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('totalTurnover')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Celkový obrat</span>
                    {getSortIcon('totalTurnover')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('totalItems')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Celkem položek</span>
                    {getSortIcon('totalItems')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('turnoverDeltaPct')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Trend obratu</span>
                    {getSortIcon('turnoverDeltaPct')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSuppliers.map((supplier, index) => (
                <tr key={`${supplier.slug}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-md truncate" title={supplier.name}>
                      {supplier.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrencyCZK(supplier.totalTurnover)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(supplier.totalItems)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      supplier.turnoverTrend === 'UP' ? 'bg-green-100 text-green-800' :
                      supplier.turnoverTrend === 'DOWN' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {supplier.turnoverTrend === 'UP' ? '↗' :
                       supplier.turnoverTrend === 'DOWN' ? '↘' : '→'}
                      {supplier.turnoverDeltaPct !== null ? ` ${supplier.turnoverDeltaPct.toFixed(1)}%` : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Komponenta pro graf dodavatelů
function SupplierChart({ suppliers, startMonth, endMonth }: { 
  suppliers: SupplierSummary[], 
  startMonth: MonthId | null, 
  endMonth: MonthId | null 
}) {
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Barvy pro grafy
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Filtrování dat podle období - použij stejnou logiku jako v tabulce
  const filteredData = useMemo(() => {
    return suppliers.map(supplier => {
      // Filtruj měsíční data dodavatele podle období
      const filteredMonths = supplier.months.filter(month => {
        if (startMonth && month.period < startMonth) return false;
        if (endMonth && month.period > endMonth) return false;
        return true;
      });

      // Pokud nemá žádná data v rozmezí, vrať null (bude vyfiltrováno)
      if (filteredMonths.length === 0) return null;

      // Přepočítej celkové hodnoty pro filtrované období
      const totalTurnover = filteredMonths.reduce((sum, m) => sum + m.turnover, 0);
      const totalItems = filteredMonths.reduce((sum, m) => sum + m.items, 0);

      return {
        ...supplier,
        months: filteredMonths,
        totalTurnover,
        totalItems,
      };
    }).filter((supplier): supplier is NonNullable<typeof supplier> => supplier !== null);
  }, [suppliers, startMonth, endMonth]);

  // Filtrování dodavatelů podle vyhledávacího dotazu
  const searchFilteredData = useMemo(() => {
    if (!searchQuery.trim()) return filteredData;
    
    const query = searchQuery.toLowerCase().trim();
    return filteredData.filter(supplier => 
      supplier.name.toLowerCase().includes(query)
    );
  }, [filteredData, searchQuery]);

  // Automaticky vyber top 5 dodavatelů pouze při prvním načtení
  useEffect(() => {
    if (selectedSuppliers.length === 0 && searchFilteredData.length > 0) {
      const top5 = searchFilteredData
        .sort((a, b) => b.totalTurnover - a.totalTurnover)
        .slice(0, 5)
        .map(s => s.slug);
      setSelectedSuppliers(top5);
    }
  }, [searchFilteredData]); // Používám searchFilteredData místo filteredData

  const handleSupplierToggle = (supplierSlug: string) => {
    setSelectedSuppliers(prev => {
      if (prev.includes(supplierSlug)) {
        return prev.filter(s => s !== supplierSlug);
      } else if (prev.length < 10) {
        return [...prev, supplierSlug];
      }
      return prev;
    });
  };

  const handleUncheckAll = () => {
    setSelectedSuppliers([]);
  };

  const selectedSuppliersData = searchFilteredData.filter(s => selectedSuppliers.includes(s.slug));

  // Mapování barev podle slug dodavatele pro konzistentní barvy
  const getSupplierColor = useCallback((supplierSlug: string) => {
    const index = selectedSuppliers.indexOf(supplierSlug);
    return index >= 0 ? colors[index % colors.length] : colors[0];
  }, [selectedSuppliers, colors]);

  // Příprava dat pro graf
  const chartData = useMemo(() => {
    if (selectedSuppliersData.length === 0) return [];

    // Získání všech unikátních měsíců z vybraných dodavatelů
    const allMonths = new Set<string>();
    selectedSuppliersData.forEach(supplier => {
      supplier.months.forEach(month => allMonths.add(month.period));
    });

    // Seřazení měsíců
    const sortedMonths = Array.from(allMonths).sort();

    // Vytvoření dat pro graf
    return sortedMonths.map(month => {
      const [year, monthPart] = month.split('-'); // Split "2024-01" into ["2024", "01"]
      const dataPoint: any = { month: `${monthPart}/${year.substring(2)}` }; // Format as "01/24"
      
      selectedSuppliersData.forEach(supplier => {
        const monthData = supplier.months.find(m => m.period === month);
        dataPoint[supplier.slug] = monthData ? monthData.turnover : 0;
      });

      return dataPoint;
    });
  }, [selectedSuppliersData]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div 
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          Graf dodavatelů
        </h2>
        {isMinimized ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        )}
      </div>

      {!isMinimized && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Selector dodavatelů */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Vyberte dodavatele (max 10):
            </h3>
            
            {/* Pole pro vyhledávání */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Vyhledat dodavatele..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Tlačítko pro zrušení všech výběrů */}
            {selectedSuppliers.length > 0 && (
              <div className="mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUncheckAll}
                  className="w-full text-xs"
                >
                  Zrušit vše ({selectedSuppliers.length})
                </Button>
              </div>
            )}
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchFilteredData.length > 0 ? (
                searchFilteredData.map((supplier, index) => {
                  const isSelected = selectedSuppliers.includes(supplier.slug);
                  const color = getSupplierColor(supplier.slug);
                  
                  return (
                    <label key={`${supplier.slug}-${index}`} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSupplierToggle(supplier.slug)}
                        disabled={!isSelected && selectedSuppliers.length >= 10}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-gray-700 truncate" title={supplier.name}>
                        {supplier.name}
                      </span>
                    </label>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm">Žádní dodavatelé nenalezeni</p>
                  {searchQuery && (
                    <p className="text-xs mt-1">Pro dotaz: "{searchQuery}"</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Graf */}
          <div className="lg:col-span-3">
            {selectedSuppliersData.length > 0 && chartData.length > 0 ? (
              <div className="h-96 border border-gray-200 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrencyCZK(value), 
                        selectedSuppliersData.find(s => s.slug === name)?.name || name
                      ]}
                      labelFormatter={(label) => `Měsíc: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value) => selectedSuppliersData.find(s => s.slug === value)?.name || value}
                    />
                    {selectedSuppliersData.map((supplier) => (
                      <Line
                        key={supplier.slug}
                        type="monotone"
                        dataKey={supplier.slug}
                        stroke={getSupplierColor(supplier.slug)}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        name={supplier.slug}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center border border-gray-200 rounded-lg">
                <div className="text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Nemáte vybrané dodavatele</p>
                  <p className="text-sm mt-1">Vyberte dodavatele pro zobrazení grafu</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuppliersPage() {
  const [data, setData] = useState<SupplierData | null>(null);
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
        const response = await fetch('/data/suppliers.json');
        if (!response.ok) {
          throw new Error('Nepodařilo se načíst data');
        }
        const jsonData = await response.json();
        setData(jsonData);
        
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
  }, []);

  // Funkce pro změnu období a jeho uložení
  const handleDateRangeChange = (start: MonthId | null, end: MonthId | null) => {
    setStartMonth(start);
    setEndMonth(end);
    saveDateRange(start, end);
  };

  // Funkce pro reset období na "Vše - Vše"
  const handleResetDateRange = () => {
    setStartMonth(null);
    setEndMonth(null);
    saveDateRange(null, null);
  };

  // Vypočítání filtrovaných summary hodnot - musí být před všemi podmíněnými returny
  const filteredSummary = useMemo(() => {
    if (!data || data.suppliers.length === 0) {
      return {
        totalSuppliers: 0,
        totalTurnover: 0,
        totalItems: 0,
        growingSuppliers: 0,
      };
    }

    const filteredSuppliers = data.suppliers.map(supplier => {
      // Filtruj měsíční data dodavatele podle období
      const filteredMonths = supplier.months.filter(month => {
        if (startMonth && month.period < startMonth) return false;
        if (endMonth && month.period > endMonth) return false;
        return true;
      });

      // Pokud nemá žádná data v rozmezí, vrať null (bude vyfiltrováno)
      if (filteredMonths.length === 0) return null;

      // Přepočítej celkové hodnoty pro filtrované období
      const totalTurnover = filteredMonths.reduce((sum, m) => sum + m.turnover, 0);
      const totalItems = filteredMonths.reduce((sum, m) => sum + m.items, 0);

      // Výpočet trendů pro filtrované období
      const firstNonZero = filteredMonths.find(m => m.turnover > 0);
      const lastNonZero = filteredMonths.slice().reverse().find(m => m.turnover > 0);
      
      const turnoverDeltaAbs = lastNonZero && firstNonZero ? lastNonZero.turnover - firstNonZero.turnover : 0;
      const turnoverDeltaPct = firstNonZero && firstNonZero.turnover > 0 
        ? (turnoverDeltaAbs / firstNonZero.turnover) * 100 
        : null;

      // Klasifikace trendu
      const turnoverTrend = turnoverDeltaPct === null ? "FLAT" : 
        turnoverDeltaPct >= 5 ? "UP" : 
        turnoverDeltaPct <= -5 ? "DOWN" : "FLAT";

      return {
        ...supplier,
        totalTurnover,
        totalItems,
        turnoverTrend,
      };
    }).filter((supplier): supplier is NonNullable<typeof supplier> => supplier !== null);

    return {
      totalSuppliers: filteredSuppliers.length,
      totalTurnover: filteredSuppliers.reduce((sum, s) => sum + s.totalTurnover, 0),
      totalItems: filteredSuppliers.reduce((sum, s) => sum + s.totalItems, 0),
      growingSuppliers: filteredSuppliers.filter(s => s.turnoverTrend === 'UP').length,
    };
  }, [data, startMonth, endMonth]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Načítám data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Chyba při načítání dat</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.suppliers.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Žádná data</h2>
          <p className="text-yellow-600 mb-4">
            Nebyla nalezena žádná data k zobrazení.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filtry */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <MonthRangePicker
            availableMonths={data.monthsAvailable}
            selectedStartMonth={startMonth}
            selectedEndMonth={endMonth}
            onRangeChange={handleDateRangeChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDateRange}
            className="whitespace-nowrap self-start sm:self-auto"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Summary karty */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Celkem dodavatelů</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredSummary.totalSuppliers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Celkový obrat</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrencyCZK(filteredSummary.totalTurnover)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Celkem položek</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(filteredSummary.totalItems)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Rostoucí dodavatelé</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredSummary.growingSuppliers}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hlavní obsah */}
      <div className="space-y-6">
        {/* Tabulka dodavatelů */}
        <SupplierTable 
          suppliers={data.suppliers}
          startMonth={startMonth}
          endMonth={endMonth}
        />

        {/* Graf dodavatelů */}
        <SupplierChart 
          suppliers={data.suppliers}
          startMonth={startMonth}
          endMonth={endMonth}
        />
      </div>
    </div>
  );
}
