import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon
} from
  'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlatformIcon } from '../components/ui/PlatformIcon';
import { Badge } from '../components/ui/Badge';
export function PostSchedulerPage() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = [12, 13, 14, 15, 16, 17, 18];
  const scheduledPosts = [
    {
      id: 1,
      day: 0,
      time: '09:00 AM',
      platform: 'Twitter',
      content: 'The future of AI in marketing...',
      status: 'scheduled'
    },
    {
      id: 2,
      day: 0,
      time: '02:30 PM',
      platform: 'LinkedIn',
      content: 'How we scaled our engineering team...',
      status: 'scheduled'
    },
    {
      id: 3,
      day: 2,
      time: '11:00 AM',
      platform: 'Instagram',
      content: 'Behind the scenes at our retreat 🌴',
      status: 'draft'
    },
    {
      id: 4,
      day: 3,
      time: '10:15 AM',
      platform: 'Twitter',
      content: 'Thread: 5 lessons from building...',
      status: 'scheduled'
    },
    {
      id: 5,
      day: 4,
      time: '04:00 PM',
      platform: 'TikTok',
      content: 'Day in the life of a PM',
      status: 'scheduled'
    }];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">August 2024</h2>
          <div className="flex items-center rounded-lg border border-border bg-card p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button variant="primary" className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Schedule New Post
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {days.map((day, i) =>
            <div
              key={day}
              className={`p-4 text-center ${i !== 6 ? 'border-r border-border' : ''}`}>

              <p className="text-sm font-medium text-muted-foreground">{day}</p>
              <p
                className={`mt-1 text-2xl font-semibold ${i === 2 ? 'text-violet-600 dark:text-violet-400' : 'text-foreground'}`}>

                {dates[i]}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-7 min-h-[600px] bg-background">
          {days.map((_, dayIndex) =>
            <div
              key={dayIndex}
              className={`p-2 space-y-3 ${dayIndex !== 6 ? 'border-r border-border' : ''}`}>

              {scheduledPosts.
                filter((post) => post.day === dayIndex).
                map((post) =>
                  <div
                    key={post.id}
                    className="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:border-violet-500/50 hover:shadow-md cursor-pointer">

                    <div className="flex items-center justify-between">
                      <PlatformIcon
                        platform={post.platform}
                        className="h-4 w-4 text-muted-foreground" />

                      <Badge
                        variant={
                          post.status === 'scheduled' ? 'success' : 'secondary'
                        }
                        className="text-[10px] px-1.5 py-0">

                        {post.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mt-1">
                      <ClockIcon className="h-3 w-3" />
                      {post.time}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </Card>
    </div>);

}