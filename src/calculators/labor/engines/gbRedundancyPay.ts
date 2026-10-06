import type { CalculatorEngine, ValidationResult } from '../../core/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GbRedundancyPayInput {
  /** Employee's age on the date employment ends. */
  age: number;
  /** Complete years of continuous employment. Service over 20 years is capped at 20. */
  yearsOfService: number;
  /** Gross weekly pay, GBP (a week's pay before tax and NI). */
  grossWeeklyPay: number;
}

export type GbRedundancyPayBand = 'under22' | '22to40' | 'age41plus';

export interface GbRedundancyPayBandLine {
  band: GbRedundancyPayBand;
  /** Statutory multiplier: 0.5 / 1 / 1.5 weeks per year. */
  multiplier: 0.5 | 1 | 1.5;
  /** Complete years of service falling in this band. */
  years: number;
  /** Weeks of pay from this band: years × multiplier. */
  weeks: number;
}

export interface GbRedundancyPayResult {
  /** Statutory redundancy pay needs 2+ years of continuous employment. */
  qualifiesForStatutory: boolean;
  /** Years actually counted: min(yearsOfService, 20). */
  yearsCounted: number;
  /** Weekly pay after the statutory cap: min(grossWeeklyPay, WEEKLY_PAY_CAP). */
  cappedWeeklyPay: number;
  /** True when the employee's pay exceeded the statutory cap. */
  capApplied: boolean;
  /** Total weeks of pay across all age bands. */
  totalWeeks: number;
  /** Per-band breakdown, only bands with ≥ 1 year are included. */
  bands: GbRedundancyPayBandLine[];
  /** Statutory redundancy pay: totalWeeks × cappedWeeklyPay. */
  statutoryPay: number;
  /** Termination payments up to this combined amount are normally tax-free. */
  taxFreeAllowance: number;
}

// ─── Rules ──────────────────────────────────────────────────────────────────

/**
 * Statutory redundancy pay (Great Britain), rules verified against GOV.UK on
 * 2026-10-06:
 *
 * - Source: Employment Rights Act 1996, Part XI / gov.uk "Redundancy: your
 *   rights" and "Explaining your redundancy payments" guidance.
 * - For redundancies on or after 6 April 2026, a week's pay is capped at
 *   £751 (was £719 before 6 April 2026). Maximum statutory redundancy pay is
 *   30 × £751 = £22,530. The cap is uprated every April.
 * - Length of service is capped at 20 years. Only complete years count.
 * - Years are counted backwards from the date employment ends. For each
 *   complete year, the multiplier depends on the employee's age during that
 *   year: 0.5 week's pay per year aged under 22, 1 week's pay per year aged
 *   22 to 40, 1.5 weeks' pay per year aged 41 or over.
 * - £30,000 tax-free rule (gov.uk "Tax on termination payments"): the first
 *   combined £30,000 of statutory redundancy pay, enhanced severance and
 *   non-cash termination benefits is normally free of Income Tax and employee
 *   National Insurance; tax is charged only on the excess, and the employer
 *   pays Class 1A employer NI on the excess. PILON, holiday pay and bonuses
 *   are taxed as earnings and do not count towards the £30,000.
 * - Northern Ireland uses a separate limit (£783/week from 6 April 2026);
 *   this calculator applies the Great Britain (£751) limit.
 */
export const WEEKLY_PAY_CAP_GB_2026 = 751;
export const TAX_FREE_ALLOWANCE = 30000;
export const MAX_YEARS_OF_SERVICE = 20;
export const QUALIFYING_YEARS = 2;

function multiplierForAge(age: number): 0.5 | 1 | 1.5 {
  if (age < 22) return 0.5;
  if (age <= 40) return 1;
  return 1.5;
}

function bandForAge(age: number): GbRedundancyPayBand {
  if (age < 22) return 'under22';
  if (age <= 40) return '22to40';
  return 'age41plus';
}

export const gbRedundancyPayEngine: CalculatorEngine<
  GbRedundancyPayInput,
  GbRedundancyPayResult,
  never
> = {
  validate(input: GbRedundancyPayInput): ValidationResult<GbRedundancyPayInput> {
    const errors: Partial<Record<keyof GbRedundancyPayInput, string>> = {};

    if (!Number.isFinite(input.age) || input.age < 16 || input.age > 100) {
      errors.age = 'errors.invalidAge';
    }
    if (
      !Number.isFinite(input.yearsOfService) ||
      input.yearsOfService < 0 ||
      input.yearsOfService > 60
    ) {
      errors.yearsOfService = 'errors.invalidYearsOfService';
    }
    if (
      !Number.isFinite(input.grossWeeklyPay) ||
      input.grossWeeklyPay < 0 ||
      input.grossWeeklyPay > 100000
    ) {
      errors.grossWeeklyPay = 'errors.invalidWeeklyPay';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: GbRedundancyPayInput): GbRedundancyPayResult {
    const yearsCounted = Math.min(
      Math.floor(input.yearsOfService),
      MAX_YEARS_OF_SERVICE,
    );
    const cappedWeeklyPay = Math.min(input.grossWeeklyPay, WEEKLY_PAY_CAP_GB_2026);

    // Count backwards from the end of employment: for year i (1-indexed),
    // the age at the end of that year is age - (i - 1).
    const yearsByBand: Record<GbRedundancyPayBand, number> = {
      under22: 0,
      '22to40': 0,
      age41plus: 0,
    };
    for (let i = 1; i <= yearsCounted; i += 1) {
      yearsByBand[bandForAge(input.age - (i - 1))] += 1;
    }

    const bands: GbRedundancyPayBandLine[] = (
      Object.keys(yearsByBand) as GbRedundancyPayBand[]
    )
      .filter((band) => yearsByBand[band] > 0)
      .map((band) => {
        const years = yearsByBand[band];
        const multiplier = multiplierForAge(band === 'under22' ? 21 : band === '22to40' ? 30 : 41);
        return { band, multiplier, years, weeks: years * multiplier };
      });

    const totalWeeks = bands.reduce((sum, line) => sum + line.weeks, 0);
    const statutoryPay = totalWeeks * cappedWeeklyPay;

    return {
      qualifiesForStatutory: input.yearsOfService >= QUALIFYING_YEARS,
      yearsCounted,
      cappedWeeklyPay,
      capApplied: input.grossWeeklyPay > WEEKLY_PAY_CAP_GB_2026,
      totalWeeks,
      bands,
      statutoryPay,
      taxFreeAllowance: TAX_FREE_ALLOWANCE,
    };
  },
};
