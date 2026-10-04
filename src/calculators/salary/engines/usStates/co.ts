import type { StateTaxEngine } from './types';

/**
 * Colorado 2026 estimate. Colorado levies a flat 4.4% individual income tax.
 * Standard deduction modeled here: $16,100 single / $32,200 married jointly.
 * SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
 * This state adapter is an estimate, not a full Colorado withholding implementation.
 */
export const coStateEngine: StateTaxEngine = {
  stateCode: 'CO',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 32200 : 16100;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const annualStateIncomeTax = taxable * 0.044;
    return {
      state: 'CO',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
