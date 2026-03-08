import { createElement, type ComponentType, type ReactElement, type ReactNode } from 'react';

/**
 * Any React component that accepts children and optional additional props.
 */
export type AnyProvider<P extends Record<string, unknown> = Record<string, unknown>> =
  ComponentType<P & { children?: ReactNode }>;

/**
 * Composes multiple provider components into a single wrapper component.
 * Providers are applied outermost-first (left to right in the argument list).
 *
 * This eliminates the deeply-nested JSX pattern common when multiple
 * unstated-next containers need to wrap the same subtree.
 *
 * @example
 * // Before: deeply nested JSX
 * <SnackbarProvider>
 *   <ProfileProvider initialState={profile}>
 *     <OrganizationProvider initialState={org}>
 *       {children}
 *     </OrganizationProvider>
 *   </ProfileProvider>
 * </SnackbarProvider>
 *
 * // After: compose providers without dynamic props
 * const AppProviders = composeProviders(
 *   SnackbarProvider,
 *   ThemeProvider,
 *   RouterProvider,
 * );
 * // <AppProviders>{children}</AppProviders>
 */
export function composeProviders(
  ...providers: ComponentType<{ children?: ReactNode }>[]
): ComponentType<{ children?: ReactNode }> {
  function ComposedProviders({ children }: { children?: ReactNode }): ReactElement {
    return providers.reduceRight<ReactElement>(
      (child, Provider) => createElement(Provider, null, child),
      children as ReactElement,
    );
  }

  ComposedProviders.displayName = `ComposedProviders(${providers
    .map((p) => p.displayName || p.name || 'Unknown')
    .join(', ')})`;

  return ComposedProviders;
}
