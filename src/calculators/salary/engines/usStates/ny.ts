import type { StateTaxEngine } from './types';
import type { FilingStatus } from '../usPaycheck';

// 2026 New York State withholding-style annualized schedule.
// NYC local income tax is intentionally not modeled because this is a state calculator.
// The state page describes the result as a state-level estimate.
const SINGLE = [
  [8500, 0.039, 0], [11700, 0.044, 332], [13900, 0.0515, 472], [80650, 0.054, 586],
  [96800, 0.059, 4190], [107650, 0.0703, 5143], [157650, 0.0753, 5906], [215400, 0.064, 9673],
  [265400, 0.1144, 13369], [1077550, 0.0735, 19091],
] as const;

const MARRIED = [
  [8500, 0.039, 0], [11700, 0.044, 332], [13900, 0.0515, 472], [80650, 0.054, 586],
  [96800, 0.059, 4190], [107650, 0.0657, 5143], [157650, 0.0707, 5855], [211550, 0.0801, 9388],
  [323200, 0.064, 13708], [373200, 0.1349, 20854], [1077550, 0.0735, 27600], [2155350, 0.0765, 79369],
] as const;

function scheduleTax(taxable: number, filingStatus: FilingStatus): number {
  const brackets = filingStatus === 'marriedJointly' ? MARRIED : SINGLE;
  if (taxable <= brackets[0][0]) return taxable * brackets[0][1];
  let previous = 0;
  for (const [upper, rate, base] of brackets) {
    if (taxable < upper) return base + (taxable - previous) * rate;
    previous = upper;
  }
  if (filingStatus === 'marriedJointly') {
    if (taxable < 5_000_000) return 79_369 + (taxable - 2_155_350) * 0.1045;
    if (taxable < 25_000_000) return 79_369 + (5_000_000 - 2_155_350) * 0.1045 + (taxable - 5_000_000) * 0.111;
    return 79_369 + (5_000_000 - 2_155_350) * 0.1045 + (25_000_000 - 5_000_000) * 0.111 + (taxable - 25_000_000) * 0.117;
  }
  if (taxable < 5_000_000) return 19_091 + (taxable - 1_077_550) * 0.1045;
  if (taxable < 25_000_000) return 19_091 + (5_000_000 - 1_077_550) * 0.1045 + (taxable - 5_000_000) * 0.111;
  return 19_091 + (5_000_000 - 1_077_550) * 0.1045 + (25_000_000 - 5_000_000) * 0.111 + (taxable - 25_000_000) * 0.117;
}

export const nyStateEngine: StateTaxEngine = {
  stateCode: 'NY',
  calculate(input, annualGrossPay, annualPreTaxDeductions) {
    const deduction = input.filingStatus === 'marriedJointly' ? 16050 : 8000;
    const taxable = Math.max(0, annualGrossPay - annualPreTaxDeductions - deduction);
    const annualStateIncomeTax = scheduleTax(taxable, input.filingStatus);
    return {
      state: 'NY',
      stateIncomeTaxPerPeriod: annualStateIncomeTax,
      annualStateIncomeTax,
      effectiveStateRate: annualGrossPay > 0 ? annualStateIncomeTax / annualGrossPay : 0,
    };
  },
};
