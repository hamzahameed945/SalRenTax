import type { StateTaxEngine } from './types';

/**
 * Louisiana 2026 estimate. Louisiana levies a flat 3% individual income tax.
 * Standard deduction modeled here: $12,875 single / $25,750 married jointly.
 * SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
 * This state adapter is an estimate, not a full Louisiana withholding implementation.
 */
export const laStateEngine: StateTaxEngine = {
  stateCode: 'LA',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 25750 : 12875;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const annualStateIncomeTax = taxable * 0.03;
    return {
      state: 'LA',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
