# pico-dom

[![CircleCI](https://circleci.com/gh/raywhite/pico-dom.svg?style=shield&circle-token=971d877b223828f6c0bd193cc0e0ff602f721ef7)](https://circleci.com/gh/raywhite/pico-dom)

> Create, transform and serialize lightweight HTML abstract syntax trees in a functional and composable style. You know... for the web!

## About

[pico-dom](https://github.com/raywhite/pico-dom) is a tool for parsing, transformation and serialization of [HTML](https://www.w3.org/TR/html5/). It is built on top of the excellent and forgiving [parse5](https://github.com/inikulin/parse5) module, and is based on a simple premise; any markup can be represented as a simple data structure (a Abstract Syntax Tree - not unlike the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) implemented in browsers) - Just like a hash, array, or any other collection, we can transform that tree using functional utilities like [map](#map) and [reduce](#reduce), and [compose](#compose) sets of those utilities into streams that perform complex transformations.

[pico-dom](https://github.com/raywhite/pico-dom) has several use cases:
 - markup sanitization
 - markup transformation
 - markup templating
 - web scraping

## API

### **parse([*doc*, ] *markup*)**

 - **doc** (`boolean`) - whether or not to parse as a document (default: `false`)

 - **markup** (`string`) - the markup to be parsed into an AST.

This is a wrapper around the `parse` and `parseFragment` methods from [parse5](https://github.com/inikulin/parse5). It will return an AST in the in the [htmlparser2](https://github.com/fb55/htmlparser2) format. 

**Note:** Where `doc` is not provided, the markup will be parsed as a document fragment, if you'd like for the markup to be parsed as a valid document (the way a browser would interpret it) then you should set `doc` to true.

### **stringify(*tree*)**

 - **tree** (`object`) - the AST to be serialized.

This wraps the `serialize` method from [parse5](https://github.com/inikulin/parse5) - it'll serialize any AST in the [htmlparser2](https://github.com/fb55/htmlparser2) format.

### **adapter**

**adoptAttributes(*recipient*, *attributes*)**

- **recipient** (`object`) - the element to copy attributes into.
- **attributes** (`array`) - the attributes to copy.

**appendChild(*parentNode*, *newNode*)**

- **parentNode** (`object`) - the parent node.
- **newNode** (`object`) - the new node to append.

**cloneNode(*node*)**

- **node** (`object`) - the node to clone.

**createCommentNode(*data*)**

- **data** (`string`) - the text content of the comment node.

**createDocument()**

Creates a spec compliant document that new nodes can be insterted into / appended to.

**createDocumentFragment()**

Creates a document fragment that new nodes can be insterted into / appended to.

**createElement(*tagName*, *namespaceURI*, *attributes*)**

- **tagName** (`string`) - the elements tag name.
- **namespaceURI** (`string`) - the elements namespace.
- **attributes** (`array`) - the elements attributes.

**createNode(*tagName*, *attrs*, *childNodes*)**

- **tagName** (`string|function`) - the tag name, or function to be called with `attrs` as `props`.
- **attrs** (`object`) - the attribute (`key`:`value`) pairs or `props`.
- **childNodes** (`...object|array|string`) - the child nodes of this node.

This is a higher level, [JSX](https://facebook.github.io/jsx/) compatible function that should be used for the creation of elements or reusable functional components. It is effectively a templating helper function. In order to use this function with JSX, you need to be using transpilation and specify the custom **pragma** (compiler directive) `adapter.createNode`. See the [babel](https://babeljs.io/) documentation for setting this up [here]([babel](https://babeljs.io/docs/plugins/transform-react-jsx/)).

**Note:** this function supports the use of two extra `tagName`s; Passing `'fragment'` as will create a document fragment root node and passing `'document'` will create a document root node - this means that you won't have to manually append nodes to a document or fragment node in order to produce a serializable abstract syntax tree.

**createTextNode(*data*)**

- **data** (`string`) - the text nodes content.

**detachNode(*node*)**

- **node** (`object`) - the node to detach from it's parent.

**getAttrList(*element*)**

- **element** (`object`) - the element to get the attributes list of.

**getChildNodes(*node*)**

- **node** (`object`) - the element to get the child nodes of.

**getCommentNodeContent(*commentNode*)**

- **commentNode** (`object`) - the comment node to get the content of. 

**getDocumentMode(*document*)**

- **document** (`object`) - the document to get the mode of.

**getDocumentTypeNodeName(*doctypeNode*)**

- **doctypeNode** (`object`) - the document type node to get the node name of.

**getDocumentTypeNodePublicId(*doctypeNode*)**

- **doctypeNode** (`object`) - the document type node to get the public id of.

**getDocumentTypeNodeSystemId(*doctypeNode*)**

- **doctypeNode** (`object`) - the document type node to get the system id of.

**getFirstChild(*node*)**

- **node** (`object`) - the node to get the first child of.

**getNamespaceURI(*element*)**

- **element** (`object`) - the element to get the namespace RUI of.

**getParentNode(*node*)**

- **node** (`object`) - the node to get the parent of.

**getTagName(*element*)**

- **node** (`object`) - the element node to get the tag name of.

**getTemplateContent(*templateElement*)**

- **templateElement** (`object`) - the template element node to get the content of.

**getTextNodeContent(*textNode*)**

- **textNode** (`object`) - the text node to get the content of.

**insertBefore(*parentNode*, *newNode*, *referenceNode*)**

- **parentNode** (`object`) - the parent node.
- **newNode** (`object`) - the new node to insert.
- **referenceNode** (`object`) - the reference node.

**insertText(*parentNode*, *text*)**

- **parentNode** (`object`) - the parent node.
- **text** (`string`) - the text content.

**insertTextBefore(*parentNode*, *text*, *referenceNode*)**

- **parentNode** (`object`) - the parent node.
- **text** (`string`) - the text content.
- **referenceNode** (`object`) - the reference node.

**isCommentNode(*node*)**

- **node** (`object`) - the node to test.

**isDocumentTypeNode(*node*)**

- **node** (`object`) - the node to test.

**isElementNode(*node*)**

- **node** (`object`) - the node to test.

**isRootNode(*node*)**

- **node** (`object`) - the node to test.

**isTextNode(*node*)**

- **node** (`object`) - the node to test.

**setDocumentMode(*document*, *mode*)**

- **document** (`object`) - the document to set the mode of.
- **mode** (`string`) - the document mode.

**setDocumentType(*document*, *name*, *publicId*, *systemId*)**

- **document** (`object`) - the document to set the mode of.
- **name** (`string`) - the document mode.
- **publicId** (`string`) - the document public id.
- **systemId** (`string`) - the document system id.

**setTemplateContent(*templateElement*, *contentElement*)**

- **templateElement** (`object`) - the template element node to set the content of.
- **contentElement** (`object`) - the fragment containing the content.

### **map(*fn*, *node*)**

- **fn** (`function`) - the callback that will recurse the AST.
- **node** (`object`) - the root node of the AST to map.

The `map` method functions in a manner analogous to [`Array.prototype.map`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/map) - The callback function `fn` will be passed the current node; `fn(node)`. The order of iteration through the tree is from the most deeply nested child of `node` to the least deeply nested, and finally `node` itself. The callback should return the node(s) to replace `node` with in the new (mapped) tree - you may return a single node, an array of nodes or `null` (in which case no children will be appended to the `node` passed to the next invokation). Note that each node is cloned internally to avoid mutation, which means that it is safe to simply `return node`.

### **reduce(*fn*, *i*, *node*)**

- **fn** (`function`) - the callback that will recurse the AST.
- **i** (`number|string|function`) - the initial value for the reduction.
- **node** (`object`) - **node** (`object`) - the root node of the AST to reduce.

The `reduce` method functions in a manner analogous to [`Array.prototype.reduce`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) - The callback function `fn` will be passed the initial value `i` or the return value of the previous invokation, as well as the the current node; `fn(i, node)`. The order of iteration through the tree is from the most deeply nested child of `node` to the least deeply nested, and finally `node` itself. Note that each node is cloned internally to avoid mutation.

### **compose(...*fns*)**

- **fns** (`...function`) - the functions to be composed.

### **sequence(...*fns*)**

- **fns** (`...function`) - the functions to be sequenced.

### License

&bull; **MIT** &copy; Ray White, 2017 &bull;

