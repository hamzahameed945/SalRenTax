import type { StateTaxEngine } from './types';

// Pennsylvania has a flat 3.07% income tax rate for 2026
// SOURCE: Pennsylvania Department of Revenue
const PA_FLAT_RATE_2026 = 0.0307;

// Pennsylvania has no standard deduction - it taxes all income at the flat rate
// after federal adjustments (which are not applicable at state level)

export const paStateEngine: StateTaxEngine = {
  stateCode: 'PA',
  calculate(_input, annualGrossPay, annualPreTaxDeductions) {
    // Pennsylvania taxes gross income minus pre-tax deductions at a flat rate
    const taxableIncome = Math.max(0, annualGrossPay - annualPreTaxDeductions);
    const annualStateIncomeTax = taxableIncome * PA_FLAT_RATE_2026;
    
    return {
      state: 'PA',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};