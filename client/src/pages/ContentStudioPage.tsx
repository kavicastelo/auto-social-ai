import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  SparklesIcon,
  RefreshCwIcon,
  Wand2Icon,
  ArrowDownToLineIcon,
  CopyIcon,
  CalendarIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { RichTextEditor } from '../components/ui/RichTextEditor';
import { PlatformIcon } from '../components/ui/PlatformIcon';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export function ContentStudioPage() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Twitter', 'LinkedIn']);
  const [contentType, setContentType] = useState('Standard Post');
  const [includeMedia, setIncludeMedia] = useState(true);

  const [generatedContent, setGeneratedContent] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('Twitter');

  const canModify = useMemo(() => {
    return activeWorkspace?.role === 'owner' || activeWorkspace?.role === 'admin';
  }, [activeWorkspace]);

  // Query for media asset if present in the active draft
  const activeMediaId = useMemo(() => {
    return generatedContent[activeTab.toLowerCase()]?.mediaAssetId;
  }, [generatedContent, activeTab]);

  const { data: activeMedia } = useQuery({
    queryKey: ['media-asset', activeMediaId],
    queryFn: async () => {
      const res = await api.get('/media');
      return res.data.data.find((m: any) => m.id === activeMediaId);
    },
    enabled: !!activeMediaId,
    refetchInterval: (query: any) => (query?.state?.data?.url === 'generating...' ? 3000 : false),
  });

  const { data: accounts } = useQuery({
    queryKey: ['social-accounts', activeWorkspace?.id],
    queryFn: async () => {
      const response = await api.get('/accounts');
      return response.data.data;
    },
    enabled: !!activeWorkspace,
  });

  const activeAccount = useMemo(() => {
    return accounts?.find((acc: any) => acc.platform.toLowerCase() === activeTab.toLowerCase());
  }, [accounts, activeTab]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/content/generate', {
        topic,
        tone,
        platforms: selectedPlatforms.map(p => p.toLowerCase()),
        type: contentType,
        includeMedia,
        workspaceId: activeWorkspace?.id
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      const initialMap: Record<string, any> = {};
      Object.keys(data.content || {}).forEach(plat => {
        initialMap[plat.toLowerCase()] = {
          ...data.content[plat],
          status: 'draft',
          body: 'AI is generating...'
        };
      });
      setGeneratedContent(prev => ({ ...prev, ...initialMap }));

      const firstPlat = Object.keys(data.content || {})[0];
      if (firstPlat) {
        const displayPlat = platforms.find(p => p.toLowerCase() === firstPlat.toLowerCase()) || firstPlat;
        setActiveTab(displayPlat);
      }
      toast.success(includeMedia ? 'AI is drafting your post and graphic...' : 'AI is generating your content...');
    }
  });

  // Poll for generated content if any are still in 'draft' status
  const pendingContentIds = useMemo(() => {
    return Object.values(generatedContent)
      .filter(c => c.status === 'draft')
      .map(c => c.id);
  }, [generatedContent]);

  const { data: polledData } = useQuery({
    queryKey: ['poll-content', pendingContentIds],
    queryFn: async () => {
      return Promise.all(
        pendingContentIds.map(id => api.get(`/content/${id}`).then(res => res.data.data))
      );
    },
    enabled: pendingContentIds.length > 0,
    refetchInterval: 2000, // Poll every 2 seconds for faster updates
  });

  // Sync polled data with local state as soon as it arrives
  useEffect(() => {
    if (polledData && polledData.length > 0) {
      polledData.forEach(content => {
        if (content.status !== 'draft') {
          setGeneratedContent(prev => {
            // Only update if the status actually changed to avoid unnecessary re-renders
            if (prev[content.platform.toLowerCase()]?.status === content.status) return prev;
            return {
              ...prev,
              [content.platform.toLowerCase()]: content
            };
          });
        }
      });
    }
  }, [polledData]);

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const platformKey = activeTab.toLowerCase();
      const contentData = generatedContent[platformKey];

      if (!contentData?.id) {
        throw new Error('Please generate content first');
      }

      if (!activeAccount) {
        throw new Error(`Please connect your ${activeTab} account first`);
      }

      // 1. Update content with latest editor changes if any
      await api.patch(`/content/${contentData.id}`, {
        body: contentData.body
      });

      // 2. Create scheduled post
      await api.post('/scheduler/create', {
        contentId: contentData.id,
        accountId: activeAccount.id,
        publishTime: new Date(Date.now() + 3600000).toISOString(), // Default: 1 hour from now
      });
    },
    onSuccess: () => {
      toast.success('Post scheduled successfully!');
      queryClient.invalidateQueries({ queryKey: ['recent-posts'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to schedule post');
    }
  });

  const refineMutation = useMutation({
    mutationFn: async (action: string) => {
      const platformKey = activeTab.toLowerCase();
      const contentData = generatedContent[platformKey];

      if (!contentData?.id) return;

      // Update local state to 'draft' to trigger polling and visual feedback
      setGeneratedContent(prev => ({
        ...prev,
        [platformKey]: { ...prev[platformKey], status: 'draft', body: 'Refining...' }
      }));

      await api.post('/content/refine', {
        contentId: contentData.id,
        action,
        platforms: [platformKey]
      });
    },
    onSuccess: () => {
      toast.success('AI is refining your content...');
    }
  });

  const togglePlatform = (plat: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(plat) ? prev.filter(p => p !== plat) : [...prev, plat]
    );
  };

  const platforms = ['Twitter', 'LinkedIn', 'Instagram', 'Facebook', 'TikTok'];

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 h-auto lg:h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      {/* Left Panel - Inputs */}
      <Card className="lg:col-span-4 flex flex-col overflow-hidden max-h-[600px] lg:max-h-none">
        <CardHeader className="border-b border-border bg-muted/30 pb-4 shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2Icon className="h-5 w-5 text-violet-500" />
            AI Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Topic or URL</label>
            <Textarea
              placeholder="What should the post be about? e.g., 'The future of AI in marketing'"
              className="resize-none h-24 text-sm"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option>Professional</option>
              <option>Casual</option>
              <option>Humorous</option>
              <option>Inspirational</option>
              <option>Educational</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Target Platforms</label>
            <div className="grid grid-cols-2 xs:grid-cols-3 lg:grid-cols-2 gap-2">
              {platforms.map((platform) => (
                <div
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={cn(
                    "flex items-center space-x-2 rounded-lg border p-2 cursor-pointer transition-colors",
                    selectedPlatforms.includes(platform) ? "bg-violet-500/10 border-violet-500/50" : "bg-background border-input hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "h-4 w-4 rounded border shrink-0 flex items-center justify-center",
                    selectedPlatforms.includes(platform) ? "bg-violet-500 border-violet-500" : "bg-transparent border-input"
                  )}>
                    {selectedPlatforms.includes(platform) && <div className="h-1.5 w-1.5 bg-white rounded-full" />}
                  </div>
                  <label className="text-[10px] md:text-sm cursor-pointer flex items-center gap-1 md:gap-2 flex-1 truncate">
                    <PlatformIcon platform={platform} className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    {platform}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option>Standard Post</option>
              <option>Thread / Carousel</option>
              <option>Short Video Script</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={cn(
                "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                includeMedia ? "bg-violet-500 border-violet-500 shadow-sm" : "bg-card border-input group-hover:border-violet-300"
              )} onClick={() => setIncludeMedia(!includeMedia)}>
                {includeMedia && <div className="h-1.5 w-1.5 bg-white rounded-full" />}
              </div>
              <span className="text-sm font-medium">Generate AI Image</span>
            </label>
          </div>
        </CardContent>
        <div className="p-4 md:p-6 pt-0 border-t border-border mt-auto bg-background shrink-0">
          <Button
            variant="primary"
            className="w-full gap-2 mt-4"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !topic}>
            {generateMutation.isPending ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              <SparklesIcon className="h-4 w-4" />
            )}
            {generateMutation.isPending ? 'Generating...' : 'Generate Content'}
          </Button>
        </div>
      </Card>

      {/* Right Panel - Editor & Preview */}
      <Card className="lg:col-span-8 flex flex-col overflow-hidden min-h-[500px] lg:min-h-0">
        {selectedPlatforms.length > 0 ? (
          <>
            <div className="border-b border-border bg-muted/30 px-2 flex overflow-x-auto scrollbar-none shrink-0">
              {selectedPlatforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => setActiveTab(platform)}
                  className={cn(
                    "flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeTab === platform
                      ? "border-violet-500 text-violet-600 dark:text-violet-400"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <PlatformIcon platform={platform} className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  {platform}
                  {!accounts?.some((a: any) => a.platform.toLowerCase() === platform.toLowerCase()) && (
                    <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-amber-500" title="Account not connected" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-background/50">
              <div className="flex flex-wrap justify-end gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 md:gap-1.5 text-[10px] md:text-xs"
                  onClick={() => refineMutation.mutate('regenerate')}
                  disabled={!canModify || refineMutation.isPending || !generatedContent[activeTab.toLowerCase()]}
                >
                  <RefreshCwIcon className={cn("h-3 w-3", refineMutation.isPending && "animate-spin")} />
                  <span className="hidden xs:inline">Regenerate</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 md:gap-1.5 text-[10px] md:text-xs"
                  onClick={() => refineMutation.mutate('improve')}
                  disabled={!canModify || refineMutation.isPending || !generatedContent[activeTab.toLowerCase()]}
                >
                  <Wand2Icon className="h-3 w-3" />
                  <span className="hidden xs:inline">Improve</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 md:gap-1.5 text-[10px] md:text-xs"
                  onClick={() => refineMutation.mutate('shorten')}
                  disabled={!canModify || refineMutation.isPending || !generatedContent[activeTab.toLowerCase()]}
                >
                  <ArrowDownToLineIcon className="h-3 w-3" />
                  <span className="hidden xs:inline">Shorten</span>
                </Button>
              </div>

              <div className="flex-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                <div className="flex items-center gap-3 p-3 md:p-4 border-b border-border bg-muted/20 shrink-0">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <PlatformIcon platform={activeTab} className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-foreground truncate">Preview {activeTab}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Draft mode</p>
                  </div>
                </div>

                {activeMedia && (
                  <div className="border-b border-border bg-muted/5 relative aspect-video sm:aspect-[21/9] overflow-hidden group flex items-center justify-center">
                    {activeMedia.url === 'generating...' ? (
                      <div className="flex flex-col items-center gap-2">
                         <RefreshCwIcon className="h-8 w-8 text-violet-500 animate-spin opacity-40" />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-violet-500/60 animate-pulse">Architecting Graphic...</span>
                      </div>
                    ) : (
                      <img src={activeMedia.url} alt="Post graphic" className="h-full w-full object-cover" />
                    )}
                  </div>
                )}

                <RichTextEditor
                  className="flex-1 border-0 rounded-none focus-within:ring-0 shadow-none border-t border-border overflow-y-auto"
                  value={generatedContent[activeTab.toLowerCase()]?.body || ''}
                  onChange={(val: string) => setGeneratedContent(prev => ({
                    ...prev,
                    [activeTab.toLowerCase()]: { ...prev[activeTab.toLowerCase()], body: val }
                  }))}
                  placeholder='Click "Generate Content" on the left to start...'
                  readOnly={!canModify}
                  limit={
                    activeTab === 'Twitter' ? 280 :
                      activeTab === 'LinkedIn' ? 3000 :
                        activeTab === 'Instagram' ? 2200 :
                          activeTab === 'Facebook' ? 5000 :
                            activeTab === 'TikTok' ? 2200 :
                              activeTab === 'Google' ? 5000 : 0
                  }
                />

                {/* Tags Display */}
                {generatedContent[activeTab.toLowerCase()]?.tags?.length > 0 && (
                  <div className="p-3 md:p-4 border-t border-border bg-muted/10 flex flex-wrap gap-1.5 md:gap-2 shrink-0">
                    {generatedContent[activeTab.toLowerCase()].tags.map((tag: string, i: number) => (
                      <span key={i} className="text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-3 mt-4 md:mt-6 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-1 sm:flex-none justify-center"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent[activeTab.toLowerCase()]?.body || '');
                    toast.success('Copied to clipboard!');
                  }}
                >
                  <CopyIcon className="h-4 w-4" />
                  <span className="hidden xs:inline">Copy</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-2 flex-1 sm:flex-none justify-center shadow-lg shadow-primary/10"
                  onClick={() => scheduleMutation.mutate()}
                  disabled={!canModify || !generatedContent[activeTab.toLowerCase()] || scheduleMutation.isPending}
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>{activeAccount ? (window.innerWidth < 640 ? 'Schedule' : 'Schedule Now') : 'Connect Account'}</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 md:p-12">
            <Wand2Icon className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/20 mb-4" />
            <h3 className="text-lg md:text-xl font-bold">Ready to Create?</h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              Select a target platform and enter a topic on the left to generate your first AI-powered social media post.
            </p>
          </div>
        )}
      </Card>
    </div>);
}