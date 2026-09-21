import type { StateTaxEngine } from './types';

/**
 * Arizona 2026 estimate. Arizona's flat individual rate is 2.5%.
 * Standard deduction modeled here: $15,750 single / $31,500 married jointly.
 * This state adapter is an estimate, not a full Arizona withholding implementation.
 */
export const azStateEngine: StateTaxEngine = {
  stateCode: 'AZ',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 31500 : 15750;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const annualStateIncomeTax = taxable * 0.025;
    return {
      state: 'AZ',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
