import type { StateTaxEngine } from './types';

/**
 * Kentucky 2026 estimate. Kentucky levies a flat 3.5% individual income tax.
 * Standard deduction modeled here: $3,360 single / $3,360 married jointly.
 * SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
 * This state adapter is an estimate, not a full Kentucky withholding implementation.
 */
export const kyStateEngine: StateTaxEngine = {
  stateCode: 'KY',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 3360 : 3360;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const annualStateIncomeTax = taxable * 0.035;
    return {
      state: 'KY',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
