/** @jsx adapter.createNode */
import { parse, stringify, map, reduce, adapter } from '../src/index.ts';
import { trim, XHTML_NAMESPACE } from './test_utilities.ts';
import type { Node } from '../src/types.ts';

/**
 * Behavioural snapshots pinning serialized output and the structural contract
 * consuming code reads (tag order, coalesced text). Deliberately avoids
 * `util.inspect` on nodes - that captures the adapter's internal
 * representation, not this module's behaviour.
 */
describe('parse5 behavioural snapshots', () => {
  const document = trim(`
    <div class="a" data-x="1">
      <a href="http://x.haus?a=b&c=d">anchor</a>
      <p>text<br>more</p>
      <!--a comment-->
      <ul><li>one</li><li>two</li></ul>
    </div>
  `);

  it('round-trips fragment markup', () => {
    expect(stringify(parse(document))).toMatchSnapshot();
  });

  it('round-trips full-document markup', () => {
    expect(stringify(parse(true, '<p>hi</p>'))).toMatchSnapshot();
  });

  it('escapes ampersands in attribute values', () => {
    expect(stringify(parse('<img src="x.com/?a=b&c=d">'))).toMatchSnapshot();
  });

  it('coalesces adjacent text via appendChild', () => {
    const p = adapter.createElement('p', XHTML_NAMESPACE, []);
    adapter.appendChild(p, adapter.createTextNode('one'));
    adapter.appendChild(p, adapter.createTextNode('two'));

    const children = adapter.getChildNodes(p);
    expect(children.length).toBe(1);
    expect(adapter.getTextNodeContent(children[0]!)).toBe('onetwo');
  });

  it('coalesces adjacent text via insertBefore', () => {
    const p = adapter.createElement('p', XHTML_NAMESPACE, []);
    const ref = adapter.createElement('span', XHTML_NAMESPACE, []);
    adapter.appendChild(p, adapter.createTextNode('one'));
    adapter.appendChild(p, ref);
    adapter.insertBefore(p, adapter.createTextNode('two'), ref);

    const children = adapter.getChildNodes(p);
    expect(children.length).toBe(2);
    expect(adapter.getTextNodeContent(children[0]!)).toBe('onetwo');
    expect(stringify(p)).toBe('onetwo<span></span>');
  });

  it('serializes a tree built via createNode (JSX)', () => {
    const node = (
      <div id="root">
        {'leading text'}
        <a href="/x">link</a>
        {['a', 'b']}
        {null}
        <p>nested</p>
      </div>
    ) as Node;
    expect(stringify(node)).toMatchSnapshot();
  });

  it('map identity preserves serialized structure', () => {
    expect(stringify(map((n) => n, parse(document)))).toMatchSnapshot();
  });

  it('reduce collects tag names in traversal order', () => {
    const tags = reduce<string[]>((acc, n) => {
      if (adapter.isElementNode(n)) acc.push(adapter.getTagName(n));
      return acc;
    }, () => [], parse(document));
    expect(tags).toMatchSnapshot();
  });
});
