import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Missouri individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $16,100 single / $32,200 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const MO_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 1348, rate: 0 },
  { min: 1348, max: 2696, rate: 0.02 },
  { min: 2696, max: 4044, rate: 0.025 },
  { min: 4044, max: 5392, rate: 0.03 },
  { min: 5392, max: 6740, rate: 0.035 },
  { min: 6740, max: 8088, rate: 0.04 },
  { min: 8088, max: 9436, rate: 0.045 },
  { min: 9436, max: null, rate: 0.047 },
];

const MO_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 1348, rate: 0 },
  { min: 1348, max: 2696, rate: 0.02 },
  { min: 2696, max: 4044, rate: 0.025 },
  { min: 4044, max: 5392, rate: 0.03 },
  { min: 5392, max: 6740, rate: 0.035 },
  { min: 6740, max: 8088, rate: 0.04 },
  { min: 8088, max: 9436, rate: 0.045 },
  { min: 9436, max: null, rate: 0.047 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? MO_BRACKETS_2026_MARRIED_JOINTLY
    : MO_BRACKETS_2026_SINGLE;
}

export const moStateEngine: StateTaxEngine = {
  stateCode: 'MO',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 32200 : 16100;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'MO',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
