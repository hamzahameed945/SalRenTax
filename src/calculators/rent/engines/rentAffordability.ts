import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { roundToCents } from '../../core/math';
import { PERIODS_PER_YEAR, type PayFrequency } from '../../core/frequency';

export interface RentAffordabilityInput {
  grossIncomePerPeriod: number;
  netIncomePerPeriod?: number;
  payFrequency: PayFrequency;
  targetGrossPercentage?: number; // Default 30%
}

export interface RentAffordabilityResult {
  monthlyGrossIncome: number;
  monthlyNetIncome?: number;
  recommendedRentGross: number; // Target percentage of gross
  recommendedRentNet?: number; // Target percentage of net, if net provided
}

export const rentAffordabilityEngine: CalculatorEngine<
  RentAffordabilityInput,
  RentAffordabilityResult,
  never
> = {
  validate(input: RentAffordabilityInput): ValidationResult<RentAffordabilityInput> {
    const errors: Partial<Record<keyof RentAffordabilityInput, string>> = {};

    if (
      input.grossIncomePerPeriod === undefined ||
      input.grossIncomePerPeriod === null ||
      (typeof input.grossIncomePerPeriod === 'number' && Number.isNaN(input.grossIncomePerPeriod))
    ) {
      errors.grossIncomePerPeriod = 'errors.invalidNumber';
    } else if (input.grossIncomePerPeriod <= 0) {
      errors.grossIncomePerPeriod = 'errors.mustBePositive';
    }

    if (
      input.netIncomePerPeriod !== undefined &&
      ((typeof input.netIncomePerPeriod === 'number' && Number.isNaN(input.netIncomePerPeriod)) || input.netIncomePerPeriod < 0)
    ) {
      errors.netIncomePerPeriod = 'errors.invalidNumber';
    }

    if (
      input.targetGrossPercentage !== undefined &&
      ((typeof input.targetGrossPercentage === 'number' && Number.isNaN(input.targetGrossPercentage)) ||
        input.targetGrossPercentage <= 0 ||
        input.targetGrossPercentage > 100)
    ) {
      errors.targetGrossPercentage = 'errors.invalidPercentage';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: RentAffordabilityInput): RentAffordabilityResult {
    const periodsPerYear = PERIODS_PER_YEAR[input.payFrequency];
    const annualGrossIncome = input.grossIncomePerPeriod * periodsPerYear;
    const monthlyGrossIncome = annualGrossIncome / PERIODS_PER_YEAR.monthly;

    const targetPercentage = input.targetGrossPercentage ?? 30;
    const recommendedRentGross = (monthlyGrossIncome * targetPercentage) / 100;

    let monthlyNetIncome: number | undefined;
    let recommendedRentNet: number | undefined;

    if (input.netIncomePerPeriod !== undefined) {
      const annualNetIncome = input.netIncomePerPeriod * periodsPerYear;
      monthlyNetIncome = annualNetIncome / PERIODS_PER_YEAR.monthly;
      // People usually apply the same percentage (e.g. 30%) to net income as a more conservative measure
      recommendedRentNet = (monthlyNetIncome * targetPercentage) / 100;
    }

    return {
      monthlyGrossIncome: roundToCents(monthlyGrossIncome),
      ...(monthlyNetIncome !== undefined && { monthlyNetIncome: roundToCents(monthlyNetIncome) }),
      recommendedRentGross: roundToCents(recommendedRentGross),
      ...(recommendedRentNet !== undefined && {
        recommendedRentNet: roundToCents(recommendedRentNet),
      }),
    };
  },
};
