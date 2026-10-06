import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { roundToCents } from '../../../core/math';
import { calculateProgressiveTax } from '../../../core/progressiveTax';
import {
  federalBrackets2026Single,
  federalBrackets2026MarriedJointly,
  standardDeduction2026,
} from '../../../../data/salary/us/federalTax2026';

// ─── 2026 Child Tax Credit constants ─────────────────────────────────────────
// SOURCES (verified 2026-10-06):
// - Congress.gov CRS R41873: max credit $2,200 per child 0–16 through 2028,
//   max ACTC $1,700 per child, refundability = 15% of earnings above $2,500,
//   phaseout thresholds $200,000 single / $400,000 joint, reduced by $50 for
//   every $1,000 (or fraction) above the threshold.
// - VisaVerge / savingtoinvest / wealthvieu (2026 guides): $2,200 per
//   qualifying child under 17, up to $1,700 refundable, thresholds unchanged
//   for 2026, OBBBA made the $2,200 amount permanent with inflation indexing.
export const CHILD_TAX_CREDIT_2026 = {
  /** Per qualifying child under age 17. */
  perChild: 2_200,
  /** Max refundable portion (ACTC) per child. */
  refundableMaxPerChild: 1_700,
  /** ACTC refundability formula: 15% of earned income above this. */
  earnedIncomeThreshold: 2_500,
  earnedIncomeRate: 0.15,
  /** MAGI thresholds where the credit starts phasing out. */
  phaseOutStartSingle: 200_000,
  phaseOutStartJoint: 400_000,
  /** Credit reduction per $1,000 (or part) of MAGI above the threshold. */
  phaseOutReductionPer1000: 50,
} as const;

