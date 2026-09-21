import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { roundToCents } from '../../core/math';

export interface BrFeriasInput {
  monthlySalary: number;
  vacationDays: number;
}

export interface BrFeriasResult {
  baseVacationPay: number;
  oneThirdBonus: number;
  totalGross: number;
}

export const brFeriasEngine: CalculatorEngine<BrFeriasInput, BrFeriasResult, never> = {
  validate(input): ValidationResult<BrFeriasInput> {
    const errors: Partial<Record<keyof BrFeriasInput, string>> = {};

    if (
      input.monthlySalary === undefined ||
      typeof input.monthlySalary === 'number' && Number.isNaN(input.monthlySalary) ||
      input.monthlySalary <= 0
    ) {
      errors.monthlySalary = 'errors.mustBePositive';
    }

    if (
      input.vacationDays === undefined ||
      typeof input.vacationDays === 'number' && Number.isNaN(input.vacationDays) ||
      input.vacationDays < 1 ||
      input.vacationDays > 30
    ) {
      errors.vacationDays = 'errors.invalidNumber';
    }

    return Object.keys(errors).length ? { valid: false, errors } : { valid: true, data: input };
  },

  calculate(input): BrFeriasResult {
    const baseVacationPay = (input.monthlySalary * input.vacationDays) / 30;
    const oneThirdBonus = baseVacationPay / 3;

    return {
      baseVacationPay: roundToCents(baseVacationPay),
      oneThirdBonus: roundToCents(oneThirdBonus),
      totalGross: roundToCents(baseVacationPay + oneThirdBonus),
    };
  },
};
