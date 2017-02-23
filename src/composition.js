/**
 * Compose a set of functions from right to left, the first argument
 * will be the last function to be called in the composed function.
 *
 * @param {...Function}
 *
 * @returns {Function}
 */
export function compose(...fns) {
  return function (res) {
    let len = fns.length;
    while (len) {
      res = fns[len - 1](res); // eslint-disable-line no-param-reassign
      len--;
    }
    return res;
  };
}

/**
 * Compose a set of functions from left to right, the last argument
 * will be the first function to be called in the composed function.
 * Effectively the opposite of `compose`.
 *
 * @param {...Function}
 *
 * @returns {Function}
 */
export function sequence(...fns) {
  return function (res) {
    const len = fns.length;
    for (let i = 0; i < len; i++) {
      res = fns[i](res); // eslint-disable-line no-param-reassign
    }
    return res;
  };
}
