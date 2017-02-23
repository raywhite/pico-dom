/** @jsx adapter.createNode */

import expect from 'expect';
import { inspect as _inspect } from 'util';

import {
  parse,
  stringify,
  map,
  reduce,
  adapter,
  compose,
  sequence,
} from '../src/index.js';

const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const LIST_ITEM = '<li';

describe('markups exported functions', function () {
  /**
   * @param {String} markup
   *
   * @returns {String} trimmed markup
   */
  function trim(str) {
    return str.replace(/\n\s*/g, '');
  }

  /**
   * Stringify a JS object, infinitely deep.
   *
   * @param {Object}
   *
   * @returns {String}
   */
  function inspect(obj) {
    return _inspect(obj, { depth: null });
  }

  /**
   * Count occurences of a substring.
   *
   * @param {String}
   *
   * @returns {Number} the occurences
   */
  function count(str, substr) {
    const re = new RegExp(substr, 'g');
    return (str.match(re) || []).length;
  }

  /**
   * @returns {Void}
   */
  function noop() {}

  describe('parse and stringify', function () {
    const markup = trim(`
      <div>
        <a href="http://somedomain.haus">anchor</a>
        <p>
          another text node
        </p>
        <div>
          <div>
            berfore line break
            <br>
            after line break
          </div>
        </div>
      </div>
    `);

    it('should be functions', function () {
      expect(parse).toBeA('function');
      expect(stringify).toBeA('function');
    });

    it('parse and stringify should have parity', function () {
      const parsed = parse(markup);
      const stringifyd = stringify(parsed);
      expect(stringifyd).toBe(markup);
    });

    it('parse should produce a dom tree in htmlparser2 format', function () {
      const parsed = parse(markup);
      const str = inspect(parsed);

      expect(parsed.type).toBe('root');
      expect(str).toMatch(/type: 'root'/);

      /**
       * TODO: Make assertions about the root node and the location
       * of text in the document etc.
       */
    });
  });

  describe('adapter', function () {
    it('should expose all of the methods that wrapped adapter does', function () {
      // htmlparser2 `treeAdaptor` methods exposed by parse5 - no need to test in depth.
      const fns = [
        'adoptAttributes',
        'createCommentNode',
        'createDocument',
        'createDocumentFragment',
        'createElement',
        'detachNode',
        'getAttrList',
        'getChildNodes',
        'getCommentNodeContent',
        'getDocumentMode',
        'getDocumentTypeNodeName',
        'getDocumentTypeNodePublicId',
        'getDocumentTypeNodeSystemId',
        'getFirstChild',
        'getNamespaceURI',
        'getParentNode',
        'getTagName',
        'getTemplateContent',
        'getTextNodeContent',
        'insertText',
        'insertTextBefore',
        'isCommentNode',
        'isDocumentTypeNode',
        'isElementNode',
        'isTextNode',
        'setDocumentMode',
        'setDocumentType',
        'setTemplateContent',
      ];

      // Plus the monkey patched methods.
      fns.push('appendChild', 'insertBefore');

      // Plus the new methods that we've appended.
      fns.push('isRootNode', 'createTextNode', 'cloneNode', 'createNode');

      fns.forEach(function (name) {
        expect(adapter[name]).toBeA('function');
      });

      // Just to make sure we've got everything covered.
      expect(fns.sort()).toEqual(Object.keys(adapter).sort());
    });

    describe('appended methods', function () {
      describe('isRootNode', function () {
        it('exposes a method to detect the root node', function () {
          const dom = parse('<div></div>');
          expect(adapter.isRootNode(dom)).toBe(true);
        });
      });

      describe('createTextNode', function () {
        const data = 'some text';
        const textNode = adapter.createTextNode(data);

        it('exposes a method to create a detached text node', function () {
          // Is this a valid text node?
          expect(adapter.isTextNode(textNode)).toBe(true);
          expect(adapter.isElementNode(textNode)).toBe(false);
          expect(adapter.isCommentNode(textNode)).toBe(false);
          expect(adapter.isDocumentTypeNode(textNode)).toBe(false);
          expect(adapter.getTextNodeContent(textNode)).toBe(data);

          // Is the node initially dettached?
          expect(adapter.getParentNode(textNode)).toBe(null);
        });

        it('should be attachable and able to be appended to', function () {
          // Is the node attachable?
          const fragment = adapter.createDocumentFragment();
          const p = adapter.createElement('p', XHTML_NAMESPACE, []);
          adapter.appendChild(p, textNode);
          adapter.appendChild(fragment, p);

          // Is it attached and does it have the correct parent node etc.
          const node = adapter.getChildNodes(adapter.getChildNodes(fragment)[0])[0];
          expect(adapter.isTextNode(node)).toBe(true);
          const parentNode = adapter.getParentNode(node);
          expect(adapter.getParentNode(parentNode)).toBe(fragment);
          expect(adapter.isRootNode(adapter.getParentNode(parentNode))).toBe(true);
          expect(adapter.isTextNode(node)).toBe(true);
          expect(adapter.getTextNodeContent(node)).toBe(data);

          // Can we add text content to the node?
          const appended = ', and now some appended text';
          adapter.insertText(p, appended);
          const _textNode = adapter.getChildNodes(p).pop();
          expect(adapter.getTextNodeContent(_textNode)).toBe(data + appended);
        });
      });

      describe('cloneNode', function () {
        // TODO: There are several document types (like a directive) that aren't covered here.
        it('should clone a node of any type', function () {
          // Comment node.
          (function () {
            const node = adapter.createCommentNode('some comment content');
            const clone = adapter.cloneNode(node);

            // They are not the same object, but equal in all other regards.
            expect(node).toNotBe(clone);
            expect(inspect(node)).toBe(inspect(clone));
          }());

          // Element node.
          (function () {
            const node = adapter.createElement(
              'div',
              XHTML_NAMESPACE,
              [{ name: 'id', value: 'x' }],
            );

            const clone = adapter.cloneNode(node);

            const dom = adapter.createDocumentFragment();
            adapter.appendChild(dom, clone);

            // Make sure that the attributes are also cloned, detach for parity.
            expect(stringify(dom)).toBe('<div id="x"></div>');
            adapter.detachNode(clone);

            // They are not the same object, but equal in all other regards.
            expect(node).toNotBe(clone);
            expect(inspect(node)).toBe(inspect(clone));
          }());

          // Root node.
          (function () {
            // Document fragment.
            (function () {
              const node = adapter.createDocumentFragment();
              const clone = adapter.cloneNode(node);

              // They are not the same object, but equal in all other regards.
              expect(node).toNotBe(clone);
              expect(inspect(node)).toBe(inspect(clone));
            }());

            // TODO: Document - Make sure that all params are copied properly.
            (function () {
              const node = adapter.createDocument();
              const clone = adapter.cloneNode(node);

              // They are not the same object, but equal in all other regards.
              expect(node).toNotBe(clone);
              expect(inspect(node)).toBe(inspect(clone));
            }());
          }());

          // Text node.
          (function () {
            const CONTENT = 'some text content';
            const node = adapter.createTextNode(CONTENT);
            const clone = adapter.cloneNode(node);

            // There are not the same object, but equal in all other regards.
            expect(node).toNotBe(clone);
            expect(adapter.getTextNodeContent(clone)).toBe(CONTENT);
            expect(inspect(node)).toBe(inspect(clone));
          }());
        });

        it('the cloned node should be shallow and detached', function () {
          const dom = adapter.createDocumentFragment();
          const node = adapter.createElement('p', XHTML_NAMESPACE, []);
          const textNode = adapter.createTextNode('text');

          // Attach the child nodes to the dom.
          adapter.appendChild(node, textNode);
          adapter.appendChild(dom, node);

          const clone = adapter.cloneNode(node);

          // Make sure the original node is attached, and has a child.
          expect(!!adapter.getParentNode(node)).toBe(true);
          expect(!!adapter.getChildNodes(node).length).toBe(true);

          // And that the new node does not.
          expect(!!adapter.getParentNode(clone)).toBe(false);
          expect(!!adapter.getChildNodes(clone).length).toBe(false);
        });
      });

      describe('createNode', function () {
        /**
         * TODO: This should be our JSX compatible DOM generation method -
         * it's actually quite easy to just proxy to the native methods
         * given the nature of the input in order to accomplish this.
         */
        it('should construct a node properly', function () {
          const markup = trim(`
            <div id="0.1">
              first text node
              <p id="0.1.1">
                second text node
              </p>
              <ul id="0.1.2">
                <li id="0.1.2.1">
                  third text node
                </li>
              </ul>
            </div>
          `);

          /**
           * This node should exactly mimic the structure of the
           * markup above.
           */
          const node = adapter.createNode(
            'div',
            { id: '0.1' },
            'first text node',
            adapter.createNode(
              'p',
              { id: '0.1.1' },
              'second text node',
            ),
            adapter.createNode(
              'ul',
              { id: '0.1.2' },
              adapter.createNode(
                'li',
                { id: '0.1.2.1' },
                'third text node',
              ),
            ),
          );

          const dom = adapter.createDocumentFragment();
          adapter.appendChild(dom, node);

          // Serialized version matches.
          expect(stringify(dom)).toEqual(markup);

          const parsed = parse(markup);

          // The internal node structure is the same.
          expect(inspect(dom)).toEqual(inspect(parsed));
        });

        it('should flatten arrays present in child nodes', function () {
          const markup = trim(`
            <div>
              first text node
              <ul>
                <li>
                  second text node
                </li>
                <li>
                  third text node
                </li>
              </ul>
              <p>
                fourth text node
              </p>
            </div>
          `);

          /**
           * This node should exactly mimic the structure of the
           * markup above.
           */
          const node = adapter.createNode(
            'div',
            null,
            'first text node',
            // The scond `childNodes` value is an array.
            [
              adapter.createNode(
                'ul',
                null,
                // The only `childNodes` value is an array.
                [
                  adapter.createNode('li', null, 'second text node'),
                  adapter.createNode('li', null, 'third text node'),
                ],
              ),
              adapter.createNode(
                'p',
                null,
                'fourth text node'
              ),
            ],
          );

          const dom = adapter.createDocumentFragment();
          adapter.appendChild(dom, node);

          // Serialized version matches.
          expect(stringify(dom)).toEqual(markup);

          const parsed = parse(markup);

          // The internal node structure is the same.
          expect(inspect(dom)).toEqual(inspect(parsed));
        });

        it('should interoperate with other adapter methods', function () {
          const markup = trim(`
            <div>
              0
              <ul>
                <li id="1">
                  1
                </li>
                <li id="2">
                  2
                </li>
              </ul>
              <p>
                3
              </p>
            </div>
          `);

          /**
           * This node should exactly mimic the structure of the
           * markup above.
           */
          const node = adapter.createNode(
            'div',
            null,
            adapter.createTextNode('0'),
            // The scond `childNodes` value is an array.
            [
              adapter.createNode(
                'ul',
                null,
                // The only `childNodes` value is an array.
                (function () {
                  const nodes = [
                    adapter.createElement('li', XHTML_NAMESPACE, [{ name: 'id', value: '1' }]),
                    adapter.createElement('li', XHTML_NAMESPACE, [{ name: 'id', value: '2' }]),
                  ];

                  nodes.forEach(function (node, index) { // eslint-disable-line no-shadow
                    adapter.insertText(node, String(index + 1));
                  });

                  return nodes;
                }()),
              ),
              adapter.createNode(
                'p',
                null,
                '3'
              ),
            ],
          );

          const dom = adapter.createDocumentFragment();
          adapter.appendChild(dom, node);

          // Serialized version matches.
          expect(stringify(dom)).toEqual(markup);

          const parsed = parse(markup);

          // The internal node structure is the same.
          expect(inspect(dom)).toEqual(inspect(parsed));
        });

        it('should function with functional components', function () {
          const markup = trim(`
            <div>
              <ul>
                <li>1</li>
                <li>2</li>
                <li>3</li>
                <li>4</li>
                <li>5</li>
              </ul>
            </div>
          `);

          /**
           * Generates an unordered list containing one item for each
           * element in the items props and then appends and children
           * that were passed in as props.
           *
           * @param {Object} properties
           *
           * @returns {Object} node
           */
          function list(props) {
            const { items, children } = props;
            return adapter.createNode(
              'ul',
              null,
              ...(function () {
                return items.map(function (item) {
                  return adapter.createNode(
                    'li',
                    null,
                    String(item)
                  );
                });
              }()),
              ...children,
            );
          }

          const node = adapter.createNode(
            'div',
            null,
            adapter.createNode(
              list,
              { items: [1, 2, 3] },
              adapter.createNode('li', null, String(4)),
              adapter.createNode('li', null, String(5)),
            )
          );

          const dom = adapter.createDocumentFragment();
          adapter.appendChild(dom, node);

          // Serialized version matches.
          expect(stringify(dom)).toEqual(markup);

          const parsed = parse(markup);

          // The internal node structure is the same.
          expect(inspect(dom)).toEqual(inspect(parsed));
        });

        it('should function identically when compiled from JSX', function () {
          const markup = trim(`
            <div>
              <ul>
                <li>0</li>
                <li>1</li>
                <li>2</li>
                <li>3</li>
                <li>4</li>
              </ul>
            </div>
          `);

          /**
           * Generates an unordered list containing one item for each
           * element in the items props and then appends and children
           * that were passed in as props - this is the JSX version of
           * the list function above.
           *
           * TODO: This module requires AirBnB JSX linting, this is
           * probably why `LIST` is registering as an unnused var.
           *
           * @param {Object} properties
           *
           * @returns {Object} node
           */
          function List(props) { // eslint-disable-line no-unused-vars
            const { items, children } = props;
            return (
              <ul>
                {(function () {
                  return items.map(function (item) {
                    return <li>{`${item}`}</li>;
                  });
                }())}
                {children}
              </ul>
            );
          }

          const items = [0, 1, 2];
          const node = (
            <div>
              <List items={items}>
                <li>{String(3)}</li>
                <li>{String(4)}</li>
              </List>
            </div>
          );

          const dom = adapter.createDocumentFragment();
          adapter.appendChild(dom, node);

          // Serialized version matches.
          expect(stringify(dom)).toEqual(markup);

          const parsed = parse(markup);

          // The internal node structure is the same.
          expect(inspect(dom)).toEqual(inspect(parsed));
        });
      });
    });

    describe('monkey patched methods', function () {
      /**
       * TODO: There are some node types that should be appendable
       * or insertable and are missing.
       */
      describe('appendChild', function () {
        // Our initial dom is total empty.
        const dom = adapter.createDocumentFragment();
        it('should append a node of any type', function () {
          const commentNode = adapter.createCommentNode('comment content');
          const elementNode = adapter.createElement('div', XHTML_NAMESPACE, []);
          const textNode = adapter.createTextNode('some text');

          /**
           * Append all of the nodes in the order in which they were declared,
           * should eventuate in this;
           *
           * <!--comment content--><div></div> , and then some<!--reference node-->
           */
          [commentNode, elementNode, textNode].forEach(function (node) {
            adapter.appendChild(dom, node);
          });

          // Ensure the correct structure and order.
          expect(stringify(dom)).toEqual(trim(`
            <!--comment content-->
            <div>
            </div>
            some text
          `));
        });

        it('should merge text nodes as expected', function () {
          const textNode = adapter.createTextNode(', and then some');

          // Check the length first, so we can make sure it doesn't change.
          expect(adapter.getChildNodes(dom).length).toBe(3);

          // Append the child.
          adapter.appendChild(dom, textNode);

          expect(stringify(dom)).toEqual(trim(`
            <!--comment content-->
            <div>
            </div>
            some text, and then some
          `));

          // The length should not have changed.
          expect(adapter.getChildNodes(dom).length).toBe(3);
        });
      });

      describe('insertBefore', function () {
        /**
         * The initial document fragment is simple, just a comment node;
         *
         * <!--reference node-->
         */
        const dom = adapter.createDocumentFragment();
        const referenceNode = adapter.createCommentNode('reference node');
        adapter.appendChild(dom, referenceNode);

        it('should insert a node if any applicable type', function () {
          // These nodes are initially detached, they'll be inserted for tests.
          const commentNode = adapter.createCommentNode('comment content');
          const elementNode = adapter.createElement('div', XHTML_NAMESPACE, []);
          const textNode = adapter.createTextNode(', and then some');

          // Ensure the original structure.
          expect(stringify(dom)).toEqual('<!--reference node-->');
          /**
           * Insert all of the nodes in the order in which they were declared,
           * should eventuate in this;
           *
           * <!--comment content--><div></div> , and then some<!--reference node-->
           */
          [commentNode, elementNode, textNode].forEach(function (node) {
            adapter.insertBefore(dom, node, referenceNode);
          });

          expect(stringify(dom)).toEqual(trim(`
            <!--comment content-->
            <div>
            </div>
            , and then some
            <!--reference node-->
          `));
        });

        it('should treat text nodes as expected', function () {
          const nodes = adapter.getChildNodes(dom);
          expect(nodes.length).toBe(4);

          // Get a new reference to the text node.
          const textNode = nodes[2];

          // Create and append a new text node.
          const newNode = adapter.createTextNode('some text');
          adapter.insertBefore(dom, newNode, textNode);

          // Text nodes should merge.
          expect(stringify(dom)).toBe(trim(`
            <!--comment content-->
            <div></div>
            some text, and then some
            <!--reference node-->
          `));

          // The length should have changed.
          expect(nodes.length).toBe(5);
        });
      });
    });
  });

  describe('dom manipulation methods', function () {
    const COMMENT = 'comment node';
    const TEXT_ONE = 'first text node';
    const TEXT_TWO = 'second text node';

    /**
     * Creates a dom containing text, comment and element nodes -
     *
     *  <!--comment node-->
     *  first text node
     *  <div>
     *    second text node
     *  </div>
     *
     * @returns {Object} a dom
     */
    function createModel() {
      const dom = adapter.createDocumentFragment();
      const d = adapter.createElement('div', XHTML_NAMESPACE, []);
      adapter.appendChild(dom, adapter.createCommentNode(COMMENT));
      adapter.appendChild(dom, adapter.createTextNode(TEXT_ONE));
      adapter.appendChild(d, adapter.createTextNode(TEXT_TWO));
      adapter.appendChild(dom, d);

      return dom;
    }

    /**
     * Creates a dom where the `id` attributes of nodes are `1`
     * based indexes in the tree, with the exception of the root
     * not, which is indexed as `0`.
     *
     *  <div id="0.1">
     *    <ul id="0.1.1">
     *      <li id="0.1.1.1"></li>
     *      <li id="0.1.1.2"></li>
     *      <li id="0.1.1.3"></li>
     *    </ul>
     *    <p id="0.1.2"></p>
     *  </div>
     *
     * @returns {Object} an indexed dom
     */
    function createIndexedModel() {
      const indexed = adapter.createDocumentFragment();
      const container = adapter.createElement(
        'div',
        XHTML_NAMESPACE,
        [{ name: 'id', value: '0.1' }],
      );
      adapter.appendChild(indexed, container);

      // An unordered list.
      const ul = adapter.createElement('ul', XHTML_NAMESPACE, [{ name: 'id', value: '0.1.1' }]);
      ['0.1.1.1', '0.1.1.2', '0.1.1.3'].forEach(function (i) {
        const li = adapter.createElement('li', XHTML_NAMESPACE, [{ name: 'id', value: i }]);
        adapter.appendChild(ul, li);
      });
      adapter.appendChild(container, ul);

      // A paragraph tag.
      const p = adapter.createElement('p', XHTML_NAMESPACE, [{ name: 'id', value: '0.1.2' }]);
      adapter.appendChild(container, p);

      return indexed;
    }

    describe('map', function () {
      it('is intended to be partially applied for composition', function () {
        const mapper = map.bind(null, noop);
        expect(mapper).toBeA('function');
      });

      /**
       * TODO: These tests are also completely broken for some reason.
       * Drunk, will sort in the morning - possibly better to just test
       * the exported `map` and `reduce` functions first.
       */
      describe('partially applied map', function () {
        it('should pass cloned and detached nodes to the callback', function () {
          let calls = 0;
          /**
           * @param {Function}
           * @param {Object}
           *
           * @returns {Object}
           */
          function fn(node) {
            expect(node.next).toBe(null);
            expect(node.prev).toBe(null);
            expect(adapter.getParentNode(node)).toBe(null);

            calls++;
            return node;
          }

          const mapper = map.bind(null, fn);
          const dom = createModel();

          mapper(dom);
          expect(calls).toBe(5);
        });

        it('should traverse the dom in the correct order', function () {
          /**
           * NOTE: These tests are wrapped for scoping reasons.
           * I'm to lazy to come up with multiple coherant
           * variable names.
           *
           * The first IIFE tests recursion in a simple dom.
           */
          (function () {
            const types = [];

            /**
             * Unshifts traversed node types into an array.
             *
             * @param {Object}
             *
             * @returns {Object}
             */
            function fn(node) {
              types.unshift(node.type);
              return node;
            }

            const dom = createModel();

            // Create a mapper using `.bind` for partial application.
            const mapper = map.bind(null, fn);
            const mapped = mapper(dom);

            // This would be the opposite order into which the dom was recursed.
            expect(types).toEqual(['root', 'comment', 'text', 'tag', 'text']);

            // Ensure that there wasn't any mutation in the model, but noop worked.
            expect(dom).toNotBe(mapped);
            expect(inspect(dom)).toBe(inspect(mapped));
            expect(stringify(dom)).toBe(stringify(mapped));
          }());

          /**
           * This is designed to test the recursion order of an indexed
           * dom, and further establishes that no mutation is occuring.
           */
          (function () {
            const ids = [];

            /**
             * Unshifts traversed node types into an array.
             *
             * @param {Object}
             *
             * @returns {Object}
             */
            function fn(node) {
              if (adapter.isElementNode(node)) {
                const value = adapter.getAttrList(node)[0].value;
                ids.unshift(value);
              }

              return node;
            }

            const dom = createIndexedModel();

            // Create a mapper using `.bind` for partial application.
            const mapper = map.bind(null, fn);
            const mapped = mapper(dom);

            // This would be the opposite order into which the dom was recursed.
            expect(ids).toEqual([
              '0.1',
              '0.1.1',
              '0.1.1.1',
              '0.1.1.2',
              '0.1.1.3',
              '0.1.2',
            ]);

            // Ensure that there wasn't any mutation in the model, but noop worked.
            expect(dom).toNotBe(mapped);
            expect(inspect(dom)).toBe(inspect(mapped));
            expect(stringify(dom)).toBe(stringify(mapped));
          }());
        });

        it('should correctly remove nodes where null is returned', function () {
          /**
           * NOTE: Encapsulated for the same reason as above.
           *
           * The first set just removes all text nodes from the dom.
           */
          (function () {
            /**
             * Returns the clone unless we are dealing with a text node,
             * in which case we return null.
             *
             * @param {Object}
             *
             * @returns {Object}
             */
            function fn(node) {
              if (adapter.isTextNode(node)) {
                return null;
              }

              return node;
            }

            const dom = createModel();
            const mapper = map.bind(null, fn);

            const mapped = mapper(dom);

            const re = /type: 'text'/;

            // Ensure that the new dom contains no text nodes.
            expect(dom).toNotBe(mapped);
            expect(inspect(dom)).toMatch(re);
            expect(inspect(mapped)).toNotMatch(re);
            expect(stringify(dom)).toNotBe(stringify(mapped));
            expect(stringify(dom).length).toBeGreaterThan(stringify(mapped).length);
          }());

          /**
           * This test removes all list items and keeps a count of
           * removed nodes.
           */
          (function () {
            /**
             * Removes any node that is a list item or noops.
             *
             * @param {Object}
             *
             * @returns {Object}
             */
            function fn(node) {
              if (adapter.isElementNode(node) && adapter.getTagName(node) === 'li') {
                return null;
              }

              return node;
            }

            const dom = createIndexedModel();
            const mapper = map.bind(null, fn);

            const mapped = mapper(dom);

            // Ensure that the new dom contains no text items.
            expect(dom).toNotBe(mapped);
            expect(inspect(dom).length).toBeGreaterThan(inspect(mapped).length);
            expect(count(stringify(dom), LIST_ITEM)).toBe(3);
            expect(count(stringify(mapped), LIST_ITEM)).toBe(0);
          }());
        });

        it('should correctly replace nodes where a single node is returned', function () {
          const INJECTED = 'injected text node';
          /**
           * Return the original node, unless;
           *    - The node is a list item (append a text node).
           *    - The node is a paragraph (switch for and article)
           *
           * @param {Object}
           *
           * @returns {Object}
           */
          function fn(node) {
            if (adapter.isElementNode(node)) {
              const tagName = adapter.getTagName(node);
              if (tagName === 'li') {
                const textNode = adapter.createTextNode(INJECTED);
                adapter.appendChild(node, textNode);
                return node;
              }

              if (tagName === 'p') {
                const article = adapter.createElement('article', XHTML_NAMESPACE, []);
                return article;
              }
            }

            return node;
          }

          const dom = createIndexedModel();
          const mapper = map.bind(null, fn);

          const mapped = mapper(dom);

          // Ensure that the new dom contains three text nodes.
          expect(dom).toNotBe(mapped);
          expect(count(stringify(dom), INJECTED)).toBe(0);
          expect(count(stringify(mapped), INJECTED)).toBe(3);

          const re = /name: 'article'/;
          expect(inspect(dom)).toNotMatch(re);
          expect(inspect(mapped)).toMatch(re);
        });

        it('should correctly append multiple nodes where an array is returned', function () {
          /**
           * Duplicate all list items that occur - assign them a class.
           *
           * @param {Object}
           *
           * @returns {Object|Array}
           */
          function fn(node) {
            if (adapter.isElementNode(node) && adapter.getTagName(node) === 'li') {
              const id = adapter.getAttrList(node)[0].value;
              const newNodes = [
                null, // Just to make sure it's filtered.
                node,
                adapter.createElement(
                  'li',
                  XHTML_NAMESPACE,
                  [{ name: 'id', value: `inserted:${id}` }],
                ),
              ];

              return newNodes;
            }

            return node;
          }

          const dom = createIndexedModel();
          const mapper = map.bind(null, fn);

          const mapped = mapper(dom);

          expect(count(stringify(dom), LIST_ITEM)).toBe(3);
          expect(count(stringify(mapped), LIST_ITEM)).toBe(6);

          const ids = [];
          /**
           * Returns a clone, pushes ids into an array.
           *
           * @param {Object}
           *
           * @returns {Object}
           */
          function push(node) {
            if (adapter.isElementNode(node)) {
              ids.unshift(adapter.getAttrList(node)[0].value);
            }

            return node;
          }

          map.bind(null, push)(mapped);

          // Ensure the correct insertion order.
          expect(ids).toEqual([
            '0.1',
            '0.1.1',
            '0.1.1.1',
            'inserted:0.1.1.1',
            '0.1.1.2',
            'inserted:0.1.1.2',
            '0.1.1.3',
            'inserted:0.1.1.3',
            '0.1.2',
          ]);
        });
      });
    });

    describe('reduce', function () {
      it('is intended to be partially applied for composition', function () {
        const reducer = reduce.bind(null, noop);
        expect(reducer).toBeA('function');
      });

      // Second parameter is a `string`, `number` or `function`.
      it('should accept a second parameter as an initial value', function () {
        // TODO: Increase the scope of this test, it doesn't cover enough.
        ['', 1, function () { return {}; }].forEach(function (i) {
          const reducer = reduce.bind(null, noop, i);
          expect(reducer).toBeA('function');
        });
      });

      /**
       * NOTE: This particular test is a bit much, I'm really just
       * playing around with the adapter methods provided by parse5's
       * `htmlparser2` adapter.
       */
      describe('partially applied reduce', function () {
        // TODO: This function is completely broken... sort it.
        it('should traverse the dom in the correct order', function () {
          /**
           * As with `map`, we have two several tests. Firstly, we can
           * check both the type of each node as it comes through.
           */
          (function () {
            /**
             * Determine the node type, unshift into an array.
             *
             * @param {Mixed} previous value
             * @param {Object} node
             *
             * @returns {Mixed}
             */
            function fn(p, node) {
              // Root node.
              if (adapter.isRootNode(node)) {
                p = `root ${p}`;
              }

              // Element node.
              if (adapter.isElementNode(node)) {
                const tagName = adapter.getTagName(node);
                p = `${tagName} ${p}`;
              }

              // Text node.
              if (adapter.isTextNode(node)) {
                p = `text ${p}`;
              }

              // Comment node.
              if (adapter.isCommentNode(node)) {
                p = `comment ${p}`;
              }

              return p;
            }

            const reducer = reduce.bind(null, fn, '');
            const dom = createModel();

            expect(reducer(dom).trim()).toBe('root comment text div text');
          }());

          /**
           * A test for using a `Number` primative as the initial value,
           * this also checks against an indexed dom and ensure that
           * that the nodes are being passed in the correct order.
           */
          (function () {
            const ids = [];
            /**
             * increments as we come acrros element nodes.
             *
             * @param {Mixed} previous value
             * @param {Object} node
             *
             * @returns {Mixed}
             */
            function fn(p, node) {
              if (adapter.isElementNode(node)) {
                const id = adapter.getAttrList(node)[0].value;
                ids.unshift(id);
                p++;
              }

              return p;
            }

            const reducer = reduce.bind(null, fn, 0);
            const dom = createIndexedModel();

            const output = reducer(dom);
            expect(output).toBe(ids.length);
            expect(ids).toEqual([
              '0.1',
              '0.1.1',
              '0.1.1.1',
              '0.1.1.2',
              '0.1.1.3',
              '0.1.2',
            ]);
          }());
        });

        // TODO: Here the value 'init' is a function that just returns an array.
        it('if the initial value is a function, the return value should be passed', function () {
          /**
           * A function to be called to create the initial value.
           *
           * @return {Array}
           */
          const i = function () {
            return [];
          };

          /**
           * Unshifts tag names or types into the previous value.
           *
           * @param {Array} the previous value
           * @param {Object} the current node
           *
           * @returns {Array}
           */
          function fn(p, node) {
            const type = node.type;
            p.unshift(type === 'tag' ? node.name : type);
            return p;
          }

          const reducer = reduce.bind(null, fn, i);
          const dom = createIndexedModel();

          expect(reducer(dom)).toEqual([
            'root',
            'div',
            'ul',
            'li',
            'li',
            'li',
            'p',
          ]);
        });
      });
    });
  });

  describe('composition utilities', function () {
    /**
     * @param {Number} some digit(s)
     *
     * @returns {Function}
     */
    function append(d) {
      /**
       * @param {String}
       *
       * @returns {String}
       */
      return function (r) {
        return r + String(d);
      };
    }

    describe('compose', function () {
      it('is a higher order function', function () {
        const composed = compose(noop);
        expect(composed).toBeA('function');
      });

      it('should compose functions right to left', function () {
        const composed = compose(append(4), append(3), append(2));
        expect(composed(1)).toBe('1234');
      });
    });

    describe('sequence', function () {
      it('is a higher order function', function () {
        const sequenced = sequence(noop);
        expect(sequenced).toBeA('function');
      });

      it('should compose functions left to right', function () {
        const sequenced = sequence(append(2), append(3), append(4));
        expect(sequenced(1)).toBe('1234');
      });
    });
  });
});
