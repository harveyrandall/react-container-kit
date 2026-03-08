// Re-export the core unstated-next API so consumers only need this package
export { createContainer } from 'unstated-next';
export type { Container } from 'unstated-next';

// Enhanced container factory with React DevTools displayName support
export { createNamedContainer } from './create-named-container';

// Provider composition utility
export { composeProviders } from './compose-providers';
export type { AnyProvider } from './compose-providers';

// TypeScript utility types for working with containers
export type { ContainerValue, ContainerState, TypedContainer } from './types';
