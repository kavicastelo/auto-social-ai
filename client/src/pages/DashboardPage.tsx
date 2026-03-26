import { useQuery } from '@tanstack/react-query';
import {
  CalendarClockIcon,
  UsersIcon,
  FileTextIcon,
  ActivityIcon,
  PlusIcon
} from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlatformIcon } from '../components/ui/PlatformIcon';
import { Badge } from '../components/ui/Badge';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';

export function DashboardPage() {
  const { activeWorkspace } = useAuth();

  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['analytics-overview', activeWorkspace?.id],
    queryFn: async () => {
      const response = await api.get('/analytics/overview');
      return response.data.data;
    },
    enabled: !!activeWorkspace,
  });

  const { data: recentPosts, isLoading: isPostsLoading } = useQuery({
    queryKey: ['recent-posts', activeWorkspace?.id],
    queryFn: async () => {
      const response = await api.get('/scheduler', { params: { limit: 5 } });
      return response.data.data;
    },
    enabled: !!activeWorkspace,
  });

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Metrics Row */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Scheduled"
          value={metrics?.scheduledCount || "0"}
          icon={<CalendarClockIcon className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
          loading={isMetricsLoading}
          gradientIcon />

        <MetricCard
          title="Social Accounts"
          value={metrics?.accountsCount || "0"}
          icon={<UsersIcon className="h-5 w-5" />}
          loading={isMetricsLoading}
          trend={{ value: 0, isPositive: true }} />

        <MetricCard
          title="Drafts"
          value={metrics?.contentCount || "0"}
          icon={<FileTextIcon className="h-5 w-5" />}
          loading={isMetricsLoading}
          trend={{ value: 5, isPositive: true }}
          gradientIcon />

        <MetricCard
          title="Avg Engage"
          value={(metrics?.avgEngagement || "0") + "%"}
          icon={<ActivityIcon className="h-5 w-5" />}
          loading={isMetricsLoading}
          trend={{ value: 0.5, isPositive: false }} />
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
        {/* Recent Scheduled Posts */}
        <Card className="lg:col-span-2 overflow-hidden border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Upcoming Posts</CardTitle>
            <Link to="/scheduler">
              <Button variant="ghost" size="sm" className="h-8 text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {isPostsLoading ? (
                // Skeletons for posts
                [1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-4 p-4">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : recentPosts?.length > 0 ? (
                recentPosts.map((post: any) => (
                  <div key={post.id} className="group flex items-center gap-4 p-4 hover:bg-violet-500/5 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border shadow-sm group-hover:border-violet-500/30 transition-colors">
                      <PlatformIcon
                        platform={post.platform}
                        className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate uppercase tracking-tight">
                        {post.platform} Post
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <CalendarClockIcon className="h-3 w-3" />
                        {new Date(post.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter">
                        {post.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-4">
                  <p className="text-muted-foreground text-sm italic mb-4">No upcoming posts found for this workspace.</p>
                  <Link to="/content">
                    <Button size="sm" variant="outline" className="font-bold">Generate Content</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-3">
            <Link to="/content" className="block">
              <Button variant="primary" className="w-full justify-start gap-3 h-11 shadow-lg shadow-violet-500/10">
                <PlusIcon className="h-4 w-4" />
                <span className="font-bold text-sm">Create New Content</span>
              </Button>
            </Link>
            <Link to="/scheduler" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-11 border-border/50 hover:bg-violet-500/5 hover:text-violet-600 hover:border-violet-500/30 transition-all">
                <CalendarClockIcon className="h-4 w-4" />
                <span className="font-bold text-sm">Schedule Post</span>
              </Button>
            </Link>
            <Link to="/pages" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-11 border-border/50 hover:bg-violet-500/5 hover:text-violet-600 hover:border-violet-500/30 transition-all">
                <UsersIcon className="h-4 w-4" />
                <span className="font-bold text-sm">Connect Account</span>
              </Button>
            </Link>

            <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-xl">
              <div className="relative z-10">
                <h4 className="font-black text-sm uppercase tracking-widest mb-1.5 opacity-90">
                  Pro Tip
                </h4>
                <p className="text-xs font-medium leading-relaxed opacity-80">
                  Set up an automation pipeline to automatically generate and
                  schedule your weekly content across all platforms.
                </p>
                <Link to="/pipelines">
                  <Button variant="secondary" size="sm" className="mt-4 w-full h-8 text-[10px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 border-0 text-white">
                    Go to Pipelines
                  </Button>
                </Link>
              </div>
              <ActivityIcon className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10 rotate-12" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}