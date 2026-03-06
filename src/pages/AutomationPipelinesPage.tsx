import { useCallback } from 'react';
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
} from
  '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  PlusIcon,
  PlayIcon,
  Settings2Icon,
  DatabaseIcon,
  SparklesIcon,
  ImageIcon,
  CalendarIcon,
  SendIcon
} from
  'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
type PipelineNodeData = {
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
};

// Custom Node Component
const PipelineNode = ({ data }: NodeProps<Node<PipelineNodeData>>) => {
  const Icon = data.icon;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm min-w-[200px] relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-background !bg-violet-500"
      />
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${data.colorClass}`}>

        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{data.label}</p>
        <p className="text-xs text-muted-foreground">{data.sublabel}</p>
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
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'pipelineNode',
    position: {
      x: 50,
      y: 150
    },
    data: {
      label: 'RSS Feed',
      sublabel: 'Source',
      icon: DatabaseIcon,
      colorClass: 'bg-blue-500/10 text-blue-600'
    }
  },
  {
    id: '2',
    type: 'pipelineNode',
    position: {
      x: 300,
      y: 150
    },
    data: {
      label: 'AI Generate',
      sublabel: 'Transform',
      icon: SparklesIcon,
      colorClass: 'bg-violet-500/10 text-violet-600'
    }
  },
  {
    id: '3',
    type: 'pipelineNode',
    position: {
      x: 550,
      y: 50
    },
    data: {
      label: 'Image Gen',
      sublabel: 'Media',
      icon: ImageIcon,
      colorClass: 'bg-pink-500/10 text-pink-600'
    }
  },
  {
    id: '4',
    type: 'pipelineNode',
    position: {
      x: 550,
      y: 250
    },
    data: {
      label: 'Format Text',
      sublabel: 'Process',
      icon: Settings2Icon,
      colorClass: 'bg-orange-500/10 text-orange-600'
    }
  },
  {
    id: '5',
    type: 'pipelineNode',
    position: {
      x: 800,
      y: 150
    },
    data: {
      label: 'Schedule',
      sublabel: 'Action',
      icon: CalendarIcon,
      colorClass: 'bg-emerald-500/10 text-emerald-600'
    }
  },
  {
    id: '6',
    type: 'pipelineNode',
    position: {
      x: 1050,
      y: 150
    },
    data: {
      label: 'Publish',
      sublabel: 'Destination',
      icon: SendIcon,
      colorClass: 'bg-indigo-500/10 text-indigo-600'
    }
  }];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: {
      stroke: '#8b5cf6'
    }
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    style: {
      stroke: '#8b5cf6'
    }
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    animated: true,
    style: {
      stroke: '#8b5cf6'
    }
  },
  {
    id: 'e3-5',
    source: '3',
    target: '5',
    animated: true,
    style: {
      stroke: '#8b5cf6'
    }
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    animated: true,
    style: {
      stroke: '#8b5cf6'
    }
  },
  {
    id: 'e5-6',
    source: '5',
    target: '6',
    animated: true,
    style: {
      stroke: '#8b5cf6'
    }
  }];

export function AutomationPipelinesPage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
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
            Design visual workflows to automate your content creation.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <PlayIcon className="h-4 w-4" />
            Run Pipeline
          </Button>
          <Button variant="primary" className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Create New
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden border-border relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-muted/10">

          <Background color="#ccc" gap={16} />
          <Controls className="bg-card border-border fill-foreground" />
          <MiniMap
            nodeColor={(node) => {
              switch (node.id) {
                case '1':
                  return '#3b82f6';
                case '2':
                  return '#8b5cf6';
                case '3':
                  return '#ec4899';
                case '4':
                  return '#f97316';
                case '5':
                  return '#10b981';
                case '6':
                  return '#6366f1';
                default:
                  return '#eee';
              }
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            className="bg-card border border-border rounded-lg" />

        </ReactFlow>
      </Card>
    </div>);

}