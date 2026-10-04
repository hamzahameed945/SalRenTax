import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Connecticut individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction no standard deduction modeled; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const CT_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 10000, rate: 0.02 },
  { min: 10000, max: 50000, rate: 0.045 },
  { min: 50000, max: 100000, rate: 0.055 },
  { min: 100000, max: 200000, rate: 0.06 },
  { min: 200000, max: 250000, rate: 0.065 },
  { min: 250000, max: 500000, rate: 0.069 },
  { min: 500000, max: null, rate: 0.0699 },
];

const CT_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 20000, rate: 0.02 },
  { min: 20000, max: 100000, rate: 0.045 },
  { min: 100000, max: 200000, rate: 0.055 },
  { min: 200000, max: 400000, rate: 0.06 },
  { min: 400000, max: 500000, rate: 0.065 },
  { min: 500000, max: 1000000, rate: 0.069 },
  { min: 1000000, max: null, rate: 0.0699 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? CT_BRACKETS_2026_MARRIED_JOINTLY
    : CT_BRACKETS_2026_SINGLE;
}

export const ctStateEngine: StateTaxEngine = {
  stateCode: 'CT',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 0 : 0;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'CT',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
