import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 California individual income tax brackets.
// SOURCE: Tax Foundation, "2026 State Income Tax Rates and Brackets" (as of Jan 1, 2026).
// Rates include the 1% Mental Health Services Tax on income over $1,000,000.
// Simplified estimate: standard deduction $5,540 single / $11,080 married jointly;
// personal exemption credits are not modeled. Married brackets apply to marriedJointly;
// all other filing statuses use the single schedule.
const CA_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 11079, rate: 0.01 },
  { min: 11079, max: 26264, rate: 0.02 },
  { min: 26264, max: 41452, rate: 0.04 },
  { min: 41452, max: 57542, rate: 0.06 },
  { min: 57542, max: 72724, rate: 0.08 },
  { min: 72724, max: 371479, rate: 0.093 },
  { min: 371479, max: 445771, rate: 0.103 },
  { min: 445771, max: 742953, rate: 0.113 },
  { min: 742953, max: 1000000, rate: 0.123 },
  { min: 1000000, max: null, rate: 0.133 },
];

const CA_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 22158, rate: 0.01 },
  { min: 22158, max: 52528, rate: 0.02 },
  { min: 52528, max: 82904, rate: 0.04 },
  { min: 82904, max: 115084, rate: 0.06 },
  { min: 115084, max: 145448, rate: 0.08 },
  { min: 145448, max: 742958, rate: 0.093 },
  { min: 742958, max: 891542, rate: 0.103 },
  { min: 891542, max: 1000000, rate: 0.113 },
  { min: 1000000, max: 1485906, rate: 0.123 },
  { min: 1485906, max: null, rate: 0.133 },
];

function getCABrackets(filingStatus: FilingStatus): TaxBracket[] {
  return filingStatus === 'marriedJointly'
    ? CA_BRACKETS_2026_MARRIED_JOINTLY
    : CA_BRACKETS_2026_SINGLE;
}

export const caStateEngine: StateTaxEngine = {
  stateCode: 'CA',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = input.filingStatus === 'marriedJointly' ? 11080 : 5540;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxable, getCABrackets(input.filingStatus));
    return {
      state: 'CA',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
