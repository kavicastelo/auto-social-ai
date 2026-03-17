import { PlusIcon, RefreshCwIcon, Trash2Icon, UsersIcon } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PlatformIcon } from '../components/ui/PlatformIcon';
import { AccountOnboardingModal } from '../components/ui/AccountOnboardingModal';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function PagesManagerPage() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['social-accounts', activeWorkspace?.id],
    queryFn: async () => {
      const response = await api.get('/accounts');
      return response.data.data;
    },
    enabled: !!activeWorkspace,
  });

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await api.delete(`/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts', activeWorkspace?.id] });
    },
  });

  const connectAccount = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pages Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your connected social media accounts for <strong>{activeWorkspace?.name}</strong>.
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={connectAccount}>
          <PlusIcon className="h-4 w-4" />
          Connect Account
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted min-h-[200px]" />
          ))
        ) : accounts?.length > 0 ? (
          accounts.map((account: any) => (
            <Card
              key={account.id}
              className="group hover:shadow-md transition-all duration-200 overflow-hidden">

              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted group-hover:bg-violet-500/10 transition-colors">
                  <PlatformIcon
                    platform={account.platform}
                    className="h-6 w-6 text-foreground group-hover:text-violet-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm('Are you sure you want to disconnect this account?')) {
                        disconnectMutation.mutate(account.id);
                      }
                    }}
                    title="Disconnect"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2 space-y-1">
                  <h3 className="font-semibold text-lg truncate" title={account.platformUsername}>
                    @{account.platformUsername}
                  </h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {account.platform}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Platform ID
                    </p>
                    <p className="font-medium text-xs truncate">{account.platformUserId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge
                      variant={
                        account.status === 'connected' ? 'success' : 'destructive'
                      }
                      className="text-[10px] px-1.5 py-0 uppercase">
                      {account.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Joined: {new Date(account.createdAt).toLocaleDateString()}</span>
                  <RefreshCwIcon className="h-3 w-3 cursor-pointer hover:text-foreground" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl bg-muted/20">
            <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No accounts connected</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6 text-sm">
              Connect your social media accounts to start generating AI content and scheduling posts across platforms.
            </p>
            <Button onClick={connectAccount} variant="primary" className="shadow-sm">Connect First Account</Button>
          </div>
        )}

        {/* Add New Card */}
        {accounts?.length > 0 && (
          <Card
            onClick={connectAccount}
            className="flex flex-col items-center justify-center border-dashed border-2 hover:border-violet-500/50 hover:bg-muted/30 transition-all cursor-pointer min-h-[240px] group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4 group-hover:bg-violet-500/10 group-hover:scale-110 transition-all">
              <PlusIcon className="h-6 w-6 text-muted-foreground group-hover:text-violet-600" />
            </div>
            <h3 className="font-medium text-foreground">Add New Account</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center px-4">
              Connect Twitter, LinkedIn, Instagram or others
            </p>
          </Card>
        )}
      </div>

      <AccountOnboardingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}