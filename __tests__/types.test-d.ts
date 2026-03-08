// Type-only test file. Processed by `vitest typecheck` / `yarn test:types`.
// Nothing here executes at runtime — all assertions are compile-time checks.

import { describe, it, expectTypeOf } from 'vitest';
import { createContainer } from 'unstated-next';
import { createNamedContainer } from '../src/create-named-container';
import type {
  ContainerValue,
  ContainerState,
  TypedContainer,
} from '../src/types';
import type { AnyProvider } from '../src/compose-providers';
import type { ComponentType, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Fixture types and hooks
// ---------------------------------------------------------------------------

interface User { id: number; name: string; }
interface Theme { mode: 'light' | 'dark'; }

function useUser(initialState?: User) {
  return initialState ?? { id: 0, name: 'anonymous' };
}

function useTheme(initialState?: Theme) {
  return initialState ?? ({ mode: 'light' } as Theme);
}

function useCount(initialState = 0) {
  return { value: initialState, doubled: initialState * 2 };
}

const UserContainer = createContainer(useUser);
const ThemeContainer = createContainer(useTheme);
const CountContainer = createNamedContainer('Count', useCount);

// ---------------------------------------------------------------------------

describe('ContainerValue', () => {
  it('extracts the hook return type', () => {
    type V = ContainerValue<typeof UserContainer>;
    expectTypeOf<V>().toEqualTypeOf<User>();
  });

  it('extracts a composite return type', () => {
    type V = ContainerValue<typeof CountContainer>;
    expectTypeOf<V>().toEqualTypeOf<{ value: number; doubled: number }>();
  });

  it('returns never when useContainer is missing', () => {
    type V = ContainerValue<{ Provider: ComponentType<{ children: ReactNode }> }>;
    expectTypeOf<V>().toBeNever();
  });

  it('returns never for primitive types', () => {
    expectTypeOf<ContainerValue<string>>().toBeNever();
    expectTypeOf<ContainerValue<number>>().toBeNever();
    expectTypeOf<ContainerValue<null>>().toBeNever();
  });

  it('works when useContainer returns a union type', () => {
    const c = createContainer((): 'yes' | 42 => 'yes');
    type V = ContainerValue<typeof c>;
    expectTypeOf<V>().toEqualTypeOf<'yes' | 42>();
  });

  it('extracts the value type from createNamedContainer result', () => {
    type V = ContainerValue<typeof ThemeContainer>;
    expectTypeOf<V>().toEqualTypeOf<Theme>();
  });
});

describe('ContainerState', () => {
  it('extracts the initialState type', () => {
    type S = ContainerState<typeof UserContainer>;
    expectTypeOf<S>().toEqualTypeOf<User>();
  });

  it('extracts void for a zero-argument hook', () => {
    function useSimple() { return 'hello'; }
    const c = createContainer(useSimple);
    type S = ContainerState<typeof c>;
    // State defaults to void
    expectTypeOf<S>().toEqualTypeOf<void>();
  });

  it('returns never when Provider is missing', () => {
    type S = ContainerState<{ useContainer: () => string }>;
    expectTypeOf<S>().toBeNever();
  });

  it('returns never for primitive types', () => {
    expectTypeOf<ContainerState<string>>().toBeNever();
  });

  it('preserves union state types', () => {
    const c = createContainer((s?: string | number) => s ?? '');
    type S = ContainerState<typeof c>;
    expectTypeOf<S>().toEqualTypeOf<string | number>();
  });
});

describe('TypedContainer', () => {
  it('is assignable from a createContainer result', () => {
    expectTypeOf(UserContainer).toMatchTypeOf<TypedContainer<User, User>>();
  });

  it('useContainer return type matches the Value generic', () => {
    type TC = TypedContainer<{ count: number }, void>;
    expectTypeOf<ReturnType<TC['useContainer']>>().toEqualTypeOf<{ count: number }>();
  });

  it('Provider initialState type matches the State generic', () => {
    type TC = TypedContainer<string, number>;
    type Props = TC['Provider'] extends ComponentType<infer P> ? P : never;
    type InitialState = Props extends { initialState?: infer S } ? S : never;
    expectTypeOf<InitialState>().toEqualTypeOf<number>();
  });

  it('State defaults to void when not supplied', () => {
    type TC = TypedContainer<string>;
    type Props = TC['Provider'] extends ComponentType<infer P> ? P : never;
    type InitialState = Props extends { initialState?: infer S } ? S : never;
    expectTypeOf<InitialState>().toEqualTypeOf<void>();
  });

  it('TypedContainer<string> is not assignable to TypedContainer<number>', () => {
    type IsAssignable<A, B> = A extends B ? true : false;
    type Result = IsAssignable<TypedContainer<string>, TypedContainer<number>>;
    expectTypeOf<Result>().toEqualTypeOf<false>();
  });

  it('is assignable from a createNamedContainer result', () => {
    expectTypeOf(CountContainer).toMatchTypeOf<
      TypedContainer<{ value: number; doubled: number }, number>
    >();
  });
});

describe('AnyProvider', () => {
  it('accepts a component that takes only children', () => {
    function SimpleProvider({ children }: { children?: ReactNode }) {
      return children as never;
    }
    expectTypeOf(SimpleProvider).toMatchTypeOf<AnyProvider>();
  });

  it('accepts a component with additional typed props', () => {
    function WithProps({ children }: { children?: ReactNode; initialState?: number }) {
      return children as never;
    }
    expectTypeOf(WithProps).toMatchTypeOf<AnyProvider<{ initialState?: number }>>();
  });

  it('the default generic is Record<string, unknown>', () => {
    expectTypeOf<AnyProvider>().toEqualTypeOf<AnyProvider<Record<string, unknown>>>();
  });
});

describe('createNamedContainer return type', () => {
  it('infers Value from the hook return type', () => {
    const c = createNamedContainer('Count', useCount);
    type V = ContainerValue<typeof c>;
    expectTypeOf<V>().toEqualTypeOf<{ value: number; doubled: number }>();
  });

  it('infers State from the hook parameter type', () => {
    const c = createNamedContainer('User', useUser);
    type S = ContainerState<typeof c>;
    expectTypeOf<S>().toEqualTypeOf<User>();
  });

  it('is assignable to TypedContainer with matching generics', () => {
    const c = createNamedContainer('Theme', useTheme);
    expectTypeOf(c).toMatchTypeOf<TypedContainer<Theme, Theme>>();
  });
});
