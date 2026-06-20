import { compose, sequence } from '../src/index.ts';
import { append, noop } from './test_utilities.ts';

describe('composition methods', () => {
  describe('compose', () => {
    it('is a higher order function', () => {
      const composed = compose(noop);
      expect(typeof composed).toBe('function');
    });

    it('should compose functions right to left', () => {
      const composed = compose(append(4), append(3), append(2));
      expect(composed(1)).toBe('1234');
    });
  });

  describe('sequence', () => {
    it('is a higher order function', () => {
      const sequenced = sequence(noop);
      expect(typeof sequenced).toBe('function');
    });

    it('should compose functions left to right', () => {
      const sequenced = sequence(append(2), append(3), append(4));
      expect(sequenced(1)).toBe('1234');
    });
  });
});
