import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { TaxBracket } from '../../../core/progressiveTax';
import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 New Jersey state income tax brackets
// SOURCE: New Jersey Division of Taxation
const NJ_BRACKETS_2026_SINGLE: TaxBracket[] = [
  { min: 0, max: 20_000, rate: 0.014 },
  { min: 20_000, max: 35_000, rate: 0.0175 },
  { min: 35_000, max: 40_000, rate: 0.035 },
  { min: 40_000, max: 75_000, rate: 0.05525 },
  { min: 75_000, max: 500_000, rate: 0.0637 },
  { min: 500_000, max: 1_000_000, rate: 0.0897 },
  { min: 1_000_000, max: null, rate: 0.1075 },
];

const NJ_BRACKETS_2026_MARRIED_JOINTLY: TaxBracket[] = [
  { min: 0, max: 20_000, rate: 0.014 },
  { min: 20_000, max: 50_000, rate: 0.0175 },
  { min: 50_000, max: 70_000, rate: 0.0245 },
  { min: 70_000, max: 80_000, rate: 0.035 },
  { min: 80_000, max: 150_000, rate: 0.05525 },
  { min: 150_000, max: 500_000, rate: 0.0637 },
  { min: 500_000, max: 1_000_000, rate: 0.0897 },
  { min: 1_000_000, max: null, rate: 0.1075 },
];

const NJ_BRACKETS_2026_MARRIED_SEPARATELY: TaxBracket[] = [
  { min: 0, max: 10_000, rate: 0.014 },
  { min: 10_000, max: 25_000, rate: 0.0175 },
  { min: 25_000, max: 35_000, rate: 0.0245 },
  { min: 35_000, max: 40_000, rate: 0.035 },
  { min: 40_000, max: 75_000, rate: 0.05525 },
  { min: 75_000, max: 250_000, rate: 0.0637 },
  { min: 250_000, max: 500_000, rate: 0.0897 },
  { min: 500_000, max: null, rate: 0.1075 },
];

// New Jersey has no standard deduction - uses personal exemptions instead
// For 2026, personal exemption amounts (estimated)
const NJ_PERSONAL_EXEMPTION_2026 = {
  single: 1_000,
  marriedJointly: 2_000,
  marriedSeparately: 1_000,
  headOfHousehold: 1_000,
} as const;

function getNJPersonalExemption(filingStatus: FilingStatus): number {
  switch (filingStatus) {
    case 'single':
      return NJ_PERSONAL_EXEMPTION_2026.single;
    case 'marriedJointly':
      return NJ_PERSONAL_EXEMPTION_2026.marriedJointly;
    case 'marriedSeparately':
      return NJ_PERSONAL_EXEMPTION_2026.marriedSeparately;
    case 'headOfHousehold':
      return NJ_PERSONAL_EXEMPTION_2026.headOfHousehold;
    default:
      return NJ_PERSONAL_EXEMPTION_2026.single;
  }
}

function getNJBrackets(filingStatus: FilingStatus): TaxBracket[] {
  switch (filingStatus) {
    case 'marriedJointly':
      return NJ_BRACKETS_2026_MARRIED_JOINTLY;
    case 'marriedSeparately':
      return NJ_BRACKETS_2026_MARRIED_SEPARATELY;
    case 'single':
    case 'headOfHousehold':
    default:
      return NJ_BRACKETS_2026_SINGLE;
  }
}

export const njStateEngine: StateTaxEngine = {
  stateCode: 'NJ',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const personalExemption = getNJPersonalExemption(input.filingStatus);
    const taxableIncome = Math.max(0, annualGrossPay - annualPreTaxDeductions - personalExemption);
    const brackets = getNJBrackets(input.filingStatus);
    
    const { totalTax: annualStateIncomeTax } = calculateProgressiveTax(taxableIncome, brackets);
    
    return {
      state: 'NJ',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};