// ─── OBBBA "no tax on overtime" / "no tax on tips" constants (2026) ─────────
// SOURCES (verified 2026-10-06):
// - SW CPAs OBBBA guide + notaxcalculator methodology + Illinois State FAQs:
//   overtime cap $12,500 single / $25,000 joint, premium-only, FLSA-only,
//   phase-out starts $150k single / $300k joint MAGI, $100 per $1,000 over,
//   fully gone at $275k / $550k, tax years 2025–2028.
// - Healio OBBBA summary + Wilkins Miller: tips deduction capped at $25,000,
//   phase-out at 10% rate ($100 per $1,000) once MAGI exceeds $150,000 single /
//   $300,000 joint, tax years 2025–2028.
// The deductions reduce taxable income; they do not reduce Social Security /
// Medicare tax. The salary input is used as a proxy for MAGI.
export const OBBBA_DEDUCTIONS_2026 = {
  overtimeCapSingle: 12_500,
  overtimeCapJoint: 25_000,
  tipsCap: 25_000,
  phaseOutStartSingle: 150_000,
  phaseOutStartJoint: 300_000,
  phaseOutReductionPer1000: 100,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export type UsTaxRefundFilingStatus = 'single' | 'marriedJointly';

export interface UsTaxRefundInput {
  filingStatus: UsTaxRefundFilingStatus;
  /** Gross annual income (wages). Used as the AGI/MAGI proxy. */
  annualIncome: number;
  /** Federal income tax already withheld (e.g. Box 2 of the W-2). */
  withholding: number;
  /** Qualifying children under 17 for the Child Tax Credit (0–3). */
  qualifyingChildren: number;
  /** Optional: qualified FLSA overtime premium (the "half" in time-and-a-half). */
  overtimePremiumDeduction?: number;
  /** Optional: qualified tips received (traditional tipped occupations). */
  tipsDeduction?: number;
}

export interface UsTaxRefundResult {
  /** 2026 standard deduction applied. */
  standardDeduction: number;
  /** OBBBA overtime deduction applied (after cap and phase-out). */
  overtimeDeductionApplied: number;
  /** OBBBA tips deduction applied (after cap and phase-out). */
  tipsDeductionApplied: number;
  /** Taxable income after deductions. */
  taxableIncome: number;
  /** Federal income tax before credits. */
  grossTax: number;
  /** Marginal tax rate on the last dollar of taxable income. */
  marginalRate: number;
  /** Effective rate on taxable income. */
  effectiveRate: number;
  /** Full Child Tax Credit after phase-out (non-refundable + refundable parts). */
  childTaxCredit: number;
  /** Non-refundable CTC used against the liability. */
  ctcNonRefundable: number;
  /** Refundable ACTC portion (paid out as part of the refund). */
  refundableCredit: number;
  /** Liability after the non-refundable credit. */
  netTaxLiability: number;
  /** Federal income tax already withheld. */
  withholding: number;
  /** Estimated refund (0 when an amount is owed instead). */
  refund: number;
  /** Estimated amount owed (0 when a refund is due instead). */
  amountOwed: number;
  /** True when an OBBBA phase-out reduced an optional deduction. */
  obbbaPhaseOutApplied: boolean;
  /** True when the CTC phase-out reduced the credit. */
  ctcPhaseOutApplied: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function applyObbbaDeduction(
  claimed: number,
  cap: number,
  magi: number,
  phaseOutStart: number,
): { applied: number; phaseOutApplied: boolean } {
  const capped = Math.min(Math.max(0, claimed), cap);
  let reduction = 0;
  if (magi > phaseOutStart) {
    reduction = Math.floor((magi - phaseOutStart) / 1000) * OBBBA_DEDUCTIONS_2026.phaseOutReductionPer1000;
  }
  const applied = Math.max(0, roundToCents(capped - reduction));
  return { applied, phaseOutApplied: reduction > 0 };
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export const usTaxRefundEngine: CalculatorEngine<UsTaxRefundInput, UsTaxRefundResult, never> = {
  validate(input: UsTaxRefundInput): ValidationResult<UsTaxRefundInput> {
    const errors: Partial<Record<keyof UsTaxRefundInput, string>> = {};

    if (input.filingStatus !== 'single' && input.filingStatus !== 'marriedJointly') {
      errors.filingStatus = 'errors.invalidNumber';
    }

    if (
      input.annualIncome === undefined ||
      Number.isNaN(input.annualIncome) ||
      input.annualIncome <= 0 ||
      input.annualIncome > 100_000_000
    ) {
      errors.annualIncome = 'errors.mustBePositive';
    }

    if (input.withholding === undefined || Number.isNaN(input.withholding) || input.withholding < 0) {
      errors.withholding = 'errors.mustBePositive';
    }

    if (
      input.qualifyingChildren === undefined ||
      Number.isNaN(input.qualifyingChildren) ||
      !Number.isInteger(input.qualifyingChildren) ||
      input.qualifyingChildren < 0 ||
      input.qualifyingChildren > 3
    ) {
      errors.qualifyingChildren = 'errors.invalidNumber';
    }

    if (
      input.overtimePremiumDeduction !== undefined &&
      (Number.isNaN(input.overtimePremiumDeduction) || input.overtimePremiumDeduction < 0)
    ) {
      errors.overtimePremiumDeduction = 'errors.mustBePositive';
    }

    if (
      input.tipsDeduction !== undefined &&
      (Number.isNaN(input.tipsDeduction) || input.tipsDeduction < 0)
    ) {
      errors.tipsDeduction = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: UsTaxRefundInput): UsTaxRefundResult {
    const magi = input.annualIncome; // salary used as MAGI proxy

    const overtimeCap =
      input.filingStatus === 'marriedJointly'
        ? OBBBA_DEDUCTIONS_2026.overtimeCapJoint
        : OBBBA_DEDUCTIONS_2026.overtimeCapSingle;
    const phaseOutStart =
      input.filingStatus === 'marriedJointly'
        ? OBBBA_DEDUCTIONS_2026.phaseOutStartJoint
        : OBBBA_DEDUCTIONS_2026.phaseOutStartSingle;

    const overtime = applyObbbaDeduction(
      input.overtimePremiumDeduction ?? 0,
      overtimeCap,
      magi,
      phaseOutStart,
    );
    const tips = applyObbbaDeduction(
      input.tipsDeduction ?? 0,
      OBBBA_DEDUCTIONS_2026.tipsCap,
      magi,
      phaseOutStart,
    );

    const standardDeduction =
      input.filingStatus === 'marriedJointly'
        ? standardDeduction2026.marriedJointly
        : standardDeduction2026.single;

    const taxableIncome = Math.max(
      0,
      roundToCents(input.annualIncome - standardDeduction - overtime.applied - tips.applied),
    );

    const brackets =
      input.filingStatus === 'marriedJointly'
        ? federalBrackets2026MarriedJointly
        : federalBrackets2026Single;
    const tax = calculateProgressiveTax(taxableIncome, brackets);
    const grossTax = roundToCents(tax.totalTax);

    // Child Tax Credit with phase-out ($50 per $1,000 or part above threshold).
    const ctcPhaseOutStart =
      input.filingStatus === 'marriedJointly'
        ? CHILD_TAX_CREDIT_2026.phaseOutStartJoint
        : CHILD_TAX_CREDIT_2026.phaseOutStartSingle;
    const ctcGross = CHILD_TAX_CREDIT_2026.perChild * input.qualifyingChildren;
    let ctcReduction = 0;
    if (magi > ctcPhaseOutStart) {
      ctcReduction =
        Math.ceil((magi - ctcPhaseOutStart) / 1000) * CHILD_TAX_CREDIT_2026.phaseOutReductionPer1000;
    }
    const childTaxCredit = Math.max(0, roundToCents(ctcGross - ctcReduction));
    const ctcNonRefundable = Math.min(childTaxCredit, grossTax);
    const ctcRemaining = roundToCents(childTaxCredit - ctcNonRefundable);

    // Refundable ACTC: min of (remaining credit, $1,700/child, 15% of earned
    // income above $2,500). Earned income is proxied by annual income.
    const actcFormula = CHILD_TAX_CREDIT_2026.earnedIncomeRate * Math.max(0, magi - CHILD_TAX_CREDIT_2026.earnedIncomeThreshold);
    const refundableCredit = roundToCents(
      Math.min(
        ctcRemaining,
        CHILD_TAX_CREDIT_2026.refundableMaxPerChild * input.qualifyingChildren,
        actcFormula,
      ),
    );

    const netTaxLiability = roundToCents(grossTax - ctcNonRefundable);
    const withholding = roundToCents(input.withholding);

    const refund = Math.max(0, roundToCents(withholding + refundableCredit - netTaxLiability));
    const amountOwed = Math.max(0, roundToCents(netTaxLiability - withholding - refundableCredit));

    return {
      standardDeduction,
      overtimeDeductionApplied: overtime.applied,
      tipsDeductionApplied: tips.applied,
      taxableIncome,
      grossTax,
      marginalRate: tax.marginalRate,
      effectiveRate: tax.effectiveRate,
      childTaxCredit,
      ctcNonRefundable: roundToCents(ctcNonRefundable),
      refundableCredit,
      netTaxLiability,
      withholding,
      refund,
      amountOwed,
      obbbaPhaseOutApplied: overtime.phaseOutApplied || tips.phaseOutApplied,
      ctcPhaseOutApplied: ctcReduction > 0,
    };
  },
};
