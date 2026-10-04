import type { StateTaxEngine } from './types';

/**
 * North Carolina 2026 estimate. North Carolina levies a flat 3.99% individual income tax.
 * Standard deduction modeled here: $12,750 single / $25,500 married jointly.
 * SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
 * This state adapter is an estimate, not a full North Carolina withholding implementation.
 */
export const ncStateEngine: StateTaxEngine = {
  stateCode: 'NC',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 25500 : 12750;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const annualStateIncomeTax = taxable * 0.0399;
    return {
      state: 'NC',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
