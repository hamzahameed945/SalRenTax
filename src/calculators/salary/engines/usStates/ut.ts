import type { StateTaxEngine } from './types';

/**
 * Utah 2026 estimate. Utah levies a flat 4.5% individual income tax.
 * Standard deduction modeled here: no standard deduction modeled.
 * SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
 * This state adapter is an estimate, not a full Utah withholding implementation.
 */
export const utStateEngine: StateTaxEngine = {
  stateCode: 'UT',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 0 : 0;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const annualStateIncomeTax = taxable * 0.045;
    return {
      state: 'UT',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
