import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { NODE_TEMPLATES } from '../types/nodes';
import type { FunnelNodeData } from '../types/nodes';

const FunnelNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as FunnelNodeData;
  const template = NODE_TEMPLATES[nodeData.type];
  const isThankYou = nodeData.type === 'thankYou';

  return (
    <div
      className={`
        relative bg-white rounded-xl shadow-lg border-2 transition-all duration-200
        min-w-[180px] p-4
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      style={{ borderColor: template.color }}
      role="button"
      aria-label={`${nodeData.label} node`}
      tabIndex={0}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        aria-label="Input connection point"
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl" role="img" aria-label={template.label}>
          {template.icon}
        </span>
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">{nodeData.label}</h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: template.color }}
          >
            {template.label}
          </span>
        </div>
      </div>

      {/* Thumbnail placeholder */}
      <div
        className="w-full h-20 bg-gray-100 rounded-lg mb-3 flex items-center justify-center border border-gray-200"
        aria-label="Page thumbnail preview"
      >
        <span className="text-gray-400 text-xs">Page Preview</span>
      </div>

      {/* Button preview */}
      <button
        className="w-full py-2 px-3 rounded-lg text-white text-sm font-medium cursor-default"
        style={{ backgroundColor: template.color }}
        tabIndex={-1}
        aria-label={`Button preview: ${nodeData.buttonLabel}`}
      >
        {nodeData.buttonLabel}
      </button>

      {/* Output handle - not for Thank You pages */}
      {!isThankYou && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white hover:!bg-blue-500 transition-colors"
          aria-label="Output connection point"
        />
      )}
    </div>
  );
});

FunnelNode.displayName = 'FunnelNode';

export default FunnelNode;
