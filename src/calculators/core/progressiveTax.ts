/**
 * Shared math utility for progressive (marginal) tax brackets.
 * Country-specific bracket data (rates/thresholds) must live in each
 * country's own data file — this function contains no country rules.
 */

export interface TaxBracket {
  /** Lower bound of this bracket (inclusive), in the same currency unit as income. */
  min: number;
  /** Upper bound of this bracket (exclusive), or null for the top, open-ended bracket. */
  max: number | null;
  /** Marginal rate for income within this bracket, expressed as a decimal (0.22 = 22%). */
  rate: number;
}

export interface ProgressiveTaxResult {
  totalTax: number;
  marginalRate: number;
  effectiveRate: number;
  /** Tax owed per bracket, in bracket order, for building a UI breakdown. */
  perBracket: { bracket: TaxBracket; taxOwed: number }[];
}

export function calculateProgressiveTax(
  taxableIncome: number,
  brackets: TaxBracket[],
): ProgressiveTaxResult {
  const income = Math.max(0, taxableIncome);
  let totalTax = 0;
  let marginalRate = 0;
  const perBracket: { bracket: TaxBracket; taxOwed: number }[] = [];

  for (const bracket of brackets) {
    if (income <= bracket.min) {
      perBracket.push({ bracket, taxOwed: 0 });
      continue;
    }
    const upper = bracket.max === null ? income : Math.min(income, bracket.max);
    const taxableInBracket = Math.max(0, upper - bracket.min);
    const taxOwed = taxableInBracket * bracket.rate;
    totalTax += taxOwed;
    perBracket.push({ bracket, taxOwed });
    if (taxableInBracket > 0) {
      marginalRate = bracket.rate;
    }
  }

  const effectiveRate = income > 0 ? totalTax / income : 0;

  return { totalTax, marginalRate, effectiveRate, perBracket };
}
