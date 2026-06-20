import { parseFragment, parse as _parse, serialize, treeAdapters } from 'parse5';

import type { Attribute, Node, PicoAdapter, Props, RootNode } from './types';

/**
 * This entire module interacts (parses from, transforms,
 * serializes to) the `treeAdapter.htmlparser2 ` AST format
 * exposed by parse5. The wrapped `parse` and `stringify`
 * methods require it as an option.
 *
 * SEE: `https://github.com/inikulin/parse5` - for parse5.
 * SEE: `https://github.com/fb55/htmlparser2` - for the reference implementation.
 *
 * parse5's `treeAdapters.htmlparser2` returns are opaque to TypeScript (see
 * `./types`), so we cast the adapter once here to our local `PicoAdapter`.
 */
const adapter = treeAdapters.htmlparser2 as unknown as PicoAdapter;
// parse5's `ParserOptions`/`SerializerOptions` expect its own (mistyped)
// `treeAdapter`; cast once at this boundary - see `./types` for why.
const OPTIONS = { treeAdapter: adapter } as never;

/**
 * @param doc - markup string, or a boolean selecting document vs fragment
 * @param markup - markup string when `doc` is a boolean
 *
 * TODO: Needs tests for support of parsing as a document.
 *
 * @returns document model
 */
export function parse(doc: boolean | string = false, markup = ''): Node {
  // A markup string was passed as the only argument - default.
  if (typeof doc === 'string') {
    return parseFragment(doc, OPTIONS) as unknown as Node;
  }

  // A doc options was passed.
  if (typeof doc === 'boolean' && typeof markup === 'string') {
    // Parse as a document.
    if (doc) return _parse(markup, OPTIONS) as unknown as Node;

    // Parse as a document fragment.
    return parseFragment(markup, OPTIONS) as unknown as Node;
  }

  return doc ? adapter.createDocument() : adapter.createDocumentFragment();
}

/**
 * @param model - a document model
 *
 * @returns some markup
 */
export function stringify(model: Node): string {
  return serialize(model as never, OPTIONS);
}

/**
 * A check to determine if a node is the document, or document
 * fragment root.
 *
 * @param node - a node
 */
adapter.isRootNode = function (node: Node): node is RootNode {
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
   * @param text - the text content
   *
   * @returns the text node
   */
  return function (text: string) {
    adapter.insertText(p, text);
    // `getChildNodes` always returns at least the just-inserted node here.
    const textNode = adapter.getChildNodes(p).pop()!;
    adapter.detachNode(textNode);
    return textNode as ReturnType<PicoAdapter['createTextNode']>;
  };
}());

// TODO: Document.
const _appendChild = adapter.appendChild;
adapter.appendChild = function (parentNode: Node, node: Node) {
  if (!adapter.isTextNode(node)) {
    return _appendChild(parentNode, node);
  }

  const text = adapter.getTextNodeContent(node);
  return adapter.insertText(parentNode, text);
};

// TODO: Document.
const _insertBefore = adapter.insertBefore;
adapter.insertBefore = function (parentNode: Node, node: Node, referenceNode: Node) {
  if (!adapter.isTextNode(node)) {
    return _insertBefore(parentNode, node, referenceNode);
  }

  const text = adapter.getTextNodeContent(node);
  return adapter.insertTextBefore(parentNode, text, referenceNode);
};

// TODO: Document.
adapter.cloneNode = function (node: Node): Node {
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
   * @param parentNode - the parent node
   * @param childNodes - the child nodes
   */
  function append(parentNode: Node, childNodes: unknown[]): void {
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
      adapter.appendChild(parentNode, node as Node);
    }
  }

  /**
   * @param tagName - tag name or component function
   * @param attributes - attributes
   * @param childNodes - the child nodes
   *
   * @returns the new node
   */
  return function (
    tagName: string | ((props: Props) => Node),
    attributes: Record<string, unknown> | null,
    ...childNodes: unknown[]
  ): Node {
    if (typeof tagName === 'function') {
      /**
       * Add `children` to the attributes them to the attributes and
       * and call the function. Take the return value and pass it to
       * recurse.
       */
      const fn = tagName;
      const props: Props = { ...attributes};
      props.children = childNodes;
      return fn(props);
    }

    let node: Node;
    const _attributes: Attribute[] = [];

    // Coerce the attributes into the correct structure.
    if (attributes !== null) {
      const keys = Object.keys(attributes);
      const len = keys.length;

      for (let i = 0; i < len; i++) {
        const name = keys[i]!;
        const value = attributes[name];

        /**
         * `undefined` should just be treated as if it weren't present,
         * but all other values will be coerced and rendered.
         *
         * NOTE: This appears to be what React does, but I'm not sure
         * that the coercion is reasonable behaviour, it would make more
         * sense if the module were to throw when a non-string was passed.
         */
        if (value !== undefined) _attributes.push({ name, value: String(value) });
      }
    }

    switch (tagName) {
      // NOTE: Special case, create a document fragment.
      case 'fragment':
        node = adapter.createDocumentFragment();
        break;

      // NOTE: Special case, create a document.
      case 'document':
        node = adapter.createDocument();
        break;

      default:
        node = adapter.createElement(tagName, XHTML_NAMESPACE, _attributes);
        break;
    }

    // Append all children to the node. Then return the node.
    append(node, childNodes);
    return node;
  };
}());

