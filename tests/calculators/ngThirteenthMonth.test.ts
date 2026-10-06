import { describe, expect, it } from 'vitest';
import {
  marginalPayeRate,
  ngThirteenthMonthEngine,
} from '../../src/calculators/labor/engines/ngThirteenthMonth';

describe('marginalPayeRate (Nigeria Tax Act 2025 bands)', () => {
  it('returns 0% for income within the first ₦800,000 band', () => {
    expect(marginalPayeRate(600_000)).toBe(0);
    expect(marginalPayeRate(800_000)).toBe(0);
  });

  it('steps through the verified band thresholds', () => {
    expect(marginalPayeRate(800_001)).toBe(0.15);
    expect(marginalPayeRate(3_000_000)).toBe(0.15);
    expect(marginalPayeRate(3_000_001)).toBe(0.18);
    expect(marginalPayeRate(12_000_000)).toBe(0.18);
    expect(marginalPayeRate(12_000_001)).toBe(0.21);
    expect(marginalPayeRate(25_000_000)).toBe(0.21);
    expect(marginalPayeRate(25_000_001)).toBe(0.23);
    expect(marginalPayeRate(50_000_000)).toBe(0.23);
    expect(marginalPayeRate(50_000_001)).toBe(0.25);
  });
});

describe('ngThirteenthMonthEngine', () => {
  it('sets gross bonus equal to one monthly salary', () => {
    const result = ngThirteenthMonthEngine.calculate({
      monthlyGrossSalary: 500_000,
      annualGrossSalary: 6_000_000,
    });
    expect(result.grossBonus).toBe(500_000);
  });

  it('withholds no PAYE for a low earner fully inside the 0% band', () => {
    const result = ngThirteenthMonthEngine.calculate({
      monthlyGrossSalary: 60_000,
      annualGrossSalary: 720_000,
    });
    expect(result.marginalPayeRate).toBe(0);
    expect(result.payeOnBonus).toBe(0);
    expect(result.netBonus).toBe(60_000);
  });

  it('applies the mid-earner marginal rate (₦6m annual → 18%)', () => {
    const result = ngThirteenthMonthEngine.calculate({
      monthlyGrossSalary: 500_000,
      annualGrossSalary: 6_000_000,
    });
    expect(result.marginalPayeRate).toBe(0.18);
    expect(result.payeOnBonus).toBe(90_000);
    expect(result.netBonus).toBe(410_000);
  });

  it('applies the top marginal rate for high earners (₦60m annual → 25%)', () => {
    const result = ngThirteenthMonthEngine.calculate({
      monthlyGrossSalary: 5_000_000,
      annualGrossSalary: 60_000_000,
    });
    expect(result.marginalPayeRate).toBe(0.25);
    expect(result.payeOnBonus).toBe(1_250_000);
    expect(result.netBonus).toBe(3_750_000);
  });

  it('returns net bonus as gross minus PAYE', () => {
    const input = { monthlyGrossSalary: 350_000, annualGrossSalary: 4_200_000 };
    const result = ngThirteenthMonthEngine.calculate(input);
    expect(result.marginalPayeRate).toBe(0.18);
    expect(result.netBonus).toBeCloseTo(result.grossBonus - result.payeOnBonus, 6);
  });

  it('rejects non-positive or missing inputs', () => {
    expect(
      ngThirteenthMonthEngine.validate({ monthlyGrossSalary: 0, annualGrossSalary: 6_000_000 }).valid,
    ).toBe(false);
    expect(
      ngThirteenthMonthEngine.validate({ monthlyGrossSalary: 500_000, annualGrossSalary: -1 }).valid,
    ).toBe(false);
    expect(
      ngThirteenthMonthEngine.validate({ monthlyGrossSalary: NaN, annualGrossSalary: 6_000_000 }).valid,
    ).toBe(false);
    expect(
      ngThirteenthMonthEngine.validate({ monthlyGrossSalary: 500_000, annualGrossSalary: 6_000_000 }).valid,
    ).toBe(true);
  });
});
