import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { roundToCents } from '../../core/math';

export interface BrLicencaMaternidadeInput {
  /** Monthly gross salary (CLT), BRL. */
  monthlySalary: number;
}

export interface BrLicencaMaternidadeResult {
  /** Leave duration in days. */
  leaveDays: number;
  /** Number of monthly benefit payments. */
  monthlyPayments: number;
  /** Benefit per month: 100% of salary, capped at the INSS ceiling. */
  monthlyBenefit: number;
  /** Total benefit for the whole leave. */
  totalBenefit: number;
  /** True when the salary exceeds the INSS ceiling. */
  isCapped: boolean;
  /** Salary amount above the ceiling (not covered by the statutory benefit). */
  cappedAmount: number;
}

/**
 * Brazilian maternity benefit (salário-maternidade) for CLT employees.
 *
 * Sources: CLT Art. 392 (120-day leave); Lei nº 8.213/1991 Art. 71-73;
 * Lei nº 10.710/2003 (employer pays the benefit and offsets it against INSS
 * contributions — "empresa paga e compensa"); INSS ceiling 2026: R$ 8.475,55.
 * - Benefit = 100% of the monthly salary, capped at the INSS ceiling.
 * - Paid in 4 monthly installments covering the 120 days.
 * - An optional 60-day extension exists via Programa Empresa Cidadã (Lei nº 11.770/2008).
 */
export const INSS_CEILING_2026 = 8475.55;
export const MATERNITY_LEAVE_DAYS = 120;
export const MATERNITY_MONTHLY_PAYMENTS = 4;

export const brLicencaMaternidadeEngine: CalculatorEngine<
  BrLicencaMaternidadeInput,
  BrLicencaMaternidadeResult,
  never
> = {
  validate(input): ValidationResult<BrLicencaMaternidadeInput> {
    const errors: Partial<Record<keyof BrLicencaMaternidadeInput, string>> = {};

    if (
      input.monthlySalary === undefined ||
      typeof input.monthlySalary === 'number' && Number.isNaN(input.monthlySalary) ||
      input.monthlySalary <= 0
    ) {
      errors.monthlySalary = 'errors.mustBePositive';
    }

    return Object.keys(errors).length ? { valid: false, errors } : { valid: true, data: input };
  },

  calculate(input): BrLicencaMaternidadeResult {
    const monthlyBenefit = roundToCents(Math.min(input.monthlySalary, INSS_CEILING_2026));
    const totalBenefit = roundToCents(monthlyBenefit * MATERNITY_MONTHLY_PAYMENTS);
    const isCapped = input.monthlySalary > INSS_CEILING_2026;

    return {
      leaveDays: MATERNITY_LEAVE_DAYS,
      monthlyPayments: MATERNITY_MONTHLY_PAYMENTS,
      monthlyBenefit,
      totalBenefit,
      isCapped,
      cappedAmount: isCapped ? roundToCents(input.monthlySalary - INSS_CEILING_2026) : 0,
    };
  },
};
