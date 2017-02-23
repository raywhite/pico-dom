import { parseFragment, parse as _parse, serialize, treeAdapters } from 'parse5';

/**
 * This entire module interacts (parses from, transforms,
 * serializes to) the `treeAdapter.htmlparser2 ` AST format
 * exposed by parse5. The wrapped `parse` and `stringify`
 * methods require it as an option.
 *
 * SEE: `https://github.com/inikulin/parse5` - for parse5.
 * SEE: `https://github.com/fb55/htmlparser2` - for the reference implementation.
 */
const adapter = treeAdapters.htmlparser2;
const OPTIONS = { treeAdapter: adapter };

/**
 * @param {String} some markup
 *
 * TODO: Needs tests for support of parsing as a document.
 *
 * @returns {Object} document model
 */
export function parse(doc, markup) { // eslint-disable-line consistent-return
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
export function stringify(model) {
  return serialize(model, OPTIONS);
}

/**
 * A check to determine if a node is the document, or document
 * fragment root.
 *
 * @param {Object} a node
 *
 * @returns
 */
adapter.isRootNode = function (node) {
  return node.type === 'root';
};

/**
 * I'm not entirely certain of what the logic for this is
 * and may need to create an issue with parse5, but `createTextNode` -
 * `https://github.com/inikulin/parse5/blob/master/lib/tree_adapters/htmlparser2.js#L126`
 * is not exposed. So we need to create our own.
 */
adapter.createTextNode = (function () {
  const p = adapter.createDocumentFragment();

  /**
   * Create a detached text node in a roundabout way,
   * this API is required for proper functioning of
   * the walker.
   *
   * @param {String} the text content
   *
   * @returns {Object} the text node
   */
  return function (text) {
    adapter.insertText(p, text);
    const textNode = adapter.getChildNodes(p).pop();
    adapter.detachNode(textNode);
    return textNode;
  };
}());

// TODO: Document.
const _appendChild = adapter.appendChild;
adapter.appendChild = function (parentNode, node) {
  if (!adapter.isTextNode(node)) {
    return _appendChild(parentNode, node);
  }

  const text = adapter.getTextNodeContent(node);
  return adapter.insertText(parentNode, text);
};

// TODO: Document.
const _insertBefore = adapter.insertBefore;
adapter.insertBefore = function (parentNode, node, referenceNode) {
  if (!adapter.isTextNode(node)) {
    return _insertBefore(parentNode, node, referenceNode);
  }

  const text = adapter.getTextNodeContent(node);
  return adapter.insertTextBefore(parentNode, text, referenceNode);
};

// TODO: Document.
adapter.cloneNode = function (node) {
  if (adapter.isCommentNode(node)) {
    const content = adapter.getCommentNodeContent(node);
    return adapter.createCommentNode(content);
  }

  if (adapter.isElementNode(node)) {
    const tagName = adapter.getTagName(node);
    const namespaceURI = adapter.getNamespaceURI(node);
    const ret = adapter.createElement(tagName, namespaceURI, []);
    adapter.adoptAttributes(ret, adapter.getAttrList(node));
    return ret;
  }

  if (adapter.isRootNode(node)) {
    const mode = adapter.getDocumentMode(node);
    return mode ? adapter.createDocument() : adapter.createDocumentFragment();
  }

  // TODO: We need to support document type nodes.
  const text = adapter.getTextNodeContent(node);
  return adapter.createTextNode(text);
};

/**
 * A JSX compatible API that creates nodes
 * or composite element nodes.
 */
adapter.createNode = (function () {
  /**
   * TODO: Figure out how to use the namespace properly;
   * at the moment all elements are created in the XHTML namespace.
   */
  const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
  // const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

  /**
   * Appends child nodes, including nested arrays to the
   * provided parent node.
   *
   * TODO: This really feels like it should be type checked.
   *
   * @param {Object} the parent node
   * @param {Array} the child nodes
   *
   * @returns {Void}
   */
  function append(parentNode, childNodes) {
    /* eslint-disable no-continue */
    const len = childNodes.length;
    for (let i = 0; i < len; i++) {
      const node = childNodes[i];

      // Null nodes need to be discarded.
      if (node === null) continue;

      // Flatten any nested arrays.
      if (Array.isArray(node)) {
        append(parentNode, node);
        continue;
      }

      // Text in JSX should become a text node.
      if (typeof node === 'string') {
        const textNode = adapter.createTextNode(node);
        adapter.appendChild(parentNode, textNode);
        continue;
      }
      /* eslint-enable no-continue */

      // Must be a regular node, just append it.
      adapter.appendChild(parentNode, node);
    }
  }

  /**
   * @param {String|Function} tag name or component function
   * @param {Object} attributes
   * @param {...Mixed} the child nodes
   *
   * @returns {Object} the new node
   */
  return function (tagName, attributes, ...childNodes) {
    if (typeof tagName === 'function') {
      /**
       * Add `children` to the attributes them to the attributes and
       * and call the function. Take the return value and pass it to
       * recurse.
       */
      const fn = tagName;
      const props = Object.assign({}, attributes);
      props.children = childNodes;
      return fn(props);
    }

    // Coerce the attributes into the correct structure.
    const _attributes = [];
    if (attributes !== null) {
      const keys = Object.keys(attributes);
      const len = keys.length;

      for (let i = 0; i < len; i++) {
        const key = keys[i];
        _attributes.push({ name: key, value: attributes[key] });
      }
    }

    // Create the node using the provided attributers.
    const node = adapter.createElement(tagName, XHTML_NAMESPACE, _attributes);

    // Append all children to the node. Then return the node.
    append(node, childNodes);
    return node;
  };
}());

// Export the adapter.
export { adapter };

export const map = (function () {
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


export const reduce = (function () {
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
