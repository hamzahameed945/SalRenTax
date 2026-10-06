import type { CalculatorEngine, ValidationResult } from '../../core/types';

export interface NgThirteenthMonthInput {
  /** Gross monthly salary (₦). */
  monthlyGrossSalary: number;
  /** Annual gross salary excluding the bonus (₦), used to find the marginal PAYE rate. */
  annualGrossSalary: number;
}

export interface NgThirteenthMonthResult {
  monthlyGrossSalary: number;
  annualGrossSalary: number;
  /** Gross 13th month bonus = one full monthly gross salary. */
  grossBonus: number;
  /** Marginal PAYE rate (as a decimal) for the annual income band. */
  marginalPayeRate: number;
  /** PAYE withheld from the bonus = grossBonus × marginalPayeRate. */
  payeOnBonus: number;
  /** Net 13th month bonus = grossBonus − payeOnBonus. */
  netBonus: number;
}

/**
 * Nigeria 13th month salary bonus, 2026.
 * The gross bonus equals one month's gross salary. It is taxable as
 * employment income, so PAYE is withheld at the marginal rate from the
 * Nigeria Tax Act 2025 progressive bands applied to the employee's annual
 * income (bands apply to chargeable income):
 * - First ₦800,000 @ 0%
 * - ₦800,001–₦3,000,000 @ 15%
 * - ₦3,000,001–₦12,000,000 @ 18%
 * - ₦12,000,001–₦25,000,000 @ 21%
 * - ₦25,000,001–₦50,000,000 @ 23%
 * - Above ₦50,000,000 @ 25%
 * (Nigeria Tax Act 2025, signed 26 June 2025, effective 1 January 2026.)
 *
 * Note: unlike the Philippine 13th month pay, the 13th month in Nigeria is
 * CUSTOMARY, not a statutory requirement — employers vary in whether and
 * how they pay it.
 */
const PAYE_BANDS: Array<{ upperLimit: number; rate: number }> = [
  { upperLimit: 800_000, rate: 0 },
  { upperLimit: 3_000_000, rate: 0.15 },
  { upperLimit: 12_000_000, rate: 0.18 },
  { upperLimit: 25_000_000, rate: 0.21 },
  { upperLimit: 50_000_000, rate: 0.23 },
  { upperLimit: Number.POSITIVE_INFINITY, rate: 0.25 },
];

export function marginalPayeRate(annualGrossSalary: number): number {
  for (const band of PAYE_BANDS) {
    if (annualGrossSalary <= band.upperLimit) {
      return band.rate;
    }
  }
  return PAYE_BANDS[PAYE_BANDS.length - 1].rate;
}

export const ngThirteenthMonthEngine: CalculatorEngine<
  NgThirteenthMonthInput,
  NgThirteenthMonthResult,
  never
> = {
  validate(input: NgThirteenthMonthInput): ValidationResult<NgThirteenthMonthInput> {
    const errors: Partial<Record<keyof NgThirteenthMonthInput, string>> = {};

    if (!input.monthlyGrossSalary || Number.isNaN(input.monthlyGrossSalary) || input.monthlyGrossSalary <= 0) {
      errors.monthlyGrossSalary = 'errors.mustBePositive';
    }
    if (!input.annualGrossSalary || Number.isNaN(input.annualGrossSalary) || input.annualGrossSalary <= 0) {
      errors.annualGrossSalary = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: NgThirteenthMonthInput): NgThirteenthMonthResult {
    const grossBonus = input.monthlyGrossSalary;
    const marginalRate = marginalPayeRate(input.annualGrossSalary);
    const payeOnBonus = grossBonus * marginalRate;
    const netBonus = grossBonus - payeOnBonus;

    return {
      monthlyGrossSalary: input.monthlyGrossSalary,
      annualGrossSalary: input.annualGrossSalary,
      grossBonus,
      marginalPayeRate: marginalRate,
      payeOnBonus,
      netBonus,
    };
  },
};