// Export the adapter.
export { adapter };

/**
 * Public node types. `Node` is the JSX-element contract downstream consumers
 * (e.g. @raywhite/markup, whose JSX compiles to `adapter.createNode`) bind to;
 * `Props` is the component prop shape. Type-only so they stay erasable and
 * don't affect the value output. `PicoAdapter` stays internal — it's an
 * implementation detail of the parse5 cast, not a consumer contract.
 */
export type {
  Attribute,
  CommentNode,
  ElementNode,
  Node,
  Props,
  RootNode,
  TextNode,
} from './types';

export const map = (function () {
  /**
   * Prepend the provided nodes to the array of child nodes
   * for the `parentNode`.
   *
   * @param parentNode - the parent node
   * @param newNode - the new child node(s)
   */
  function prepend(parentNode: Node, newNode: Node | Node[] | null): void {
    const children = adapter.getChildNodes(parentNode);
    if (!Array.isArray(newNode)) {
      if (newNode === null) return;

      children.length ?  
        adapter.insertBefore(parentNode, newNode, children[0]!) :  
        adapter.appendChild(parentNode, newNode);

      return;
    }

    let len = newNode.length;
    while (len) {
      const _newNode = newNode[len - 1]!;

      // The node is null.
      if (_newNode === null) {
        len--;
        continue; // eslint-disable-line no-continue
      }

      // The node is a nested array - flatten it.
      if (Array.isArray(_newNode)) {
        prepend(parentNode, _newNode);
        len--;
        continue; // eslint-disable-line no-continue
      }

      children.length ?  
        adapter.insertBefore(parentNode, _newNode, children[0]!) :  
        adapter.appendChild(parentNode, _newNode);

      len--;
    }
  }

  /**
   * Recurses the provided document (or document fragment) tree
   * and passes each node into the provided callback. The output
   * of the callback replaces that node, or where it is `null`,
   * that node is deleted.
   *
   * @param fn - the callback function
   * @param node - the node or dom to be mapped
   *
   * @returns the transformed node or an array of nodes
   */
  return function map(fn: (node: Node) => Node, node: Node): Node {
    // Clone the original node to produce a detached copy.
    const ret = adapter.cloneNode(node);

    // If the node potentialy has children, we need to recurse.
    if (adapter.isElementNode(node) || adapter.isRootNode(node)) {
      const children = adapter.getChildNodes(node);
      let len = children.length;
      while (len) {
        const mapped = map(fn, children[len - 1]!);
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
   * @param fn - the accumulator function
   * @param i - the initial value
   * @param node - a node
   *
   * @returns the accumulated value
   * @private
   */
  function recurse<T>(fn: (acc: T, node: Node) => T, i: T, node: Node): T {
    if (adapter.isElementNode(node) || adapter.isRootNode(node)) {
      const children = adapter.getChildNodes(node);
      let len = children.length;
      while (len) {
        const childNode = children[len - 1]!;
        i = recurse(fn, i, childNode);
        len--;
      }
    }

    return fn(i, node);
  }
  /**
   * A small wrapper around the private `recurse`.
   *
   * @param fn - the accumulator function
   * @param i - the initial value, or a factory producing it
   * @param node - a node
   *
   * @returns the transformed node
   */
  return function <T>(fn: (acc: T, node: Node) => T, i: T | (() => T), node: Node): T {
    let initial: T;
    if (typeof i === 'function') initial = (i as () => T)();
    else initial = i;
    /**
     * If we are dealing with a node that potentially has children,
     * then we need to reduce their children right to left first.
     */
    return recurse(fn, initial, node);
  };
}());

/**
 * Compose a set of functions from right to left, the first argument
 * will be the last function to be called in the composed function.
 *
 * Functions are heterogeneous (each may take/return a different type),
 * so the chain is typed as `any` - the structural contract is left to
 * the caller, matching the original untyped behaviour.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function compose(...fns: Array<(x: any) => any>): (res: any) => any {
  return function (res) {
    let len = fns.length;
    while (len) {
      res = fns[len - 1]!(res);
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
 * See `compose` for the rationale behind the `any`-typed chain.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sequence(...fns: Array<(x: any) => any>): (res: any) => any {
  return function (res) {
    const len = fns.length;
    for (let i = 0; i < len; i++) {
      res = fns[i]!(res);
    }
    return res;
  };
}
