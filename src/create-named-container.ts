import { createContainer } from 'unstated-next';

/**
 * Creates an unstated-next container and sets a displayName on the Provider
 * for improved React DevTools readability.
 *
 * Without a displayName, every container's Provider appears as "Provider" in
 * the React component tree. This wrapper names it "<name>Provider" so that
 * e.g. `createNamedContainer('Profile', useProfile)` shows as "ProfileProvider"
 * in DevTools.
 *
 * @example
 * // Instead of:
 * const container = createContainer(useProfile);
 * export const ProfileProvider = container.Provider; // shows as "Provider" in DevTools
 * export const useProfile = container.useContainer;
 *
 * // Use:
 * const { Provider: ProfileProvider, useContainer: useProfile } =
 *   createNamedContainer('Profile', useProfile);
 * // ProfileProvider now shows as "ProfileProvider" in DevTools
 */
export function createNamedContainer<Value, State = void>(
  name: string,
  useHook: (initialState?: State) => Value,
) {
  const container = createContainer<Value, State>(useHook);
  container.Provider.displayName = `${name}Provider`;
  return container;
}
