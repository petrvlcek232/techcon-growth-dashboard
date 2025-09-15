'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { CustomerMonthly } from '@/lib/types';
import { formatCurrencyCZK } from '@/lib/format';

interface SparklineProps {
  data: CustomerMonthly[];
  className?: string;
}

export function Sparkline({ data, className }: SparklineProps) {
  // Filtruj pouze měsíce s nenulovým revenue pro lepší vizualizaci
  const chartData = data
    .filter(d => d.revenue > 0)
    .map(d => ({
      period: d.period,
      revenue: d.revenue,
    }));

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center text-gray-400 text-xs ${className || ''}`}>
        Žádná data
      </div>
    );
  }

  return (
    <div className={`h-8 ${className || ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: '#3b82f6' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-2 border rounded shadow-sm text-xs">
                    <div className="font-medium">{data.period}</div>
                    <div className="text-blue-600">
                      {formatCurrencyCZK(data.revenue)}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
