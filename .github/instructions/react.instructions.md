---
applyTo: "**/react/**/*.tsx,**/react/**/*.jsx,**/components/**/*.tsx,**/components/**/*.jsx,**/app/**/*.tsx,**/pages/**/*.tsx"
---
# React Instructions

## Component design
- Use functional components with hooks. No class components.
- Keep components small and focused — one responsibility per component.
- Extract custom hooks for reusable logic.
- Co-locate related files: component, styles, tests, types.

## Naming
- `PascalCase` for component files and component names.
- `camelCase` for hooks (`useAuth`, `useFetch`).
- `camelCase` for utility functions and non-component modules.
- Props interfaces: `ComponentNameProps`.

## State management
- Start with local state (`useState`). Lift only when necessary.
- Use `useReducer` for complex state transitions.
- Use context for cross-cutting concerns, not for everything.
- For global state, use the project's established solution (Redux, Zustand, Jotai, etc.).

## Performance
- Avoid unnecessary re-renders: memoize with `React.memo`, `useMemo`, `useCallback` where profiling shows benefit.
- Do not prematurely optimize — measure first.
- Use lazy loading (`React.lazy` + `Suspense`) for route-level code splitting.
- Virtualize long lists.

## Side effects
- Keep effects minimal and well-scoped.
- Always specify dependency arrays accurately.
- Clean up subscriptions, timers, and listeners in effect cleanup.

## Accessibility
- Use semantic HTML elements.
- Provide `aria-*` attributes when semantic HTML is insufficient.
- Ensure keyboard navigation works.
- Test with screen reader considerations.

## Testing
- Test behavior from the user's perspective.
- Use React Testing Library — avoid testing implementation details.
- Test user interactions, not internal state.
- Mock API calls, not components.
