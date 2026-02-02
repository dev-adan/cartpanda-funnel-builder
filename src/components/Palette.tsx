import type { DragEvent } from 'react';
import { NODE_TEMPLATES } from '../types/nodes';
import type { NodeType } from '../types/nodes';

interface PaletteProps {
  onExport: () => void;
  onImport: () => void;
  onAddNode?: (type: NodeType) => void;
}

const Palette = ({ onExport, onImport, onAddNode }: PaletteProps) => {
  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside
      className="w-64 bg-white border-r border-gray-200 flex flex-col h-full"
      aria-label="Node palette"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-bold text-lg text-gray-800">Funnel Builder</h2>
        <p className="text-xs text-gray-500 mt-1">
          Tap or drag nodes to the canvas
        </p>
      </div>

      {/* Node types */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Page Types
        </h3>
        <div className="space-y-2">
          {Object.values(NODE_TEMPLATES).map((template) => (
            <div
              key={template.type}
              draggable
              onDragStart={(e) => onDragStart(e, template.type)}
              onClick={() => onAddNode?.(template.type)}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-grab 
                         hover:bg-gray-100 active:cursor-grabbing transition-colors
                         border border-transparent hover:border-gray-200"
              role="button"
              aria-label={`Tap or drag to add ${template.label}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onAddNode?.(template.type);
                }
              }}
            >
              <span
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                style={{ backgroundColor: template.color }}
              >
                {template.icon}
              </span>
              <div>
                <span className="font-medium text-gray-800 text-sm block">
                  {template.label}
                </span>
                <span className="text-xs text-gray-500">
                  {template.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Actions
        </h3>
        <button
          onClick={onExport}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg font-medium
                     hover:bg-blue-600 transition-colors text-sm"
          aria-label="Export funnel as JSON"
        >
          📤 Export JSON
        </button>
        <button
          onClick={onImport}
          className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium
                     hover:bg-gray-200 transition-colors text-sm"
          aria-label="Import funnel from JSON"
        >
          📥 Import JSON
        </button>
      </div>

      {/* Help text */}
      <div className="p-4 bg-gray-50 text-xs text-gray-500">
        <p><strong>Tip:</strong> Connect nodes by dragging from the right handle to the left handle of another node.</p>
      </div>
    </aside>
  );
};

export default Palette;
