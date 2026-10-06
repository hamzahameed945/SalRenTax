import type { CalculatorEngine, ValidationResult } from '../../core/types';

/** Employment days in the May 1 – Dec 31 window that earn the full bonus. */
export const GR_DORO_FULL_DAYS = 243;
/** Days of employment earning one bonus share. */
export const GR_DORO_DAYS_PER_SHARE = 19;
/** Bonus share per 19-day block: 2/25 of the monthly salary. */
export const GR_DORO_SHARE_OF_SALARY = 2 / 25;
/** Vacation-allowance (επίδομα αδείας) uplift: the bonus is multiplied by 1.041666. */
export const GR_DORO_VACATION_FACTOR = 1.041666;
/** Statutory payment deadline for the 2026 bonus. */
export const GR_DORO_DEADLINE_2026 = '2026-12-21';

export interface GrDoroInput {
  /** Regular monthly salary (μισθός), EUR — pay in effect on Dec 10 (or the day employment ended). */
  monthlySalary: number;
  /** Days of employment within the May 1 – Dec 31 window (0–243). */
  daysWorked: number;
}

export interface GrDoroResult {
  monthlySalary: number;
  daysWorked: number;
  /** Full bonus for the whole reference window: monthlySalary × 1.041666. */
  fullBonus: number;
  /** (daysWorked / 19) × (2/25), capped at 1 for the full window. */
  proRataFraction: number;
  /** Bonus before the vacation-allowance uplift. */
  baseBonus: number;
  /** Vacation-allowance uplift factor (1.041666). */
  vacationFactor: number;
  /** Gross bonus actually due. */
  doroBruto: number;
}

/**
 * Greece Christmas bonus (Δώρο Χριστουγέννων) — private sector.
 * Verified 2026 rules (e-howto.gr, daidis.net):
 * - Employment covering the whole May 1 – Dec 31 window → one full monthly salary.
 * - Otherwise 2/25 of the monthly salary for every 19 days of employment
 *   (a proportional fraction applies below 19 days).
 * - The result is multiplied by 1.041666 for the vacation allowance
 *   (επίδομα αδείας).
 * - Reference salary: regular pay in effect on December 10 (or the day the
 *   employment ended). Payable by December 21 each year.
 * Note: the bonus is subject to EFKA (ΕΦΚΑ) contributions and income tax
 * (φόρος μισθωτών υπηρεσιών) in practice; this engine returns the gross
 * (μικτό) amount only. Private sector only — the public-sector Christmas
 * bonus is abolished.
 */
export const grDoroHristougennonEngine: CalculatorEngine<GrDoroInput, GrDoroResult, never> = {
  validate(input: GrDoroInput): ValidationResult<GrDoroInput> {
    const errors: Partial<Record<keyof GrDoroInput, string>> = {};

    if (!input.monthlySalary || Number.isNaN(input.monthlySalary) || input.monthlySalary <= 0) {
      errors.monthlySalary = 'errors.mustBePositive';
    }
    if (
      input.daysWorked === undefined ||
      Number.isNaN(input.daysWorked) ||
      !Number.isInteger(input.daysWorked) ||
      input.daysWorked < 0 ||
      input.daysWorked > GR_DORO_FULL_DAYS
    ) {
      errors.daysWorked = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: GrDoroInput): GrDoroResult {
    const proRataFraction = Math.min(
      (input.daysWorked / GR_DORO_DAYS_PER_SHARE) * GR_DORO_SHARE_OF_SALARY,
      1,
    );
    const baseBonus = input.monthlySalary * proRataFraction;

    return {
      monthlySalary: input.monthlySalary,
      daysWorked: input.daysWorked,
      fullBonus: input.monthlySalary * GR_DORO_VACATION_FACTOR,
      proRataFraction,
      baseBonus,
      vacationFactor: GR_DORO_VACATION_FACTOR,
      doroBruto: baseBonus * GR_DORO_VACATION_FACTOR,
    };
  },
};
