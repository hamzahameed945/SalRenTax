import type { StateTaxEngine, StateTaxResult } from './types';
import type { UsPaycheckInput } from '../usPaycheck';

export const wyStateEngine: StateTaxEngine = {
  stateCode: 'WY',
  calculate(
    _input: UsPaycheckInput,
    _annualGrossPay: number,
    _annualPreTaxDeductions: number,
  ): StateTaxResult {
    // Wyoming has no individual income tax on wages
    return {
      state: 'WY',
      stateIncomeTaxPerPeriod: 0,
      annualStateIncomeTax: 0,
      effectiveStateRate: 0,
    };
  },
};
