# unstated-next-lib

TypeScript utilities and helpers for [`unstated-next`](https://github.com/jamiebuilds/unstated-next) state management.

## Installation

```sh
yarn add unstated-next-lib unstated-next react
```

## API

### `createContainer` (re-export)

Re-exported directly from `unstated-next`. Create a container from a custom hook:

```ts
import { createContainer } from 'unstated-next-lib';

interface Profile { firstName: string; lastName: string; }

function useProfileInternal(initialState?: Profile) {
  const [profile, setProfile] = useState<Profile>(initialState ?? { firstName: '', lastName: '' });
  return { profile, setProfile };
}

const container = createContainer(useProfileInternal);
export const ProfileProvider = container.Provider;
export const useProfile = container.useContainer;
```

### `createNamedContainer`

Like `createContainer`, but sets a `displayName` on the Provider for better React DevTools readability. Without this, every container's provider shows as `"Provider"` in the component tree.

```ts
import { createNamedContainer } from 'unstated-next-lib';

const { Provider: ProfileProvider, useContainer: useProfile } =
  createNamedContainer('Profile', useProfileInternal);
// ProfileProvider now shows as "ProfileProvider" in React DevTools
```

### `composeProviders`

Composes multiple provider components into a single wrapper, eliminating deeply-nested JSX. Providers are applied outermost-first (left to right).

```tsx
import { composeProviders } from 'unstated-next-lib';

// Before — deeply nested:
// <SnackbarProvider>
//   <ThemeProvider>
//     <RouterProvider>
//       {children}
//     </RouterProvider>
//   </ThemeProvider>
// </SnackbarProvider>

const AppProviders = composeProviders(SnackbarProvider, ThemeProvider, RouterProvider);

function App() {
  return <AppProviders><Routes /></AppProviders>;
}
```

> **Note:** `composeProviders` is suited for providers that don't require dynamic props at render time. For providers that need `initialState` computed from fetched data, continue to use JSX directly.

### Type utilities

```ts
import type { ContainerValue, ContainerState, TypedContainer } from 'unstated-next-lib';

const ProfileContainer = createContainer(useProfileInternal);

// Extract the hook's return type
type ProfileValue = ContainerValue<typeof ProfileContainer>;
// -> { profile: Profile; setProfile: Dispatch<SetStateAction<Profile>> }

// Extract the initialState type
type ProfileInitialState = ContainerState<typeof ProfileContainer>;
// -> Profile | undefined

// Type a variable that holds any container
function logContainer(c: TypedContainer<unknown>) { ... }
```

## Patterns from the field

Based on real-world usage, the recommended pattern for a container module is:

```ts
// src/core/data/profile/index.ts
import { useState } from 'react';
import { createNamedContainer } from 'unstated-next-lib';
import type { User } from 'core/types/user';

interface UseProfile {
  profile: User;
  update: (draft: Partial<User>) => Promise<void>;
}

function useProfileInternal(initialState?: User): UseProfile {
  const [profile, setProfile] = useState<User>(initialState ?? defaultUser);

  async function update(draft: Partial<User>) {
    const updated = await patchProfile(draft);
    setProfile(updated);
  }

  return { profile, update };
}

const { Provider: ProfileProvider, useContainer: useProfile } =
  createNamedContainer('Profile', useProfileInternal);

export { ProfileProvider };
export default useProfile;
```

## License

MIT
