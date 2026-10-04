import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 New Mexico individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $16,100 single / $32,200 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const NM_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 5500, rate: 0.015 },
  { min: 5500, max: 16500, rate: 0.032 },
  { min: 16500, max: 33500, rate: 0.043 },
  { min: 33500, max: 66500, rate: 0.047 },
  { min: 66500, max: 210000, rate: 0.049 },
  { min: 210000, max: null, rate: 0.059 },
];

const NM_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 8000, rate: 0.015 },
  { min: 8000, max: 25000, rate: 0.032 },
  { min: 25000, max: 50000, rate: 0.043 },
  { min: 50000, max: 100000, rate: 0.047 },
  { min: 100000, max: 315000, rate: 0.049 },
  { min: 315000, max: null, rate: 0.059 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? NM_BRACKETS_2026_MARRIED_JOINTLY
    : NM_BRACKETS_2026_SINGLE;
}

export const nmStateEngine: StateTaxEngine = {
  stateCode: 'NM',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 32200 : 16100;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'NM',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
