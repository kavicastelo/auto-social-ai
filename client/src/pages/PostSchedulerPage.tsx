import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
  CalendarIcon
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlatformIcon } from '../components/ui/PlatformIcon';
import { Badge } from '../components/ui/Badge';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

export function PostSchedulerPage() {
  const { activeWorkspace } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: scheduledPosts, isLoading } = useQuery({
    queryKey: ['scheduled-posts', activeWorkspace?.id],
    queryFn: async () => {
      const response = await api.get('/scheduler');
      return response.data.data;
    },
    enabled: !!activeWorkspace,
  });

  const calendarDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Start of week (Monday)

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getPostsForDay = (date: Date) => {
    if (!scheduledPosts) return [];
    return scheduledPosts.filter((post: any) => {
      const postDate = new Date(post.scheduledAt);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const changeWeek = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (offset * 7));
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center rounded-lg border border-border bg-card p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => changeWeek(-1)}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => changeWeek(1)}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Link to="/content">
          <Button variant="primary" className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Schedule New Post
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-border bg-card/30 backdrop-blur-sm">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {calendarDays.map((date, i) => (
            <div
              key={i}
              className={`p-4 text-center ${i !== 6 ? 'border-r border-border' : ''}`}>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{days[i]}</p>
              <p
                className={`mt-1 text-2xl font-bold ${date.toDateString() === new Date().toDateString()
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-foreground'
                  }`}>
                {date.getDate()}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[600px] bg-background/50">
          {calendarDays.map((date, dayIndex) => {
            const posts = getPostsForDay(date);
            return (
              <div
                key={dayIndex}
                className={`p-2 space-y-3 ${dayIndex !== 6 ? 'border-r border-border' : ''} min-h-full hover:bg-muted/5 transition-colors`}>
                {isLoading ? (
                  <div className="h-12 w-full animate-pulse bg-muted rounded-md" />
                ) : posts.length > 0 ? (
                  posts.map((post: any) => (
                    <div
                      key={post.id}
                      className="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:border-violet-500/50 hover:shadow-md cursor-pointer overflow-hidden">
                      <div className="flex items-center justify-between">
                        <PlatformIcon
                          platform={post.platform}
                          className="h-4 w-4 text-muted-foreground" />
                        <Badge
                          variant={post.status === 'scheduled' || post.status === 'published' ? 'success' : 'secondary'}
                          className="text-[10px] px-1.5 py-0 uppercase">
                          {post.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mt-1">
                        <ClockIcon className="h-3 w-3" />
                        {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Empty slot placeholder */}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {!isLoading && scheduledPosts?.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Your schedule is empty</h3>
          <p className="text-muted-foreground mt-1 mb-6">Plan your social media presence ahead of time.</p>
          <Link to="/content">
            <Button variant="outline">Schedule your first post</Button>
          </Link>
        </div>
      )}
    </div>);
}