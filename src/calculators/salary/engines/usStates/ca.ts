import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 California state income tax brackets (inflation-adjusted estimates)
// SOURCE: California Franchise Tax Board, adjusted for 2026 inflation
const CA_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 11_430, rate: 0.01 },
  { min: 11_430, max: 27_100, rate: 0.02 },
  { min: 27_100, max: 42_770, rate: 0.04 },
  { min: 42_770, max: 59_380, rate: 0.06 },
  { min: 59_380, max: 75_080, rate: 0.08 },
  { min: 75_080, max: 383_330, rate: 0.093 },
  { min: 383_330, max: 460_000, rate: 0.103 },
  { min: 460_000, max: 766_660, rate: 0.113 },
  { min: 766_660, max: 1_000_000, rate: 0.123 },
  { min: 1_000_000, max: null, rate: 0.133 }, // Includes 1% Mental Health Services Tax
];

const CA_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 22_860, rate: 0.01 },
  { min: 22_860, max: 54_200, rate: 0.02 },
  { min: 54_200, max: 85_540, rate: 0.04 },
  { min: 85_540, max: 118_760, rate: 0.06 },
  { min: 118_760, max: 150_160, rate: 0.08 },
  { min: 150_160, max: 766_660, rate: 0.093 },
  { min: 766_660, max: 920_000, rate: 0.103 },
  { min: 920_000, max: 1_533_320, rate: 0.113 },
  { min: 1_533_320, max: 2_000_000, rate: 0.123 },
  { min: 2_000_000, max: null, rate: 0.133 }, // Includes 1% Mental Health Services Tax
];

// California standard deduction for 2026 (estimated with inflation adjustment)
const CA_STANDARD_DEDUCTION_2026 = {
  single: 5_706,
  marriedJointly: 11_412,
  marriedSeparately: 5_706,
  headOfHousehold: 11_412,
} as const;

function getCAStandardDeduction(filingStatus: FilingStatus): number {
  switch (filingStatus) {
    case 'single':
      return CA_STANDARD_DEDUCTION_2026.single;
    case 'marriedJointly':
      return CA_STANDARD_DEDUCTION_2026.marriedJointly;
    case 'marriedSeparately':
      return CA_STANDARD_DEDUCTION_2026.marriedSeparately;
    case 'headOfHousehold':
      return CA_STANDARD_DEDUCTION_2026.headOfHousehold;
    default:
      return CA_STANDARD_DEDUCTION_2026.single;
  }
}

function getCABrackets(filingStatus: FilingStatus): TaxBracket[] {
  switch (filingStatus) {
    case 'marriedJointly':
      return CA_BRACKETS_2026_MARRIED_JOINTLY;
    case 'single':
    case 'marriedSeparately':
    case 'headOfHousehold':
    default:
      return CA_BRACKETS_2026_SINGLE;
  }
}

export const caStateEngine: StateTaxEngine = {
  stateCode: 'CA',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const standardDeduction = getCAStandardDeduction(input.filingStatus);
    const taxableIncome = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const brackets = getCABrackets(input.filingStatus);
    
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxableIncome, brackets);
    
    return {
      state: 'CA',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};