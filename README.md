# pico-dom

[![CircleCI](https://circleci.com/gh/raywhite/pico-dom.svg?style=shield&circle-token=971d877b223828f6c0bd193cc0e0ff602f721ef7)](https://circleci.com/gh/raywhite/pico-dom)

> Create, transform and serialize lightweight HTML abstract syntax trees in a functional and composable style. You know... for the web!

## About

[pico-dom](https://github.com/raywhite/pico-dom) is a tool for parsing, transformation and serialization of [HTML](https://www.w3.org/TR/html5/). It is built on top of The premise of the module is simple; any markup can be represented as a simple data structure (a Abstract Syntax Tree - not unlike the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) implemented in browsers) - Just like a hash, array, or any other collection, we can transform that tree using functional utilities like [map](#map) and [reduce](#reduce), and compose sets of those utilities into streams that perform complex tasks.

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

  **appendChild(*parentNode*, *newNode*)**

  **cloneNode(*node*)**

  **createCommentNode(*data*)**

  **createDocument()**

  **createDocumentFragment()**

  **createElement(*tagName*, *namespaceURI*, *attributes*)**

  **createNode(*tagName*, *attrs*, *childNodes*)**

This is a higher level, [JSX](https://facebook.github.io/jsx/) compatible function that should be used for the creation of elements or reusable functional components. It is effectively a templating helper function. In order to use this function with JSX, you need to be using transpilation and specify the custom **pragma** (compiler directive) `adapter.createNode`. See the [babel](https://babeljs.io/) documentation for setting this up [here]([babel](https://babeljs.io/docs/plugins/transform-react-jsx/)).

**Note:** this function supports the use of two extra `tagName`s; Passing `'fragment'` as will create a document fragment root node and passing `'document'` will create a document root node - this means that you won't have to manually append nodes to a document or fragment node in order to produce a serializable abstract syntax tree.

  **createTextNode(*data*)**

  **detachNode(*node*)**

  **getAttrList(*element*)**

  **getChildNodes(*node*)**

  **getCommentNodeContent(*commentNode*)**

  **getDocumentMode(*document*)**

  **getDocumentTypeNodeName(*node*)**

  **getDocumentTypeNodePublicId(*node*)**

  **getDocumentTypeNodeSystemId(*node*)**

  **getFirstChild(*node*)**

  **getNamespaceURI(*element*)**

  **getParentNode(*node*)**

  **getTagName(*element*)**

  **getTemplateContent(*templateElement*)**

  **getTextNodeContent(*textNode*)**

  **insertBefore(*parentNode*, *newNode*, *referenceNode*)**

  **insertText(*parentNode*, *text*)**

  **insertTextBefore(*parentNode*, *text*, *referenceNode*)**

  **isCommentNode(*node*)**

  **isDocumentTypeNode(*node*)**

  **isElementNode(*node*)**

  **isRootNode(*node*)**

  **isTextNode(*node*)**

  **setDocumentMode(*document*, *mode*)**

  **setDocumentType(*document*, *name*, *publicId*, *systemId*)**

  **setTemplateContent(*templateElement*, *contentElement*)**

### **map(*fn*, *node*)**

 - **fn** (`function`) - the callback that will recurse the AST.

 - **node** (`object`) - the root node of the AST to map.

### **reduce(*fn*, *i*, *node*)**

 - **fn** (`function`) - the callback that will recurse the AST.

 - **i** (`number|string|function`) - the initial value for the reduction.

 - **node** (`object`) - **node** (`object`) - the root node of the AST to reduce.

### **compose(...*fns*)**

 - **fns** (`...function`) - the functions to be composed.

### **sequence(...*fns*)**

 - **fns** (`...function`) - the functions to be composed.

