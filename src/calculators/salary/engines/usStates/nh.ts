import type { StateTaxEngine, StateTaxResult } from './types';
import type { UsPaycheckInput } from '../usPaycheck';

export const nhStateEngine: StateTaxEngine = {
  stateCode: 'NH',
  calculate(
    _input: UsPaycheckInput,
    _annualGrossPay: number,
    _annualPreTaxDeductions: number,
  ): StateTaxResult {
    // New Hampshire has no individual income tax on wages
    return {
      state: 'NH',
      stateIncomeTaxPerPeriod: 0,
      annualStateIncomeTax: 0,
      effectiveStateRate: 0,
    };
  },
};
