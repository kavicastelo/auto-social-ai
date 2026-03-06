import { PlusIcon, MoreVerticalIcon, ExternalLinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PlatformIcon } from '../components/ui/PlatformIcon';
export function PagesManagerPage() {
  const accounts = [
    {
      id: 1,
      name: '@autosocial_ai',
      platform: 'Twitter',
      followers: '12.4K',
      status: 'Connected',
      lastPost: '2 hours ago'
    },
    {
      id: 2,
      name: 'AutoSocial Inc.',
      platform: 'LinkedIn',
      followers: '8.2K',
      status: 'Connected',
      lastPost: '5 hours ago'
    },
    {
      id: 3,
      name: '@autosocial.app',
      platform: 'Instagram',
      followers: '45.1K',
      status: 'Connected',
      lastPost: '1 day ago'
    },
    {
      id: 4,
      name: '@autosocial_tips',
      platform: 'TikTok',
      followers: '102K',
      status: 'Needs Reauth',
      lastPost: '3 days ago'
    }];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pages Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your connected social media accounts.
          </p>
        </div>
        <Button variant="primary" className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Connect Account
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {accounts.map((account) =>
          <Card
            key={account.id}
            className="group hover:shadow-md transition-all duration-200">

            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted group-hover:bg-violet-500/10 transition-colors">
                <PlatformIcon
                  platform={account.platform}
                  className="h-6 w-6 text-foreground group-hover:text-violet-600" />

              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground">

                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mt-2 space-y-1">
                <h3 className="font-semibold text-lg truncate">
                  {account.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {account.platform}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Followers
                  </p>
                  <p className="font-medium">{account.followers}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge
                    variant={
                      account.status === 'Connected' ? 'success' : 'destructive'
                    }
                    className="text-[10px] px-1.5 py-0">

                    {account.status}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Last post: {account.lastPost}</span>
                <ExternalLinkIcon className="h-3 w-3 cursor-pointer hover:text-foreground" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add New Card */}
        <Card className="flex flex-col items-center justify-center border-dashed border-2 hover:border-violet-500/50 hover:bg-muted/50 transition-all cursor-pointer min-h-[240px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <PlusIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground">Add New Account</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Connect another platform
          </p>
        </Card>
      </div>
    </div>);

}