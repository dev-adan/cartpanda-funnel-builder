# Cartpanda Funnel Builder

A drag-and-drop visual editor for building upsell funnels. Built with React, TypeScript, and React Flow.

🔗 **Live Demo:** [Coming soon - deploy to Vercel]

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Features

### Core Functionality (MVP)
- ✅ **Infinite canvas** with pan and zoom
- ✅ **Grid background** with snap-to-grid
- ✅ **5 node types**: Sales Page, Order Page, Upsell, Downsell, Thank You
- ✅ **Drag & drop** from palette to canvas
- ✅ **Visual connections** with animated arrows
- ✅ **Auto-increment labels** (Upsell 1, Upsell 2, etc.)
- ✅ **Validation rules**: Thank You has no outgoing, Sales Page warns on multiple
- ✅ **Persistence**: localStorage + Export/Import JSON

### Bonus Features
- ✅ Zoom in/out controls
- ✅ Snap to grid
- ✅ Mini-map navigation
- ✅ Node deletion (Backspace/Delete key)
- ✅ Validation panel showing issues

## Architecture Decisions

### Why React Flow?
- Battle-tested graph visualization library
- Built-in performance optimizations (virtualization, memoization)
- Handles complex edge cases (multi-select, keyboard shortcuts, touch)
- Reduces code by ~70% vs custom implementation

### State Management
- **Local state only** (useState + useReducer pattern via React Flow hooks)
- No Redux/Zustand needed — funnel state is self-contained
- Persistence via localStorage (simple, no backend required)

### Component Structure
```
src/
├── components/
│   ├── FunnelNode.tsx    # Custom node renderer
│   ├── Palette.tsx       # Sidebar with draggable node types
│   └── ValidationPanel.tsx # Real-time funnel validation
├── types/
│   └── nodes.ts          # TypeScript interfaces + node templates
├── App.tsx               # Main app with React Flow canvas
└── main.tsx              # Entry point
```

### Styling
- **Tailwind CSS** for rapid development
- Inline styles for dynamic colors (node type-specific)
- No CSS-in-JS overhead

## Accessibility Notes

### WCAG 2.1 AA Compliance
- ✅ **Keyboard navigation**: Tab through palette items, Enter to interact
- ✅ **ARIA labels**: All interactive elements have descriptive labels
- ✅ **Focus indicators**: Visible focus rings on all controls
- ✅ **Color contrast**: All text meets 4.5:1 ratio
- ✅ **Screen reader support**: Role attributes, live regions for validation
- ✅ **Reduced motion**: Respects `prefers-reduced-motion` (React Flow built-in)

### Known Limitations
- Drag-and-drop is not fully accessible (keyboard alternative would require additional work)
- Canvas navigation primarily mouse/touch based

## Tradeoffs & What I'd Improve Next

### What I Skipped (Intentionally)
1. **Undo/Redo** — Would add ~2h dev time with command pattern
2. **Edge deletion UI** — Works with keyboard, would add context menu
3. **Node editing** — Labels are static; would add inline editing
4. **Mobile optimization** — Focused on desktop for this MVP

### Next Iterations
1. Add undo/redo with command history
2. Right-click context menu for nodes/edges
3. Inline node label editing
4. Funnel templates (pre-built configurations)
5. Collaborative editing (would need backend + WebSocket)

## Testing Strategy

For production, I'd add:
- **Unit tests**: Node validation logic, counter incrementing
- **Integration tests**: Drag-drop flow, connection creation
- **E2E tests**: Full funnel creation workflow with Playwright

---

Built for Cartpanda Front-end Engineer assessment.
