import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 South Carolina individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $8,350 single / $16,700 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const SC_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 3640, rate: 0 },
  { min: 3640, max: 18230, rate: 0.03 },
  { min: 18230, max: null, rate: 0.06 },
];

const SC_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 3640, rate: 0 },
  { min: 3640, max: 18230, rate: 0.03 },
  { min: 18230, max: null, rate: 0.06 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? SC_BRACKETS_2026_MARRIED_JOINTLY
    : SC_BRACKETS_2026_SINGLE;
}

export const scStateEngine: StateTaxEngine = {
  stateCode: 'SC',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 16700 : 8350;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'SC',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
