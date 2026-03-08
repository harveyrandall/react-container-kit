import type { ComponentType, ReactNode } from 'react';

/**
 * Extracts the value (return type of useContainer) from a container.
 *
 * @example
 * const SnackbarContainer = createContainer(useSnackbar);
 * type SnackbarValue = ContainerValue<typeof SnackbarContainer>;
 * // -> [Queue, SnackbarState]
 */
export type ContainerValue<C> = C extends { useContainer: () => infer V } ? V : never;

/**
 * Extracts the initialState type from a container's Provider.
 *
 * @example
 * const ProfileContainer = createContainer(useProfile);
 * type ProfileState = ContainerState<typeof ProfileContainer>;
 * // -> User
 */
export type ContainerState<C> =
  C extends { Provider: ComponentType<infer P> }
    ? P extends { initialState?: infer S }
      ? S
      : never
    : never;

/**
 * A fully-typed container shape returned by createContainer.
 * Useful for typing variables that hold any container.
 *
 * @example
 * function wrapContainer<V, S>(container: TypedContainer<V, S>) { ... }
 */
export interface TypedContainer<Value, State = void> {
  Provider: ComponentType<{
    initialState?: State;
    children: ReactNode;
  }>;
  useContainer: () => Value;
}
