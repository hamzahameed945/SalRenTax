import { describe, expect, it } from 'vitest';
import {
  isPositiveNumber,
  isNonNegativeNumber,
  validateRequired,
} from '../../../src/calculators/core/validation';

describe('validation primitives', () => {
  it('isPositiveNumber', () => {
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber(-1)).toBe(false);
    expect(isPositiveNumber(null)).toBe(false);
    expect(isPositiveNumber('1')).toBe(false);
    expect(isPositiveNumber(NaN)).toBe(false);
  });

  it('isNonNegativeNumber', () => {
    expect(isNonNegativeNumber(1)).toBe(true);
    expect(isNonNegativeNumber(0)).toBe(true);
    expect(isNonNegativeNumber(-1)).toBe(false);
    expect(isNonNegativeNumber(NaN)).toBe(false);
  });

  it('validateRequired', () => {
    const input = { a: 1, b: null, c: undefined, d: '' };
    const errors = validateRequired(input, ['a', 'b', 'c', 'd']);
    expect(errors.a).toBeUndefined();
    expect(errors.b).toBeDefined();
    expect(errors.c).toBeDefined();
    expect(errors.d).toBeDefined();
  });
});
