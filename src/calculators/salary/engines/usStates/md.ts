import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Maryland individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $3,350 single / $6,700 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const MD_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 1000, rate: 0.02 },
  { min: 1000, max: 2000, rate: 0.03 },
  { min: 2000, max: 3000, rate: 0.04 },
  { min: 3000, max: 100000, rate: 0.0475 },
  { min: 100000, max: 125000, rate: 0.05 },
  { min: 125000, max: 150000, rate: 0.0525 },
  { min: 150000, max: 250000, rate: 0.055 },
  { min: 250000, max: 500000, rate: 0.0575 },
  { min: 500000, max: 1000000, rate: 0.0625 },
  { min: 1000000, max: null, rate: 0.065 },
];

const MD_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 1000, rate: 0.02 },
  { min: 1000, max: 2000, rate: 0.03 },
  { min: 2000, max: 3000, rate: 0.04 },
  { min: 3000, max: 150000, rate: 0.0475 },
  { min: 150000, max: 175000, rate: 0.05 },
  { min: 175000, max: 225000, rate: 0.0525 },
  { min: 225000, max: 300000, rate: 0.055 },
  { min: 300000, max: 600000, rate: 0.0575 },
  { min: 600000, max: 1200000, rate: 0.0625 },
  { min: 1200000, max: null, rate: 0.065 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? MD_BRACKETS_2026_MARRIED_JOINTLY
    : MD_BRACKETS_2026_SINGLE;
}

export const mdStateEngine: StateTaxEngine = {
  stateCode: 'MD',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 6700 : 3350;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'MD',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
