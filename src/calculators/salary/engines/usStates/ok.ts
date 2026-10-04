import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Oklahoma individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $6,350 single / $12,700 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const OK_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 3750, rate: 0 },
  { min: 3750, max: 4900, rate: 0.025 },
  { min: 4900, max: 7200, rate: 0.035 },
  { min: 7200, max: null, rate: 0.045 },
];

const OK_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 7500, rate: 0 },
  { min: 7500, max: 9800, rate: 0.025 },
  { min: 9800, max: 14400, rate: 0.035 },
  { min: 14400, max: null, rate: 0.045 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? OK_BRACKETS_2026_MARRIED_JOINTLY
    : OK_BRACKETS_2026_SINGLE;
}

export const okStateEngine: StateTaxEngine = {
  stateCode: 'OK',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 12700 : 6350;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'OK',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
