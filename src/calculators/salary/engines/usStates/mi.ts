import type { StateTaxEngine } from './types';

/**
 * Michigan 2026 estimate. Michigan levies a flat 4.25% individual income tax.
 * Standard deduction modeled here: no standard deduction modeled.
 * SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
 * This state adapter is an estimate, not a full Michigan withholding implementation.
 */
export const miStateEngine: StateTaxEngine = {
  stateCode: 'MI',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 0 : 0;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const annualStateIncomeTax = taxable * 0.0425;
    return {
      state: 'MI',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
