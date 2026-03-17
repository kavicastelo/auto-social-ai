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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div
            className={`p-2 rounded-lg ${gradientIcon ? 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-600 dark:text-violet-400' : 'bg-muted text-muted-foreground'}`}>

            {icon}
          </div>
        </div>
        <div className="flex items-baseline space-x-3 mt-4">
          {loading ? (
             <Skeleton className="h-8 w-16" />
          ) : (
            <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
          )}
          {trend && !loading &&
          <div
            className={`flex items-center text-sm font-medium ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>

              {trend.isPositive ?
            <TrendingUpIcon className="mr-1 h-4 w-4" /> :

            <TrendingDownIcon className="mr-1 h-4 w-4" />
            }
              {trend.value}%
            </div>
          }
        </div>
      </CardContent>
    </Card>);

}