'use client';

import { useState, useEffect } from 'react';
import { AggregatedData, CustomerSummary } from '@/lib/types';

export function useProcessedData() {
  const [data, setData] = useState<AggregatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/data/processed.json');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const jsonData: AggregatedData = await response.json();
        setData(jsonData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Neznámá chyba při načítání dat';
        setError(errorMessage);
        console.error('Chyba při načítání dat:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Vytvoř mapu zákazníků podle slug pro rychlý přístup
  const customersMap = data ? new Map(data.customers.map(c => [c.slug, c])) : new Map<string, CustomerSummary>();

  return {
    data,
    loading,
    error,
    monthsAvailable: data?.monthsAvailable || [],
    customers: data?.customers || [],
    customersMap,
    loaded: !loading && !error && data !== null,
  };
}

