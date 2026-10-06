import type { CalculatorEngine, ValidationResult } from '../../core/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export type GbMaWorkStatus =
  | 'employed'
  | 'selfEmployed'
  | 'recentlyStopped'
  | 'spouseBusiness';

export interface GbMaternityAllowanceInput {
  /** How the claimant worked during the 66-week test period. */
  workStatus: GbMaWorkStatus;
  /** Weeks worked (employed or self-employed) in the 66 weeks before the due date. */
  weeksWorked: number;
  /** Weeks with earnings of £30/week or more (employed/recently stopped). */
  weeksAtLeast30: number;
  /** Average weekly earnings from the claimant's 13 highest-earning weeks, GBP. */
  averageWeeklyEarnings: number;
  /** Weeks of Class 2 NI paid in the test period (self-employed only). */
  class2WeeksPaid: number;
  /** Claimants who get Statutory Maternity Pay from another job cannot get MA. */
  receivesSmpFromAnotherJob: boolean;
}

export type GbMaIneligibilityReason =
  | 'receives-smp'
  | 'too-few-work-weeks'
  | 'too-few-high-earning-weeks';

export type GbMaRateBasis =
  | 'standard'
  | 'ninety-percent'
  | 'reduced'
  | 'minimum';

export interface GbMaternityAllowanceResult {
  /** Whether the claimant is eligible for Maternity Allowance. */
  eligible: boolean;
  /** Machine-readable reasons for ineligibility (empty when eligible). */
  ineligibilityReasons: GbMaIneligibilityReason[];
  /** Weekly payment rate in GBP (0 when not eligible). */
  weeklyRate: number;
  /** Number of weeks the payment runs for: 39, or 14 for the spouse/partner unpaid-work case. */
  paidWeeks: number;
  /** Total Maternity Allowance over the payment period in GBP. */
  totalAmount: number;
  /** Which rule produced the weekly rate. */
  rateBasis: GbMaRateBasis;
  /** Weeks of Class 2 NI short of the 13-week full-rate threshold (self-employed). */
  class2ShortfallWeeks: number;
  /** Weekly Class 2 NI cost so claimants can see the top-up trade-off. */
  class2WeeklyCost: number;
}

// ─── Rules ──────────────────────────────────────────────────────────────────
/**
 * UK Maternity Allowance, 2026/27 (verified against GOV.UK, October 2026).
 *
 * Rates apply to claims where the payment period falls between
 * 5 April 2026 and 3 April 2027:
 * - Standard rate: £194.32/week, or 90% of average weekly earnings from the
 *   13 highest-earning weeks — whichever is lower — for up to 39 weeks.
 * - Self-employed: between £27 and £194.32/week for up to 39 weeks, based on
 *   Class 2 NI contributions in the 66-week test period. 13+ weeks paid (or
 *   treated as paid) = full entitlement; fewer = reduced pro-rata rate
 *   (weekly = full rate × weeks paid ÷ 13, minimum £27); none paid = £27/week.
 * - Unpaid work for a spouse/civil partner's business: £27/week for up to
 *   14 weeks (needs 26 weeks of such work in the test period; the partner
 *   must be registered self-employed and paying Class 2 NI).
 * - Class 2 NI: £3.65/week.
 *
 * Eligibility: employed or registered self-employed for at least 26 weeks in
 * the 66 weeks before the baby's due date; employed claimants must also have
 * earned (or been classed as earning) £30/week or more in at least 13 of
 * those weeks. Weeks do not need to be together; different jobs and periods
 * of unemployment are fine. No eligibility if the claimant gets Statutory
 * Maternity Pay from another job.
 *
 * Maternity Allowance is not taxable.
 */

export const GB_MA_STANDARD_RATE = 194.32; // GBP/week, 2026/27
export const GB_MA_MINIMUM_RATE = 27; // GBP/week fallback
export const GB_MA_FULL_WEEKS = 39;
export const GB_MA_SPOUSE_BUSINESS_WEEKS = 14;
export const GB_MA_TEST_PERIOD_WEEKS = 66;
export const GB_MA_MIN_WORK_WEEKS = 26;
export const GB_MA_MIN_HIGH_EARNING_WEEKS = 13;
export const GB_MA_HIGH_EARNING_THRESHOLD = 30; // GBP/week
export const GB_MA_FULL_CLASS2_WEEKS = 13;
export const GB_MA_CLASS2_WEEKLY_COST = 3.65; // GBP/week, 2026/27

const WORK_STATUSES: readonly GbMaWorkStatus[] = [
  'employed',
  'selfEmployed',
  'recentlyStopped',
  'spouseBusiness',
];

const roundPence = (v: number) => Math.round(v * 100) / 100;

// ─── Engine ─────────────────────────────────────────────────────────────────

export const gbMaternityAllowanceEngine: CalculatorEngine<
  GbMaternityAllowanceInput,
  GbMaternityAllowanceResult,
  never
