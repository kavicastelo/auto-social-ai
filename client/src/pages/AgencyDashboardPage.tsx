import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { UsersIcon, ActivityIcon, GitBranchIcon, ImageIcon, CheckCircleIcon } from 'lucide-react';

export function AgencyDashboardPage() {
    const { data: overview, isLoading } = useQuery({
        queryKey: ['agency-overview'],
        queryFn: async () => {
            const response = await api.get('/workspaces/agency-overview');
            return response.data.data;
        },
    });

    const formatNumber = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            </div>
        );
    }

    const metrics = overview?.aggregateMetrics;
    const workspaces = overview?.workspaces || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Agency Hub</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Aggregate overview across all your connected client workspaces.
                </p>
            </div>

            {/* Top Level Aggregate Metrics */}
            <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border-violet-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Workspaces</CardTitle>
                        <UsersIcon className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{metrics?.totalWorkspaces || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active clients managed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Global Reach</CardTitle>
                        <ActivityIcon className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{formatNumber(metrics?.totalReach)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total impressions across all clients</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                        <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{formatNumber(metrics?.totalEngagement)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Likes, comments, and shares</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                        <GitBranchIcon className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{formatNumber(metrics?.totalPosts)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Published by pipelines</p>
                    </CardContent>
                </Card>
            </div>

            {/* Client Breakdown Table */}
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Client Workspace Health</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/10 text-xs uppercase font-semibold text-muted-foreground border-b">
                                <tr>
                                    <th className="px-6 py-4">Workspace Name</th>
                                    <th className="px-6 py-4 text-center">Active Pipelines</th>
                                    <th className="px-6 py-4 text-center">Media Assets</th>
                                    <th className="px-6 py-4 text-center">Generated Content</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {workspaces.map((ws: any) => (
                                    <tr key={ws.id} className="hover:bg-muted/5 transition-colors">
                                        <td className="px-6 py-4 font-medium">
                                            {ws.name}
                                            <span className="block text-[10px] text-muted-foreground mt-0.5">{ws.slug}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 font-semibold text-xs border border-violet-500/20">
                                                <GitBranchIcon className="w-3 h-3" />
                                                {ws.activePipelines} Active
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">
                                            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                                                <ImageIcon className="w-3.5 h-3.5" />
                                                {ws.totalMedia}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold">
                                            {ws.totalContent}
                                        </td>
                                    </tr>
                                ))}
                                {workspaces.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                            No workspaces found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
