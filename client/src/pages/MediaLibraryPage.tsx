import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UploadIcon,
  SearchIcon,
  FilterIcon,
  ImageIcon,
  VideoIcon,
  FileTextIcon,
  MoreVerticalIcon,
  Trash2Icon,
  DownloadIcon
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';

export function MediaLibraryPage() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: mediaItems, isLoading } = useQuery({
    queryKey: ['media-assets', activeWorkspace?.id],
    queryFn: async () => {
      const response = await api.get('/media');
      return response.data.data;
    },
    enabled: !!activeWorkspace,
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

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e: any) => {
      const files = e.target.files;
      if (!files.length) return;

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      try {
        await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Upload complete');
        queryClient.invalidateQueries({ queryKey: ['media-assets', activeWorkspace?.id] });
      } catch (err) {
        console.error('Upload failed:', err);
        toast.error('Upload failed');
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

  const filteredItems = mediaItems?.filter((item: any) =>
    item.originalName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Media Library</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your images and videos for <strong>{activeWorkspace?.name}</strong>.
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={handleUpload}>
          <UploadIcon className="h-4 w-4" />
          Upload Media
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <FilterIcon className="h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted min-h-[200px]" />
          ))
        ) : filteredItems?.length > 0 ? (
          filteredItems.map((item: any) => (
            <Card
              key={item.id}
              className="group overflow-hidden hover:shadow-md transition-all duration-200">

              <div className="aspect-video bg-muted flex items-center justify-center relative transition-colors group-hover:bg-muted/50">
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.originalName} className="h-full w-full object-cover" />
                ) : getFileIcon(item.type)}

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
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate" title={item.originalName}>
                      {item.originalName}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 capitalize">
                        {item.type}
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
          ))
        ) : (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No media found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-1 mb-6">
              Upload your project assets to use them in your social media posts.
            </p>
            <Button onClick={handleUpload} variant="outline">Upload First Asset</Button>
          </div>
        )}
      </div>
    </div>);
}