import type { CalculatorEngine, ValidationResult } from '../../core/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export type IeChristmasBonusPaymentType =
  | 'statePensionContributory'
  | 'statePensionNonContributory'
  | 'disabilityAllowance'
  | 'oneParentFamilyPayment'
  | 'invalidityPension'
  | 'carersAllowance'
  | 'bereavedPartnersPension'
  | 'farmAssist'
  | 'jobseekersAllowance'
  | 'jobseekersBenefit'
  | 'illnessBenefit'
  | 'supplementaryWelfareAllowance';

export type IeChristmasBonusDuration = 'under12' | '12plus';

export interface IeChristmasBonusInput {
  /** Social welfare payment the person receives. */
  paymentType: IeChristmasBonusPaymentType;
  /** How long they have been receiving it. */
  duration: IeChristmasBonusDuration;
  /** Their normal weekly payment amount, EUR. */
  weeklyAmount: number;
}

export type IeChristmasBonusRule =
  | 'long-term'
  | 'needs-12-months'
  | 'short-term-excluded';

export interface IeChristmasBonusResult {
  /** Whether the person qualifies for the Christmas Bonus. */
  qualifies: boolean;
  /** Which eligibility rule was applied. */
  rule: IeChristmasBonusRule;
  /** True when the 12-month duration requirement (where applicable) is met. */
  durationRequirementMet: boolean;
  weeklyAmount: number;
  /** 100% of the weekly payment (with the €20 statutory minimum) when eligible, otherwise 0. */
  bonusAmount: number;
  /** True when the €20 statutory minimum was applied instead of the weekly rate. */
  minimumApplied: boolean;
  /** i18n key for the payment-timing note; the UI layer provides the copy. */
  timingNoteKey: string;
  /** i18n key for the rule explanation; the UI layer provides the copy. */
  ruleSourceKey: string;
}

// ─── Rules ──────────────────────────────────────────────────────────────────

/**
 * Ireland Christmas Bonus eligibility (rules as published by Citizens
 * Information for the 2025 payment; the 2026 bonus had not been officially
 * confirmed at the time of writing, so the 2025 rules are applied and
 * labelled as expected 2026 rules on the page).
 *
 * - Long-term schemes (pensions, Disability Allowance, One-Parent Family
 *   Payment, Invalidity Pension, Carer's Allowance, Bereaved Partner's
 *   Pension, Farm Assist): qualify with no duration wait.
 * - Jobseeker's Allowance, Illness Benefit, Supplementary Welfare Allowance:
 *   qualify only after 12 months (Jobseeker's: 312 claim paid days).
 *   Illness Benefit is otherwise a short-term scheme that never qualified;
 *   long-term (12+ months) recipients were included from 2022.
 * - Jobseeker's Benefit: short-term scheme, never qualifies.
 * - Bonus = 100% of the normal weekly payment, minimum €20, paid
 *   automatically with the normal weekly payment in the first week of
 *   December (~1.5M recipients in 2025).
 */
const BONUS_RATE = 1.0;
const MIN_BONUS = 20; // EUR, statutory minimum per Citizens Information

const PAYMENT_RULES: Record<IeChristmasBonusPaymentType, IeChristmasBonusRule> = {
  statePensionContributory: 'long-term',
  statePensionNonContributory: 'long-term',
  disabilityAllowance: 'long-term',
  oneParentFamilyPayment: 'long-term',
  invalidityPension: 'long-term',
  carersAllowance: 'long-term',
  bereavedPartnersPension: 'long-term',
  farmAssist: 'long-term',
  jobseekersAllowance: 'needs-12-months',
  jobseekersBenefit: 'short-term-excluded',
  illnessBenefit: 'needs-12-months',
  supplementaryWelfareAllowance: 'needs-12-months',
};

const DURATION_OPTIONS: readonly IeChristmasBonusDuration[] = ['under12', '12plus'];

// ─── Engine ─────────────────────────────────────────────────────────────────

export const ieChristmasBonusEngine: CalculatorEngine<IeChristmasBonusInput, IeChristmasBonusResult, never> = {
  validate(input: IeChristmasBonusInput): ValidationResult<IeChristmasBonusInput> {
    const errors: Partial<Record<keyof IeChristmasBonusInput, string>> = {};

    if (!(input.paymentType in PAYMENT_RULES)) {
      errors.paymentType = 'errors.invalidPaymentType';
    }

    if (!DURATION_OPTIONS.includes(input.duration)) {
      errors.duration = 'errors.invalidDuration';
    }

    const w = input.weeklyAmount;
    if (w === undefined || w === null || (typeof w === 'number' && Number.isNaN(w))) {
      errors.weeklyAmount = 'errors.invalidNumber';
    } else if (w <= 0) {
      errors.weeklyAmount = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: IeChristmasBonusInput): IeChristmasBonusResult {
    const rule = PAYMENT_RULES[input.paymentType];
    const durationRequirementMet =
      rule !== 'needs-12-months' || input.duration === '12plus';
    const qualifies = rule === 'long-term' || (rule === 'needs-12-months' && durationRequirementMet);

    const weeklyAmount = input.weeklyAmount;
    const bonusAmount = qualifies ? Math.max(weeklyAmount * BONUS_RATE, MIN_BONUS) : 0;
    const minimumApplied = qualifies && bonusAmount === MIN_BONUS && weeklyAmount < MIN_BONUS;

    return {
      qualifies,
      rule,
      durationRequirementMet,
      weeklyAmount,
      bonusAmount,
      minimumApplied,
      timingNoteKey: 'ieChristmasBonus.timingNote',
      ruleSourceKey: 'ieChristmasBonus.ruleSource',
    };
  },
};
