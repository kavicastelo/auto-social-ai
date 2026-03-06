import {
  CalendarClockIcon,
  UsersIcon,
  FileTextIcon,
  ActivityIcon,
  PlusIcon
} from
  'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlatformIcon } from '../components/ui/PlatformIcon';
export function DashboardPage() {
  const recentActivity = [
    {
      id: 1,
      text: 'AI generated 5 LinkedIn posts',
      time: '2 min ago',
      platform: 'LinkedIn'
    },
    {
      id: 2,
      text: 'Scheduled Twitter thread',
      time: '15 min ago',
      platform: 'Twitter'
    },
    {
      id: 3,
      text: 'New Instagram carousel created',
      time: '1 hour ago',
      platform: 'Instagram'
    },
    {
      id: 4,
      text: 'TikTok script generated',
      time: '2 hours ago',
      platform: 'TikTok'
    },
    {
      id: 5,
      text: 'Analytics report ready',
      time: '3 hours ago',
      platform: 'System'
    }];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Posts Scheduled"
          value="28"
          icon={<CalendarClockIcon className="h-5 w-5" />}
          trend={{
            value: 12,
            isPositive: true
          }}
          gradientIcon />

        <MetricCard
          title="Active Pages"
          value="12"
          icon={<UsersIcon className="h-5 w-5" />}
          trend={{
            value: 2,
            isPositive: true
          }} />

        <MetricCard
          title="Generated Content"
          value="156"
          icon={<FileTextIcon className="h-5 w-5" />}
          trend={{
            value: 24,
            isPositive: true
          }}
          gradientIcon />

        <MetricCard
          title="Engagement Rate"
          value="4.8%"
          icon={<ActivityIcon className="h-5 w-5" />}
          trend={{
            value: 0.5,
            isPositive: false
          }} />

      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 pt-4">
              {recentActivity.map((activity) =>
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <PlatformIcon
                      platform={activity.platform}
                      className="h-4 w-4 text-muted-foreground" />

                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">
                      {activity.text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
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
            <Button variant="primary" className="w-full justify-start gap-2">
              <PlusIcon className="h-4 w-4" />
              Create New Content
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <CalendarClockIcon className="h-4 w-4" />
              Schedule Post
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <UsersIcon className="h-4 w-4" />
              Connect Account
            </Button>
            <div className="mt-6 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-4 border border-violet-500/20">
              <h4 className="font-semibold text-violet-700 dark:text-violet-300 mb-2">
                Pro Tip
              </h4>
              <p className="text-sm text-muted-foreground">
                Set up an automation pipeline to automatically generate and
                schedule your weekly content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}