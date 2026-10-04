import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Rhode Island individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $11,200 single / $22,400 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const RI_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 82050, rate: 0.0375 },
  { min: 82050, max: 186450, rate: 0.0475 },
  { min: 186450, max: null, rate: 0.0599 },
];

const RI_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 82050, rate: 0.0375 },
  { min: 82050, max: 186450, rate: 0.0475 },
  { min: 186450, max: null, rate: 0.0599 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? RI_BRACKETS_2026_MARRIED_JOINTLY
    : RI_BRACKETS_2026_SINGLE;
}

export const riStateEngine: StateTaxEngine = {
  stateCode: 'RI',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 22400 : 11200;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'RI',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
