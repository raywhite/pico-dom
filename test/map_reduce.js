import expect from 'expect';
import { stringify, map, reduce, adapter } from '../src/index';
import { count, inspect, noop, XHTML_NAMESPACE } from './test_utilities';

describe('dom transformation methods', function () {
  const LIST_ITEM = '<li';
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
