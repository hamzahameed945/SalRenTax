import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 South Carolina individual income tax.
// SOURCE: Act No. 110 (H.4216), 126th SC General Assembly, signed 2026-03-30,
// effective for tax years beginning after 2025; SC DOR 2026 individual income
// tax tables; SC Association of CPAs 2026 tax update.
//
// 2026 brought a full restructure — the old graduated 0%/3%/6% schedule and the
// federal-conforming standard deduction are gone:
//   - Two brackets, same for every filing status: 1.99% on SC taxable income up
//     to $30,000; 5.21% on taxable income above $30,000.
//   - SC Income Adjusted Deduction (SCIAD) replaces the standard/itemized
//     deduction: $15,000 single/MFS, $22,500 head of household, $30,000 married
//     jointly. It phases out linearly over a federal-AGI range: single/MFS
//     $40,000-$95,000, HoH $60,000-$142,500, MFJ $80,000-$190,000. The phase-out
//     reduction is rounded down to the next lowest $10; at/above the range end
//     no deduction is allowed.
// The starting point is federal AGI, so pre-tax deductions (401(k), HSA, ...)
// reduce the base. Other SC additions/subtractions and credits are not modeled:
// this is a state-level estimate.

const RATE_LOW = 0.0199;
const RATE_HIGH = 0.0521;
const BRACKET_BREAK = 30000;

interface SciadRule {
  base: number;
  phaseOutStart: number;
  phaseOutWidth: number;
}

function getSciadRule(filingStatus: FilingStatus): SciadRule {
  switch (filingStatus) {
    case 'marriedJointly':
      return { base: 30000, phaseOutStart: 80000, phaseOutWidth: 110000 };
    case 'headOfHousehold':
      return { base: 22500, phaseOutStart: 60000, phaseOutWidth: 82500 };
    default:
      // 'single' and 'marriedSeparately'
      return { base: 15000, phaseOutStart: 40000, phaseOutWidth: 55000 };
  }
}

/** SC Income Adjusted Deduction for a given federal AGI (phase-out floored to $10s). */
export function calculateSciad(federalAgi: number, filingStatus: FilingStatus): number {
  const { base, phaseOutStart, phaseOutWidth } = getSciadRule(filingStatus);
  if (federalAgi <= phaseOutStart) return base;
  const fraction = (federalAgi - phaseOutStart) / phaseOutWidth;
  if (fraction >= 1) return 0;
  const reduction = Math.floor((base * fraction) / 10) * 10;
  return Math.max(0, base - reduction);
}

export const scStateEngine: StateTaxEngine = {
  stateCode: 'SC',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    // Federal AGI proxy: pre-tax deductions reduce AGI.
    const federalAgi = Math.max(0, annualGrossPay - annualPreTaxDeductions);
    const sciad = calculateSciad(federalAgi, input.filingStatus);
    const taxable = Math.max(0, federalAgi - sciad);
    const annualStateIncomeTax =
      Math.min(taxable, BRACKET_BREAK) * RATE_LOW +
      Math.max(0, taxable - BRACKET_BREAK) * RATE_HIGH;
    return {
      state: 'SC',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
