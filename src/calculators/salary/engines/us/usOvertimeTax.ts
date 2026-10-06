import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { roundToCents } from '../../../core/math';
import {
  federalBrackets2026Single,
  federalBrackets2026MarriedJointly,
  standardDeduction2026,
  fica2026,
} from '../../../../data/salary/us/federalTax2026';

// ─── OBBBA "no tax on overtime" constants ────────────────────────────────────
// SOURCES (verified 2026-10-06):
// - Princeton University Finance & Treasury: "One Big Beautiful Bill Act (OBBBA):
//   Understanding the 'No Tax on Overtime' Provision" (Jan. 10, 2026) — caps
//   $12,500 single / $25,000 joint, premium-only ("half" of time-and-a-half).
// - Illinois State University OBBBA FAQs — eligibility, FLSA-only, premium-only.
// - TaxAct "No Tax On Overtime Explained" — phaseout starts $150k single /
//   $300k joint MAGI, $100 reduction per $1,000 over, fully gone at
//   $275k / $550k; claimed whether itemizing or standard deduction; married
//   must file jointly.
// - IRS guidance summaries (Sept 2026) — 2026 W-2 Box 14 reporting; only
//   FLSA-mandated overtime qualifies (not state-law or contract extras);
//   applies to tax years 2025–2028.
export const OBBBA_OVERTIME_2026 = {
  singleCap: 12_500,
  jointCap: 25_000,
  phaseOutStartSingle: 150_000,
  phaseOutStartJoint: 300_000,
  phaseOutEndSingle: 275_000,
  phaseOutEndJoint: 550_000,
  /** Deduction reduction per $1,000 of MAGI above the phase-out start. */
  phaseOutReductionPer1000: 100,
  firstYear: 2025,
  lastYear: 2028,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export type UsOvertimeFilingStatus = 'single' | 'marriedJointly';

/** The 2026 federal marginal brackets offered as a direct "I know my bracket" choice. */
export const FEDERAL_BRACKET_OPTIONS_2026 = [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37] as const;

export interface UsOvertimeTaxInput {
  /** Regular hourly rate in USD (the "1" in time-and-a-half). */
  hourlyRate: number;
  /** Overtime hours worked in 2026. */
  overtimeHours: number;
  filingStatus: UsOvertimeFilingStatus;
  /**
   * Estimated total 2026 wages (overtime pay included). Used as a proxy for
   * MAGI for the OBBBA phase-out and to derive the marginal tax bracket.
   */
  annualSalary?: number;
  /**
   * Directly supplied 2026 federal marginal rate (e.g. 0.22). Overrides the
   * bracket derived from annualSalary when provided.
   */
  taxBracket?: number;
}

export interface UsOvertimeTaxResult {
  /** Overtime gross pay: hourlyRate x 1.5 x overtimeHours. */
  overtimeGross: number;
  /** Straight-time component of the overtime gross. */
  baseComponent: number;
  /** Premium ("and-a-half") component: hourlyRate x 0.5 x overtimeHours. */
  premiumComponent: number;
  /** True when the marginal rate was derived from annualSalary; false when taxBracket was given. */
  bracketDerived: boolean;
  /** Federal marginal income tax rate applied to the overtime. */
  marginalRate: number;
  /** Federal income tax on the overtime at the SAME marginal rate (myth-busting number). */
  taxOnOvertime: number;
  /** Estimated FICA (Social Security + Medicare) on the overtime. */
  ficaOnOvertime: number;
  /** Overtime premium deductible under the OBBBA after cap and phase-out. */
  deductiblePremium: number;
  /** Estimated federal income tax saved by the OBBBA deduction. */
  taxSavings: number;
  /** Net overtime after tax and FICA, before counting the OBBBA refund. */
  netAfterTax: number;
  /** Effective net overtime including the OBBBA tax savings (which arrives at filing time). */
  effectiveNet: number;
  /** True when the OBBBA phase-out reduced the deductible premium. */
  phaseOutApplied: boolean;
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export const usOvertimeTaxEngine: CalculatorEngine<UsOvertimeTaxInput, UsOvertimeTaxResult, never> = {
  validate(input: UsOvertimeTaxInput): ValidationResult<UsOvertimeTaxInput> {
    const errors: Partial<Record<keyof UsOvertimeTaxInput, string>> = {};

    if (input.hourlyRate === undefined || Number.isNaN(input.hourlyRate) || input.hourlyRate <= 0) {
      errors.hourlyRate = 'errors.mustBePositive';
    }

    if (
      input.overtimeHours === undefined ||
      Number.isNaN(input.overtimeHours) ||
      input.overtimeHours < 0 ||
      input.overtimeHours > 20_000
    ) {
      errors.overtimeHours = 'errors.invalidNumber';
    }

    if (input.filingStatus !== 'single' && input.filingStatus !== 'marriedJointly') {
      errors.filingStatus = 'errors.invalidNumber';
    }

    const hasSalary =
      input.annualSalary !== undefined && input.annualSalary !== null && !Number.isNaN(input.annualSalary);
    const hasBracket =
      input.taxBracket !== undefined && input.taxBracket !== null && !Number.isNaN(input.taxBracket);

    if (hasSalary && input.annualSalary! <= 0) {
      errors.annualSalary = 'errors.mustBePositive';
    }

    if (hasBracket && !(FEDERAL_BRACKET_OPTIONS_2026 as readonly number[]).includes(input.taxBracket!)) {
      errors.taxBracket = 'errors.invalidNumber';
    }

    if (!hasSalary && !hasBracket) {
      errors.annualSalary = 'errors.annualSalaryOrBracketRequired';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: UsOvertimeTaxInput): UsOvertimeTaxResult {
    const overtimeGross = roundToCents(input.hourlyRate * 1.5 * input.overtimeHours);
    const baseComponent = roundToCents(input.hourlyRate * input.overtimeHours);
    const premiumComponent = roundToCents(input.hourlyRate * 0.5 * input.overtimeHours);

    // Marginal bracket: direct choice wins; otherwise derive from annual salary
    // minus the 2026 standard deduction.
    let marginalRate: number;
    let bracketDerived: boolean;
    if (
      input.taxBracket !== undefined &&
      input.taxBracket !== null &&
      !Number.isNaN(input.taxBracket)
    ) {
      marginalRate = input.taxBracket;
      bracketDerived = false;
    } else {
      const salary = input.annualSalary!;
      const standardDeduction =
        input.filingStatus === 'marriedJointly'
          ? standardDeduction2026.marriedJointly
          : standardDeduction2026.single;
      const taxable = Math.max(0, salary - standardDeduction);
      const brackets =
        input.filingStatus === 'marriedJointly'
          ? federalBrackets2026MarriedJointly
          : federalBrackets2026Single;
      const topBracket = brackets.find((b) => b.max === null || taxable < b.max) ?? brackets[brackets.length - 1];
      marginalRate = topBracket.rate;
      bracketDerived = true;
    }

    const taxOnOvertime = roundToCents(overtimeGross * marginalRate);

    // FICA: Social Security (6.2%) applies only below the 2026 wage base;
    // Medicare (1.45%) always applies. The OBBBA deduction does not touch FICA.
    const wages = input.annualSalary ?? 0;
    const ssApplies = wages <= 0 || wages < fica2026.socialSecurityWageBase;
    const ficaRate = fica2026.medicareRate + (ssApplies ? fica2026.socialSecurityRate : 0);
    const ficaOnOvertime = roundToCents(overtimeGross * ficaRate);

    // OBBBA deduction: only the premium ("and-a-half") counts, capped by
    // filing status, then reduced by the MAGI phase-out (salary is a proxy
    // for MAGI here).
    const cap =
      input.filingStatus === 'marriedJointly' ? OBBBA_OVERTIME_2026.jointCap : OBBBA_OVERTIME_2026.singleCap;
    const phaseOutStart =
      input.filingStatus === 'marriedJointly'
        ? OBBBA_OVERTIME_2026.phaseOutStartJoint
        : OBBBA_OVERTIME_2026.phaseOutStartSingle;
    let reduction = 0;
    if (wages > phaseOutStart) {
      reduction =
        Math.floor((wages - phaseOutStart) / 1000) * OBBBA_OVERTIME_2026.phaseOutReductionPer1000;
    }
    const deductiblePremium = Math.max(0, roundToCents(Math.min(premiumComponent, cap) - reduction));
    const taxSavings = roundToCents(deductiblePremium * marginalRate);

    const netAfterTax = roundToCents(overtimeGross - taxOnOvertime - ficaOnOvertime);
    const effectiveNet = roundToCents(netAfterTax + taxSavings);

    return {
      overtimeGross,
      baseComponent,
      premiumComponent,
      bracketDerived,
      marginalRate,
      taxOnOvertime,
      ficaOnOvertime,
      deductiblePremium,
      taxSavings,
      netAfterTax,
      effectiveNet,
      phaseOutApplied: reduction > 0,
    };
  },
};
