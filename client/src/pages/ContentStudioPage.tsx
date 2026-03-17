import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('Twitter');

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/content/generate', {
        topic,
        tone,
        platforms: selectedPlatforms,
        type: contentType,
        workspaceId: activeWorkspace?.id
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      // Assuming data is { Twitter: "...", LinkedIn: "..." }
      setGeneratedContent(data.content || {});
      const firstPlat = Object.keys(data.content || {})[0];
      if (firstPlat) setActiveTab(firstPlat);
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      await api.post('/scheduler', {
        content: generatedContent[activeTab],
        platform: activeTab.toLowerCase(),
        scheduledAt: new Date(Date.now() + 3600000).toISOString(), // +1 hour default
        workspaceId: activeWorkspace?.id
      });
    },
    onSuccess: () => {
      toast.success('Post scheduled successfully!');
      queryClient.invalidateQueries({ queryKey: ['recent-posts'] });
    }
  });

  const togglePlatform = (plat: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(plat) ? prev.filter(p => p !== plat) : [...prev, plat]
    );
  };

  const platforms = ['Twitter', 'LinkedIn', 'Instagram', 'TikTok'];

  return (
    <div className="grid gap-6 lg:grid-cols-12 h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      {/* Left Panel - Inputs */}
      <Card className="lg:col-span-4 flex flex-col overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2Icon className="h-5 w-5 text-violet-500" />
            AI Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Topic or URL</label>
            <Textarea
              placeholder="What should the post be about? e.g., 'The future of AI in marketing'"
              className="resize-none h-24"
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
            <div className="grid grid-cols-2 gap-2">
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
                    "h-4 w-4 rounded border flex items-center justify-center",
                    selectedPlatforms.includes(platform) ? "bg-violet-500 border-violet-500" : "bg-transparent border-input"
                  )}>
                    {selectedPlatforms.includes(platform) && <div className="h-2 w-2 bg-white rounded-full" />}
                  </div>
                  <label className="text-sm cursor-pointer flex items-center gap-2 flex-1">
                    <PlatformIcon platform={platform} className="h-4 w-4" />
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
        </CardContent>
        <div className="p-6 pt-0 border-t border-border mt-auto bg-background">
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
      <Card className="lg:col-span-8 flex flex-col overflow-hidden">
        {selectedPlatforms.length > 0 ? (
          <>
            <div className="border-b border-border bg-muted/30 px-2 flex overflow-x-auto">
              {selectedPlatforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => setActiveTab(platform)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeTab === platform
                      ? "border-violet-500 text-violet-600 dark:text-violet-400"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <PlatformIcon platform={platform} className="h-4 w-4" />
                  {platform}
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-background/50">
              <div className="flex justify-end gap-2 mb-4">
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <RefreshCwIcon className="h-3 w-3" /> Regenerate
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Wand2Icon className="h-3 w-3" /> Improve
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <ArrowDownToLineIcon className="h-3 w-3" /> Shorten
                </Button>
              </div>

              <div className="flex-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
                <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/20">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <PlatformIcon platform={activeTab} className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Preview {activeTab}</p>
                    <p className="text-xs text-muted-foreground">Draft mode</p>
                  </div>
                </div>

                <RichTextEditor
                  className="flex-1 border-0 rounded-none focus-within:ring-0 shadow-none border-t border-border"
                  value={generatedContent[activeTab] || ''}
                  onChange={(val: string) => setGeneratedContent(prev => ({ ...prev, [activeTab]: val }))}
                  placeholder='Click "Generate Content" on the left to start...'
                  limit={
                    activeTab === 'Twitter' ? 280 : 
                    activeTab === 'LinkedIn' ? 3000 : 
                    activeTab === 'Instagram' ? 2200 : 0
                  }
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent[activeTab] || '');
                    alert('Copied to clipboard!');
                  }}
                >
                  <CopyIcon className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="primary"
                  className="gap-2"
                  onClick={() => scheduleMutation.mutate()}
                  disabled={!generatedContent[activeTab] || scheduleMutation.isPending}
                >
                  <CalendarIcon className="h-4 w-4" />
                  Schedule Now
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <Wand2Icon className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <h3 className="text-xl font-bold">Ready to Create?</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Select a target platform and enter a topic on the left to generate your first AI-powered social media post.
            </p>
          </div>
        )}
      </Card>
    </div>);
}