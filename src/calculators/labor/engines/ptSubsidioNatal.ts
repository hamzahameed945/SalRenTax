import type { CalculatorEngine, ValidationResult } from '../../core/types';

export interface PtSubsidioNatalInput {
  /** Monthly base salary (retribuição base mensal), EUR. */
  baseMonthly: number;
  /** Months worked in the calendar year (0–12). */
  monthsWorked: number;
  /** Whether the worker receives the subsidy spread over 12 months (duodécimos). */
  duodecimos: boolean;
}

export interface PtSubsidioNatalResult {
  baseMonthly: number;
  monthsWorked: number;
  duodecimos: boolean;
  /** Gross subsidy: baseMonthly × (monthsWorked / 12). Full year (12 months) = one full month. */
  subsidioBruto: number;
  /** Monthly duodécimo: 1/12 of the (possibly proportional) subsidy. 0 when duodecimos is false. */
  duodecimoMensal: number;
}

/**
 * Portugal subsídio de Natal ("13th month"), 2026 estimate.
 * Source: Código do Trabalho, art. 263.º — the worker is entitled to a Natal
 * subsidy equal to one month of retribuição, payable by 15 December each year;
 * the amount is proportional to time worked in the calendar year (admission
 * year, termination year, or contract suspension not caused by the employer).
 * - Full year (12 months): subsidy = 1 month of base salary.
 * - Partial year: subsidy = baseMonthly × (monthsWorked / 12).
 * - Duodécimos: the subsidy is paid monthly as 1/12 of the (proportional) amount.
 * Note: the subsidy is subject to IRS withholding and Segurança Social
 * contributions like salary; this calculator returns the gross amount only.
 */
export const ptSubsidioNatalEngine: CalculatorEngine<
  PtSubsidioNatalInput,
  PtSubsidioNatalResult,
  never
> = {
  validate(input: PtSubsidioNatalInput): ValidationResult<PtSubsidioNatalInput> {
    const errors: Partial<Record<keyof PtSubsidioNatalInput, string>> = {};

    if (!input.baseMonthly || Number.isNaN(input.baseMonthly) || input.baseMonthly <= 0) {
      errors.baseMonthly = 'errors.mustBePositive';
    }
    if (
      input.monthsWorked === undefined ||
      Number.isNaN(input.monthsWorked) ||
      input.monthsWorked < 0 ||
      input.monthsWorked > 12
    ) {
      errors.monthsWorked = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: PtSubsidioNatalInput): PtSubsidioNatalResult {
    const subsidioBruto = input.baseMonthly * (input.monthsWorked / 12);
    const duodecimoMensal = input.duodecimos ? subsidioBruto / 12 : 0;

    return {
      baseMonthly: input.baseMonthly,
      monthsWorked: input.monthsWorked,
      duodecimos: input.duodecimos,
      subsidioBruto,
      duodecimoMensal,
    };
  },
};
