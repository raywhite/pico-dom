import { treeAdapters } from 'parse5';

const adapter = treeAdapters.htmlparser2;

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

export { adapter };
