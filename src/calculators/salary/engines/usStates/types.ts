import type { UsPaycheckInput } from '../usPaycheck';
import type { TaxBracket } from '../../../core/progressiveTax';

/**
 * Static facts about a state's 2026 tax model, exposed for content generation
 * (e.g. the per-amount insight blocks on state paycheck pages). Every value
 * must mirror what the engine's calculate() actually applies.
 */
export interface StateTaxMeta {
  type: 'graduated' | 'flat' | 'none';
  /** Flat states only: the single rate applied to taxable income. */
  flatRate?: number;
  bracketsSingle?: TaxBracket[];
  bracketsMarriedJointly?: TaxBracket[];
  standardDeductionSingle?: number;
  standardDeductionMarriedJointly?: number;
  /** Set when the standardDeduction* amounts are not a standard deduction (NJ, IL). */
  deductionLabel?: 'personal exemption';
  /** SC only: the SCIAD replaces the standard deduction and phases out with
   * income; these are its full base amounts before the phase-out. */
  sciadBaseSingle?: number;
  sciadBaseMarriedJointly?: number;
}

export interface StateTaxResult {
  state: string;
  /** Annual state liability divided by the caller's pay period when used in usPaycheck. */
  stateIncomeTaxPerPeriod: number;
  annualStateIncomeTax: number;
  effectiveStateRate: number;
}

export interface StateTaxEngine {
  stateCode: string;
  meta?: StateTaxMeta;
  calculate(
    input: UsPaycheckInput,
    annualGrossPay: number,
    annualPreTaxDeductions: number,
  ): StateTaxResult;
}
