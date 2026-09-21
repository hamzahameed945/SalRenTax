import type { CalculatorEngine, ValidationResult } from '../../core/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export type EsDismissalType = 'voluntary' | 'objectiveDismissal' | 'unfairDismissal';

export interface EsFiniquitoInput {
  /** Annual gross salary, EUR. */
  grossAnnual: number;
  /** Complete years worked (fractions accepted for partial year). */
  yearsWorked: number;
  /** Vacation days not yet taken. */
  daysHolidayPending: number;
  dismissalType: EsDismissalType;
  /**
   * Month of departure/dismissal (1–12).
   * Used for accurate proportional extra-pay accrual.
   * Default: 6 (mid-year).
   */
  departureMonth?: number;
  /**
   * Years of service completed BEFORE 12 February 2012 (ET reform, RDL 3/2012).
   * For unfair dismissal those years are compensated at 45 days/year (max 42 months).
   * Leave as 0 if all service is after 12 Feb 2012.
   */
  yearsWorkedPre2012?: number;
  /** Number of extra "pagas" per year (12 or 14). Affects proportional pay. */
  paymentsPerYear?: 12 | 14;
}

export interface EsFiniquitoBreakdown {
  // ── Proportional extra pays ──────────────────────────────────────────
  /** Number of extra pays (paymentsPerYear - 12). */
  extraPays: number;
  /** Months elapsed in current bonus year. */
  monthsInYear: number;
  /** Proportional extra pay for the period worked this year. */
  proportionalExtraPay: number;

  // ── Holiday pay ──────────────────────────────────────────────────────
  /** Daily rate (grossAnnual / 365). */
  dailyRate: number;
  /** Vacation pay: daysHolidayPending × dailyRate. */
  holidayPay: number;

  // ── Severance ────────────────────────────────────────────────────────
  /** Pre-2012 tranche severance (45 days/year, cap 42 months). */
  severancePre2012: number;
  /** Post-2012 tranche severance (33 days/year objective: 20 days/year). */
  severancePost2012: number;
  /** Total severance pay. */
  severancePay: number;
  /** Whether any pre-2012 cap (42 months) was applied. */
  pre2012CapApplied: boolean;
  /** Whether any post-2012 cap (24 months for unfair) was applied. */
  post2012CapApplied: boolean;

  totalFiniquito: number;
}

// ─── Engine ─────────────────────────────────────────────────────────────────

/** Months elapsed in a calendar year up to and including departureMonth. */
function monthsElapsed(departureMonth: number): number {
  return Math.min(12, Math.max(1, departureMonth));
}

export const esFiniquitoEngine: CalculatorEngine<EsFiniquitoInput, EsFiniquitoBreakdown, never> = {
  validate(input: EsFiniquitoInput): ValidationResult<EsFiniquitoInput> {
    const errors: Partial<Record<keyof EsFiniquitoInput, string>> = {};

    if (!input.grossAnnual || Number.isNaN(input.grossAnnual)) {
      errors.grossAnnual = 'errors.invalidNumber';
    } else if (input.grossAnnual <= 0) {
      errors.grossAnnual = 'errors.mustBePositive';
    }

    if (input.yearsWorked === undefined || Number.isNaN(input.yearsWorked) || input.yearsWorked < 0) {
      errors.yearsWorked = 'errors.invalidNumber';
    }

    if (
      input.daysHolidayPending === undefined ||
      Number.isNaN(input.daysHolidayPending) ||
      input.daysHolidayPending < 0 ||
      input.daysHolidayPending > 365
    ) {
      errors.daysHolidayPending = 'errors.invalidNumber';
    }

    if (input.departureMonth !== undefined) {
      const m = input.departureMonth;
      if (Number.isNaN(m) || m < 1 || m > 12) {
        errors.departureMonth = 'errors.invalidNumber';
      }
    }

    const pre2012 = input.yearsWorkedPre2012 ?? 0;
    if (Number.isNaN(pre2012) || pre2012 < 0 || pre2012 > input.yearsWorked) {
      errors.yearsWorkedPre2012 = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: EsFiniquitoInput): EsFiniquitoBreakdown {
    const {
      grossAnnual,
      yearsWorked,
      daysHolidayPending,
      dismissalType,
      departureMonth = 6,
      yearsWorkedPre2012 = 0,
      paymentsPerYear = 14,
    } = input;

    const dailyRate   = grossAnnual / 365;
    const monthlyRate = grossAnnual / 12;

    // ── Proportional extra pays ──────────────────────────────────────────
    // Extra pays = paymentsPerYear - 12 (typically 2 for 14-paga workers)
    const extraPays   = paymentsPerYear - 12;            // 0 or 2
    const mElapsed    = monthsElapsed(departureMonth);
    // Each extra pay is worth 1 monthly salary; accrual = months worked / 12
    const proportionalExtraPay = extraPays > 0
      ? (monthlyRate * extraPays) * (mElapsed / 12)
      : 0;

    // ── Holiday pay ──────────────────────────────────────────────────────
    const holidayPay = daysHolidayPending * dailyRate;

    // ── Severance ────────────────────────────────────────────────────────
    let severancePre2012  = 0;
    let severancePost2012 = 0;
    let pre2012CapApplied  = false;
    let post2012CapApplied = false;

    const yearsPost2012 = Math.max(0, yearsWorked - yearsWorkedPre2012);

    if (dismissalType === 'unfairDismissal') {
      // Pre-2012 tranche: 45 days/year, capped at 42 monthly salaries
      if (yearsWorkedPre2012 > 0) {
        const raw = 45 * dailyRate * yearsWorkedPre2012;
        const cap = monthlyRate * 42;
        severancePre2012  = Math.min(raw, cap);
        pre2012CapApplied = raw > cap;
      }
      // Post-2012 tranche: 33 days/year, capped at 24 monthly salaries
      if (yearsPost2012 > 0) {
        const raw = 33 * dailyRate * yearsPost2012;
        const cap = monthlyRate * 24;
        severancePost2012  = Math.min(raw, cap);
        post2012CapApplied = raw > cap;
      }
    } else if (dismissalType === 'objectiveDismissal') {
      // 20 days/year, cap 12 monthly salaries — applies to all years
      const raw = 20 * dailyRate * yearsWorked;
      const cap = monthlyRate * 12;
      severancePost2012  = Math.min(raw, cap);
      post2012CapApplied = raw > cap;
    }
    // voluntary: no severance

    const severancePay = severancePre2012 + severancePost2012;
    const totalFiniquito = proportionalExtraPay + holidayPay + severancePay;

    return {
      extraPays,
      monthsInYear:         mElapsed,
      proportionalExtraPay,
      dailyRate,
      holidayPay,
      severancePre2012,
      severancePost2012,
      severancePay,
      pre2012CapApplied,
      post2012CapApplied,
      totalFiniquito,
    };
  },
};
