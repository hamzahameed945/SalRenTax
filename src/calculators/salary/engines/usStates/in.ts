import type { StateTaxEngine } from './types';

/**
 * Indiana 2026 estimate. Indiana levies a flat 2.95% individual income tax.
 * Standard deduction modeled here: no standard deduction modeled.
 * SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
 * This state adapter is an estimate, not a full Indiana withholding implementation.
 */
export const inStateEngine: StateTaxEngine = {
  stateCode: 'IN',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 0 : 0;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const annualStateIncomeTax = taxable * 0.0295;
    return {
      state: 'IN',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
