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
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Reach"
              value={formatNumber(analytics?.totalReach || 0)}
              icon={<span className="font-bold">R</span>}
              trend={{ value: 12.4, isPositive: true }}
            />
            <MetricCard
              title="Engage"
              value={formatNumber(analytics?.totalEngagement || 0)}
              icon={<span className="font-bold">E</span>}
              trend={{ value: 5.2, isPositive: true }}
            />
            <MetricCard
              title="Clicks"
              value={formatNumber(analytics?.totalClicks || 0)}
              icon={<span className="font-bold">C</span>}
              trend={{ value: 2.1, isPositive: false }}
            />
            <MetricCard
              title="Posts"
              value={analytics?.totalPosts?.toString() || "0"}
              icon={<span className="font-bold">P</span>}
              trend={{ value: 18.2, isPositive: true }}
              gradientIcon
            />
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
            {/* Engagement Chart */}
            <Card className="bg-card/50 backdrop-blur-sm border-border overflow-hidden">
              <CardHeader className="p-4 md:p-6 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Engagement Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-2 md:p-6 pt-0">
                <div className="h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={engagementData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" name="Engagement" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Platform Performance */}
            <Card className="bg-card/50 backdrop-blur-sm border-border overflow-hidden">
              <CardHeader className="p-4 md:p-6 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Platform Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-2 md:p-6 pt-0">
                <div className="h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                      <Bar dataKey="reach" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Reach" />
                      <Bar dataKey="engagement" fill="#c4b5fd" radius={[4, 4, 0, 0]} name="Engage" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Platforms Detail */}
          <Card className="border-border overflow-hidden shadow-lg rounded-2xl">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Growth per Platform</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto scrollbar-none">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-[10px] text-muted-foreground uppercase bg-muted/10 tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4 font-bold">Platform</th>
                    <th className="px-6 py-4 font-bold text-center">Posts</th>
                    <th className="px-6 py-4 font-bold text-right">Reach</th>
                    <th className="px-6 py-4 font-bold text-right">Engage</th>
                    <th className="px-6 py-4 font-bold text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {analytics?.platformBreakdown?.map((p: any) => (
                    <tr key={p.platform} className="hover:bg-violet-500/5 transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-card border border-border shadow-sm group-hover:border-violet-500/30 transition-colors">
                            <PlatformIcon platform={p.platform} className="h-4 w-4" />
                          </div>
                          <span className="capitalize font-bold text-foreground">{p.platform}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-medium">{p.posts}</td>
                      <td className="px-6 py-5 text-right font-black text-foreground">{formatNumber(p.reach)}</td>
                      <td className="px-6 py-5 text-right font-medium text-muted-foreground">{formatNumber(p.engagement)}</td>
                      <td className="px-6 py-5 text-right font-bold text-violet-600 dark:text-violet-400">{formatNumber(p.clicks)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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