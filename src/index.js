import {
  parseFragment,
  parse as _parse,
  serialize,
} from 'parse5';

import { compose, sequence } from './composition.js';
import { adapter } from './manipulation.js';

/**
 * We only want to deal with models in the the htmlparser2 format -
 * wrapping the parse and serializer functions allows us to
 * only expost that.
 */
const OPTIONS = { treeAdapter: adapter };

/**
 * @param {String} some markup
 *
 * TODO: Needs tests for support of parsing as a document.
 *
 * @returns {Object} document model
 */
function parse(doc, markup) {
  // A markup string was passed as the only argument - default.
  if (typeof doc === 'string') {
    return parseFragment(doc, OPTIONS);
  }

  // A doc options was passed.
  if (typeof doc === 'boolean') {
    // Parse as a document.
    if (doc) return _parse(markup, OPTIONS);

    // Parse as a document fragment.
    return parseFragment(markup, OPTIONS);
  }
}

/**
 * @param {String} a document model
 *
 * @returns {Object} some markup
 */
function stringify(model) {
  return serialize(model, OPTIONS);
}

const map = (function () {
  /**
   * Prepend the provided nodes to the array of child nodes
   * for the `parentNode`.
   *
   * @param {Object} the parent node
   * @param {Object|Array} the new child node(s)
   *
   * @returns {Void}
   */
  function prepend(parentNode, newNode) {
    const children = adapter.getChildNodes(parentNode);
    if (!Array.isArray(newNode)) {
      if (newNode === null) return;
      children.length ? // eslint-disable-line no-unused-expressions
        adapter.insertBefore(parentNode, newNode, children[0]) :
        adapter.appendChild(parentNode, newNode);

      return;
    }

    let len = newNode.length;
    while (len) {
      const _newNode = newNode[len - 1];
      if (_newNode === null) {
        len--;
        continue; // eslint-disable-line no-continue
      }

      children.length ? // eslint-disable-line no-unused-expressions
        adapter.insertBefore(parentNode, _newNode, children[0]) :
        adapter.appendChild(parentNode, _newNode);

      len--;
    }

    return;
  }

  /**
   * Recurses the provided document (or document fragment) tree
   * and passes each node into the provided callback. The output
   * of the callback replaces that node, or where it is `null`,
   * that node is deleted.
   *
   * @param {Function} the callback function
   * @param {Object} the node or dom to be mapped
   *
   * @returns {Object} the transformed node or an array of nodes
   */
  return function (fn, node) {
    // Clone the original node to produce a detached copy.
    const ret = adapter.cloneNode(node);

    // If the node potentialy has children, we need to recurse.
    if (adapter.isElementNode(node) || adapter.isRootNode(node)) {
      const children = adapter.getChildNodes(node);
      let len = children.length;
      while (len) {
        const mapped = map(fn, children[len - 1]);
        prepend(ret, mapped);
        len--;
      }
    }

    return fn(ret);
  };
}());


const reduce = (function () {
  /**
   * Recurses the provided document (or document fragment) tree
   * and passes each node into the provided callback. The callback
   * first passed the initial value, and then the return value
   * of any subsequent call.
   *
   * @param {Function} the accumulator function
   * @param {Mixed} the initial value
   * @param {Object} a node
   *
   * @returns {Object} the accumulated value
   * @private
   */
  function recurse(fn, i, node) {
    if (adapter.isElementNode(node) || adapter.isRootNode(node)) {
      const children = adapter.getChildNodes(node);
      let len = children.length;
      while (len) {
        const childNode = children[len - 1];
        i = recurse(fn, i, childNode);
        len--;
      }
    }

    return fn(i, node);
  }
  /**
   * A small wrapper around the private `recurse`.
   *
   * @param {Function} the accumulator function
   * @param {Mixed} the initial value
   * @param {Object} a node
   *
   * @returns {Object} the transformed node
   */
  return function (fn, i, node) {
    if (typeof i === 'function') i = i();
    /**
     * If we are dealing with a node that potentially has children,
     * then we need to reduce their children right to left first.
     */
    return recurse(fn, i, node);
  };
}());

module.exports = {
  parse,
  stringify,
  map,
  reduce,
  adapter,
  compose,
  sequence,
};
