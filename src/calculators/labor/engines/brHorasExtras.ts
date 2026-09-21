import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { roundToCents } from '../../core/math';

export interface BrHorasExtrasInput {
  monthlySalary: number;
  monthlyHours: number;
  overtimeHours: number;
  premiumPercent: number;
}

export interface BrHorasExtrasResult {
  hourlyRate: number;
  overtimeRate: number;
  overtimePay: number;
}

export const brHorasExtrasEngine: CalculatorEngine<
  BrHorasExtrasInput,
  BrHorasExtrasResult,
  never
> = {
  validate(input): ValidationResult<BrHorasExtrasInput> {
    const errors: Partial<Record<keyof BrHorasExtrasInput, string>> = {};

    if (
      input.monthlySalary === undefined ||
      typeof input.monthlySalary === 'number' && Number.isNaN(input.monthlySalary) ||
      input.monthlySalary <= 0
    ) {
      errors.monthlySalary = 'errors.mustBePositive';
    }

    if (
      input.monthlyHours === undefined ||
      typeof input.monthlyHours === 'number' && Number.isNaN(input.monthlyHours) ||
      input.monthlyHours <= 0
    ) {
      errors.monthlyHours = 'errors.invalidNumber';
    }

    if (
      input.overtimeHours === undefined ||
      typeof input.overtimeHours === 'number' && Number.isNaN(input.overtimeHours) ||
      input.overtimeHours < 0
    ) {
      errors.overtimeHours = 'errors.invalidNumber';
    }

    if (
      input.premiumPercent === undefined ||
      typeof input.premiumPercent === 'number' && Number.isNaN(input.premiumPercent) ||
      input.premiumPercent < 0
    ) {
      errors.premiumPercent = 'errors.invalidNumber';
    }

    return Object.keys(errors).length ? { valid: false, errors } : { valid: true, data: input };
  },

  calculate(input): BrHorasExtrasResult {
    const hourlyRate = input.monthlySalary / input.monthlyHours;
    const overtimeRate = hourlyRate * (1 + input.premiumPercent / 100);

    return {
      hourlyRate: roundToCents(hourlyRate),
      overtimeRate: roundToCents(overtimeRate),
      overtimePay: roundToCents(overtimeRate * input.overtimeHours),
    };
  },
};
