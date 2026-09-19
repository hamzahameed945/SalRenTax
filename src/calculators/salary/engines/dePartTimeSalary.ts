import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { roundToCents } from '../../core/math';

export interface DePartTimeSalaryInput {
  fullTimeMonthlyGross: number;
  fullTimeHoursPerWeek: number;
  partTimeHoursPerWeek: number;
}

export interface DePartTimeSalaryResult {
  partTimeMonthlyGross: number;
  annualGross: number;
  reductionPercent: number;
}

export const dePartTimeSalaryEngine: CalculatorEngine<
  DePartTimeSalaryInput,
  DePartTimeSalaryResult,
  never
> = {
  validate(input): ValidationResult<DePartTimeSalaryInput> {
    const errors: Partial<Record<keyof DePartTimeSalaryInput, string>> = {};

    if (
      input.fullTimeMonthlyGross === undefined ||
      Number.isNaN(input.fullTimeMonthlyGross) ||
      input.fullTimeMonthlyGross <= 0
    ) {
      errors.fullTimeMonthlyGross = 'errors.mustBePositive';
    }

    if (
      input.fullTimeHoursPerWeek === undefined ||
      Number.isNaN(input.fullTimeHoursPerWeek) ||
      input.fullTimeHoursPerWeek <= 0
    ) {
      errors.fullTimeHoursPerWeek = 'errors.invalidNumber';
    }

    if (
      input.partTimeHoursPerWeek === undefined ||
      Number.isNaN(input.partTimeHoursPerWeek) ||
      input.partTimeHoursPerWeek <= 0 ||
      input.partTimeHoursPerWeek > input.fullTimeHoursPerWeek
    ) {
      errors.partTimeHoursPerWeek = 'errors.invalidNumber';
    }

    return Object.keys(errors).length ? { valid: false, errors } : { valid: true, data: input };
  },

  calculate(input): DePartTimeSalaryResult {
    const ratio = input.partTimeHoursPerWeek / input.fullTimeHoursPerWeek;
    const value = input.fullTimeMonthlyGross * ratio;

    return {
      partTimeMonthlyGross: roundToCents(value),
      annualGross: roundToCents(value * 12),
      reductionPercent: (1 - ratio) * 100,
    };
  },
};
