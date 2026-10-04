import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Delaware individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $3,250 single / $6,500 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const DE_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 2000, rate: 0 },
  { min: 2000, max: 5000, rate: 0.022 },
  { min: 5000, max: 10000, rate: 0.039 },
  { min: 10000, max: 20000, rate: 0.048 },
  { min: 20000, max: 25000, rate: 0.052 },
  { min: 25000, max: 60000, rate: 0.0555 },
  { min: 60000, max: null, rate: 0.066 },
];

const DE_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 2000, rate: 0 },
  { min: 2000, max: 5000, rate: 0.022 },
  { min: 5000, max: 10000, rate: 0.039 },
  { min: 10000, max: 20000, rate: 0.048 },
  { min: 20000, max: 25000, rate: 0.052 },
  { min: 25000, max: 60000, rate: 0.0555 },
  { min: 60000, max: null, rate: 0.066 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? DE_BRACKETS_2026_MARRIED_JOINTLY
    : DE_BRACKETS_2026_SINGLE;
}

export const deStateEngine: StateTaxEngine = {
  stateCode: 'DE',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 6500 : 3250;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'DE',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
