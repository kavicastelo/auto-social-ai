import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    UserIcon,
    BriefcaseIcon,
    PlusIcon,
    Loader2Icon,
    SaveIcon,
    UserPlusIcon,
    MailIcon,
    GlobeIcon,
    ArrowRightIcon,
    LayersIcon,
    Trash2Icon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

type SettingsTab = 'profile' | 'workspace' | 'workspaces';

export function SettingsPage() {
    const { user, activeWorkspace, workspaces, refreshProfile, setActiveWorkspace } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    // Profile States
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        avatarUrl: user?.avatarUrl || '',
    });

    // Workspace States
    const [workspaceData, setWorkspaceData] = useState({
        name: activeWorkspace?.name || '',
    });

    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');

    const updateProfileMutation = useMutation({
        mutationFn: async (data: typeof profileData) => {
            // Corrected endpoint
            const response = await api.put('/auth/me', data);
            return response.data.data;
        },
        onSuccess: () => {
            toast.success('Profile updated successfully');
            refreshProfile();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || 'Failed to update profile');
        }
    });

    const updateActiveWorkspaceMutation = useMutation({
        mutationFn: async (data: typeof workspaceData) => {
            const response = await api.put(`/workspaces/${activeWorkspace?.id}`, data);
            return response.data.data;
        },
        onSuccess: (updated) => {
            toast.success('Workspace updated successfully');
            setActiveWorkspace(updated);
            refreshProfile(); // List update
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || 'Failed to update workspace');
        }
    });

    const createWorkspaceMutation = useMutation({
        mutationFn: async (name: string) => {
            const response = await api.post('/workspaces', { name });
            return response.data.data;
        },
        onSuccess: (newWs) => {
            toast.success('New workspace created');
            setNewWorkspaceName('');
            refreshProfile();
            setActiveWorkspace(newWs);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || 'Failed to create workspace');
        }
    });

    const addMemberMutation = useMutation({
        mutationFn: async (email: string) => {
            await api.post(`/workspaces/${activeWorkspace?.id}/members`, { email, role: 'member' });
        },
        onSuccess: () => {
            toast.success('Invitation sent to: ' + newMemberEmail);
            setNewMemberEmail('');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || 'Failed to add member');
        }
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-bold tracking-tight">Account & Workspace</h2>
                <p className="text-muted-foreground">
                    Configure your personal profile and team collaborative environments.
                </p>
            </div>

            <div className="flex p-1 gap-1 border rounded-lg bg-muted/30 w-fit backdrop-blur-sm sticky top-0 z-10">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'profile' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <UserIcon className="h-4 w-4" />
                    Profile
                </button>
                <button
                    onClick={() => setActiveTab('workspace')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'workspace' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <BriefcaseIcon className="h-4 w-4" />
                    Active Workspace
                </button>
                <button
                    onClick={() => setActiveTab('workspaces')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'workspaces' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <LayersIcon className="h-4 w-4" />
                    All Workspaces
                </button>
            </div>

            <div className="grid gap-6 pb-20">
                {activeTab === 'profile' && (
                    <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                        <CardHeader className="border-b pb-6">
                            <CardTitle>Global Profile</CardTitle>
                            <CardDescription>This information is visible across all your workspaces.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-8">
                            <div className="flex flex-col sm:flex-row items-center gap-8">
                                <div className="relative group">
                                    <div className="h-28 w-28 rounded-full border-4 border-muted overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30">
                                        {profileData.avatarUrl ? (
                                            <img src={profileData.avatarUrl} className="h-full w-full object-cover" alt="Profile" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <UserIcon className="h-10 w-10 text-violet-500 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <PlusIcon className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid flex-1 gap-4 w-full">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Display Name</label>
                                        <Input
                                            value={profileData.name}
                                            onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                            className="bg-background/80"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Account Email</label>
                                        <Input value={user?.email || ''} disabled className="bg-muted/50 text-muted-foreground opacity-70" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Custom Avatar URL</label>
                                <Input
                                    value={profileData.avatarUrl}
                                    onChange={e => setProfileData({ ...profileData, avatarUrl: e.target.value })}
                                    placeholder="https://images.unsplash.com/..."
                                    className="bg-background/80 font-mono text-xs"
                                />
                                <p className="text-[10px] text-muted-foreground">Enter a direct link to a square-ratio image.</p>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    variant="primary"
                                    className="gap-2 px-8"
                                    onClick={() => updateProfileMutation.mutate(profileData)}
                                    disabled={updateProfileMutation.isPending}
                                >
                                    {updateProfileMutation.isPending ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
                                    Save Profile
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'workspace' && (
                    <div className="space-y-6">
                        <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                            <CardHeader className="border-b pb-6">
                                <CardTitle className="flex items-center gap-2">
                                    <GlobeIcon className="h-5 w-5 text-violet-500" />
                                    Workspace Identity
                                </CardTitle>
                                <CardDescription>Customization settings for {activeWorkspace?.name}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Workspace Name</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={workspaceData.name}
                                            onChange={e => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                                            placeholder="My Organization"
                                            className="bg-background/80"
                                        />
                                        <Button
                                            variant="secondary"
                                            onClick={() => updateActiveWorkspaceMutation.mutate(workspaceData)}
                                            disabled={updateActiveWorkspaceMutation.isPending || workspaceData.name === activeWorkspace?.name}
                                        >
                                            {updateActiveWorkspaceMutation.isPending ? <Loader2Icon className="h-4 w-4 animate-spin" /> : 'Rename'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold">Workspace Access & Team</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border border-y bg-muted/10">
                                    <div className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center font-bold text-violet-600">
                                                {user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{user?.name} (You)</p>
                                                <p className="text-xs text-muted-foreground">{user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40">Owner</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-4">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                        <UserPlusIcon className="h-4 w-4 text-violet-500" />
                                        Invite Team Members
                                    </h4>
                                    <p className="text-xs text-muted-foreground max-w-sm">Collaborators can manage scheduled posts and automation pipelines within this workspace.</p>
                                    <div className="flex gap-2 max-w-md">
                                        <div className="relative flex-1">
                                            <MailIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
                                            <Input
                                                placeholder="colleague@company.com"
                                                className="pl-9 bg-background"
                                                value={newMemberEmail}
                                                onChange={e => setNewMemberEmail(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="primary"
                                            className="px-6"
                                            disabled={!newMemberEmail || addMemberMutation.isPending}
                                            onClick={() => addMemberMutation.mutate(newMemberEmail)}
                                        >
                                            {addMemberMutation.isPending ? <Loader2Icon className="h-4 w-4 animate-spin" /> : 'Send Invite'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'workspaces' && (
                    <div className="space-y-8">
                        <Card className="border-dashed border-2 bg-violet-500/5 transition-all hover:bg-violet-500/10 cursor-pointer p-8 group">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="space-y-1 text-center sm:text-left">
                                    <h3 className="text-xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                                        <LayersIcon className="h-6 w-6 text-violet-500" />
                                        Create New Workspace
                                    </h3>
                                    <p className="text-sm text-muted-foreground">Keep different brands or projects organized and isolated.</p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Input
                                        placeholder="Workspace Name"
                                        className="bg-background/80 flex-1 sm:w-64"
                                        value={newWorkspaceName}
                                        onChange={e => setNewWorkspaceName(e.target.value)}
                                    />
                                    <Button
                                        variant="primary"
                                        className="gap-2 shrink-0 group-active:scale-95 transition-transform"
                                        disabled={!newWorkspaceName || createWorkspaceMutation.isPending}
                                        onClick={() => createWorkspaceMutation.mutate(newWorkspaceName)}
                                    >
                                        {createWorkspaceMutation.isPending ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                                        Create
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <div className="grid gap-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Your Memberships</h3>
                            {workspaces.map(ws => (
                                <div
                                    key={ws.id}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${activeWorkspace?.id === ws.id
                                        ? 'bg-gradient-to-r from-violet-500/5 to-transparent border-violet-500/20 ring-1 ring-violet-500/10 shadow-lg'
                                        : 'bg-card/50 border-border/50 hover:border-violet-500/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-xl transition-colors ${activeWorkspace?.id === ws.id ? 'bg-violet-500 text-white' : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {ws.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold">{ws.name}</p>
                                                {activeWorkspace?.id === ws.id && <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />}
                                            </div>
                                            <p className="text-xs text-muted-foreground capitalize">Role: {ws.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {activeWorkspace?.id !== ws.id ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 h-9 px-4 hover:border-violet-500/50 hover:text-violet-600 transition-all"
                                                onClick={() => setActiveWorkspace(ws)}
                                            >
                                                Switch To
                                                <ArrowRightIcon className="h-3 w-3" />
                                            </Button>
                                        ) : (
                                            <span className="text-xs font-bold text-violet-600 px-3 py-1 bg-violet-100 rounded-md dark:bg-violet-900/40">Active</span>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                                            <Trash2Icon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
