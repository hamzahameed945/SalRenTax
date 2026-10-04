import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Maine individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $8,350 single / $16,700 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const ME_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 27399, rate: 0.058 },
  { min: 27399, max: 64849, rate: 0.0675 },
  { min: 64849, max: null, rate: 0.0715 },
];

const ME_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 54849, rate: 0.058 },
  { min: 54849, max: 129749, rate: 0.0675 },
  { min: 129749, max: null, rate: 0.0715 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? ME_BRACKETS_2026_MARRIED_JOINTLY
    : ME_BRACKETS_2026_SINGLE;
}

export const meStateEngine: StateTaxEngine = {
  stateCode: 'ME',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 16700 : 8350;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'ME',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
