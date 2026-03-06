import {
  UploadIcon,
  SearchIcon,
  FilterIcon,
  ImageIcon,
  VideoIcon,
  FileTextIcon,
  MoreVerticalIcon
} from
  'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
export function MediaLibraryPage() {
  const mediaItems = [
    {
      id: 1,
      name: 'Q3_Campaign_Hero.jpg',
      type: 'image',
      date: 'Aug 12, 2024',
      size: '2.4 MB'
    },
    {
      id: 2,
      name: 'Product_Demo_Short.mp4',
      type: 'video',
      date: 'Aug 10, 2024',
      size: '15.2 MB'
    },
    {
      id: 3,
      name: 'AI_Generated_Abstract.png',
      type: 'image',
      date: 'Aug 09, 2024',
      size: '1.1 MB'
    },
    {
      id: 4,
      name: 'Carousel_Template_V2.fig',
      type: 'template',
      date: 'Aug 05, 2024',
      size: '4.5 MB'
    },
    {
      id: 5,
      name: 'Team_Retreat_2024.jpg',
      type: 'image',
      date: 'Aug 01, 2024',
      size: '3.8 MB'
    },
    {
      id: 6,
      name: 'Feature_Announcement.mp4',
      type: 'video',
      date: 'Jul 28, 2024',
      size: '22.1 MB'
    },
    {
      id: 7,
      name: 'Infographic_Stats.png',
      type: 'image',
      date: 'Jul 25, 2024',
      size: '1.9 MB'
    },
    {
      id: 8,
      name: 'Quote_Template_Dark.fig',
      type: 'template',
      date: 'Jul 20, 2024',
      size: '2.2 MB'
    }];

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-8 w-8 text-violet-500 opacity-50" />;
      case 'video':
        return <VideoIcon className="h-8 w-8 text-blue-500 opacity-50" />;
      case 'template':
        return <FileTextIcon className="h-8 w-8 text-emerald-500 opacity-50" />;
      default:
        return (
          <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />);

    }
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Media Library</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your images, videos, and templates.
          </p>
        </div>
        <Button variant="primary" className="gap-2">
          <UploadIcon className="h-4 w-4" />
          Upload Media
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search files..." className="pl-9 bg-card" />
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <FilterIcon className="h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mediaItems.map((item) =>
          <Card
            key={item.id}
            className="group overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer">

            <div className="aspect-video bg-muted flex items-center justify-center relative group-hover:bg-muted/80 transition-colors">
              {getIcon(item.type)}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" size="sm">
                  View
                </Button>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 capitalize">

                      {item.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {item.size}
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
                {item.date}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>);

}