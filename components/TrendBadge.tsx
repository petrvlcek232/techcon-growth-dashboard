'use client';

import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendBadgeProps {
  trend: 'UP' | 'DOWN' | 'FLAT';
  className?: string;
}

export function TrendBadge({ trend, className }: TrendBadgeProps) {
  const config = {
    UP: {
      icon: TrendingUp,
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
      label: 'Roste'
    },
    DOWN: {
      icon: TrendingDown,
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
      label: 'Klesá'
    },
    FLAT: {
      icon: Minus,
      variant: 'secondary' as const,
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      label: 'Stabilní'
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
