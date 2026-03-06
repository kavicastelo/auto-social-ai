import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from
  'recharts';
import { DownloadIcon, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MetricCard } from '../components/ui/MetricCard';
import { PlatformIcon } from '../components/ui/PlatformIcon';
const engagementData = [
  {
    name: 'Mon',
    value: 4000
  },
  {
    name: 'Tue',
    value: 3000
  },
  {
    name: 'Wed',
    value: 5000
  },
  {
    name: 'Thu',
    value: 2780
  },
  {
    name: 'Fri',
    value: 6890
  },
  {
    name: 'Sat',
    value: 8390
  },
  {
    name: 'Sun',
    value: 7490
  }];

const performanceData = [
  {
    name: 'Twitter',
    views: 4000,
    likes: 2400
  },
  {
    name: 'LinkedIn',
    views: 3000,
    likes: 1398
  },
  {
    name: 'Instagram',
    views: 2000,
    likes: 9800
  },
  {
    name: 'TikTok',
    views: 2780,
    likes: 3908
  }];

export function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Analytics Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your social media performance across all platforms.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Last 7 Days
          </Button>
          <Button variant="primary" className="gap-2">
            <DownloadIcon className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Reach"
          value="2.4M"
          icon={<span className="font-bold">R</span>}
          trend={{
            value: 14.5,
            isPositive: true
          }} />

        <MetricCard
          title="Engagement"
          value="142K"
          icon={<span className="font-bold">E</span>}
          trend={{
            value: 8.2,
            isPositive: true
          }} />

        <MetricCard
          title="Link Clicks"
          value="12.5K"
          icon={<span className="font-bold">C</span>}
          trend={{
            value: 3.1,
            isPositive: false
          }} />

        <MetricCard
          title="Followers Growth"
          value="+4,230"
          icon={<span className="font-bold">F</span>}
          trend={{
            value: 22.4,
            isPositive: true
          }}
          gradientIcon />

      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={engagementData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0
                  }}>

                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))" />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12
                    }}
                    dy={10} />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12
                    }} />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    itemStyle={{
                      color: 'hsl(var(--foreground))'
                    }} />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)" />

                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0
                  }}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))" />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12
                    }}
                    dy={10} />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12
                    }} />

                  <Tooltip
                    cursor={{
                      fill: 'hsl(var(--muted))'
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }} />

                  <Bar dataKey="views" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="likes" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Content */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) =>
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">

                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <PlatformIcon
                      platform={
                        i === 1 ? 'LinkedIn' : i === 2 ? 'Twitter' : 'Instagram'
                      }
                      className="h-5 w-5 text-muted-foreground" />

                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      10 ways AI is changing the landscape of modern
                      marketing...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Published 2 days ago
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{(12.4 / i).toFixed(1)}K</p>
                  <p className="text-xs text-muted-foreground">Engagements</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>);

}