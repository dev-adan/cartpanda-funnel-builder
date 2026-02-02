# Modern Dashboard Architecture for Cartpanda

A comprehensive guide to building a scalable, accessible, and maintainable admin dashboard for funnels, orders, customers, subscriptions, analytics, disputes, settings, and permissions.

---

## Table of Contents
1. [Architecture](#1-architecture)
2. [Design System](#2-design-system)
3. [Data Fetching + State](#3-data-fetching--state)
4. [Performance](#4-performance)
5. [Developer Experience & Team Scaling](#5-developer-experience--team-scaling)
6. [Testing Strategy](#6-testing-strategy)
7. [Release & Quality](#7-release--quality)

---

## 1. Architecture

### High-Level Structure

```
src/
├── app/                      # Next.js App Router (or Vite + React Router)
│   ├── (auth)/              # Auth-required layout group
│   │   ├── dashboard/       # Main dashboard route
│   │   ├── funnels/         # Funnel management
│   │   ├── orders/          # Order management
│   │   ├── customers/       # Customer CRM
│   │   ├── subscriptions/   # Subscription management
│   │   ├── analytics/       # Analytics & reporting
│   │   ├── disputes/        # Dispute handling
│   │   └── settings/        # App settings + permissions
│   └── (public)/            # Public routes (login, etc.)
├── features/                 # Feature modules (domain-driven)
│   ├── funnels/
│   │   ├── components/      # Feature-specific components
│   │   ├── hooks/           # Feature-specific hooks
│   │   ├── api/             # API calls + queries
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Feature utilities
│   ├── orders/
│   ├── customers/
│   └── ...
├── components/               # Shared UI components
│   ├── ui/                  # Design system primitives
│   ├── layout/              # Layouts, navigation, sidebars
│   └── data-display/        # Tables, charts, cards
├── lib/                      # Shared utilities
│   ├── api/                 # API client, interceptors
│   ├── auth/                # Auth context + helpers
│   └── utils/               # General utilities
├── hooks/                    # Shared custom hooks
├── stores/                   # Global client state (if needed)
└── styles/                   # Global styles, tokens
```

### Why This Structure?

1. **Feature modules own their domain**: Each feature (funnels, orders, etc.) is self-contained. Engineers can work in parallel without merge conflicts.

2. **Colocation over separation**: Components, hooks, and API calls live together. No hunting across `components/`, `hooks/`, `api/` folders.

3. **Shared UI stays separate**: The design system lives in `components/ui/` and never contains business logic.

4. **Route-based code splitting**: Each route is a natural bundle boundary.

### Avoiding Spaghetti

| Pattern | Why It Works |
|---------|--------------|
| Feature folders | Boundaries prevent cross-feature coupling |
| Barrel exports | `features/orders/index.ts` exposes only public API |
| Dependency direction | Features import from `components/` and `lib/`, never from other features |
| Shared types | Common types in `lib/types/`, domain types stay in feature |

---

## 2. Design System

### Build vs Buy Decision

**My choice: shadcn/ui + Tailwind CSS**

| Option | Pros | Cons |
|--------|------|------|
| Build from scratch | Full control | 3-6 months dev time |
| Material UI | Feature-rich | Bundle size, hard to customize |
| Chakra UI | Good DX | Styling conflicts |
| **shadcn/ui** | Copy-paste components, full ownership, accessible | Need to maintain |

shadcn/ui gives us accessible, unstyled primitives (built on Radix) that we own. No version lock-in, no "fighting the library."

### Enforcing Consistency

```
design-system/
├── tokens/
│   ├── colors.css          # CSS custom properties
│   ├── typography.css      # Font sizes, weights, line heights
│   ├── spacing.css         # 4px grid (4, 8, 12, 16, 24, 32, 48...)
│   └── shadows.css         # Elevation levels
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Table/
│   └── ...
└── index.ts                 # Public exports
```

### Accessibility Enforcement

1. **Radix primitives**: Keyboard navigation, focus management, ARIA built-in
2. **ESLint plugin**: `eslint-plugin-jsx-a11y` catches issues at dev time
3. **Storybook a11y addon**: Visual accessibility testing in component library
4. **Color contrast**: Design tokens enforce 4.5:1 minimum
5. **Focus visible**: Global styles for keyboard focus indicators

```tsx
// All interactive components use focus-visible
<Button className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500">
  Click me
</Button>
```

---

## 3. Data Fetching + State

### Server State vs Client State

| Type | Tool | Examples |
|------|------|----------|
| Server state | TanStack Query | Orders list, funnel data, analytics |
| Client state | Zustand (if needed) | UI preferences, sidebar open state |
| URL state | nuqs or searchParams | Table filters, pagination, sorts |
| Form state | React Hook Form + Zod | Create/edit forms |

### TanStack Query Setup

```tsx
// features/orders/api/queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from './client';
import { Order, OrderFilters } from './types';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => orderApi.getOrders(filters),
    staleTime: 30_000, // 30 seconds
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderApi.getOrder(id),
    enabled: !!id,
  });
}
```

### Loading/Error/Empty States

Standardized patterns across all features:

```tsx
// components/data-display/QueryState.tsx
interface QueryStateProps<T> {
  query: UseQueryResult<T>;
  loading?: React.ReactNode;
  error?: (error: Error) => React.ReactNode;
  empty?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}

function QueryState<T>({ query, loading, error, empty, children }: QueryStateProps<T>) {
  if (query.isLoading) return loading ?? <Skeleton />;
  if (query.isError) return error?.(query.error) ?? <ErrorCard error={query.error} />;
  if (!query.data || (Array.isArray(query.data) && query.data.length === 0)) {
    return empty ?? <EmptyState />;
  }
  return children(query.data);
}
```

### Table Filters/Sorts/Pagination

URL-driven state for shareability and back-button support:

```tsx
// features/orders/hooks/useOrderFilters.ts
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs';

export function useOrderFilters() {
  return useQueryStates({
    search: parseAsString.withDefault(''),
    status: parseAsString.withDefault('all'),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(20),
    sortBy: parseAsString.withDefault('createdAt'),
    sortOrder: parseAsString.withDefault('desc'),
  });
}
```

---

## 4. Performance

### Bundle Splitting Strategy

1. **Route-based splitting**: Each route is a separate chunk (automatic with Next.js)
2. **Feature lazy loading**: Heavy features load on demand
3. **Component-level splitting**: Charts, rich text editors loaded when needed

```tsx
// Lazy load heavy components
const AnalyticsChart = lazy(() => import('./components/AnalyticsChart'));
const RichTextEditor = lazy(() => import('./components/RichTextEditor'));
```

### Table Virtualization

For large datasets (1000+ rows):

```tsx
// Using TanStack Virtual
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedTable({ data }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });
  
  // ... render only visible rows
}
```

### Avoiding Rerenders

1. **Memoization**: `React.memo` for expensive components
2. **Selector pattern**: Zustand selectors prevent unnecessary updates
3. **Stable references**: `useCallback` for handlers passed as props
4. **Key optimization**: Stable, unique keys for lists

### Performance Instrumentation

```tsx
// lib/performance/metrics.ts
import { onCLS, onFID, onLCP, onTTFB } from 'web-vitals';

export function initPerformanceMonitoring() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

// Custom "feels slow" metrics
export function measureInteraction(name: string, fn: () => Promise<void>) {
  const start = performance.now();
  return fn().finally(() => {
    const duration = performance.now() - start;
    if (duration > 100) {
      console.warn(`Slow interaction: ${name} took ${duration}ms`);
      sendToAnalytics({ name, duration, type: 'interaction' });
    }
  });
}
```

---

## 5. Developer Experience & Team Scaling

### Onboarding Engineers

1. **Architecture Decision Records (ADRs)**: Document why, not just what
2. **Storybook**: Visual component catalog with usage examples
3. **Scaffold scripts**: `npm run create:feature orders` generates folder structure
4. **Pair programming**: First PR reviewed live with senior engineer

### Enforced Conventions

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "import/order": ["error", { "groups": ["builtin", "external", "internal"] }],
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

### PR Template

```markdown
## What does this PR do?
Brief description...

## Type of change
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Docs

## Checklist
- [ ] Self-reviewed code
- [ ] Added/updated tests
- [ ] Updated Storybook (if UI change)
- [ ] Tested accessibility (keyboard, screen reader)
- [ ] No console errors/warnings
```

### Preventing One-Off UI

1. **Component library is the source of truth**: No inline styles for standard patterns
2. **Design review required**: UI changes need designer approval
3. **Storybook visual tests**: Catch unintended visual regressions
4. **Tailwind safelist**: Only approved utility classes in config

---

## 6. Testing Strategy

### What Gets Tested Where

| Level | What | Tools | Coverage Target |
|-------|------|-------|-----------------|
| Unit | Utils, hooks, validation | Vitest | 80% |
| Component | UI components in isolation | Vitest + Testing Library | Critical paths |
| Integration | Feature flows | Vitest + MSW | Happy paths + edge cases |
| E2E | Critical user journeys | Playwright | Smoke tests only |

### Minimum Before Moving Fast

1. **Unit tests for**: Validation logic, data transformations, utility functions
2. **Component tests for**: Form submission, error states, loading states
3. **E2E for**: Login, create funnel, complete order (critical paths only)

```tsx
// features/orders/api/__tests__/queries.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@/test/utils';
import { useOrders } from '../queries';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

test('useOrders returns order list', async () => {
  const { result } = renderHook(
    () => useOrders({ page: 1, pageSize: 20 }),
    { wrapper: createWrapper() }
  );
  
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(20);
});
```

---

## 7. Release & Quality

### Feature Flags

Using LaunchDarkly or custom implementation:

```tsx
// lib/feature-flags/index.ts
import { useFlags } from './provider';

export function useFeatureFlag(key: string): boolean {
  const flags = useFlags();
  return flags[key] ?? false;
}

// Usage
function AnalyticsDashboard() {
  const showNewCharts = useFeatureFlag('analytics-v2');
  
  return showNewCharts ? <NewCharts /> : <LegacyCharts />;
}
```

### Staged Rollouts

1. **Development**: All flags on
2. **Staging**: Match production flags
3. **Production**: 
   - Internal users first (1%)
   - Beta users (10%)
   - Gradual rollout (25% → 50% → 100%)

### Error Monitoring

```tsx
// lib/error-tracking/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});

// Error boundary wrapper
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error, componentStack) => {
        Sentry.captureException(error, { extra: { componentStack } });
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
```

### Ship Fast But Safe

| Strategy | Implementation |
|----------|----------------|
| CI/CD | GitHub Actions → Preview deploy → Staging → Production |
| Preview deploys | Every PR gets a preview URL (Vercel) |
| Canary releases | 1% traffic to new version, monitor errors |
| Rollback | One-click revert to previous deployment |
| Health checks | `/api/health` endpoint, Uptime monitoring |

---

## Summary

This architecture prioritizes:

1. **Team velocity**: Feature modules let engineers work independently
2. **Maintainability**: Clear boundaries, enforced conventions
3. **Performance**: Lazy loading, virtualization, measured metrics
4. **Accessibility**: Built-in from component layer up
5. **Pragmatism**: Start simple, add complexity when needed

The goal is a codebase that stays fast, consistent, and pleasant to work in as it grows from 1 to 10+ engineers.

---

*Written for Cartpanda Front-end Engineer assessment*
