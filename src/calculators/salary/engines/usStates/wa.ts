import type { StateTaxEngine } from './types';

// Washington State has no state income tax on wages and salaries
// Note: Washington does have a capital gains excise tax on high earners,
// but that does not apply to regular wage income covered by paycheck calculators

export const waStateEngine: StateTaxEngine = {
  stateCode: 'WA',
  calculate(_input, _annualGrossPay, _annualPreTaxDeductions) {
    // Washington has no state income tax on wages
    const annualStateIncomeTax = 0;
    
    return {
      state: 'WA',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: 0,
    };
  },
};