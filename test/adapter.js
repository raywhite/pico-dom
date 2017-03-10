/** @jsx adapter.createNode */
/**
 * NOTE: The above compiler directive is required for transpilation
 * JSX syntax to work, otherwise it would attempt to complile
 * to React.createElement. Use of a directive is actually
 * depracated and the pragma should be set in `.babelrc` anyway.
 */

import expect from 'expect';
import { parse, stringify, adapter } from '../src/index';
import { inspect, trim, XHTML_NAMESPACE } from './test_utilities';

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

      it('should handle the special fragment `tagName`', function () {
        /**
         * A component to make a little text block where
         * the root node that is provided is actually a
         * document fragment.
         *
         * @param {Object} props
         *
         * @returns {Object} node
         */
        function TextBlock(props) {
          const { text, items } = props;
          return (
            <fragment>
              <p>{text}</p>
              <ul>
                {items.map(function (item) {
                  return <li>{item}</li>
                })}
              </ul>
            </fragment>
          );
        }

        // Some props to pass into our `TextBlock` component.
        const text ='this is some text content';
        const items = [
          'item one',
          'item two',
          'item three',
        ];

        const node = <TextBlock text={text} items={items} />;

        // Ensure that we have created a fragment.
        expect(node.type).toBe('root');

        const markup = trim(`
          <p>this is some text content</p>
          <ul>
            <li>item one</li>
            <li>item two</li>
            <li>item three</li>
          </ul>
        `);

        // Ensure that the two structures match and seriazlize identically.
        const parsed = parse(markup);
        expect(inspect(node)).toBe(inspect(parsed));
        expect(stringify(node)).toBe(markup);
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
