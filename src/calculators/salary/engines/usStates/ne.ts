import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Nebraska individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $8,850 single / $17,700 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const NE_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 4130, rate: 0.0246 },
  { min: 4130, max: 24760, rate: 0.0351 },
  { min: 24760, max: null, rate: 0.0455 },
];

const NE_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 8250, rate: 0.0246 },
  { min: 8250, max: 49530, rate: 0.0351 },
  { min: 49530, max: null, rate: 0.0455 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? NE_BRACKETS_2026_MARRIED_JOINTLY
    : NE_BRACKETS_2026_SINGLE;
}

export const neStateEngine: StateTaxEngine = {
  stateCode: 'NE',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 17700 : 8850;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'NE',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
