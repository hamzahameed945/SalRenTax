/**
 * Canada (Ontario) salary engine, 2026 rates (CRA T4032/T4127).
 *
 * Version 1 scope: federal and Ontario income tax with the full basic
 * personal amount credits (no basic personal amount phase-out is modelled),
 * Ontario surtax, CPP/CPP2 and EI. It does not model the Ontario Health
 * Premium, LIFT or any other credit or deduction.
 */

export interface CaOntarioSalaryResult {
  grossAnnual: number;
  federalTax: number;
  ontarioTax: number;
  ontarioSurtax: number;
  cpp: number;
  cpp2: number;
  ei: number;
  totalDeductions: number;
  netAnnual: number;
  netMonthly: number;
}

type Bracket = { limit: number; rate: number };

const FEDERAL_BRACKETS: Bracket[] = [
  { limit: 58523, rate: 0.14 },
  { limit: 117045, rate: 0.205 },
  { limit: 181440, rate: 0.26 },
  { limit: 258482, rate: 0.29 },
  { limit: Number.POSITIVE_INFINITY, rate: 0.33 },
];

const ONTARIO_BRACKETS: Bracket[] = [
  { limit: 53891, rate: 0.0505 },
  { limit: 107785, rate: 0.0915 },
  { limit: 150000, rate: 0.1116 },
  { limit: 220000, rate: 0.1216 },
  { limit: Number.POSITIVE_INFINITY, rate: 0.1316 },
];

const FEDERAL_BPA_CREDIT = 16452 * 0.14;
const ONTARIO_BPA_CREDIT = 12989 * 0.0505;

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function bracketTax(grossAnnual: number, brackets: Bracket[]): number {
  let tax = 0;
  let lower = 0;
  for (const bracket of brackets) {
    if (grossAnnual <= lower) break;
    tax += (Math.min(grossAnnual, bracket.limit) - lower) * bracket.rate;
    lower = bracket.limit;
  }
  return tax;
}

export function calculateCaOntarioSalary(grossAnnual: number): CaOntarioSalaryResult {
  const gross = Math.max(0, grossAnnual);
  const federalTax = Math.max(
    0,
    roundToCents(bracketTax(gross, FEDERAL_BRACKETS) - FEDERAL_BPA_CREDIT),
  );
  const ontarioBaseTax = Math.max(
    0,
    roundToCents(bracketTax(gross, ONTARIO_BRACKETS) - ONTARIO_BPA_CREDIT),
  );
  const ontarioSurtax = roundToCents(
    Math.max(0, ontarioBaseTax - 5818) * 0.2 + Math.max(0, ontarioBaseTax - 7446) * 0.36,
  );
  const ontarioTax = roundToCents(ontarioBaseTax + ontarioSurtax);
  const cpp = roundToCents(Math.min(Math.max(gross - 3500, 0), 74600 - 3500) * 0.0595);
  const cpp2 = roundToCents(Math.min(Math.max(gross - 74600, 0), 85000 - 74600) * 0.04);
  const ei = roundToCents(Math.min(gross, 68900) * 0.0163);
  const totalDeductions = roundToCents(federalTax + ontarioTax + cpp + cpp2 + ei);
  const netAnnual = roundToCents(gross - totalDeductions);
  return {
    grossAnnual: roundToCents(gross),
    federalTax,
    ontarioTax,
    ontarioSurtax,
    cpp,
    cpp2,
    ei,
    totalDeductions,
    netAnnual,
    netMonthly: roundToCents(netAnnual / 12),
  };
}
