'use client';

import { Badge } from '@/src/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendBadgeProps {
  trend: 'UP' | 'DOWN' | 'FLAT';
  percentage?: number | null;
  className?: string;
}

export function TrendBadge({ trend, percentage, className }: TrendBadgeProps) {
  // Vytvoří label s procenty pokud jsou dostupná
  const getLabel = (trend: 'UP' | 'DOWN' | 'FLAT', pct?: number | null) => {
    if (pct !== null && pct !== undefined) {
      if (trend === 'UP') {
        return `Roste +${pct.toFixed(1)}%`;
      } else if (trend === 'DOWN') {
        return `Klesá ${pct.toFixed(1)}%`; // pct už bude záporné
      }
    }
    
    // Fallback na původní labely
    switch (trend) {
      case 'UP': return 'Roste';
      case 'DOWN': return 'Klesá';
      case 'FLAT': return 'Stabilní';
    }
  };

  const config = {
    UP: {
      icon: TrendingUp,
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
      label: getLabel('UP', percentage)
    },
    DOWN: {
      icon: TrendingDown,
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
      label: getLabel('DOWN', percentage)
    },
    FLAT: {
      icon: Minus,
      variant: 'secondary' as const,
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      label: getLabel('FLAT', percentage)
    }
  };

  const { icon: Icon, className: badgeClassName, label } = config[trend];

  return (
    <Badge 
      variant={config[trend].variant}
      className={`${badgeClassName} ${className || ''}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
