import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Vermont individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $7,650 single / $15,300 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const VT_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 49400, rate: 0.0335 },
  { min: 49400, max: 119700, rate: 0.066 },
  { min: 119700, max: 249700, rate: 0.076 },
  { min: 249700, max: null, rate: 0.0875 },
];

const VT_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 82500, rate: 0.0335 },
  { min: 82500, max: 199450, rate: 0.066 },
  { min: 199450, max: 304000, rate: 0.076 },
  { min: 304000, max: null, rate: 0.0875 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? VT_BRACKETS_2026_MARRIED_JOINTLY
    : VT_BRACKETS_2026_SINGLE;
}

export const vtStateEngine: StateTaxEngine = {
  stateCode: 'VT',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 15300 : 7650;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'VT',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
