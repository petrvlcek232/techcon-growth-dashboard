'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useProcessedData } from '@/hooks/useProcessedData';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import PasswordGateway from '@/components/PasswordGateway';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  
  const { data, loading, error } = useProcessedData();

  // Kontrola autentizace při mount
  useEffect(() => {
    const authenticated = sessionStorage.getItem('authenticated') === 'true';
    setIsAuthenticated(authenticated);
  }, []);

  // Zobrazit password gateway, pokud uživatel není autentizován
  if (!isAuthenticated) {
    return <PasswordGateway onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Načítám data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Chyba při načítání dat</h2>
            <p className="text-red-600 mb-4">{error || 'Nepodařilo se načíst data'}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Zkusit znovu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar
          customers={data.customers}
          state={{}}
          onStateChange={() => {}}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <TopBar
            state={{}}
            onStateChange={() => {}}
            availableMonths={data.monthsAvailable}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />


          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
