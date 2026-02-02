import { useCallback, useRef, useState, useEffect } from 'react';
import type { DragEvent } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import type { Node, Edge, Connection, ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import FunnelNode from './components/FunnelNode';
import Palette from './components/Palette';
import ValidationPanel from './components/ValidationPanel';
import { NODE_TEMPLATES } from './types/nodes';
import type { FunnelNodeData, NodeType } from './types/nodes';

const nodeTypes = {
  funnel: FunnelNode,
};

// Track auto-increment counters for upsell/downsell
const getNodeCounters = (): Record<string, number> => {
  const stored = localStorage.getItem('funnel-counters');
  return stored ? JSON.parse(stored) : { upsell: 0, downsell: 0 };
};

const saveNodeCounters = (counters: Record<string, number>) => {
  localStorage.setItem('funnel-counters', JSON.stringify(counters));
};

const STORAGE_KEY = 'funnel-builder-state';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function FunnelBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [counters, setCounters] = useState<Record<string, number>>(getNodeCounters);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(stored);
        if (savedNodes) setNodes(savedNodes);
        if (savedEdges) setEdges(savedEdges);
      } catch (e) {
        console.error('Failed to load saved funnel:', e);
      }
    }
  }, [setNodes, setEdges]);

  // Save to localStorage on changes
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
    }
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Prevent Thank You from having outgoing connections
      const sourceNode = nodes.find((n) => n.id === params.source);
      const data = sourceNode?.data as FunnelNodeData | undefined;
      if (data?.type === 'thankYou') {
        alert('Thank You pages cannot have outgoing connections');
        return;
      }

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      );
    },
    [nodes, setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type || !NODE_TEMPLATES[type]) return;

      const template = NODE_TEMPLATES[type];
      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (!position) return;

      let label = template.label;
      const newCounters = { ...counters };

      // Auto-increment upsell/downsell labels
      if (type === 'upsell' || type === 'downsell') {
        newCounters[type] = (newCounters[type] || 0) + 1;
        label = `${template.label} ${newCounters[type]}`;
        setCounters(newCounters);
        saveNodeCounters(newCounters);
      }

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: 'funnel',
        position,
        data: {
          label,
          type,
          buttonLabel: template.buttonLabel,
          icon: template.icon,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, counters, setNodes]
  );

  const handleExport = useCallback(() => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'funnel-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.nodes && Array.isArray(data.nodes)) {
          setNodes(data.nodes);
        }
        if (data.edges && Array.isArray(data.edges)) {
          setEdges(data.edges);
        }
        localStorage.setItem(STORAGE_KEY, text);
      } catch {
        alert('Invalid JSON file');
      }
    };
    input.click();
  }, [setNodes, setEdges]);

  const onNodesDelete = useCallback((deleted: Node[]) => {
    // Clean up edges when nodes are deleted
    const deletedIds = new Set(deleted.map((n) => n.id));
    setEdges((eds) => eds.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target)));
  }, [setEdges]);

  return (
    <div className="flex h-screen w-screen">
      <Palette onExport={handleExport} onImport={handleImport} />
      
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as FunnelNodeData;
              return NODE_TEMPLATES[data.type]?.color || '#999';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
        
        <ValidationPanel nodes={nodes} edges={edges} />
        
        {/* Keyboard shortcuts hint */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow px-3 py-2 text-xs text-gray-500">
          <span><kbd className="px-1 py-0.5 bg-gray-100 rounded">Del</kbd> Delete selected</span>
          <span className="mx-2">•</span>
          <span><kbd className="px-1 py-0.5 bg-gray-100 rounded">Scroll</kbd> Zoom</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <FunnelBuilder />
    </ReactFlowProvider>
  );
}

export default App;
