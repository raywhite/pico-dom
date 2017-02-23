import { inspect as _inspect } from 'util';

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
