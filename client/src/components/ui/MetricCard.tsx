import React from 'react';
import { Card, CardContent } from './Card';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { Skeleton } from './Skeleton';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradientIcon?: boolean;
  loading?: boolean;
}
export function MetricCard({
  title,
  value,
  icon,
  trend,
  gradientIcon = false,
  loading = false,
}: MetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between space-x-2 pb-2">
          <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <div
            className={`p-1.5 md:p-2 rounded-lg shrink-0 ${gradientIcon ? 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-600 dark:text-violet-400' : 'bg-muted text-muted-foreground'}`}>
            {icon}
          </div>
        </div>
        <div className="flex flex-wrap items-baseline gap-2 mt-2 md:mt-4">
          {loading ? (
             <Skeleton className="h-7 w-12 md:h-8 md:w-16" />
          ) : (
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">{value}</h2>
          )}
          {trend && !loading && (
            <div
              className={`flex items-center text-[10px] md:text-sm font-medium ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
              {trend.isPositive ?
                <TrendingUpIcon className="mr-0.5 md:mr-1 h-3 w-3 md:h-4 md:w-4" /> :
                <TrendingDownIcon className="mr-0.5 md:mr-1 h-3 w-3 md:h-4 md:w-4" />
              }
              {trend.value}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>);

}