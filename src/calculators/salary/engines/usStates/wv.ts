import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 West Virginia individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction no standard deduction modeled; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const WV_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 10000, rate: 0.0211 },
  { min: 10000, max: 25000, rate: 0.0281 },
  { min: 25000, max: 40000, rate: 0.0316 },
  { min: 40000, max: 60000, rate: 0.0422 },
  { min: 60000, max: null, rate: 0.0458 },
];

const WV_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 10000, rate: 0.0211 },
  { min: 10000, max: 25000, rate: 0.0281 },
  { min: 25000, max: 40000, rate: 0.0316 },
  { min: 40000, max: 60000, rate: 0.0422 },
  { min: 60000, max: null, rate: 0.0458 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? WV_BRACKETS_2026_MARRIED_JOINTLY
    : WV_BRACKETS_2026_SINGLE;
}

export const wvStateEngine: StateTaxEngine = {
  stateCode: 'WV',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 0 : 0;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'WV',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
