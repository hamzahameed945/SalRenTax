import type { UsPaycheckInput } from '../usPaycheck';

export interface StateTaxResult {
  state: string;
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
