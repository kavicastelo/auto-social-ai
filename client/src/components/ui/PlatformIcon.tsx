import {
  TwitterIcon,
  LinkedinIcon,
  InstagramIcon,
  VideoIcon,
  HashIcon
} from
  'lucide-react';
interface PlatformIconProps {
  platform: 'Twitter' | 'LinkedIn' | 'Instagram' | 'TikTok' | string;
  className?: string;
}
export function PlatformIcon({
  platform,
  className = 'h-5 w-5'
}: PlatformIconProps) {
  switch (platform.toLowerCase()) {
    case 'twitter':
    case 'x':
      return <TwitterIcon className={className} />;
    case 'linkedin':
      return <LinkedinIcon className={className} />;
    case 'instagram':
      return <InstagramIcon className={className} />;
    case 'tiktok':
      return <VideoIcon className={className} />;
    default:
      return <HashIcon className={className} />;
  }
}