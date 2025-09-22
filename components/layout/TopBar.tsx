'use client';

import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface TopBarProps {
  state: any;
  onStateChange: (updates: any) => void;
  availableMonths: string[];
  onMenuToggle?: () => void;
}

export function TopBar({ 
  state, 
  onStateChange, 
  availableMonths, 
  onMenuToggle 
}: TopBarProps) {

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu button and title */}
        <div className="flex items-center space-x-3">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="lg:hidden p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              ABC Díly - přehledy
            </h1>
            <p className="text-sm text-gray-600">
              Analýza růstu a poklesu zákazníků
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
