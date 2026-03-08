import { createElement } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createNamedContainer } from '../src/create-named-container';

// Deterministic fixture — no useState, so no act() wrapping needed.
function useCounter(initialState = 0) {
  return initialState + 1;
}

function useStringValue(initialState?: string) {
  return initialState ?? 'default';
}

// ---------------------------------------------------------------------------

describe('createNamedContainer', () => {
  describe('return shape', () => {
    it('returns an object with a Provider component', () => {
      const container = createNamedContainer('Counter', useCounter);
      expect(typeof container.Provider).toBe('function');
    });

    it('returns an object with a useContainer hook', () => {
      const container = createNamedContainer('Counter', useCounter);
      expect(typeof container.useContainer).toBe('function');
    });

    it('has exactly Provider and useContainer as keys', () => {
      const container = createNamedContainer('Counter', useCounter);
      expect(Object.keys(container).sort()).toEqual(['Provider', 'useContainer'].sort());
    });
  });

  describe('displayName', () => {
    it('sets displayName to "${name}Provider"', () => {
      const container = createNamedContainer('Profile', useStringValue);
      expect(container.Provider.displayName).toBe('ProfileProvider');
    });

    it('appends Provider to the exact name supplied', () => {
      const container = createNamedContainer('MyComplexState', useCounter);
      expect(container.Provider.displayName).toBe('MyComplexStateProvider');
    });

    it('handles a single-character name', () => {
      const container = createNamedContainer('X', useCounter);
      expect(container.Provider.displayName).toBe('XProvider');
    });

    it('handles a name with spaces (no sanitisation — appends verbatim)', () => {
      const container = createNamedContainer('My State', useCounter);
      expect(container.Provider.displayName).toBe('My StateProvider');
    });

    it('empty string name produces "Provider"', () => {
      const container = createNamedContainer('', useCounter);
      expect(container.Provider.displayName).toBe('Provider');
    });
  });

  describe('useContainer integration', () => {
    it('returns the value produced by the hook with no initialState', () => {
      const container = createNamedContainer('Counter', useCounter);
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(container.Provider, null, children);

      const { result } = renderHook(() => container.useContainer(), { wrapper });
      // useCounter(undefined) → default 0 + 1 = 1
      expect(result.current).toBe(1);
    });

    it('passes initialState through to the hook', () => {
      const container = createNamedContainer('Counter', useCounter);
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(container.Provider, { initialState: 10 }, children);

      const { result } = renderHook(() => container.useContainer(), { wrapper });
      // useCounter(10) = 11
      expect(result.current).toBe(11);
    });

    it('throws when useContainer is called outside a Provider', () => {
      const container = createNamedContainer('Counter', useCounter);
      expect(() => renderHook(() => container.useContainer())).toThrow();
    });

    it('returns a complex object value correctly', () => {
      function useData() {
        return { count: 42, label: 'hello' };
      }
      const container = createNamedContainer('Data', useData);
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(container.Provider, null, children);

      const { result } = renderHook(() => container.useContainer(), { wrapper });
      expect(result.current).toEqual({ count: 42, label: 'hello' });
    });
  });

  describe('multiple containers are independent', () => {
    it('two containers with the same name do not share state', () => {
      const A = createNamedContainer('Counter', useCounter);
      const B = createNamedContainer('Counter', useCounter);

      const wrapperA = ({ children }: { children: React.ReactNode }) =>
        createElement(A.Provider, { initialState: 0 }, children);
      const wrapperB = ({ children }: { children: React.ReactNode }) =>
        createElement(B.Provider, { initialState: 99 }, children);

      const { result: resultA } = renderHook(() => A.useContainer(), { wrapper: wrapperA });
      const { result: resultB } = renderHook(() => B.useContainer(), { wrapper: wrapperB });

      expect(resultA.current).toBe(1);   // useCounter(0) = 1
      expect(resultB.current).toBe(100); // useCounter(99) = 100
    });

    it('displayName on one container does not affect the other', () => {
      const A = createNamedContainer('Foo', useCounter);
      const B = createNamedContainer('Bar', useCounter);
      expect(A.Provider.displayName).toBe('FooProvider');
      expect(B.Provider.displayName).toBe('BarProvider');
    });
  });
});
