import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { imss2026, isrMonthlyBrackets2026 } from '../../../../data/salary/mx/mexicoPayrollData2026';

export interface MexicoSalaryInput {
  /** Monthly taxable income, MXN. */
  grossMonthly: number;
}

export interface MexicoSalaryResult {
  grossMonthly: number;
  isrMonthly: number;
  isrEffectiveRate: number;
  imssCesantiaYVejezEmployee: number;
  netMonthly: number;
  /** Partial IMSS only — Cesantía y Vejez branch only. */
  partialImssOnly: true;
}

export const mexicoSalaryEngine: CalculatorEngine<MexicoSalaryInput, MexicoSalaryResult, never> = {
  validate(input: MexicoSalaryInput): ValidationResult<MexicoSalaryInput> {
    const errors: Partial<Record<keyof MexicoSalaryInput, string>> = {};

    if (!input.grossMonthly || Number.isNaN(input.grossMonthly)) {
      errors.grossMonthly = 'errors.invalidNumber';
    } else if (input.grossMonthly <= 0) {
      errors.grossMonthly = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: MexicoSalaryInput): MexicoSalaryResult {
    const gross = input.grossMonthly;
    const imssCesantiaYVejezEmployee = gross * imss2026.cesantiaYVejezEmployeeRate;
    const isrTaxableBase = Math.max(0, gross - imssCesantiaYVejezEmployee);
    const { totalTax: isrMonthly, effectiveRate: isrEffectiveRate } =
      calculateProgressiveTax(isrTaxableBase, isrMonthlyBrackets2026);
    const netMonthly = gross - imssCesantiaYVejezEmployee - isrMonthly;

    return {
      grossMonthly: gross,
      isrMonthly,
      isrEffectiveRate,
      imssCesantiaYVejezEmployee,
      netMonthly,
      partialImssOnly: true,
    };
  },
};
