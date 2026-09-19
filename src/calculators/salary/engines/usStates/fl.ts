import type { StateTaxEngine } from './types';

export const flStateEngine: StateTaxEngine = {
  stateCode: 'FL',
  calculate(_input, _annualGrossPay, _annualPreTaxDeductions) {
    return { state: 'FL', stateIncomeTaxPerPeriod: 0, annualStateIncomeTax: 0, effectiveStateRate: 0 };
  },
};
