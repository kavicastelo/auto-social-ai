import { useMemo, useState } from 'react';
import {
  UploadIcon,
  SearchIcon,
  FilterIcon,
  ImageIcon,
  VideoIcon,
  FileTextIcon,
  MoreVerticalIcon,
  Trash2Icon,
  DownloadIcon,
  SparklesIcon,
  XIcon,
  RefreshCwIcon,
  CopyIcon,
  CalendarIcon,
  ExternalLinkIcon,
  RepeatIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../lib/utils';

export function MediaLibraryPage() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiQuote, setAiQuote] = useState('');
  const [aiStyle, setAiStyle] = useState<'vivid' | 'natural'>('vivid');
  const [aiSize, setAiSize] = useState<'1024x1024' | '1024x1792' | '1792x1024'>('1024x1024');
  const [activeTab, setActiveTab] = useState<'assets' | 'generations'>('assets');
  const navigate = useNavigate();

  const canModify = useMemo(() => {
    return activeWorkspace?.role === 'owner' || activeWorkspace?.role === 'admin';
  }, [activeWorkspace]);

  const { data: mediaItems, isLoading: isMediaLoading } = useQuery({
    queryKey: ['media-assets', activeWorkspace?.id],
    queryFn: async () => {
      const response = await api.get('/media');
      return response.data.data;
    },
    enabled: !!activeWorkspace && activeTab === 'assets',
    refetchInterval: (query: any) => {
      const data = query.state.data;
      // Poll every 3 seconds if any item is still generating
      const isGenerating = Array.isArray(data) && data.some((item: any) => item.url === 'generating...');
      return isGenerating ? 3000 : false;
    }
  });

  const { data: contentItems, isLoading: isContentLoading } = useQuery({
    queryKey: ['content-generations', activeWorkspace?.id],
    queryFn: async () => {
      const response = await api.get('/content');
      return response.data.data;
    },
    enabled: !!activeWorkspace && activeTab === 'generations',
    refetchInterval: (query: any) => {
      const data = query.state.data;
      const isGenerating = Array.isArray(data) && data.some((item: any) => item.status === 'draft');
      return isGenerating ? 3000 : false;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/media/${id}`);
    },
    onSuccess: () => {
      toast.success('File deleted');
      queryClient.invalidateQueries({ queryKey: ['media-assets', activeWorkspace?.id] });
    },
    onError: () => {
      toast.error('Failed to delete file');
    }
  });

  const generateAiMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post('/media/generate', payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('AI Architect is drafting your vision...');
      setIsAiModalOpen(false);
      setAiQuote('');
      queryClient.invalidateQueries({ queryKey: ['media-assets', activeWorkspace?.id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to trigger AI generation');
    }
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/content/${id}`);
    },
    onSuccess: () => {
      toast.success('Content entry cleared');
      queryClient.invalidateQueries({ queryKey: ['content-generations', activeWorkspace?.id] });
    }
  });

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e: any) => {
      const files = e.target.files;
      if (!files.length) return;

      const uploadToast = toast.loading(`Uploading ${files.length} file(s)...`);

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const contentType = file.type || 'application/octet-stream';

          // 1. Get Presigned URL
          const { data: urlRes } = await api.post('/media/upload-url', {
            fileName: file.name,
            contentType
          });

          const { uploadUrl, key } = urlRes.data;

          // 2. Direct upload to Cloudflare R2 / AWS S3
          await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': contentType,
            }
          });

          // 3. Commit to Database
          await api.post('/media/commit', {
            key,
            originalName: file.name,
            mimeType: contentType,
            size: file.size,
            tags: [],
            metadata: {}
          });
        }

        toast.success('Upload complete', { id: uploadToast });
        queryClient.invalidateQueries({ queryKey: ['media-assets', activeWorkspace?.id] });
      } catch (err) {
        console.error('Upload failed:', err);
        toast.error('Upload failed', { id: uploadToast });
      }
    };
    input.click();
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-8 w-8 text-violet-500 opacity-50" />;
      case 'video':
        return <VideoIcon className="h-8 w-8 text-blue-500 opacity-50" />;
      default:
        return <FileTextIcon className="h-8 w-8 text-muted-foreground opacity-50" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredMedia = mediaItems?.filter((item: any) =>
    item.originalName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContent = contentItems?.filter((item: any) =>
    (item.body?.toLowerCase().includes(search.toLowerCase()) || item.title?.toLowerCase().includes(search.toLowerCase()))
  );

  const isLoading = activeTab === 'assets' ? isMediaLoading : isContentLoading;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-black tracking-tight truncate">Content Library</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate max-w-xs md:max-w-none">
            Archives and assets for your next viral hit.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {activeTab === 'assets' && (
            <>
              <Button
                variant="outline"
                className="gap-2 flex-1 sm:flex-none justify-center border-violet-500/20 hover:bg-violet-500/5 text-violet-600 font-bold"
                onClick={() => setIsAiModalOpen(true)}
                disabled={!canModify}
              >
                <SparklesIcon className="h-4 w-4" />
                AI Generate
              </Button>
              <Button
                variant="primary"
                className="gap-2 flex-1 sm:flex-none justify-center shadow-lg shadow-violet-500/10"
                onClick={handleUpload}
                disabled={!canModify}
              >
                <UploadIcon className="h-4 w-4" />
                Upload
              </Button>
            </>
          )}
          {activeTab === 'generations' && (
             <Button
                variant="primary"
                className="gap-2 flex-1 sm:flex-none justify-center shadow-lg shadow-violet-500/10"
                onClick={() => navigate('/content')}
             >
                <SparklesIcon className="h-4 w-4" />
                New Generation
             </Button>
          )}
        </div>
      </div>

      <div className="flex p-1 bg-muted/30 rounded-xl w-fit border border-border/50">
        <button
          onClick={() => setActiveTab('assets')}
          className={cn(
            "px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all",
            activeTab === 'assets' ? "bg-card text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Files & Media
        </button>
        <button
          onClick={() => setActiveTab('generations')}
          className={cn(
            "px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all",
            activeTab === 'generations' ? "bg-card text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Draft Generations
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder={activeTab === 'assets' ? "Search files..." : "Search content..."}
            className="pl-9 h-11 bg-card/50 border-border/50 focus:border-violet-500/50 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 h-11 border-border/50 hover:bg-violet-500/5 hover:text-violet-600 transition-all font-bold text-xs uppercase tracking-widest px-6">
          <FilterIcon className="h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted min-h-[200px]" />
          ))
        ) : activeTab === 'assets' ? (
          filteredMedia?.length > 0 ? (
            filteredMedia.map((item: any) => {
              const isGenerating = item.url === 'generating...';
              return (
                <Card
                  key={item.id}
                  className="group overflow-hidden hover:shadow-md transition-all duration-200">

                  <div className={cn(
                    "aspect-video bg-muted flex items-center justify-center relative transition-colors group-hover:bg-muted/50",
                    isGenerating && "bg-violet-500/5 overflow-hidden"
                  )}>
                    {isGenerating ? (
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCwIcon className="h-8 w-8 text-violet-500 animate-spin opacity-40" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-500/60 animate-pulse">Drafting...</span>
                      </div>
                    ) : item.type === 'image' ? (
                      <img src={item.url} alt={item.originalName} className="h-full w-full object-cover" />
                    ) : getFileIcon(item.type)}

                    {!isGenerating && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a href={item.url} target="_blank" rel="noreferrer">
                          <Button variant="secondary" size="icon" className="h-8 w-8">
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </a>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            deleteMutation.mutate(item.id);
                          }}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate" title={item.originalName}>
                          {item.originalName}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 capitalize">
                            {item.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 capitalize border-muted-foreground/30 text-muted-foreground">
                            {item.source === 'ai_generated' ? 'AI Generated' : 'Library'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatSize(item.size)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 -mr-2 text-muted-foreground">
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">
                      Uploaded {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No media found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-1 mb-6">
                Upload your project assets to use them in your social media posts.
              </p>
              <Button onClick={handleUpload} variant="outline" disabled={!canModify}>Upload First Asset</Button>
            </div>
          )
        ) : (
          /* Content Generations Tab */
          filteredContent?.length > 0 ? (
            filteredContent.map((item: any) => {
              const isGenerating = item.status === 'draft';
              return (
                <Card
                  key={item.id}
                  className="group flex flex-col h-[280px] hover:shadow-lg transition-all duration-300 border-border/50 relative overflow-hidden"
                >
                  <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between shrink-0">
                    <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-widest text-violet-600 bg-violet-500/5 border-violet-500/20">
                      {item.platform}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                       {isGenerating ? (
                           <RefreshCwIcon className="h-3 w-3 animate-spin text-violet-500" />
                       ) : (
                           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                       )}
                       <span className="text-[9px] font-bold uppercase tracking-tighter opacity-60">
                         {item.status === 'draft' ? 'Generating' : 'Ready'}
                       </span>
                    </div>
                  </div>

                  <CardContent className="p-4 flex-1 flex flex-col overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto scrollbar-none mb-4">
                       <p className={cn(
                         "text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap italic",
                         isGenerating && "animate-pulse"
                       )}>
                         {item.body}
                       </p>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-12">
                       {item.tags?.map((t: string) => (
                         <span key={t} className="text-[8px] text-violet-500 font-bold">#{t}</span>
                       ))}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-card via-card to-transparent pt-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-lg border-border/50 hover:bg-violet-500/5 hover:text-violet-600 shadow-sm"
                        title="Copy Body"
                        onClick={() => {
                           navigator.clipboard.writeText(item.body);
                           toast.success('Copied to clipboard');
                        }}
                      >
                         <CopyIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-lg border-border/50 hover:bg-violet-500/5 hover:text-violet-600 shadow-sm"
                        title="Repost"
                        onClick={() => {
                           navigator.clipboard.writeText(item.body);
                           toast.success('Ready to repost');
                           navigate('/scheduler');
                        }}
                      >
                         <RepeatIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 h-8 gap-1.5 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-violet-500/20"
                        onClick={() => {
                           navigator.clipboard.writeText(item.body);
                           navigate('/scheduler');
                        }}
                      >
                         <CalendarIcon className="h-3 w-3" />
                         Schedule
                      </Button>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg border-border/50 hover:bg-violet-500/5 hover:text-violet-600"
                          title="Open in Studio"
                          onClick={() => navigate('/content')}
                        >
                           <ExternalLinkIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg border-red-500/10 hover:bg-red-50 text-muted-foreground hover:text-red-500"
                          title="Delete Generation"
                          onClick={() => deleteContentMutation.mutate(item.id)}
                        >
                           <Trash2Icon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>

                  <div className="px-4 py-2 border-t border-border/30 bg-muted/5 flex items-center justify-between shrink-0">
                    <span className="text-[9px] text-muted-foreground font-medium">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tight">AI Archive</span>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl bg-muted/20">
              <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-bold">No saved generations</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2 mb-8 text-sm">
                Generations from the Content Studio that weren't immediately scheduled appear here.
              </p>
              <Button onClick={() => navigate('/content')} variant="outline" className="gap-2 font-black uppercase tracking-widest text-[10px] px-8">
                <SparklesIcon className="h-3 w-3" />
                Start Drafting
              </Button>
            </div>
          )
        )}
      </div>

      {/* AI Generation Modal (Keep for media items) */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-border bg-card overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-bold uppercase tracking-widest">DALL-E 3 Architect</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsAiModalOpen(false)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Visualization Prompt</label>
                <textarea
                  value={aiQuote}
                  onChange={(e) => setAiQuote(e.target.value)}
                  placeholder="Describe the image you want to generate (e.g., 'A futuristic city at sunset with purple neon lights')"
                  rows={4}
                  className="w-full bg-muted/50 border border-border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:italic"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Aesthetic Style</label>
                  <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                    {['vivid', 'natural'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setAiStyle(style as any)}
                        className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${aiStyle === style
                          ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Dimensions</label>
                  <select
                    value={aiSize}
                    onChange={(e) => setAiSize(e.target.value as any)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="1024x1024">Square (1:1)</option>
                    <option value="1024x1792">Portrait (9:16)</option>
                    <option value="1792x1024">Landscape (16:9)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full h-11 gap-2 font-bold shadow-lg shadow-violet-500/20"
                  disabled={!aiQuote.trim() || generateAiMutation.isPending}
                  onClick={() => generateAiMutation.mutate({ quote: aiQuote, style: aiStyle, size: aiSize })}
                >
                  {generateAiMutation.isPending ? (
                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="h-4 w-4" />
                  )}
                  {generateAiMutation.isPending ? 'Drafting Graphic...' : 'Ignite DALL-E 3'}
                </Button>
                <p className="text-[9px] text-center text-muted-foreground mt-3 uppercase tracking-tighter">
                  Powered by OpenAI DALL-E 3 • 1 Generation Token
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>);
}