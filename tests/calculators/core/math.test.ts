import { describe, expect, it } from 'vitest';
import {
  roundToCents,
  calculatePercentage,
  applyCap,
  applyFloor,
} from '../../../src/calculators/core/math';

describe('math primitives', () => {
  it('roundToCents rounds properly', () => {
    expect(roundToCents(10.123)).toBe(10.12);
    expect(roundToCents(10.125)).toBe(10.13);
    expect(roundToCents(10.129)).toBe(10.13);
  });

  it('calculatePercentage works', () => {
    expect(calculatePercentage(100, 0.15)).toBe(15);
  });

  it('applyCap caps values', () => {
    expect(applyCap(150, 100)).toBe(100);
    expect(applyCap(50, 100)).toBe(50);
  });

  it('applyFloor floors values', () => {
    expect(applyFloor(-50, 0)).toBe(0);
    expect(applyFloor(50, 0)).toBe(50);
    expect(applyFloor(50, 100)).toBe(100);
  });
});
