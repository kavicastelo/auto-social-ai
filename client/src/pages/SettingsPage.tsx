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
import { Badge } from '../components/ui/Badge';
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
            <div className="flex flex-col gap-1 px-4 md:px-0">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">Account & Workspace</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your profile and team environments.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row p-1 gap-1 border rounded-xl bg-muted/30 w-full sm:w-fit backdrop-blur-sm sticky top-0 z-10 mx-auto md:mx-0 shadow-sm">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-2 text-xs md:text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'profile' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <UserIcon className="h-4 w-4" />
                    Profile
                </button>
                <button
                    onClick={() => setActiveTab('workspace')}
                    className={`flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-2 text-xs md:text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'workspace' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <BriefcaseIcon className="h-4 w-4" />
                    Current
                </button>
                <button
                    onClick={() => setActiveTab('workspaces')}
                    className={`flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-2 text-xs md:text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'workspaces' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <LayersIcon className="h-4 w-4" />
                    Workspaces
                </button>
            </div>

            <div className="grid gap-6 pb-20">
                {activeTab === 'profile' && (
                    <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl overflow-hidden">
                        <CardHeader className="border-b p-4 md:p-6">
                            <CardTitle className="text-lg md:text-xl font-black">Global Profile</CardTitle>
                            <CardDescription className="text-xs">This information is visible across all your workspaces.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 md:p-8 space-y-6 md:space-y-8">
                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                <div className="relative group shrink-0">
                                    <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl border-2 border-muted overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 shadow-inner">
                                        {profileData.avatarUrl ? (
                                            <img src={profileData.avatarUrl} className="h-full w-full object-cover" alt="Profile" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <UserIcon className="h-8 w-8 md:h-10 md:w-10 text-violet-500 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <PlusIcon className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid flex-1 gap-4 w-full">
                                    <div className="grid gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display Name</label>
                                        <Input
                                            value={profileData.name}
                                            onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                            className="bg-background/80 h-10"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account Email</label>
                                        <Input value={user?.email || ''} disabled className="bg-muted/50 text-muted-foreground opacity-70 h-10" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-6 border-t border-border/50">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custom Avatar URL</label>
                                <Input
                                    value={profileData.avatarUrl}
                                    onChange={e => setProfileData({ ...profileData, avatarUrl: e.target.value })}
                                    placeholder="https://images.unsplash.com/..."
                                    className="bg-background/80 font-mono text-[10px] h-10"
                                />
                                <p className="text-[9px] text-muted-foreground italic">Enter a direct link to a square-ratio image.</p>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    variant="primary"
                                    className="w-full sm:w-auto gap-2 px-8 shadow-lg shadow-violet-500/10"
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
                        <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl overflow-hidden">
                            <CardHeader className="border-b p-4 md:p-6">
                                <CardTitle className="text-lg md:text-xl font-black flex items-center gap-2">
                                    <GlobeIcon className="h-5 w-5 text-violet-500" />
                                    Workspace Identity
                                </CardTitle>
                                <CardDescription className="text-xs">Customization settings for local workspace</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 md:p-8 space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Workspace Name</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Input
                                            value={workspaceData.name}
                                            onChange={e => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                                            placeholder="My Organization"
                                            className="bg-background/80 h-11"
                                        />
                                        <Button
                                            variant="secondary"
                                            className="h-11 px-6 font-bold uppercase tracking-widest text-xs"
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
                            <CardHeader className="p-4 md:p-6 bg-muted/20 border-b">
                                <CardTitle className="text-sm font-black uppercase tracking-widest">Workspace Access & Team</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/50 bg-background/30">
                                    <div className="flex items-center justify-between p-4 md:p-6 hover:bg-violet-500/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center font-black text-violet-600 shadow-sm border border-violet-500/10">
                                                {user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate">{user?.name} (You)</p>
                                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                            </div>
                                        </div>
                                        <Badge variant="success" className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5">Owner</Badge>
                                    </div>
                                </div>

                                <div className="p-4 md:p-8 space-y-4">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                            <UserPlusIcon className="h-4 w-4 text-violet-500" />
                                            Invite Team Members
                                        </h4>
                                        <p className="text-xs text-muted-foreground">Collaborators will gain access to this specific workspace.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="relative flex-1">
                                            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                            <Input
                                                placeholder="colleague@company.com"
                                                className="pl-9 h-11 bg-background"
                                                value={newMemberEmail}
                                                onChange={e => setNewMemberEmail(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="primary"
                                            className="px-6 h-11 shadow-lg shadow-violet-500/10 font-bold uppercase tracking-widest text-xs"
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
                        <Card className="border-dashed border-2 border-violet-500/20 bg-violet-500/5 transition-all hover:bg-violet-500/10 cursor-pointer p-4 md:p-8 group rounded-2xl overflow-hidden">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                <div className="space-y-1 text-left">
                                    <h3 className="text-lg md:text-xl font-black flex items-center gap-2">
                                        <LayersIcon className="h-6 w-6 text-violet-500" />
                                        Create New Workspace
                                    </h3>
                                    <p className="text-xs md:text-sm text-muted-foreground">Isolate your different brands or client projects.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                                    <Input
                                        placeholder="Project Name"
                                        className="bg-background/80 h-11 flex-1 lg:w-64"
                                        value={newWorkspaceName}
                                        onChange={e => setNewWorkspaceName(e.target.value)}
                                    />
                                    <Button
                                        variant="primary"
                                        className="gap-2 h-11 px-8 shrink-0 shadow-lg shadow-violet-500/10 font-bold uppercase tracking-widest text-xs"
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
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Active Memberships</h3>
                            <div className="grid gap-3">
                                {workspaces.map(ws => (
                                    <div
                                        key={ws.id}
                                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border-2 transition-all gap-4 group ${activeWorkspace?.id === ws.id
                                            ? 'bg-gradient-to-r from-violet-500/10 to-indigo-500/5 border-violet-500/30 ring-1 ring-violet-500/10 shadow-xl'
                                            : 'bg-card/50 border-border/50 hover:border-violet-500/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-xl transition-all shadow-sm ${activeWorkspace?.id === ws.id ? 'bg-violet-600 text-white scale-110' : 'bg-muted text-muted-foreground grayscale group-hover:grayscale-0'
                                                }`}>
                                                {ws.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-foreground truncate">{ws.name}</p>
                                                    {activeWorkspace?.id === ws.id && <span className="h-2 w-2 rounded-full bg-violet-600 animate-pulse" />}
                                                </div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{ws.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            {activeWorkspace?.id !== ws.id ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 sm:flex-none gap-2 h-10 px-6 font-bold uppercase tracking-widest text-[10px] transition-all border-border/50 hover:border-violet-500/50 hover:text-violet-600"
                                                    onClick={() => setActiveWorkspace(ws)}
                                                >
                                                    Switch
                                                    <ArrowRightIcon className="h-3.5 w-3.5" />
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] flex-1 sm:flex-none text-center font-black uppercase tracking-widest text-violet-600 px-4 py-2 bg-violet-500/10 rounded-xl border border-violet-500/20">Selected</span>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all rounded-xl border border-transparent hover:border-red-500/20">
                                                <Trash2Icon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
