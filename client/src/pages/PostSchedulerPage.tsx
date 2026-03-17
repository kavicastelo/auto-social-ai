import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { cn } from '../lib/utils';
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

  const queryClient = useQueryClient();
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, newDate }: { id: string, newDate: Date }) => {
      await api.patch(`/scheduler/${id}`, { scheduledAt: newDate.toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast.success('Post rescheduled!');
    }
  });

  const handleDragStart = (e: React.DragEvent, postId: string) => {
    e.dataTransfer.setData('postId', postId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData('postId');
    if (!postId) return;

    // Find original post to maintain its time
    const post = scheduledPosts?.find((p: any) => p.id === postId);
    if (!post) return;

    const originalTime = new Date(post.scheduledAt);
    const newDateTime = new Date(targetDate);
    newDateTime.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);

    updatePostMutation.mutate({ id: postId, newDate: newDateTime });
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

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-start">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight truncate">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center rounded-lg border border-border bg-card p-1 shadow-sm shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => changeWeek(-1)}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => changeWeek(1)}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Link to="/content" className="w-full md:w-auto">
          <Button variant="primary" className="gap-2 w-full md:w-auto justify-center">
            <PlusIcon className="h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-border bg-card/30 backdrop-blur-sm shadow-xl rounded-2xl">
        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-7 border-b border-border bg-muted/30">
          {calendarDays.map((date, i) => (
            <div
              key={i}
              className={`p-4 text-center ${i !== 6 ? 'border-r border-border' : ''}`}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{days[i]}</p>
              <p
                className={`mt-1 text-2xl font-black ${date.toDateString() === new Date().toDateString()
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-foreground'
                  }`}>
                {date.getDate()}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop Grid / Mobile List */}
        <div className="flex flex-col lg:grid lg:grid-cols-7 min-h-0 lg:min-h-[600px] bg-background/50 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {calendarDays.map((date, dayIndex) => {
            const posts = getPostsForDay(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={dayIndex}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, date)}
                className={cn(
                  "p-3 md:p-4 space-y-3 min-h-[120px] lg:min-h-full hover:bg-muted/5 transition-colors",
                  isToday && "bg-violet-500/5 lg:bg-transparent"
                )}>
                {/* Mobile Day Header */}
                <div className="flex items-center justify-between lg:hidden mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-widest",
                      isToday ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"
                    )}>
                      {days[dayIndex]}
                    </span>
                    <span className={cn(
                      "text-lg font-black",
                      isToday ? "text-violet-600 dark:text-violet-400 font-black" : "text-foreground"
                    )}>
                      {date.getDate()}
                    </span>
                  </div>
                  {posts.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                    </Badge>
                  )}
                </div>

                {isLoading ? (
                  <div className="h-12 w-full animate-pulse bg-muted rounded-md" />
                ) : posts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {posts.map((post: any) => (
                      <div
                        key={post.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, post.id)}
                        className="group relative flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:border-violet-500/50 hover:shadow-lg lg:hover:-translate-y-1 cursor-grab active:cursor-grabbing overflow-hidden">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <PlatformIcon
                              platform={post.platform}
                              className="h-3.5 w-3.5 text-muted-foreground" />
                            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                              <ClockIcon className="h-3 w-3" />
                              {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <Badge
                            variant={post.status === 'scheduled' || post.status === 'published' ? 'success' : 'secondary'}
                            className="text-[9px] px-1.5 py-0 uppercase font-bold tracking-tighter">
                            {post.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground/80 line-clamp-2 md:line-clamp-3 leading-relaxed italic">
                          "{post.content || post.body}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="hidden lg:flex h-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-muted-foreground italic font-medium">No posts</p>
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