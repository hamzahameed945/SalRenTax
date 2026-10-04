import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Wisconsin individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $13,960 single / $25,840 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const WI_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 15110, rate: 0.035 },
  { min: 15110, max: 51950, rate: 0.044 },
  { min: 51950, max: 332720, rate: 0.053 },
  { min: 332720, max: null, rate: 0.0765 },
];

const WI_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 20150, rate: 0.035 },
  { min: 20150, max: 69260, rate: 0.044 },
  { min: 69260, max: 443630, rate: 0.053 },
  { min: 443630, max: null, rate: 0.0765 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? WI_BRACKETS_2026_MARRIED_JOINTLY
    : WI_BRACKETS_2026_SINGLE;
}

export const wiStateEngine: StateTaxEngine = {
  stateCode: 'WI',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 25840 : 13960;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'WI',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
