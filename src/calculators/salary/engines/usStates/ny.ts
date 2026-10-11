import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 New York State statutory tax schedule.
// SOURCE: NYS Department of Taxation and Finance, 2026 estimated tax
// instructions; statutory brackets (single): 3.9% to $8,500, 4.4% to $11,700,
// 5.15% to $13,900, 5.4% to $80,650, 5.9% to $215,400, 6.85% to $1,077,550,
// 9.65% to $5,000,000, 10.3% to $25,000,000, 10.9% above. Married filing
// jointly thresholds: $17,150 / $23,600 / $27,900 / $161,550 / $323,200 /
// $2,155,350 / $5,000,000 / $25,000,000 (same rates).
// Base amounts below are the cumulative tax at the previous bracket's upper
// bound (e.g. single: $8,500 x 3.9% = $331.50).
// NYC local income tax is intentionally not modeled because this is a state calculator.
// NOTE: NY requires taxpayers with NY AGI above $107,650 to use a special tax
// computation worksheet that recaptures lower-bracket benefits; the statutory
// schedule here is the documented estimate the state page describes.
type BracketRow = readonly [upper: number, rate: number, base: number];

const SINGLE: readonly BracketRow[] = [
  [8500, 0.039, 0],
  [11700, 0.044, 331.5],
  [13900, 0.0515, 472.3],
  [80650, 0.054, 585.6],
  [215400, 0.059, 4190.1],
  [1077550, 0.0685, 12140.35],
  [5000000, 0.0965, 71197.625],
  [25000000, 0.103, 449714.05],
] as const;

const MARRIED: readonly BracketRow[] = [
  [17150, 0.039, 0],
  [23600, 0.044, 668.85],
  [27900, 0.0515, 952.65],
  [161550, 0.054, 1174.1],
  [323200, 0.059, 8391.2],
  [2155350, 0.0685, 17928.55],
  [5000000, 0.0965, 143430.825],
  [25000000, 0.103, 417939.55],
] as const;

const TOP_RATE = 0.109;

function scheduleTax(taxable: number, brackets: readonly BracketRow[]): number {
  let previous = 0;
  for (const [upper, rate, base] of brackets) {
    if (taxable < upper) return base + (taxable - previous) * rate;
    previous = upper;
  }
  const [lastUpper, , lastBase] = brackets[brackets.length - 1];
  return lastBase + (taxable - lastUpper) * TOP_RATE;
}

export const nyStateEngine: StateTaxEngine = {
  stateCode: 'NY',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const deduction = input.filingStatus === 'marriedJointly' ? 16050 : 8000;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - deduction);
    const brackets = input.filingStatus === 'marriedJointly' ? MARRIED : SINGLE;
    const annualStateIncomeTax = scheduleTax(taxable, brackets);
    return {
      state: 'NY',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
