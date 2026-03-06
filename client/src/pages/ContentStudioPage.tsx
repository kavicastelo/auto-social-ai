import { useState } from 'react';
import {
  SparklesIcon,
  RefreshCwIcon,
  Wand2Icon,
  ArrowDownToLineIcon,
  Maximize2Icon,
  CopyIcon
} from
  'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { PlatformIcon } from '../components/ui/PlatformIcon';
export function ContentStudioPage() {
  const [activeTab, setActiveTab] = useState('Twitter');
  const [isGenerating, setIsGenerating] = useState(false);
  const platforms = ['Twitter', 'LinkedIn', 'Instagram', 'TikTok'];
  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 1500);
  };
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
            <label className="text-sm font-medium text-foreground">
              Topic or URL
            </label>
            <Textarea
              placeholder="What should the post be about? e.g., 'The future of AI in marketing'"
              className="resize-none h-24" />

          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tone</label>
            <select className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option>Professional</option>
              <option>Casual</option>
              <option>Humorous</option>
              <option>Inspirational</option>
              <option>Educational</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Target Platform
            </label>
            <div className="grid grid-cols-2 gap-2">
              {platforms.map((platform) =>
                <div
                  key={platform}
                  className="flex items-center space-x-2 rounded-lg border border-input p-2 hover:bg-muted cursor-pointer transition-colors">

                  <input
                    type="checkbox"
                    id={`plat-${platform}`}
                    className="rounded border-input text-violet-600 focus:ring-violet-600"
                    defaultChecked={
                      platform === 'Twitter' || platform === 'LinkedIn'
                    } />

                  <label
                    htmlFor={`plat-${platform}`}
                    className="text-sm cursor-pointer flex items-center gap-2 flex-1">

                    <PlatformIcon platform={platform} className="h-4 w-4" />
                    {platform}
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Content Type
            </label>
            <select className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
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
            onClick={handleGenerate}
            disabled={isGenerating}>

            {isGenerating ?
              <RefreshCwIcon className="h-4 w-4 animate-spin" /> :

              <SparklesIcon className="h-4 w-4" />
            }
            {isGenerating ? 'Generating...' : 'Generate Content'}
          </Button>
        </div>
      </Card>

      {/* Right Panel - Editor & Preview */}
      <Card className="lg:col-span-8 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-2 flex overflow-x-auto">
          {platforms.map((platform) =>
            <button
              key={platform}
              onClick={() => setActiveTab(platform)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === platform ? 'border-violet-500 text-violet-600 dark:text-violet-400' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>

              <PlatformIcon platform={platform} className="h-4 w-4" />
              {platform}
            </button>
          )}
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
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Maximize2Icon className="h-3 w-3" /> Expand
            </Button>
          </div>

          <div className="flex-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
            {/* Mockup Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <PlatformIcon
                  platform={activeTab}
                  className="h-5 w-5 text-muted-foreground" />

              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Your Brand
                </p>
                <p className="text-xs text-muted-foreground">
                  Just now • {activeTab}
                </p>
              </div>
            </div>

            {/* Editable Content */}
            <Textarea
              className="flex-1 border-0 rounded-none focus-visible:ring-0 p-4 text-base resize-none"
              defaultValue={`The future of AI in marketing isn't about replacing humans. It's about augmenting our creativity. 🚀\n\nWe're seeing teams use AI to:\n1️⃣ Generate 10x more ideas\n2️⃣ Personalize content at scale\n3️⃣ Analyze trends in real-time\n\nThe teams that win will be the ones who learn to collaborate with AI, not compete against it.\n\nWhat's your favorite AI marketing tool right now? 👇\n\n#Marketing #AI #FutureOfWork`} />

          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" className="gap-2">
              <CopyIcon className="h-4 w-4" />
              Copy
            </Button>
            <Button variant="primary">Schedule Post</Button>
          </div>
        </div>
      </Card>
    </div>);

}