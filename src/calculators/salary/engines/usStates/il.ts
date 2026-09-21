import type { StateTaxEngine } from './types';

/**
 * Illinois individual income tax: 4.95%; 2026 personal exemption allowance = $2,925.
 * Source: Illinois Department of Revenue 2026 IL-700-T and personal exemption FAQ.
 */
export const ilStateEngine: StateTaxEngine = {
  stateCode: 'IL',
  calculate(_input, annualGrossPay, annualPreTaxDeductions) {
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - 2925);
    const annualStateIncomeTax = taxable * 0.0495;
    // The engine also returns the annual amount; usPaycheck derives the pay-period amount.

    return {
      state: 'IL',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
