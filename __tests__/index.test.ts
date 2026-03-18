/**
 * Public API smoke tests — verify that all named exports from src/index.ts
 * are present and callable. These tests are intentionally thin: the
 * behavioural contracts are covered in the feature-specific test files.
 */

import { describe, it, expect } from 'vitest';
import {
  createContainer,
  createNamedContainer,
  composeProviders,
} from '../src/index';

describe('public API exports', () => {
  it('exports createContainer from unstated-next', () => {
    expect(typeof createContainer).toBe('function');
  });

  it('exports createNamedContainer', () => {
    expect(typeof createNamedContainer).toBe('function');
  });

  it('exports composeProviders', () => {
    expect(typeof composeProviders).toBe('function');
  });

  it('createContainer is the same reference as the unstated-next original', async () => {
    const { createContainer: original } = await import('unstated-next');
    expect(createContainer).toBe(original);
  });

  it('createNamedContainer returns an object with Provider and useContainer', () => {
    function useValue() { return 42; }
    const container = createNamedContainer('Test', useValue);
    expect(container).toHaveProperty('Provider');
    expect(container).toHaveProperty('useContainer');
    expect(typeof container.Provider).toBe('function');
    expect(typeof container.useContainer).toBe('function');
  });

  it('composeProviders returns a function (the composed component)', () => {
    function useA() { return 'a'; }
    const A = createNamedContainer('A', useA);
    const Composed = composeProviders(A.Provider);
    expect(typeof Composed).toBe('function');
  });
});
