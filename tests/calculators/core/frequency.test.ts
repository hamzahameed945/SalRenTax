import { describe, expect, it } from 'vitest';
import { annualize, deannualize, convertFrequency } from '../../../src/calculators/core/frequency';

describe('frequency primitives', () => {
  it('annualize multiplies by periods', () => {
    expect(annualize(1000, 'monthly')).toBe(12000);
    expect(annualize(1000, 'biweekly')).toBe(26000);
  });

  it('deannualize divides by periods', () => {
    expect(deannualize(12000, 'monthly')).toBe(1000);
    expect(deannualize(26000, 'biweekly')).toBe(1000);
  });

  it('convertFrequency converts across frequencies', () => {
    // $1000 biweekly -> $26000 annual -> $500 weekly
    expect(convertFrequency(1000, 'biweekly', 'weekly')).toBe(500);
  });
});
