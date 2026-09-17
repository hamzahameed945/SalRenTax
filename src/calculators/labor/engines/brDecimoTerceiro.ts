import type { CalculatorEngine, ValidationResult } from '../../core/types';

export interface BrDecimoTerceiroInput {
  /** Monthly gross salary, BRL. */
  grossMonthly: number;
  /** Months worked in the year (1–12). */
  monthsWorked: number;
}

export interface BrDecimoTerceiroResult {
  firstInstallment: number;
  secondInstallment: number;
  totalDecimoTerceiro: number;
}

/**
 * Brazilian 13th salary (décimo terceiro salário) calculator.
 * Source: CLT Art. 7º inciso VIII; Lei nº 4.090/1962.
 * - Total = grossMonthly × (monthsWorked / 12)
 * - 1st installment (paid Nov): half of total
 * - 2nd installment (paid Dec): half of total (may be subject to INSS/IR deductions in practice)
 */
export const brDecimoTerceiroEngine: CalculatorEngine<BrDecimoTerceiroInput, BrDecimoTerceiroResult, never> = {
  validate(input: BrDecimoTerceiroInput): ValidationResult<BrDecimoTerceiroInput> {
    const errors: Partial<Record<keyof BrDecimoTerceiroInput, string>> = {};

    if (!input.grossMonthly || Number.isNaN(input.grossMonthly)) {
      errors.grossMonthly = 'errors.invalidNumber';
    } else if (input.grossMonthly <= 0) {
      errors.grossMonthly = 'errors.mustBePositive';
    }

    if (
      input.monthsWorked === undefined ||
      Number.isNaN(input.monthsWorked) ||
      input.monthsWorked < 1 ||
      input.monthsWorked > 12
    ) {
      errors.monthsWorked = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: BrDecimoTerceiroInput): BrDecimoTerceiroResult {
    const total = input.grossMonthly * (input.monthsWorked / 12);
    const firstInstallment = total / 2;
    const secondInstallment = total / 2;

    return {
      firstInstallment,
      secondInstallment,
      totalDecimoTerceiro: total,
    };
  },
};
