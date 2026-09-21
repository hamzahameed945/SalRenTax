import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { mindestlohn2026 } from '../../../../data/salary/de/germanPayrollData2026';

export interface MindestlohnInput {
  hoursPerWeek: number;
  weeksPerYear: number;
}

export interface MindestlohnResult {
  hourlyWage: number;
  weeklyWage: number;
  monthlyWage: number;
  annualWage: number;
  /** True if hoursPerWeek*hourlyWage exceeds the 2026 Minijob monthly limit. */
  aboveMinijobLimit: boolean;
}

export const mindestlohnEngine: CalculatorEngine<MindestlohnInput, MindestlohnResult, never> = {
  validate(input: MindestlohnInput): ValidationResult<MindestlohnInput> {
    const errors: Partial<Record<keyof MindestlohnInput, string>> = {};

    if (!input.hoursPerWeek || typeof input.hoursPerWeek === 'number' && Number.isNaN(input.hoursPerWeek)) {
      errors.hoursPerWeek = 'errors.invalidNumber';
    } else if (input.hoursPerWeek <= 0 || input.hoursPerWeek > 80) {
      errors.hoursPerWeek = 'errors.mustBePositive';
    }

    if (!input.weeksPerYear || typeof input.weeksPerYear === 'number' && Number.isNaN(input.weeksPerYear)) {
      errors.weeksPerYear = 'errors.invalidNumber';
    } else if (input.weeksPerYear <= 0 || input.weeksPerYear > 52) {
      errors.weeksPerYear = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: MindestlohnInput): MindestlohnResult {
    const weeklyWage = input.hoursPerWeek * mindestlohn2026;
    const monthlyWage = (weeklyWage * input.weeksPerYear) / 12;
    const annualWage = weeklyWage * input.weeksPerYear;

    return {
      hourlyWage: mindestlohn2026,
      weeklyWage,
      monthlyWage,
      annualWage,
      aboveMinijobLimit: monthlyWage > 603,
    };
  },
};
