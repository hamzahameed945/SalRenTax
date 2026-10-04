import type { StateTaxEngine, StateTaxResult } from './types';
import type { UsPaycheckInput } from '../usPaycheck';

export const tnStateEngine: StateTaxEngine = {
  stateCode: 'TN',
  calculate(
    _input: UsPaycheckInput,
    _annualGrossPay: number,
    _annualPreTaxDeductions: number,
  ): StateTaxResult {
    // Tennessee has no individual income tax on wages
    return {
      state: 'TN',
      stateIncomeTaxPerPeriod: 0,
      annualStateIncomeTax: 0,
      effectiveStateRate: 0,
    };
  },
};
