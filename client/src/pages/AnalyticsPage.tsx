import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import { DownloadIcon, CalendarIcon, Loader2Icon, BarChart3Icon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MetricCard } from '../components/ui/MetricCard';
import { PlatformIcon } from '../components/ui/PlatformIcon';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export function AnalyticsPage() {
  const { activeWorkspace } = useAuth();
  const [timeRange] = useState('7d');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics-overview', activeWorkspace?.id, timeRange],
    queryFn: async () => {
      const response = await api.get('/analytics/overview', {
        params: { workspaceId: activeWorkspace?.id }
      });
      return response.data.data;
    },
    enabled: !!activeWorkspace,
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const performanceData = analytics?.platformBreakdown?.map((p: any) => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    posts: p.posts,
    engagement: p.engagement,
    reach: p.reach
  })) || [];

  const engagementData = analytics?.dailyMetrics?.map((d: any) => ({
    name: new Date(d.date).toLocaleDateString([], { weekday: 'short' }),
    value: d.engagement,
    reach: d.reach
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time performance metrics for <strong>{activeWorkspace?.name}</strong>.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Last {timeRange === '7d' ? '7 Days' : 'Month'}
          </Button>
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => {
              const headers = ['Platform', 'Posts', 'Reach', 'Engagement', 'Clicks'];
              const rows = analytics?.platformBreakdown?.map((p: any) => [
                p.platform,
                p.posts,
                p.reach,
                p.engagement,
                p.clicks
              ]);

              if (!rows) return;

              const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement("a");
              const url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", `analytics_report_${activeWorkspace?.name}.csv`);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <DownloadIcon className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2Icon className="h-10 w-10 animate-spin text-primary opacity-20" />
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Reach"
              value={formatNumber(analytics?.totalReach || 0)}
              icon={<span className="font-bold">R</span>}
              trend={{ value: 12.4, isPositive: true }}
            />
            <MetricCard
              title="Engagement"
              value={formatNumber(analytics?.totalEngagement || 0)}
              icon={<span className="font-bold">E</span>}
              trend={{ value: 5.2, isPositive: true }}
            />
            <MetricCard
              title="Link Clicks"
              value={formatNumber(analytics?.totalClicks || 0)}
              icon={<span className="font-bold">C</span>}
              trend={{ value: 2.1, isPositive: false }}
            />
            <MetricCard
              title="Total Posts"
              value={analytics?.totalPosts?.toString() || "0"}
              icon={<span className="font-bold">P</span>}
              trend={{ value: 18.2, isPositive: true }}
              gradientIcon
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Engagement Chart */}
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Engagement Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" name="Engagement" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Platform Performance */}
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Platform Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="reach" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Reach" />
                      <Bar dataKey="engagement" fill="#c4b5fd" radius={[4, 4, 0, 0]} name="Engagement" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Platforms List */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Platform Metrics Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Platform</th>
                      <th className="px-4 py-3 font-medium">Posts</th>
                      <th className="px-4 py-3 font-medium">Total Reach</th>
                      <th className="px-4 py-3 font-medium">Engagement</th>
                      <th className="px-4 py-3 font-medium">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analytics?.platformBreakdown?.map((p: any) => (
                      <tr key={p.platform} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4 flex items-center gap-2 font-medium">
                          <PlatformIcon platform={p.platform} className="h-4 w-4" />
                          <span className="capitalize">{p.platform}</span>
                        </td>
                        <td className="px-4 py-4">{p.posts}</td>
                        <td className="px-4 py-4 font-semibold">{formatNumber(p.reach)}</td>
                        <td className="px-4 py-4">{formatNumber(p.engagement)}</td>
                        <td className="px-4 py-4 text-violet-600 dark:text-violet-400">{formatNumber(p.clicks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!isLoading && (!analytics?.platformBreakdown || analytics.platformBreakdown.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/10">
          <BarChart3Icon className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-xl font-bold">No Data Yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Connect your social accounts and start posting to see detailed performance analytics here.
          </p>
        </div>
      )}
    </div>);
}