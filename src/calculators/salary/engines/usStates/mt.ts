import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Montana individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $16,100 single / $32,200 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const MT_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 47500, rate: 0.047 },
  { min: 47500, max: null, rate: 0.0565 },
];

const MT_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 95000, rate: 0.047 },
  { min: 95000, max: null, rate: 0.0565 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? MT_BRACKETS_2026_MARRIED_JOINTLY
    : MT_BRACKETS_2026_SINGLE;
}

export const mtStateEngine: StateTaxEngine = {
  stateCode: 'MT',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 32200 : 16100;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'MT',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
