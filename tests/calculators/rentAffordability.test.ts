import { describe, it, expect } from 'vitest';
import { rentAffordabilityEngine } from '../../src/calculators/rent/engines/rentAffordability';

describe('rentAffordabilityEngine', () => {
  describe('validate()', () => {
    it('returns valid for correct input', () => {
      const result = rentAffordabilityEngine.validate({
        grossIncomePerPeriod: 5000,
        payFrequency: 'monthly',
      });
      expect(result.valid).toBe(true);
    });

    it('returns error for negative gross income', () => {
      const result = rentAffordabilityEngine.validate({
        grossIncomePerPeriod: -100,
        payFrequency: 'monthly',
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.grossIncomePerPeriod).toBe('errors.mustBePositive');
      }
    });

    it('returns error for invalid target percentage', () => {
      const result = rentAffordabilityEngine.validate({
        grossIncomePerPeriod: 5000,
        payFrequency: 'monthly',
        targetGrossPercentage: 150,
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.targetGrossPercentage).toBe('errors.invalidPercentage');
      }
    });
  });

  describe('calculate()', () => {
    it('calculates default 30% of gross monthly income', () => {
      const result = rentAffordabilityEngine.calculate(
        {
          grossIncomePerPeriod: 60000,
          payFrequency: 'annually',
        },
        {} as never,
        2026,
      );
      expect(result.monthlyGrossIncome).toBe(5000);
      expect(result.recommendedRentGross).toBe(1500); // 30% of 5000
      expect(result.monthlyNetIncome).toBeUndefined();
      expect(result.recommendedRentNet).toBeUndefined();
    });

    it('calculates custom percentage of gross monthly income', () => {
      const result = rentAffordabilityEngine.calculate(
        {
          grossIncomePerPeriod: 1000,
          payFrequency: 'weekly',
          targetGrossPercentage: 25,
        },
        {} as never,
        2026,
      );
      // 1000/wk * 52 = 52000 annual / 12 = 4333.33 monthly
      expect(result.monthlyGrossIncome).toBe(4333.33);
      expect(result.recommendedRentGross).toBe(1083.33); // 25% of 4333.33
    });

    it('calculates based on net income when provided', () => {
      const result = rentAffordabilityEngine.calculate(
        {
          grossIncomePerPeriod: 5000,
          netIncomePerPeriod: 4000,
          payFrequency: 'monthly',
        },
        {} as never,
        2026,
      );
      expect(result.monthlyGrossIncome).toBe(5000);
      expect(result.recommendedRentGross).toBe(1500); // 30% of 5000
      expect(result.monthlyNetIncome).toBe(4000);
      expect(result.recommendedRentNet).toBe(1200); // 30% of 4000
    });
  });
});
