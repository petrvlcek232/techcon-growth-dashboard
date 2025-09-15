'use client';

import { Button } from '@/src/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onRefresh?: () => Promise<void>;
}

export function Header({ onRefresh }: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              TechCon Growth Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Analýza růstu a poklesu zákazníků
            </p>
          </div>
          
          {onRefresh && (
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Aktualizuji...' : 'Refresh data'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
