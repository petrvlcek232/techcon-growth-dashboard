'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Truck,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CustomerSummary } from '@/lib/types';

interface SidebarProps {
  customers: CustomerSummary[];
  state: Record<string, unknown>;
  onStateChange: (updates: Record<string, unknown>) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  {
    name: 'Zákazníci',
    href: '/customers',
    icon: Users,
    description: 'Přehled všech zákazníků'
  },
  {
    name: 'Dodavatelé',
    href: '/suppliers',
    icon: Truck,
    description: 'Přehled všech dodavatelů'
  }
];

export function Sidebar({ customers, state, onStateChange, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
        "flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">ABC Díly</h2>
              <p className="text-xs text-gray-500">Přehledy</p>
            </div>
          )}
          
          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="p-1 h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "hover:bg-gray-100 hover:text-gray-900",
                  isActive 
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700" 
                    : "text-gray-600",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                {!isCollapsed && (
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <div>Celkem zákazníků: {customers.length}</div>
              <div className="mt-1">
                {customers.filter(c => c.trend > 0).length} rostoucích, {' '}
                {customers.filter(c => c.trend < 0).length} klesajících
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Bubble */}
      {isOpen && (
        <div className="fixed top-16 left-4 z-50 lg:hidden">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[200px]">
            {/* Close button */}
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="p-1 h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onToggle} // Zavře menu po kliknutí
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      "hover:bg-gray-100 hover:text-gray-900",
                      isActive 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-gray-600"
                    )}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
