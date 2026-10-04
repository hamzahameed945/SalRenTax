import type { StateTaxEngine, StateTaxResult } from './types';
import type { UsPaycheckInput } from '../usPaycheck';

export const akStateEngine: StateTaxEngine = {
  stateCode: 'AK',
  calculate(
    _input: UsPaycheckInput,
    _annualGrossPay: number,
    _annualPreTaxDeductions: number,
  ): StateTaxResult {
    // Alaska has no individual income tax on wages
    return {
      state: 'AK',
      stateIncomeTaxPerPeriod: 0,
      annualStateIncomeTax: 0,
      effectiveStateRate: 0,
    };
  },
};
