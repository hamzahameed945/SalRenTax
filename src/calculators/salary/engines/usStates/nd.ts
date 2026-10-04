import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 North Dakota individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $16,100 single / $32,200 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const ND_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 48475, rate: 0 },
  { min: 48475, max: 244825, rate: 0.0195 },
  { min: 244825, max: null, rate: 0.025 },
];

const ND_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 80975, rate: 0 },
  { min: 80975, max: 298075, rate: 0.0195 },
  { min: 298075, max: null, rate: 0.025 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? ND_BRACKETS_2026_MARRIED_JOINTLY
    : ND_BRACKETS_2026_SINGLE;
}

export const ndStateEngine: StateTaxEngine = {
  stateCode: 'ND',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 32200 : 16100;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'ND',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
