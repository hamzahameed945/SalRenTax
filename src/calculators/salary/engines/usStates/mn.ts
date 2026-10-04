import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Minnesota individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $15,300 single / $30,600 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const MN_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 33310, rate: 0.0535 },
  { min: 33310, max: 109430, rate: 0.068 },
  { min: 109430, max: 203150, rate: 0.0785 },
  { min: 203150, max: null, rate: 0.0985 },
];

const MN_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 48700, rate: 0.0535 },
  { min: 48700, max: 193480, rate: 0.068 },
  { min: 193480, max: 337930, rate: 0.0785 },
  { min: 337930, max: null, rate: 0.0985 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? MN_BRACKETS_2026_MARRIED_JOINTLY
    : MN_BRACKETS_2026_SINGLE;
}

export const mnStateEngine: StateTaxEngine = {
  stateCode: 'MN',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 30600 : 15300;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'MN',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
