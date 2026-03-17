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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Posts Scheduled"
          value={metrics?.scheduledCount || "0"}
          icon={<CalendarClockIcon className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
          loading={isMetricsLoading}
          gradientIcon />

        <MetricCard
          title="Accounts"
          value={metrics?.accountsCount || "0"}
          icon={<UsersIcon className="h-5 w-5" />}
          loading={isMetricsLoading}
          trend={{ value: 0, isPositive: true }} />

        <MetricCard
          title="Content Items"
          value={metrics?.contentCount || "0"}
          icon={<FileTextIcon className="h-5 w-5" />}
          loading={isMetricsLoading}
          trend={{ value: 5, isPositive: true }}
          gradientIcon />

        <MetricCard
          title="Engagement"
          value={(metrics?.avgEngagement || "0") + "%"}
          icon={<ActivityIcon className="h-5 w-5" />}
          loading={isMetricsLoading}
          trend={{ value: 0.5, isPositive: false }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Scheduled Posts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Upcoming Posts</CardTitle>
            <Link to="/scheduler">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 pt-4">
              {isPostsLoading ? (
                // Skeletons for posts
                [1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-4 p-2">
                    <Skeleton className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" />
                    <div className="flex-1 space-y-2">
                       <Skeleton className="h-4 w-3/4" />
                       <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : recentPosts?.length > 0 ? (
                recentPosts.map((post: any) => (
                  <div key={post.id} className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
                      <PlatformIcon
                        platform={post.platform}
                        className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">
                        {post.status.toUpperCase()}: Post to {post.platform}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Scheduled for {new Date(post.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm italic mb-4">No upcoming posts found for this workspace.</p>
                  <Link to="/content">
                    <Button size="sm" variant="outline">Generate Content</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/content" className="w-full">
              <Button variant="primary" className="w-full justify-start gap-2">
                <PlusIcon className="h-4 w-4" />
                Create New Content
              </Button>
            </Link>
            <Link to="/scheduler" className="w-full mt-2 block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CalendarClockIcon className="h-4 w-4" />
                Schedule Post
              </Button>
            </Link>
            <Link to="/pages" className="w-full mt-2 block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <UsersIcon className="h-4 w-4" />
                Connect Account
              </Button>
            </Link>
            <div className="mt-6 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-4 border border-violet-500/20 shadow-sm">
              <h4 className="font-semibold text-violet-700 dark:text-violet-300 mb-2">
                Pro Tip
              </h4>
              <p className="text-sm text-muted-foreground">
                Set up an automation pipeline to automatically generate and
                schedule your weekly content across all platforms.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
}