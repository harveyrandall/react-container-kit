import { createElement, createContext, useContext, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { composeProviders } from '../src/compose-providers';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

// Builds a simple provider that logs its name on each render, letting tests
// verify the order providers are mounted (outermost first).
function makeRenderLogProvider(name: string, log: string[]) {
  function LoggingProvider({ children }: { children?: ReactNode }) {
    log.push(name);
    return createElement('div', { 'data-provider': name }, children);
  }
  LoggingProvider.displayName = `${name}Provider`;
  return LoggingProvider;
}

// Context/provider pair used in ordering and integration tests.
const ThemeContext = createContext<string>('light');
function ThemeProvider({ children }: { children?: ReactNode }) {
  return createElement(ThemeContext.Provider, { value: 'dark' }, children);
}
ThemeProvider.displayName = 'ThemeProvider';

const LangContext = createContext<string>('en');
function LangProvider({ children }: { children?: ReactNode }) {
  return createElement(LangContext.Provider, { value: 'fr' }, children);
}
LangProvider.displayName = 'LangProvider';

// ---------------------------------------------------------------------------

describe('composeProviders', () => {
  describe('return value', () => {
    it('returns a React component (a function)', () => {
      const Composed = composeProviders();
      expect(typeof Composed).toBe('function');
    });

    it('the returned component renders without crashing', () => {
      const Composed = composeProviders();
      expect(() => render(createElement(Composed, null))).not.toThrow();
    });
  });

  describe('displayName', () => {
    it('uses the ComposedProviders(...) format listing all names', () => {
      const Composed = composeProviders(ThemeProvider, LangProvider);
      expect(Composed.displayName).toBe('ComposedProviders(ThemeProvider, LangProvider)');
    });

    it('prefers displayName over .name', () => {
      function NamedFn({ children }: { children?: ReactNode }) {
        return createElement('div', null, children);
      }
      NamedFn.displayName = 'ExplicitDisplay';
      const Composed = composeProviders(NamedFn);
      expect(Composed.displayName).toBe('ComposedProviders(ExplicitDisplay)');
    });

    it('falls back to .name when displayName is absent', () => {
      function UnnamedDisplayProvider({ children }: { children?: ReactNode }) {
        return createElement('div', null, children);
      }
      const Composed = composeProviders(UnnamedDisplayProvider);
      expect(Composed.displayName).toBe('ComposedProviders(UnnamedDisplayProvider)');
    });

    it('falls back to "Unknown" when both displayName and name are empty', () => {
      const anonProvider = Object.assign(
        ({ children }: { children?: ReactNode }) => createElement('div', null, children),
        { displayName: undefined as string | undefined },
      );
      Object.defineProperty(anonProvider, 'name', { value: '' });
      const Composed = composeProviders(anonProvider);
      expect(Composed.displayName).toBe('ComposedProviders(Unknown)');
    });

    it('zero providers produces "ComposedProviders()"', () => {
      const Composed = composeProviders();
      expect(Composed.displayName).toBe('ComposedProviders()');
    });

    it('single provider is listed correctly', () => {
      const Composed = composeProviders(ThemeProvider);
      expect(Composed.displayName).toBe('ComposedProviders(ThemeProvider)');
    });

    it('three providers are comma-separated', () => {
      const A = Object.assign(
        ({ children }: { children?: ReactNode }) => createElement('div', null, children),
        { displayName: 'A' },
      );
      const B = Object.assign(
        ({ children }: { children?: ReactNode }) => createElement('div', null, children),
        { displayName: 'B' },
      );
      const Composed = composeProviders(ThemeProvider, A, B);
      expect(Composed.displayName).toBe('ComposedProviders(ThemeProvider, A, B)');
    });
  });

  describe('provider ordering invariant — first argument is outermost', () => {
    it('renders providers in outermost-first order (via render log)', () => {
      const log: string[] = [];
      const A = makeRenderLogProvider('A', log);
      const B = makeRenderLogProvider('B', log);
      const C = makeRenderLogProvider('C', log);
      render(createElement(composeProviders(A, B, C), null, null));
      // A mounts first (outermost), then B, then C (innermost).
      expect(log).toEqual(['A', 'B', 'C']);
    });

    it('provides context values to children from both outer and inner providers', () => {
      const Composed = composeProviders(ThemeProvider, LangProvider);

      function Consumer() {
        return createElement('div', {
          'data-theme': useContext(ThemeContext),
          'data-lang': useContext(LangContext),
        });
      }

      const { container } = render(
        createElement(Composed, null, createElement(Consumer, null)),
      );
      const div = container.querySelector('[data-theme]')!;
      expect(div.getAttribute('data-theme')).toBe('dark');
      expect(div.getAttribute('data-lang')).toBe('fr');
    });

    it('an inner provider can read context set by an outer provider', () => {
      // OuterProvider injects value 42. InnerProvider reads it and doubles it.
      // Consumer sees 84, confirming Outer wraps Inner (not the reverse).
      const ValueContext = createContext(0);

      function OuterProvider({ children }: { children?: ReactNode }) {
        return createElement(ValueContext.Provider, { value: 42 }, children);
      }

      function InnerProvider({ children }: { children?: ReactNode }) {
        const outer = useContext(ValueContext);
        return createElement(ValueContext.Provider, { value: outer * 2 }, children);
      }

      function Consumer() {
        return createElement('span', { 'data-value': useContext(ValueContext) });
      }

      const Composed = composeProviders(OuterProvider, InnerProvider);
      const { container } = render(
        createElement(Composed, null, createElement(Consumer, null)),
      );
      expect(container.querySelector('span')!.getAttribute('data-value')).toBe('84');
    });

    it('produces the same tree as explicit JSX nesting', () => {
      const Composed = composeProviders(ThemeProvider, LangProvider);

      function Consumer() {
        return createElement('span', {
          'data-theme': useContext(ThemeContext),
          'data-lang': useContext(LangContext),
        });
      }

      const { container: composedContainer } = render(
        createElement(Composed, null, createElement(Consumer, null)),
      );
      // Manual nesting for comparison
      const { container: manualContainer } = render(
        createElement(ThemeProvider, null,
          createElement(LangProvider, null,
            createElement(Consumer, null),
          ),
        ),
      );

      const composed = composedContainer.querySelector('span')!;
      const manual = manualContainer.querySelector('span')!;
      expect(composed.getAttribute('data-theme')).toBe(manual.getAttribute('data-theme'));
      expect(composed.getAttribute('data-lang')).toBe(manual.getAttribute('data-lang'));
    });
  });

  describe('children rendering', () => {
    it('renders text children correctly', () => {
      const Composed = composeProviders(ThemeProvider);
      render(
        createElement(Composed, null,
          createElement('span', { 'data-testid': 'child' }, 'hello'),
        ),
      );
      expect(screen.getByTestId('child').textContent).toBe('hello');
    });

    it('renders without children without crashing', () => {
      const Composed = composeProviders(ThemeProvider);
      expect(() => render(createElement(Composed, null))).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('zero providers renders children directly', () => {
      const Composed = composeProviders();
      render(
        createElement(Composed, null,
          createElement('span', { 'data-testid': 'bare' }, 'bare'),
        ),
      );
      expect(screen.getByTestId('bare').textContent).toBe('bare');
    });

    it('the same provider passed twice creates two independent instances', () => {
      let renderCount = 0;
      function CountingProvider({ children }: { children?: ReactNode }) {
        renderCount++;
        return createElement('div', null, children);
      }
      CountingProvider.displayName = 'CountingProvider';

      const Composed = composeProviders(CountingProvider, CountingProvider);
      render(createElement(Composed, null, null));
      expect(renderCount).toBe(2);
    });

    it('1000 providers do not cause a stack overflow', () => {
      const providers = Array.from({ length: 1000 }, (_, i) => {
        const p = ({ children }: { children?: ReactNode }) =>
          createElement('span', null, children);
        Object.defineProperty(p, 'name', { value: `P${i}` });
        return p as React.ComponentType<{ children?: ReactNode }>;
      });

      const Composed = composeProviders(...providers);
      expect(() =>
        render(createElement(Composed, null, createElement('span', null, 'deep'))),
      ).not.toThrow();
    });
  });
});
