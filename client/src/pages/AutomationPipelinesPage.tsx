import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeProps,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  PlayIcon,
  Settings2Icon,
  DatabaseIcon,
  SparklesIcon,
  ImageIcon,
  CalendarIcon,
  SendIcon,
  SaveIcon,
  Trash2Icon,
  PlusIcon,
  ChevronDownIcon,
  RefreshCwIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

type PipelineNodeData = {
  label: string;
  sublabel: string;
  icon: any;
  colorClass: string;
};

// Custom Node Component
const PipelineNode = ({ id, data }: NodeProps<Node<PipelineNodeData>>) => {
  const Icon = data.icon;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm min-w-[200px] relative hover:border-primary/50 transition-colors group/node">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-background !bg-violet-500"
      />
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${data.colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{data.label}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-tight font-mono">{data.sublabel}</p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-background !bg-violet-500"
      />

      <button
        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover/node:opacity-100 transition-opacity shadow-lg hover:scale-110 active:scale-95"
        onClick={(e) => {
          e.stopPropagation();
          if ((data as any).onDelete) (data as any).onDelete(id);
        }}
      >
        <Trash2Icon className="h-3 w-3" />
      </button>
    </div>);
};

const nodeTypes = {
  pipelineNode: PipelineNode
};

export function AutomationPipelinesPage() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [triggerType, setTriggerType] = useState('schedule');
  const [selectedPlats, setSelectedPlats] = useState<string[]>(['twitter']);
  const [pipelineTopic, setPipelineTopic] = useState('');
  const [cron, setCron] = useState('0 9 * * *');
  const [pipelineName, setPipelineName] = useState('New Pipeline');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [pipelineStatus, setPipelineStatus] = useState('draft');
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);

  const { data: pipelines, isLoading } = useQuery({
    queryKey: ['pipelines', activeWorkspace?.id],
    queryFn: async () => {
      const response = await api.get('/automation');
      return response.data.data ?? [];
    },
    enabled: !!activeWorkspace,
  });

  const pipeline = pipelines?.find((p: any) => p.id === activePipelineId);

  useEffect(() => {
    // Auto-select first pipeline on initial load
    if (!activePipelineId && pipelines?.length > 0) {
      setActivePipelineId(pipelines[0].id);
    }
  }, [pipelines, activePipelineId]);

  useEffect(() => {
    if (pipeline && activePipelineId !== 'new') {
      setTriggerType(pipeline.triggerType);
      setSelectedPlats(pipeline.platforms);
      setPipelineTopic(pipeline.config?.topic || '');
      setCron(pipeline.config?.cron || '0 9 * * *');
      setPipelineName(pipeline.name);
      setPipelineDescription(pipeline.description || '');
      setPipelineStatus(pipeline.status);
    }
  }, [pipeline, activePipelineId]);

  const resetToNew = () => {
    setActivePipelineId('new');
    setPipelineName('New Pipeline');
    setPipelineDescription('');
    setTriggerType('schedule');
    setSelectedPlats(['twitter']);
    setPipelineTopic('');
    setCron('0 9 * * *');
    setPipelineStatus('draft');
    setNodes([
      { id: '1', type: 'pipelineNode', position: { x: 50, y: 150 }, data: { label: 'RSS Feed', sublabel: 'RSS', icon: DatabaseIcon, colorClass: 'bg-blue-500/10 text-blue-600', onDelete: deleteNode } },
      { id: '2', type: 'pipelineNode', position: { x: 300, y: 150 }, data: { label: 'AI Text Generator', sublabel: 'AI', icon: SparklesIcon, colorClass: 'bg-violet-500/10 text-violet-600', onDelete: deleteNode } },
      { id: '6', type: 'pipelineNode', position: { x: 550, y: 150 }, data: { label: 'Publish to Twitter', sublabel: 'PUBLISH', icon: SendIcon, colorClass: 'bg-indigo-500/10 text-indigo-600', onDelete: deleteNode } }
    ]);
    setEdges([
      { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#8b5cf6' } },
      { id: 'e2-6', source: '2', target: '6', animated: true, style: { stroke: '#8b5cf6' } }
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: pipelineName,
        description: pipelineDescription,
        status: pipelineStatus,
        triggerType,
        platforms: selectedPlats,
        config: {
          nodes: nodes.map(n => ({
            id: n.id,
            name: (n.data as any).label,
            type: (n.data as any).sublabel.toLowerCase(),
            position: n.position,
            config: (n.data as any).config || {}
          })),
          edges: edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target
          })),
          topic: pipelineTopic,
          cron,
        }
      };

      if (pipeline?.id) {
        return await api.put(`/automation/${pipeline.id}`, payload);
      } else {
        return await api.post('/automation/create', payload);
      }
    },
    onSuccess: (data: any) => {
      toast.success('Pipeline configuration saved');
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      if ((activePipelineId === 'new' || !activePipelineId) && data?.data?.id) {
        setActivePipelineId(data.data.id);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to save pipeline');
    }
  });

  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, [setNodes, setEdges]);

  const addNode = (type: string) => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'pipelineNode',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: `${type.toUpperCase()} Task`,
        sublabel: type.toUpperCase(),
        icon: getIcon(type),
        colorClass: getColor(type),
        onDelete: deleteNode
      }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const triggerMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/automation/${id}/trigger`);
    },
    onSuccess: () => {
      toast.success('Pipeline execution triggered successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Execution failed');
    }
  });

  // Map icons
  const getIcon = (type: string) => {
    switch (type) {
      case 'rss': return DatabaseIcon;
      case 'ai': return SparklesIcon;
      case 'image': return ImageIcon;
      case 'format': return Settings2Icon;
      case 'schedule': return CalendarIcon;
      case 'publish': return SendIcon;
      default: return Settings2Icon;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'rss': return 'bg-blue-500/10 text-blue-600';
      case 'ai': return 'bg-violet-500/10 text-violet-600';
      case 'image': return 'bg-pink-500/10 text-pink-600';
      case 'format': return 'bg-orange-500/10 text-orange-600';
      case 'schedule': return 'bg-emerald-500/10 text-emerald-600';
      case 'publish': return 'bg-indigo-500/10 text-indigo-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  useEffect(() => {
    if (pipeline) {
      const mappedNodes = pipeline.config.nodes?.map((node: any) => ({
        id: node.id,
        type: 'pipelineNode',
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.name,
          sublabel: node.type.toUpperCase(),
          icon: getIcon(node.type),
          colorClass: getColor(node.type),
          onDelete: deleteNode
        }
      }));
      const mappedEdges = pipeline.config.edges?.map((edge: any) => ({
        ...edge,
        animated: true,
        style: { stroke: '#8b5cf6' }
      }));
      setNodes(mappedNodes || []);
      setEdges(mappedEdges || []);
    } else if (!isLoading) {
      // Default demo if no pipeline in DB
      const defaultNodes: Node[] = [
        { id: '1', type: 'pipelineNode', position: { x: 50, y: 150 }, data: { label: 'RSS Feed', sublabel: 'RSS', icon: DatabaseIcon, colorClass: 'bg-blue-500/10 text-blue-600', onDelete: deleteNode } },
        { id: '2', type: 'pipelineNode', position: { x: 300, y: 150 }, data: { label: 'AI Text Generator', sublabel: 'AI', icon: SparklesIcon, colorClass: 'bg-violet-500/10 text-violet-600', onDelete: deleteNode } },
        { id: '6', type: 'pipelineNode', position: { x: 550, y: 150 }, data: { label: 'Publish to Twitter', sublabel: 'PUBLISH', icon: SendIcon, colorClass: 'bg-indigo-500/10 text-indigo-600', onDelete: deleteNode } }
      ];
      const defaultEdges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#8b5cf6' } },
        { id: 'e2-6', source: '2', target: '6', animated: true, style: { stroke: '#8b5cf6' } }
      ];
      setNodes(defaultNodes);
      setEdges(defaultEdges);
    }
  }, [pipeline, isLoading, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: {
              stroke: '#8b5cf6'
            }
          } as Edge,
          eds
        )
      ),
    [setEdges]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col space-y-4 md:space-y-6 min-w-0">
        {/* Modern Workflow Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 bg-background/40 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm transition-all hover:shadow-md z-20">
          <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
            <div className="p-2 md:p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-inner shrink-0">
              <Settings2Icon className="h-4 w-4 md:h-5 md:w-5" />
            </div>

            <div className="h-10 w-[1px] bg-border/50 mx-1 hidden xs:block" />

            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1 group/selector relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-1.5 gap-1.5 -ml-1.5 hover:bg-muted/50 text-foreground font-bold text-sm md:text-lg"
                >
                  <span className="truncate max-w-[150px] md:max-w-[200px]">{pipeline?.name || (activePipelineId === 'new' ? 'New Pipeline' : 'Select Architecture')}</span>
                  <ChevronDownIcon className="h-3 w-3 md:h-4 md:w-4 opacity-30 group-hover/selector:opacity-80 transition-opacity" />
                </Button>

                {/* Dropdown Menu */}
                <div className="absolute top-10 left-0 w-64 md:w-72 bg-card border border-border rounded-xl shadow-2xl p-2 z-50 hidden group-hover/selector:block animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">My Architectures</span>
                    <Button variant="primary" size="sm" className="h-6 px-2 text-[10px]" onClick={resetToNew}>
                      <PlusIcon className="h-3 w-3 mr-1" /> Create New
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                    {pipelines?.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => setActivePipelineId(p.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center justify-between group ${activePipelineId === p.id
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'hover:bg-muted text-muted-foreground border border-transparent'
                          }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-bold">{p.name}</p>
                          <p className="text-[10px] opacity-60 truncate mt-0.5 font-medium">{p.description || 'No description provided'}</p>
                        </div>
                        <div className={`h-2 w-2 rounded-full ring-4 ring-background ${p.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                          }`} />
                      </button>
                    ))}
                    {pipelines?.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-xs text-muted-foreground italic">No pipelines yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-muted-foreground font-medium uppercase tracking-tighter ml-0.5">
                <span className="opacity-60 hidden xs:inline">Workspace:</span>
                <span className="text-foreground/80 font-bold truncate max-w-[80px] md:max-w-none">{activeWorkspace?.name}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>{activePipelineId === 'new' ? 'Unsaved' : `ID: ${activePipelineId?.slice(-6)}`}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 font-semibold flex-1 sm:flex-none justify-center"
              onClick={() => pipeline && triggerMutation.mutate(pipeline.id)}
              disabled={!pipeline || triggerMutation.isPending}
            >
              {triggerMutation.isPending ? <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" /> : <PlayIcon className="h-3.5 w-3.5 text-emerald-500" />}
              <span className="xs:inline">Test Run</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-9 gap-2 px-3 md:px-5 font-bold shadow-lg shadow-primary/20 flex-1 sm:flex-none justify-center"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" /> : <SaveIcon className="h-3.5 w-3.5" />}
              <span className="xs:inline">Save Design</span>
            </Button>
          </div>
        </div>

        <Card className="flex-1 min-h-[400px] lg:min-h-0 overflow-hidden border-border/50 relative bg-background/50 backdrop-blur-sm shadow-xl rounded-2xl group">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <RefreshCwIcon className="h-12 w-12 animate-spin text-primary opacity-20" />
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              className="bg-muted/5">
              <Background color="#aaa" gap={20} size={1} />
              <Controls className="bg-card border-border fill-foreground" />
              <MiniMap
                nodeColor={(node: any) => {
                  const color = node.data?.colorClass || '';
                  if (color.includes('blue')) return '#3b82f6';
                  if (color.includes('violet')) return '#8b5cf6';
                  if (color.includes('emerald')) return '#10b981';
                  if (color.includes('orange')) return '#f97316';
                  if (color.includes('pink')) return '#ec4899';
                  if (color.includes('indigo')) return '#6366f1';
                  return '#eee';
                }}
                maskColor="rgba(0, 0, 0, 0.05)"
                className="bg-card border border-border rounded-lg"
              />
            </ReactFlow>
          )}

          {activePipelineId === 'new' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-violet-500/10 border border-violet-500/20 rounded-full py-1.5 px-4 backdrop-blur-md z-10 shadow-2xl flex items-center gap-2 border-dashed">
              <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
              <p className="text-[10px] text-violet-700 dark:text-violet-300 font-bold uppercase tracking-widest leading-none">
                Blueprint Mode: Unsaved
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Global Config Sidebar */}
      <Card className="w-full lg:w-80 shrink-0 border-border bg-card/30 backdrop-blur-sm flex flex-col shadow-xl animate-in slide-in-from-right duration-500">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <Settings2Icon className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Pipeline Architect</span>
          </div>
          <p className="text-xs text-muted-foreground">Configure the execution logic and workflow.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Identity & Status */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Pipeline Status</label>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
              {['draft', 'active', 'paused'].map((status) => (
                <button
                  key={status}
                  onClick={() => setPipelineStatus(status)}
                  className={`flex-1 py-1 px-2 rounded-md text-[10px] font-bold uppercase transition-all ${pipelineStatus === status
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Description</label>
            <textarea
              value={pipelineDescription}
              onChange={(e) => setPipelineDescription(e.target.value)}
              placeholder="What is the purpose of this pipeline?"
              rows={2}
              className="w-full bg-muted/50 border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Node Library</label>
            <div className="grid grid-cols-2 xs:grid-cols-3 lg:grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-14 flex-col gap-1 text-[10px]" onClick={() => addNode('rss')}>
                <DatabaseIcon className="h-4 w-4 text-blue-500" /> RSS Feed
              </Button>
              <Button variant="outline" size="sm" className="h-14 flex-col gap-1 text-[10px]" onClick={() => addNode('ai')}>
                <SparklesIcon className="h-4 w-4 text-violet-500" /> AI Generator
              </Button>
              <Button variant="outline" size="sm" className="h-14 flex-col gap-1 text-[10px]" onClick={() => addNode('format')}>
                <Settings2Icon className="h-4 w-4 text-orange-500" /> Formatter
              </Button>
              <Button variant="outline" size="sm" className="h-14 flex-col gap-1 text-[10px]" onClick={() => addNode('schedule')}>
                <CalendarIcon className="h-4 w-4 text-emerald-500" /> Scheduler
              </Button>
              <Button variant="outline" size="sm" className="h-14 flex-col gap-1 text-[10px]" onClick={() => addNode('image')}>
                <ImageIcon className="h-4 w-4 text-pink-500" /> Media Gen
              </Button>
              <Button variant="outline" size="sm" className="h-14 flex-col gap-1 text-[10px]" onClick={() => addNode('publish')}>
                <SendIcon className="h-4 w-4 text-indigo-500" /> Publisher
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Trigger Method</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={triggerType === 'schedule' ? 'primary' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setTriggerType('schedule')}
              >
                <CalendarIcon className="h-3 w-3" /> Recurring
              </Button>
              <Button
                variant={triggerType === 'manual' ? 'primary' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setTriggerType('manual')}
              >
                <PlayIcon className="h-3 w-3" /> Manual
              </Button>
            </div>
          </div>

          {triggerType === 'schedule' && (
            <div className="space-y-2 animate-in slide-in-from-top duration-300">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Cron Schedule</label>
              <input
                type="text"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                placeholder="e.g., 0 9 * * *"
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground italic px-1">Tip: "0 9 * * *" means 9 AM daily</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Context Topic</label>
            <textarea
              value={pipelineTopic}
              onChange={(e) => setPipelineTopic(e.target.value)}
              placeholder="What should this pipeline talk about?"
              rows={3}
              className="w-full bg-muted/50 border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Target Platforms</label>
            <div className="flex flex-wrap gap-2">
              {['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok'].map(plat => (
                <button
                  key={plat}
                  onClick={() => {
                    setSelectedPlats((prev: string[]) =>
                      prev.includes(plat) ? prev.filter((p: string) => p !== plat) : [...prev, plat]
                    )
                  }}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${selectedPlats.includes(plat)
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                    : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                    }`}
                >
                  {plat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}