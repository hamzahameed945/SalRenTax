import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Alabama individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $3,000 single / $8,500 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const AL_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 500, rate: 0.02 },
  { min: 500, max: 3000, rate: 0.04 },
  { min: 3000, max: null, rate: 0.05 },
];

const AL_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 1000, rate: 0.02 },
  { min: 1000, max: 6000, rate: 0.04 },
  { min: 6000, max: null, rate: 0.05 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? AL_BRACKETS_2026_MARRIED_JOINTLY
    : AL_BRACKETS_2026_SINGLE;
}

export const alStateEngine: StateTaxEngine = {
  stateCode: 'AL',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 8500 : 3000;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'AL',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
