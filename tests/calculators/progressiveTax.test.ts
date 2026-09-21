import { describe, expect, it } from 'vitest';
import {
  calculateProgressiveTax,
  type TaxBracket,
} from '../../src/calculators/core/progressiveTax';

const brackets: TaxBracket[] = [
  { min: 0, max: 100, rate: 0.1 },
  { min: 100, max: 200, rate: 0.2 },
  { min: 200, max: null, rate: 0.3 },
];

describe('calculateProgressiveTax', () => {
  it('taxes income entirely within the first bracket', () => {
    const result = calculateProgressiveTax(50, brackets);
    expect(result.totalTax).toBeCloseTo(5);
    expect(result.marginalRate).toBe(0.1);
  });

  it('taxes income spanning multiple brackets correctly', () => {
    // 100*0.1 + 100*0.2 + 50*0.3 = 10 + 20 + 15 = 45
    const result = calculateProgressiveTax(250, brackets);
    expect(result.totalTax).toBeCloseTo(45);
    expect(result.marginalRate).toBe(0.3);
  });

  it('handles an exact bracket boundary', () => {
    const result = calculateProgressiveTax(100, brackets);
    expect(result.totalTax).toBeCloseTo(10);
  });

  it('handles zero income', () => {
    const result = calculateProgressiveTax(0, brackets);
    expect(result.totalTax).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });

  it('clamps negative income to zero', () => {
    const result = calculateProgressiveTax(-500, brackets);
    expect(result.totalTax).toBe(0);
  });

  it('computes effective rate as total tax divided by income', () => {
    const result = calculateProgressiveTax(250, brackets);
    expect(result.effectiveRate).toBeCloseTo(45 / 250);
  });
});