> = {
  validate(input: GbMaternityAllowanceInput): ValidationResult<GbMaternityAllowanceInput> {
    const errors: Partial<Record<keyof GbMaternityAllowanceInput, string>> = {};

    if (!WORK_STATUSES.includes(input.workStatus)) {
      errors.workStatus = 'errors.invalidWorkStatus';
    }

    const int = (v: unknown) => typeof v === 'number' && Number.isInteger(v);

    if (!int(input.weeksWorked) || input.weeksWorked < 0 || input.weeksWorked > GB_MA_TEST_PERIOD_WEEKS) {
      errors.weeksWorked = 'errors.invalidWeeksWorked';
    }
    if (!int(input.weeksAtLeast30) || input.weeksAtLeast30 < 0 || input.weeksAtLeast30 > input.weeksWorked) {
      errors.weeksAtLeast30 = 'errors.invalidWeeksAtLeast30';
    }
    if (typeof input.averageWeeklyEarnings !== 'number' || Number.isNaN(input.averageWeeklyEarnings) || input.averageWeeklyEarnings < 0) {
      errors.averageWeeklyEarnings = 'errors.invalidNumber';
    }
    if (!int(input.class2WeeksPaid) || input.class2WeeksPaid < 0 || input.class2WeeksPaid > GB_MA_TEST_PERIOD_WEEKS) {
      errors.class2WeeksPaid = 'errors.invalidClass2Weeks';
    }
    if (typeof input.receivesSmpFromAnotherJob !== 'boolean') {
      errors.receivesSmpFromAnotherJob = 'errors.invalidBoolean';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: GbMaternityAllowanceInput): GbMaternityAllowanceResult {
    const reasons: GbMaIneligibilityReason[] = [];

    if (input.receivesSmpFromAnotherJob) {
      reasons.push('receives-smp');
    }
    if (input.weeksWorked < GB_MA_MIN_WORK_WEEKS) {
      reasons.push('too-few-work-weeks');
    }
    // The spouse/partner unpaid-work route has no £30 earnings requirement.
    if (input.workStatus !== 'spouseBusiness' && input.weeksAtLeast30 < GB_MA_MIN_HIGH_EARNING_WEEKS) {
      reasons.push('too-few-high-earning-weeks');
    }

    const eligible = reasons.length === 0;

    if (!eligible) {
      return {
        eligible: false,
        ineligibilityReasons: reasons,
        weeklyRate: 0,
        paidWeeks: 0,
        totalAmount: 0,
        rateBasis: 'minimum',
        class2ShortfallWeeks: 0,
        class2WeeklyCost: GB_MA_CLASS2_WEEKLY_COST,
      };
    }

    // Unpaid work for a spouse/partner's business: flat £27 for up to 14 weeks.
    if (input.workStatus === 'spouseBusiness') {
      const weeklyRate = GB_MA_MINIMUM_RATE;
      return {
        eligible: true,
        ineligibilityReasons: [],
        weeklyRate,
        paidWeeks: GB_MA_SPOUSE_BUSINESS_WEEKS,
        totalAmount: roundPence(weeklyRate * GB_MA_SPOUSE_BUSINESS_WEEKS),
        rateBasis: 'minimum',
        class2ShortfallWeeks: 0,
        class2WeeklyCost: GB_MA_CLASS2_WEEKLY_COST,
      };
    }

    // Full entitlement rate: standard rate or 90% of AWE, whichever is lower.
    const fullRate = Math.min(GB_MA_STANDARD_RATE, roundPence(input.averageWeeklyEarnings * 0.9));
    const rateBasis90 = fullRate < GB_MA_STANDARD_RATE;

    // Self-employed reduced rate: pro-rata by Class 2 weeks, minimum £27.
    if (input.workStatus === 'selfEmployed' && input.class2WeeksPaid < GB_MA_FULL_CLASS2_WEEKS) {
      const weeklyRate = input.class2WeeksPaid === 0
        ? GB_MA_MINIMUM_RATE
        : Math.max(GB_MA_MINIMUM_RATE, roundPence(fullRate * input.class2WeeksPaid / GB_MA_FULL_CLASS2_WEEKS));
      return {
        eligible: true,
        ineligibilityReasons: [],
        weeklyRate,
        paidWeeks: GB_MA_FULL_WEEKS,
        totalAmount: roundPence(weeklyRate * GB_MA_FULL_WEEKS),
        rateBasis: 'reduced',
        class2ShortfallWeeks: GB_MA_FULL_CLASS2_WEEKS - input.class2WeeksPaid,
        class2WeeklyCost: GB_MA_CLASS2_WEEKLY_COST,
      };
    }

    return {
      eligible: true,
      ineligibilityReasons: [],
      weeklyRate: fullRate,
      paidWeeks: GB_MA_FULL_WEEKS,
      totalAmount: roundPence(fullRate * GB_MA_FULL_WEEKS),
      rateBasis: rateBasis90 ? 'ninety-percent' : 'standard',
      class2ShortfallWeeks: 0,
      class2WeeklyCost: GB_MA_CLASS2_WEEKLY_COST,
    };
  },
};
