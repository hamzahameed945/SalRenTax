import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Oregon individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $2,910 single / $5,820 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const OR_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 4550, rate: 0.0475 },
  { min: 4550, max: 11400, rate: 0.0675 },
  { min: 11400, max: 125000, rate: 0.0875 },
  { min: 125000, max: null, rate: 0.099 },
];

const OR_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 9100, rate: 0.0475 },
  { min: 9100, max: 22800, rate: 0.0675 },
  { min: 22800, max: 250000, rate: 0.0875 },
  { min: 250000, max: null, rate: 0.099 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? OR_BRACKETS_2026_MARRIED_JOINTLY
    : OR_BRACKETS_2026_SINGLE;
}

export const orStateEngine: StateTaxEngine = {
  stateCode: 'OR',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 5820 : 2910;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'OR',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
