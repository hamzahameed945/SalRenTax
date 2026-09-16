import type { StateTaxEngine, StateTaxResult } from './types';
import type { UsPaycheckInput } from '../usPaycheck';

export const txStateEngine: StateTaxEngine = {
  stateCode: 'TX',
  calculate(input: UsPaycheckInput, annualGrossPay: number, annualPreTaxDeductions: number): StateTaxResult {
    // Texas has no state income tax
    return {
      state: 'TX',
      stateIncomeTaxPerPeriod: 0,
      annualStateIncomeTax: 0,
      effectiveStateRate: 0,
    };
  },
};
