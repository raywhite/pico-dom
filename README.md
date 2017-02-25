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

### **parse([document, ] m)**

### **stringify(t)**

### **adapter**

  **adoptAttributes(recipient, attributes)**

  **appendChild(parentNode, newNode)**

  **cloneNode(node)Node**

  **createCommentNode(data)**

  **createDocument()**

  **createDocumentFragment()**

  **createElement(tagName, namespaceURI, attributes)**

  **createNode(tagName, attrs, childNodes)**

This is a higher level, [JSX](https://facebook.github.io/jsx/) compatible function that should be used for the creation of elements or reusable functional components. It is effectively a templating helper function. In order to use this function with JSX, you need to be using transpilation and specify the custom **pragma** (compiler directive) `adapter.createNode`. See the [babel](https://babeljs.io/) documentation for setting this up [here]([babel](https://babeljs.io/docs/plugins/transform-react-jsx/)).

  **createTextNode(data)**

  **#detachNode(node)**

  **#getAttrList(element)**

  **getChildNodes(node)**

  **getCommentNodeContent(commentNode)**

  **getDocumentMode(document)**

  **getDocumentTypeNodeName(node)**

  **getDocumentTypeNodePublicId(node)**

  **getDocumentTypeNodeSystemId(node)**

  **getFirstChild(node)**

  **getNamespaceURI(element)**

  **getParentNode(node)**

  **getTagName(element)**

  **getTemplateContent(templateElement)**

  **getTextNodeContent(textNode)**

  **insertBefore(parentNode, newNode, referenceNode)**

  **insertText(parentNode, text)**

  **insertTextBefore(parentNode, text, referenceNode)**

  **isCommentNode(node)**

  **isDocumentTypeNode(node)**

  **isElementNode(node)**

  **isRootNode(node)**

  **isTextNode(node)**

  **setDocumentMode(document, mode)**

  **setDocumentType(document, name, publicId, systemId)**

  **setTemplateContent(templateElement, contentElement)**

### **map(fn, node)**

### **reduce(fn, i, node)**

### **compose(...fns)**

### **sequence(...fns)**

