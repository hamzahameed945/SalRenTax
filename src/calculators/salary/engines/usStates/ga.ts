import type { StateTaxEngine } from './types';

/**
 * Georgia 2026 estimate. Georgia levies a flat 5.19% individual income tax.
 * Standard deduction modeled here: $12,000 single / $24,000 married jointly.
 * SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
 * This state adapter is an estimate, not a full Georgia withholding implementation.
 */
export const gaStateEngine: StateTaxEngine = {
  stateCode: 'GA',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 24000 : 12000;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const annualStateIncomeTax = taxable * 0.0519;
    return {
      state: 'GA',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
