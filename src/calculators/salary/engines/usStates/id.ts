import type { StateTaxEngine } from './types';

/**
 * Idaho 2026 estimate. Idaho levies a flat 5.3% individual income tax.
 * Standard deduction modeled here: $16,100 single / $32,200 married jointly.
 * SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
 * This state adapter is an estimate, not a full Idaho withholding implementation.
 */
export const idStateEngine: StateTaxEngine = {
  stateCode: 'ID',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 32200 : 16100;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const annualStateIncomeTax = taxable * 0.053;
    return {
      state: 'ID',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
