import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Virginia individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $8,750 single / $17,500 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const VA_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 3000, rate: 0.02 },
  { min: 3000, max: 5000, rate: 0.03 },
  { min: 5000, max: 17000, rate: 0.05 },
  { min: 17000, max: null, rate: 0.0575 },
];

const VA_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 3000, rate: 0.02 },
  { min: 3000, max: 5000, rate: 0.03 },
  { min: 5000, max: 17000, rate: 0.05 },
  { min: 17000, max: null, rate: 0.0575 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? VA_BRACKETS_2026_MARRIED_JOINTLY
    : VA_BRACKETS_2026_SINGLE;
}

export const vaStateEngine: StateTaxEngine = {
  stateCode: 'VA',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 17500 : 8750;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'VA',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
