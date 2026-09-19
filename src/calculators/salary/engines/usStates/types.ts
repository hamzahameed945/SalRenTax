import type { UsPaycheckInput } from '../usPaycheck';

export interface StateTaxResult {
  state: string;
  /** Annual state liability divided by the caller's pay period when used in usPaycheck. */
  stateIncomeTaxPerPeriod: number;
  annualStateIncomeTax: number;
  effectiveStateRate: number;
}

export interface StateTaxEngine {
  stateCode: string;
  calculate(
    input: UsPaycheckInput,
    annualGrossPay: number,
    annualPreTaxDeductions: number,
  ): StateTaxResult;
}
