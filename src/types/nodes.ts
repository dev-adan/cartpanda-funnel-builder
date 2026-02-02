// Node type definitions for the funnel builder
export type NodeType = 'salesPage' | 'orderPage' | 'upsell' | 'downsell' | 'thankYou';

export interface FunnelNodeData {
  label: string;
  type: NodeType;
  buttonLabel: string;
  icon: string;
  [key: string]: unknown; // Index signature for React Flow compatibility
}

export interface NodeTemplate {
  type: NodeType;
  label: string;
  buttonLabel: string;
  icon: string;
  color: string;
  description: string;
}

export const NODE_TEMPLATES: Record<NodeType, NodeTemplate> = {
  salesPage: {
    type: 'salesPage',
    label: 'Sales Page',
    buttonLabel: 'Buy Now',
    icon: '📄',
    color: '#3b82f6',
    description: 'Landing page to sell your product',
  },
  orderPage: {
    type: 'orderPage',
    label: 'Order Page',
    buttonLabel: 'Complete Order',
    icon: '🛒',
    color: '#10b981',
    description: 'Checkout page for customer details',
  },
  upsell: {
    type: 'upsell',
    label: 'Upsell',
    buttonLabel: 'Yes, Add This!',
    icon: '⬆️',
    color: '#f59e0b',
    description: 'Offer additional products',
  },
  downsell: {
    type: 'downsell',
    label: 'Downsell',
    buttonLabel: 'Get This Instead',
    icon: '⬇️',
    color: '#ef4444',
    description: 'Alternative offer if upsell declined',
  },
  thankYou: {
    type: 'thankYou',
    label: 'Thank You',
    buttonLabel: 'Continue',
    icon: '✅',
    color: '#8b5cf6',
    description: 'Order confirmation page',
  },
};

// Validation rules
export const VALIDATION_RULES = {
  thankYouNoOutgoing: true,
  salesPageSingleOutgoing: true,
};
