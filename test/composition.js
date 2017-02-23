import expect from 'expect';
import { compose, sequence } from '../src/composition.js';
import { append, noop } from './test_utilities.js';

describe('composition methods', function () {
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
