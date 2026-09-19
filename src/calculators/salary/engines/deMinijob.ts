import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { roundToCents } from '../../core/math';

// Source: German Federal Government 2026 minimum-wage FAQ.
const LIMIT_2026 = 603;

export interface DeMinijobInput {
  hourlyWage: number;
  hoursPerMonth: number;
}

export interface DeMinijobResult {
  monthlyGross: number;
  minijobLimit: number;
  withinLimit: boolean;
  hoursAtLimit: number;
}

export const deMinijobEngine: CalculatorEngine<DeMinijobInput, DeMinijobResult, never> = {
  validate(input): ValidationResult<DeMinijobInput> {
    const errors: Partial<Record<keyof DeMinijobInput, string>> = {};

    if (
      input.hourlyWage === undefined ||
      Number.isNaN(input.hourlyWage) ||
      input.hourlyWage <= 0
    ) {
      errors.hourlyWage = 'errors.mustBePositive';
    }

    if (
      input.hoursPerMonth === undefined ||
      Number.isNaN(input.hoursPerMonth) ||
      input.hoursPerMonth < 0
    ) {
      errors.hoursPerMonth = 'errors.invalidNumber';
    }

    return Object.keys(errors).length ? { valid: false, errors } : { valid: true, data: input };
  },

  calculate(input): DeMinijobResult {
    const monthlyGross = input.hourlyWage * input.hoursPerMonth;
    return {
      monthlyGross: roundToCents(monthlyGross),
      minijobLimit: LIMIT_2026,
      withinLimit: monthlyGross <= LIMIT_2026,
      hoursAtLimit: roundToCents(LIMIT_2026 / input.hourlyWage),
    };
  },
};
