import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { FunnelNodeData, NodeType } from '../types/nodes';

interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  nodeId?: string;
}

interface ValidationPanelProps {
  nodes: Node[];
  edges: Edge[];
}

const ValidationPanel = ({ nodes, edges }: ValidationPanelProps) => {
  const issues = useMemo(() => {
    const problems: ValidationIssue[] = [];

    // Find orphan nodes (no incoming or outgoing edges, except valid start/end)
    nodes.forEach((node) => {
      const hasIncoming = edges.some((e) => e.target === node.id);
      const hasOutgoing = edges.some((e) => e.source === node.id);
      const nodeData = node.data as FunnelNodeData;
      const nodeType = nodeData.type as NodeType;

      // Sales page should be start (no incoming is OK)
      if (nodeType === 'salesPage' && !hasOutgoing) {
        problems.push({
          type: 'warning',
          message: `"${nodeData.label}" has no outgoing connection`,
          nodeId: node.id,
        });
      }

      // Thank you should have no outgoing (enforced by design)
      // But should have incoming
      if (nodeType === 'thankYou' && !hasIncoming) {
        problems.push({
          type: 'warning',
          message: `"${nodeData.label}" has no incoming connection`,
          nodeId: node.id,
        });
      }

      // Other nodes should have both
      if (nodeType !== 'salesPage' && nodeType !== 'thankYou') {
        if (!hasIncoming && !hasOutgoing) {
          problems.push({
            type: 'error',
            message: `"${nodeData.label}" is orphaned (no connections)`,
            nodeId: node.id,
          });
        } else if (!hasIncoming) {
          problems.push({
            type: 'warning',
            message: `"${nodeData.label}" has no incoming connection`,
            nodeId: node.id,
          });
        } else if (!hasOutgoing) {
          problems.push({
            type: 'warning',
            message: `"${nodeData.label}" has no outgoing connection`,
            nodeId: node.id,
          });
        }
      }
    });

    // Check Sales Page connections (should typically go to Order Page)
    const salesPages = nodes.filter((n) => (n.data as FunnelNodeData).type === 'salesPage');
    salesPages.forEach((sp) => {
      const outgoing = edges.filter((e) => e.source === sp.id);
      if (outgoing.length > 1) {
        const spData = sp.data as FunnelNodeData;
        problems.push({
          type: 'warning',
          message: `"${spData.label}" has multiple outgoing connections (typically should have one)`,
          nodeId: sp.id,
        });
      }
    });

    return problems;
  }, [nodes, edges]);

  if (nodes.length === 0) {
    return (
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <p className="text-gray-500 text-sm">
          Drag nodes from the palette to start building your funnel
        </p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="absolute bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-xs">
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span className="text-green-700 text-sm font-medium">Funnel looks good!</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm"
      role="status"
      aria-live="polite"
    >
      <h3 className="font-semibold text-gray-800 text-sm mb-2">
        Validation ({issues.length} {issues.length === 1 ? 'issue' : 'issues'})
      </h3>
      <ul className="space-y-1">
        {issues.slice(0, 5).map((issue, idx) => (
          <li
            key={idx}
            className={`text-xs flex items-start gap-2 ${
              issue.type === 'error' ? 'text-red-600' : 'text-yellow-600'
            }`}
          >
            <span>{issue.type === 'error' ? '❌' : '⚠️'}</span>
            <span>{issue.message}</span>
          </li>
        ))}
        {issues.length > 5 && (
          <li className="text-xs text-gray-500">
            +{issues.length - 5} more issues
          </li>
        )}
      </ul>
    </div>
  );
};

export default ValidationPanel;
