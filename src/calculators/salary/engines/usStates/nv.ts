import type { StateTaxEngine, StateTaxResult } from './types';
import type { UsPaycheckInput } from '../usPaycheck';

export const nvStateEngine: StateTaxEngine = {
  stateCode: 'NV',
  calculate(
    _input: UsPaycheckInput,
    _annualGrossPay: number,
    _annualPreTaxDeductions: number,
  ): StateTaxResult {
    // Nevada has no individual income tax on wages
    return {
      state: 'NV',
      stateIncomeTaxPerPeriod: 0,
      annualStateIncomeTax: 0,
      effectiveStateRate: 0,
    };
  },
};
