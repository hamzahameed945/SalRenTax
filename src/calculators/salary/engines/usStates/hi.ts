import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 Hawaii individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Simplified estimate: standard deduction $4,400 single / $8,800 married jointly; personal exemptions
// and credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const HI_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 9600, rate: 0.014 },
  { min: 9600, max: 14400, rate: 0.032 },
  { min: 14400, max: 19200, rate: 0.055 },
  { min: 19200, max: 24000, rate: 0.064 },
  { min: 24000, max: 36000, rate: 0.068 },
  { min: 36000, max: 48000, rate: 0.072 },
  { min: 48000, max: 125000, rate: 0.076 },
  { min: 125000, max: 175000, rate: 0.079 },
  { min: 175000, max: 225000, rate: 0.0825 },
  { min: 225000, max: 275000, rate: 0.09 },
  { min: 275000, max: 325000, rate: 0.1 },
  { min: 325000, max: null, rate: 0.11 },
];

const HI_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 19200, rate: 0.014 },
  { min: 19200, max: 28800, rate: 0.032 },
  { min: 28800, max: 38400, rate: 0.055 },
  { min: 38400, max: 48000, rate: 0.064 },
  { min: 48000, max: 72000, rate: 0.068 },
  { min: 72000, max: 96000, rate: 0.072 },
  { min: 96000, max: 250000, rate: 0.076 },
  { min: 250000, max: 350000, rate: 0.079 },
  { min: 350000, max: 450000, rate: 0.0825 },
  { min: 450000, max: 550000, rate: 0.09 },
  { min: 550000, max: 650000, rate: 0.1 },
  { min: 650000, max: null, rate: 0.11 },
];

function getBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? HI_BRACKETS_2026_MARRIED_JOINTLY
    : HI_BRACKETS_2026_SINGLE;
}

export const hiStateEngine: StateTaxEngine = {
  stateCode: 'HI',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 8800 : 4400;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getBrackets(input.filingStatus));
    return {
      state: 'HI',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
