import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { roundToCents } from '../../core/math';

export type SeniorityTier = 'individual-contributor' | 'manager' | 'executive';

/**
 * Market benchmark multipliers for the standard "1–2 weeks of pay per year
 * of service" severance rule. These are observed market norms, not law.
 */
export const SEVERANCE_TIER_MULTIPLIERS: Record<SeniorityTier, number> = {
  'individual-contributor': 1.0,
  manager: 1.5,
  executive: 2.0,
};

/** Low end of the market benchmark: 1 week of pay per year of service. */
export const SEVERANCE_WEEKS_PER_YEAR_LOW = 1;
/** High end of the market benchmark: 2 weeks of pay per year of service. */
export const SEVERANCE_WEEKS_PER_YEAR_HIGH = 2;

export interface UsSeveranceInput {
  annualSalary: number;
  yearsOfService: number;
  seniorityTier: SeniorityTier;
  /** Optional: weeks of pay the employer has offered, used for the verdict. */
  offeredSeveranceWeeks?: number;
}

export type SeveranceVerdict = 'below-market' | 'market' | 'strong' | 'no-offer';

export interface UsSeveranceResult {
  weeklyPay: number;
  tierMultiplier: number;
  lowWeeks: number;
  highWeeks: number;
  lowAmount: number;
  midAmount: number;
  highAmount: number;
  verdict: SeveranceVerdict;
}

const roundToTenth = (value: number) => Math.round(value * 10) / 10;

export const usSeveranceEngine: CalculatorEngine<UsSeveranceInput, UsSeveranceResult, never> = {
  validate(input): ValidationResult<UsSeveranceInput> {
    const errors: Partial<Record<keyof UsSeveranceInput, string>> = {};

    if (
      input.annualSalary === undefined ||
      (typeof input.annualSalary === 'number' && Number.isNaN(input.annualSalary)) ||
      input.annualSalary <= 0
    ) {
      errors.annualSalary = 'errors.mustBePositive';
    }

    if (
      input.yearsOfService === undefined ||
      (typeof input.yearsOfService === 'number' && Number.isNaN(input.yearsOfService)) ||
      input.yearsOfService < 0 ||
      input.yearsOfService > 60
    ) {
      errors.yearsOfService = 'errors.invalidNumber';
    }

    if (!Object.keys(SEVERANCE_TIER_MULTIPLIERS).includes(input.seniorityTier)) {
      errors.seniorityTier = 'errors.invalidNumber';
    }

    if (
      input.offeredSeveranceWeeks !== undefined &&
      (Number.isNaN(input.offeredSeveranceWeeks) || input.offeredSeveranceWeeks < 0)
    ) {
      errors.offeredSeveranceWeeks = 'errors.invalidNumber';
    }

    return Object.keys(errors).length ? { valid: false, errors } : { valid: true, data: input };
  },

  calculate(input): UsSeveranceResult {
    const weeklyPay = input.annualSalary / 52;
    const tierMultiplier = SEVERANCE_TIER_MULTIPLIERS[input.seniorityTier];

    const lowWeeks = roundToTenth(input.yearsOfService * SEVERANCE_WEEKS_PER_YEAR_LOW * tierMultiplier);
    const highWeeks = roundToTenth(input.yearsOfService * SEVERANCE_WEEKS_PER_YEAR_HIGH * tierMultiplier);

    const lowAmount = roundToCents(lowWeeks * weeklyPay);
    const highAmount = roundToCents(highWeeks * weeklyPay);
    const midAmount = roundToCents((lowAmount + highAmount) / 2);

    let verdict: SeveranceVerdict = 'no-offer';
    if (input.offeredSeveranceWeeks !== undefined) {
      if (input.offeredSeveranceWeeks < lowWeeks) verdict = 'below-market';
      else if (input.offeredSeveranceWeeks > highWeeks) verdict = 'strong';
      else verdict = 'market';
    }

    return {
      weeklyPay: roundToCents(weeklyPay),
      tierMultiplier,
      lowWeeks,
      highWeeks,
      lowAmount,
      midAmount,
      highAmount,
      verdict,
    };
  },
};
