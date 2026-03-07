import { useCallback, useEffect } from 'react';
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
  RefreshCwIcon,
  SaveIcon
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
const PipelineNode = ({ data }: NodeProps<Node<PipelineNodeData>>) => {
  const Icon = data.icon;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm min-w-[200px] relative hover:border-primary/50 transition-colors">
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

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['active-pipeline', activeWorkspace?.id],
    queryFn: async () => {
      const response = await api.get('/automation');
      return response.data.data?.[0] ?? null;
    },
    enabled: !!activeWorkspace,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: pipeline?.name || 'Main Pipeline',
        nodes: nodes.map(n => ({
          id: n.id,
          name: (n.data as any).label,
          type: (n.data as any).sublabel.toLowerCase(),
          position: n.position,
          config: {} // Default empty config
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target
        }))
      };

      if (pipeline?.id) {
        await api.put(`/automation/${pipeline.id}`, payload);
      } else {
        await api.post('/automation', payload);
      }
    },
    onSuccess: () => {
      toast.success('Pipeline configuration saved');
      queryClient.invalidateQueries({ queryKey: ['active-pipeline'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to save pipeline');
    }
  });

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
      const mappedNodes = pipeline.nodes.map((node: any) => ({
        id: node.id,
        type: 'pipelineNode',
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.name,
          sublabel: node.type.toUpperCase(),
          icon: getIcon(node.type),
          colorClass: getColor(node.type)
        }
      }));
      const mappedEdges = pipeline.edges.map((edge: any) => ({
        ...edge,
        animated: true,
        style: { stroke: '#8b5cf6' }
      }));
      setNodes(mappedNodes);
      setEdges(mappedEdges);
    } else if (!isLoading) {
      // Default demo if no pipeline in DB
      const defaultNodes: Node[] = [
        { id: '1', type: 'pipelineNode', position: { x: 50, y: 150 }, data: { label: 'RSS Feed', sublabel: 'RSS', icon: DatabaseIcon, colorClass: 'bg-blue-500/10 text-blue-600' } },
        { id: '2', type: 'pipelineNode', position: { x: 300, y: 150 }, data: { label: 'AI Text Generator', sublabel: 'AI', icon: SparklesIcon, colorClass: 'bg-violet-500/10 text-violet-600' } },
        { id: '6', type: 'pipelineNode', position: { x: 550, y: 150 }, data: { label: 'Publish to Twitter', sublabel: 'PUBLISH', icon: SendIcon, colorClass: 'bg-indigo-500/10 text-indigo-600' } }
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
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Automation Pipelines
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visual workflow configuration for <strong>{activeWorkspace?.name}</strong>.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => pipeline && triggerMutation.mutate(pipeline.id)}
            disabled={!pipeline || triggerMutation.isPending}
          >
            {triggerMutation.isPending ? <RefreshCwIcon className="h-4 w-4 animate-spin" /> : <PlayIcon className="h-4 w-4" />}
            Test Run
          </Button>
          <Button
            variant="primary"
            className="gap-2 px-6"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <RefreshCwIcon className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
            Save Architecture
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden border-border relative bg-background/50 backdrop-blur-sm shadow-inner group">
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
                return '#eee';
              }}
              maskColor="rgba(0, 0, 0, 0.05)"
              className="bg-card border border-border rounded-lg"
            />
          </ReactFlow>
        )}
      </Card>

      {!pipeline && !isLoading && (
        <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3 text-center">
          <p className="text-xs text-violet-700 dark:text-violet-300">
            <strong>Blueprint Mode:</strong> You are currently editing a template. Click "Save Architecture" to persist this to your workspace database.
          </p>
        </div>
      )}
    </div>);
}