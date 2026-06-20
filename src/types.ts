/**
 * Local structural node types for parse5's `treeAdapters.htmlparser2` AST.
 *
 * parse5 v3.0.3 bundles its own typings, but `treeAdapters.htmlparser2`
 * is typed to return opaque `HtmlParser2.Node`-ish values that are NOT
 * wired to parse5's richer interfaces, so consuming code sees little more
 * than `any`. No parse5 version both retains the `treeAdapters.htmlparser2`
 * API (removed in v5) and improves these typings (the API was reworked in
 * v7), so upgrading is not an option here. We therefore declare the node
 * shape locally, verified empirically against the htmlparser2 adapter's
 * actual output, and cast the adapter to `PicoAdapter` once at the boundary
 * in `index.ts`.
 *
 * The `ElementNode` produced here IS the JSX element type consumed
 * downstream by @raywhite/markup (its JSX compiles to `adapter.createNode`).
 */

export type Attribute = {
  name: string;
  value: string;
}

type BaseNode = {
  type: string;
  parent: ParentNode | null;
  prev: Node | null;
  next: Node | null;
  // htmlparser2 aliases.
  parentNode?: ParentNode | null;
  previousSibling?: Node | null;
  nextSibling?: Node | null;
}

export type TextNode = {
  type: 'text';
  data: string;
} & BaseNode

export type CommentNode = {
  type: 'comment';
  data: string;
} & BaseNode

export type ElementNode = {
  type: 'tag' | 'script' | 'style';
  name: string;
  namespace: string;
  attribs: { [name: string]: string };
  children: Node[];
  'x-attribsNamespace'?: { [name: string]: string };
  'x-attribsPrefix'?: { [name: string]: string };
} & BaseNode

export type RootNode = {
  type: 'root';
  name: 'root';
  children: Node[];
} & BaseNode

export type Node = TextNode | CommentNode | ElementNode | RootNode;

export type ParentNode = ElementNode | RootNode;

/**
 * Props passed to a functional component invoked via `createNode`.
 * `children` is always populated by the factory.
 */
export type Props = Record<string, unknown> & { children?: unknown[] };

/**
 * Global JSX typings for the classic runtime (`jsxFactory: adapter.createNode`).
 * The element type produced IS this module's `Node`, which is exactly what
 * @raywhite/markup consumes. Intrinsic elements accept arbitrary props since
 * `createNode` coerces any attribute to a string.
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

/**
 * The methods the source actually uses on the htmlparser2 adapter, plus
 * the custom methods the source adds (`isRootNode`, `createTextNode`, and
 * the `appendChild`/`insertBefore`/`cloneNode`/`createNode` overrides).
 * Loosely typed where the underlying adapter is loose; this is a structural
 * cast target, not a faithful parse5 typing.
 */
export type PicoAdapter = {
  // Base htmlparser2 adapter methods used by the source.
  createDocument(): RootNode;
  createDocumentFragment(): RootNode;
  createElement(tagName: string, namespaceURI: string, attrs: Attribute[]): ElementNode;
  createCommentNode(data: string): CommentNode;
  detachNode(node: Node): void;
  getAttrList(node: Node): Attribute[];
  getChildNodes(node: Node): Node[];
  getCommentNodeContent(node: Node): string;
  getDocumentMode(node: Node): boolean;
  getNamespaceURI(node: Node): string;
  getTagName(node: Node): string;
  getTextNodeContent(node: Node): string;
  getParentNode(node: Node): ParentNode | null;
  insertText(parentNode: Node, text: string): void;
  insertTextBefore(parentNode: Node, text: string, referenceNode: Node): void;
  adoptAttributes(recipient: Node, attrs: Attribute[]): void;
  isCommentNode(node: Node): boolean;
  isElementNode(node: Node): boolean;
  isTextNode(node: Node): boolean;
  isDocumentTypeNode(node: Node): boolean;

  // Overridden by the source (signatures preserved).
  appendChild(parentNode: Node, node: Node): void;
  insertBefore(parentNode: Node, node: Node, referenceNode: Node): void;
  cloneNode(node: Node): Node;

  // Added by the source.
  isRootNode(node: Node): boolean;
  createTextNode(text: string): TextNode;
  createNode(
    tagName: string | ((props: Props) => Node),
    attributes: Record<string, unknown> | null,
    ...childNodes: unknown[]
  ): Node;

  // The full htmlparser2 adapter exposes more methods than the source uses;
  // tests enumerate them by string key, so allow indexed access.
  [method: string]: unknown;
}
