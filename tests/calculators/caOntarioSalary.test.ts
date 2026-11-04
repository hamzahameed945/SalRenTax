import { describe, expect, it } from 'vitest';
import { calculateCaOntarioSalary } from '../../src/calculators/salary/engines/ca/canadaOntarioSalary';

// 2026 rates (CRA T4032/T4127), calculated by hand from the brackets in the
// engine. Basic personal amounts are applied at full value, with no phase-out.
describe('calculateCaOntarioSalary', () => {
  it('calculates a low salary below all CPP/EI caps', () => {
    expect(calculateCaOntarioSalary(30000)).toEqual({
      grossAnnual: 30000,
      federalTax: 1896.72,
      ontarioTax: 859.06,
      ontarioSurtax: 0,
      cpp: 1576.75,
      cpp2: 0,
      ei: 489,
      totalDeductions: 4821.53,
      netAnnual: 25178.47,
      netMonthly: 2098.21,
    });
  });

  it('calculates a mid salary of $75,000, at the CPP maximum', () => {
    expect(calculateCaOntarioSalary(75000)).toEqual({
      grossAnnual: 75000,
      federalTax: 9267.73,
      ontarioTax: 3997.02,
      ontarioSurtax: 0,
      cpp: 4230.45,
      cpp2: 16,
      ei: 1123.07,
      totalDeductions: 18634.27,
      netAnnual: 56365.73,
      netMonthly: 4697.14,
    });
  });

  it('calculates a high salary above the CPP2 and EI caps, including surtax', () => {
    expect(calculateCaOntarioSalary(150000)).toEqual({
      grossAnnual: 150000,
      federalTax: 26455.25,
      ontarioTax: 14420.4,
      ontarioSurtax: 2712.35,
      cpp: 4230.45,
      cpp2: 416,
      ei: 1123.07,
      totalDeductions: 46645.17,
      netAnnual: 103354.83,
      netMonthly: 8612.9,
    });
  });
});
