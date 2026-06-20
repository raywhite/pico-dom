import { inspect as _inspect } from 'util';

/**
 * We need to create elements throughout the tests with some
 * namespace URI, so we can use use the XHTML namespace (HTML5)
 * for this.
 */
export const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

/**
 * Returns a functions that appends to a string.
 */
export function append(d: number) {
  return function (r: string): string {
    return r + String(d);
  };
}

/**
 * Trims leading line whitespace from formatted markup.
 */
export function trim(str: string): string {
  return str.replace(/\n\s*/g, '');
}

/**
 * Stringify a JS object, infinitely deep.
 */
export function inspect(obj: unknown): string {
  return _inspect(obj, { depth: null });
}

/**
 * Count occurences of a substring.
 */
export function count(str: string, substr: string): number {
  const re = new RegExp(substr, 'g');
  return (str.match(re) || []).length;
}

/**
 * A no operation function.
 */
export function noop(): void {}
