import type { Node } from '../src/types.ts';

/**
 * Test-only JSX typings for the classic runtime (`jsxFactory: adapter.createNode`).
 * The element type produced IS pico-dom's `Node`. This lives with the tests, not
 * in `src`, so it is NOT shipped: a global `JSX` augmentation in the published
 * types would collide with a consumer's own JSX-bearing dependency (the binding
 * belongs in the actual JSX consumer, e.g. @raywhite/markup). Intrinsic elements
 * accept arbitrary props since `createNode` coerces any attribute to a string.
 */
declare global {
  namespace JSX {
    type Element = Node;
    interface ElementChildrenAttribute {
      children: object;
    }
    interface IntrinsicElements {
      [tagName: string]: Record<string, unknown>;
    }
  }
}
