import expect from 'expect';
import { parse, stringify } from '../src/index';
import { trim, inspect } from './test_utilities';

/**
 * TODO: Make assertions about the root node and the location
 * of text in the document etc. Also... parse now has the
 * ability to parse an entire document, or to parse a fragment
 * as a document (however a browser would) - test for this
 * need to be added.
 */
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
  });
});
