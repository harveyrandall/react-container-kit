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

## In depth - When and why to use this package

### `createNamedContainer`

React DevTools identifies components in the tree by their `displayName`. Without it, every container's provider renders as the generic label `"Provider"` — in an app with several containers, the component tree becomes a wall of identical entries that tells you nothing about which context is which.

`createNamedContainer` is a drop-in replacement for `createContainer` that accepts a name as its first argument and uses it to label the provider in DevTools. Pass `'Profile'` and the provider appears as `"ProfileProvider"`, matching the naming convention used by libraries like React Router and React Query. The returned container is otherwise identical in shape: the same `{ Provider, useContainer }` pair, the same TypeScript generics, the same `initialState` support.

The name also surfaces in error messages. When `useContainer` is called outside its provider, React includes the component name in the error, so `"ProfileProvider"` in the stack trace points you directly to the missing wrapper rather than leaving you to work out which of your many `"Provider"` components is absent.

Use `createNamedContainer` by default for all containers — there is no downside, and the DevTools clarity pays off immediately once your component tree grows beyond a handful of providers.

### `composeProviders`

As an application grows, it is common for many providers to wrap the same subtree. Three containers already requires three levels of JSX nesting; a real app with auth, theming, routing, snackbars, and feature flags can easily reach ten. This nesting is structural boilerplate — it adds indentation and diff noise without conveying any intent.

`composeProviders(...providers)` collapses any number of provider components into a single wrapper. The order is outermost-first, reading left to right: `composeProviders(A, B, C)` is equivalent to `<A><B><C>{children}</C></B></A>`. The resulting component is assigned a `displayName` derived from its members, so DevTools shows the composition rather than hiding it.

The constraint to keep in mind: `composeProviders` renders each provider with only `children` — no other props. It is the right tool for providers that are self-contained and initialise from module-level config or internal defaults (themes, routing, snackbars, analytics). For providers that need `initialState` derived from runtime data — for example, seeding a user container after an auth response — keep those in JSX where you can pass the prop directly. In practice, one or two dynamic providers in JSX alongside a single `AppProviders = composeProviders(...)` is the common pattern.

### Type utilities

**`ContainerValue<C>`** extracts the return type of a container's `useContainer` — the value your hook hands to consuming components. This lets you name and reuse that type across your codebase without importing or re-declaring the hook. It is the canonical way to derive types from a container while keeping its internals encapsulated.

```ts
type ProfileValue = ContainerValue<typeof ProfileContainer>;
// -> { profile: Profile; setProfile: Dispatch<SetStateAction<Profile>> }
```

**`ContainerState<C>`** extracts the `initialState` prop type from a container's `Provider`. Useful when writing test helpers or factory functions that need to accept or pass `initialState` without reaching into the container's hook directly.

```ts
type ProfileInitialState = ContainerState<typeof ProfileContainer>;
// -> Profile
```

**`TypedContainer<Value, State>`** is a structural interface describing the shape every container conforms to: a `Provider` component and a `useContainer` hook. Use it to type function parameters or variables that should accept any container without coupling to a specific one.

```ts
function wrapContainer<V>(container: TypedContainer<V>) { ... }
```

**`AnyProvider<P>`** types any React component that accepts `children` plus any additional props `P`. Useful when building utilities that work with arbitrary provider components, regardless of their own prop requirements.

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
