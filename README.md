# react-container-kit

TypeScript utilities for the React container pattern — named containers, provider composition, and type helpers. Built on top of [`unstated-next`](https://github.com/jamiebuilds/unstated-next).

## Installation

```sh
yarn add react-container-kit unstated-next react
```

## API

### `createContainer` (re-export)

Re-exported directly from `unstated-next`. Create a container from a custom hook:

```ts
import { createContainer } from 'react-container-kit';

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
import { createNamedContainer } from 'react-container-kit';

const { Provider: ProfileProvider, useContainer: useProfile } =
  createNamedContainer('Profile', useProfileInternal);
// ProfileProvider now shows as "ProfileProvider" in React DevTools
```

### `composeProviders`

Composes multiple provider components into a single wrapper, eliminating deeply-nested JSX. Providers are applied outermost-first (left to right).

```tsx
import { composeProviders } from 'react-container-kit';

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
import type { ContainerValue, ContainerState, TypedContainer } from 'react-container-kit';

const ProfileContainer = createContainer(useProfileInternal);

// Extract the hook's return type
type ProfileValue = ContainerValue<typeof ProfileContainer>;
// -> { profile: Profile; setProfile: Dispatch<SetStateAction<Profile>> }

// Extract the initialState type
type ProfileInitialState = ContainerState<typeof ProfileContainer>;
// -> Profile

// Type a variable that holds any container
function logContainer(c: TypedContainer<unknown>) { ... }
```

## Patterns from the field

Based on real-world usage, the recommended pattern for a container module is:

<!-- markdownlint-disable-next-line MD033 -->
<details>
  <!-- markdownlint-disable-next-line MD033 -->
  <summary>See types defined for <code>User</code> example below.</summary>

For the purposes of this example the types are deifind in one file shown below.

In a production ready application these types would be defined `common`/`shared` folders and `Locale` would be in an `i18n` related file. The files don't _only_ relate to the `User` interfaceb but for the purposes of this example they do.

```ts
// src/core/types/user.ts

export interface Media {
  id?: string;
  url: string;
}

export enum UserState {
  DELETED = 'DELETED',
  BLOCKED = 'BLOCKED',
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
}

export enum UserType {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  type: UserType;
  state: UserState;
  email: string;
  phone?: string;
  profilePicture?: Media;
}
```

</details>

```ts
// src/core/data/profile/index.ts
import { useState } from 'react';
import { createNamedContainer } from 'react-container-kit';
import type { User } from 'core/types/user';

export type ProfileDraft = Pick<User, 'firstName' | 'lastName' | 'phone' | 'language'>;

const defaultUser: User = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  type: UserType.USER,
  state: UserState.ACTIVE,
};

interface UseProfile {
  profile: User;
  update: (draft: ProfileDraft) => Promise<void>;
}

function useProfileInternal(initialState?: User): UseProfile {
  const [profile, setProfile] = useState<User>(initialState || defaultUser);

  async function update(draft: ProfileDraft) {
    try {
      const res = await updateProfile(draft);
      setProfile(res);
      return res;
    } catch (e) {
      console.error(e);
    }

    return undefined;
  }

  return { profile, update };
}

const { Provider: ProfileProvider, useContainer: useProfile } =
  createNamedContainer('Profile', useProfileInternal);

export { ProfileProvider };
export default useProfile;
```

## Tests

The test suite uses [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and [happy-dom](https://github.com/capricorn86/happy-dom) for the DOM environment. Compile-time type assertions are validated separately with `tsc`.

Run the suite:

```sh
yarn test              # vitest run (all runtime tests)
yarn test:types        # tsc --noEmit on *.test-d.ts files
yarn test:coverage     # vitest with v8 coverage
```

### Test files

| File | Description | Tests | Coverage |
|---|---|---|---|
| `__tests__/create-named-container.test.ts` | Return shape, `displayName` assignment, `useContainer` integration, container independence | 14 | 100% |
| `__tests__/compose-providers.test.ts` | Return value, provider ordering, context chaining, children rendering, edge cases | 18 | 100% |
| `__tests__/index.test.ts` | Public API export presence and basic callability | 6 | — |
| `__tests__/types.test-d.ts` | Compile-time assertions for `ContainerValue`, `ContainerState`, `TypedContainer`, `AnyProvider` | 21 | — |

**Total: 38 runtime tests passing · 100% statement/branch/function/line coverage on runtime source**

## License

MIT
