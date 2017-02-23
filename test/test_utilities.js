import { inspect as _inspect } from 'util';
/**
 * We need to create elements throughout the tests with some
 * namespace URI, so we can use use the XHTML namespace (HTML5)
 * for this.
 */
export const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

/**
 * Returns a functions that appends to a string.
 *
 * @param {Number} some digit(s)
 *
 * @returns {Function}
 */
export function append(d) {
  /**
   * @param {String}
   *
   * @returns {String}
   */
  return function (r) {
    return r + String(d);
  };
}

/**
 * Trims leading line whitespace from formatted markup.
 *
 * @param {String} markup
 *
 * @returns {String} trimmed markup
 */
export function trim(str) {
  return str.replace(/\n\s*/g, '');
}

/**
 * Stringify a JS object, infinitely deep.
 *
 * @param {Object}
 *
 * @returns {String}
 */
export function inspect(obj) {
  return _inspect(obj, { depth: null });
}

/**
 * Count occurences of a substring.
 *
 * @param {String}
 *
 * @returns {Number} the occurences
 */
export function count(str, substr) {
  const re = new RegExp(substr, 'g');
  return (str.match(re) || []).length;
}

/**
 * A no operation function.
 *
 * @returns {Void}
 */
export function noop() {}
