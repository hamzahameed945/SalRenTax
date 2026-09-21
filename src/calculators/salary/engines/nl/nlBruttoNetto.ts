import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  nlBox1Brackets2026,
  nlBox1BracketsAOW2026,
  nlBox1BracketsAOWPre1946_2026,
  nlAlgemeneHeffingskorting2026,
  nlArbeidskorting2026,
  nlArbeidskortingAOW2026,
  nlIACK2026,
  nlOuderenkorting2026,
  nlDertigProcentRegeling2026,
  NL_AOW_AGE_2026,
  NL_VAKANTIEGELD_RATE,
} from '../../../../data/salary/nl/nlTaxData2026';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface NlBruttoNettoInput {
  /** Annual gross salary in EUR (excluding holiday allowance). */
  grossAnnual: number;
  /** Age of the taxpayer (affects AOW bracket rates and ouderenkorting). */
  age?: number;
  /** Whether the 30% expat ruling applies. Reduces taxable salary by 30%. */
  thirtyPercentRuling?: boolean;
  /** Include the 8% statutory holiday allowance (vakantiegeld) in the gross. */
  includeVakantiegeld?: boolean;
  /** Whether taxpayer has qualifying children under 12 for IACK. */
  iackEligible?: boolean;
  /** Whether taxpayer was born before 1 January 1946 (affects schijf-1 ceiling). */
  bornBefore1946?: boolean;
  /** Pay period for per-period output: 'annual' | 'monthly' | 'fourweekly' | 'weekly'. */
  payPeriod?: 'annual' | 'monthly' | 'fourweekly' | 'weekly';
}

export interface NlBruttoNettoBreakdown {
  /** Gross annual salary (base, excl. vakantiegeld). */
  grossBase: number;
  /** Vakantiegeld (8% of gross base) if included, else 0. */
  vakantiegeld: number;
  /** Total gross including vakantiegeld. */
  grossTotal: number;
  /** Taxable income after 30% ruling reduction. */
  taxableIncome: number;
  /** The 30% tax-free allowance amount (0 if ruling not applied). */
  thirtyPctAllowance: number;
  /** Raw Box 1 tax before any credits. */
  box1TaxRaw: number;
  /** Box 1 tax per bracket for UI table. */
  box1PerBracket: { bracketLabel: string; taxableAmount: number; rate: number; taxOwed: number }[];
  /** Social security component breakdown (AOW, WLZ, ANW) embedded in Box 1 rates. */
  socialSecurityBreakdown: {
    aow: number;      // State pension contribution
    wlz: number;      // Long-term care contribution
    anw: number;      // Survivors benefit contribution
    total: number;    // Total social security
  };
  /** Algemene heffingskorting applied. */
  algemeenHeffingskorting: number;
  /** Algemene heffingskorting before cap (shows phase-out). */
  algemeenHeffingskortingUncapped: number;
  /** Arbeidskorting applied. */
  arbeidskorting: number;
  /** Arbeidskorting before cap (shows phase-out). */
  arbeidskortingUncapped: number;
  /** IACK (combinatiekorting) applied. */
  iack: number;
  /** Ouderenkorting applied (AOW-age taxpayers only). */
  ouderenkorting: number;
  /** Total tax credits. */
  totalCredits: number;
  /** Net income tax after all credits. */
  incomeTaxAnnual: number;
  /** Net annual income (grossTotal − incomeTaxAnnual). */
  netAnnual: number;
  /** Net monthly income. */
  netMonthly: number;
  /** Net per period (based on payPeriod). */
  netPerPeriod: number;
  /** Period label key. */
  periodLabel: string;
  /** Effective tax rate (incomeTaxAnnual / grossTotal). */
  effectiveRate: number;
  /** Marginal rate on last euro of gross base. */
  marginalRate: number;
  /** Take-home percentage. */
  takeHomePercentage: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Calculate the full piecewise Arbeidskorting for a given labour income. */
function calcArbeidskorting(labourIncome: number, isAOW: boolean): number {
  const segs = isAOW ? nlArbeidskortingAOW2026.segments : nlArbeidskorting2026.segments;
  for (const seg of segs) {
    const upper = seg.to ?? Infinity;
    if (labourIncome <= seg.from) return 0;
    if (labourIncome <= upper || seg.to === null) {
      if (seg.phaseOut) {
        return Math.max(0, seg.base - seg.rate * (labourIncome - seg.from));
      }
      return seg.base + seg.rate * (labourIncome - seg.from);
    }
  }
  return 0;
}

/** Calculate Algemene Heffingskorting for a given verzamelinkomen. */
function calcAHK(verzamelinkomen: number): number {
  const { maxCredit, flatUpTo, phaseOutRate, zeroAt } = nlAlgemeneHeffingskorting2026;
  if (verzamelinkomen <= flatUpTo) return maxCredit;
  if (verzamelinkomen >= zeroAt) return 0;
  return Math.max(0, maxCredit - phaseOutRate * (verzamelinkomen - flatUpTo));
}

/** Calculate IACK for eligible parents. */
function calcIACK(labourIncome: number): number {
  const { minIncome, maxCredit, phaseInRate, maxAt } = nlIACK2026;
  if (labourIncome < minIncome) return 0;
  if (labourIncome >= maxAt) return maxCredit;
  return Math.min(maxCredit, phaseInRate * (labourIncome - minIncome));
}

/** Calculate ouderenkorting for AOW-age taxpayers. */
function calcOuderenkorting(verzamelinkomen: number): number {
  const { maxCredit, flatUpTo, phaseOutRate, zeroAt } = nlOuderenkorting2026;
  if (verzamelinkomen <= flatUpTo) return maxCredit;
  if (verzamelinkomen >= zeroAt) return 0;
  return Math.max(0, maxCredit - phaseOutRate * (verzamelinkomen - flatUpTo));
}

function periodDivisor(period: string): number {
  switch (period) {
    case 'monthly':    return 12;
    case 'fourweekly': return 13;
    case 'weekly':     return 52;
    default:           return 1;
  }
}

// ─── Engine ────────────────────────────────────────────────────────────────

export const nlBruttoNettoEngine: CalculatorEngine<NlBruttoNettoInput, NlBruttoNettoBreakdown, never> = {
  validate(input: NlBruttoNettoInput): ValidationResult<NlBruttoNettoInput> {
    const errors: Partial<Record<keyof NlBruttoNettoInput, string>> = {};

    if (!input.grossAnnual || typeof input.grossAnnual === 'number' && Number.isNaN(input.grossAnnual)) {
      errors.grossAnnual = 'errors.invalidNumber';
    } else if (input.grossAnnual <= 0) {
      errors.grossAnnual = 'errors.mustBePositive';
    } else if (input.grossAnnual > 10_000_000) {
      errors.grossAnnual = 'errors.tooHigh';
    }

    if (input.age !== undefined) {
      if (typeof input.age === 'number' && Number.isNaN(input.age) || input.age < 15 || input.age > 100) {
        errors.age = 'errors.invalidAge';
      }
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: NlBruttoNettoInput): NlBruttoNettoBreakdown {
    const {
      grossAnnual,
      age,
      thirtyPercentRuling = false,
      includeVakantiegeld = false,
      iackEligible = false,
      bornBefore1946 = false,
      payPeriod = 'monthly',
    } = input;

    // ── 1. Gross incl. vakantiegeld ──────────────────────────────────────
    const vakantiegeld = includeVakantiegeld
      ? Math.round(grossAnnual * NL_VAKANTIEGELD_RATE * 100) / 100
      : 0;
    const grossTotal = grossAnnual + vakantiegeld;

    // ── 2. AOW status ────────────────────────────────────────────────────
    const isAOW = age !== undefined && age >= NL_AOW_AGE_2026;

    // ── 3. 30% ruling — reduces the LABOUR income taxed in Box 1 ────────
    const thirtyPctAllowance = thirtyPercentRuling
      ? grossAnnual * nlDertigProcentRegeling2026.rate
      : 0;
    // Taxable = gross base minus the 30% allowance; vakantiegeld is always fully taxable
    const taxableIncome = grossAnnual - thirtyPctAllowance + vakantiegeld;

    // ── 4. Box 1 progressive tax ─────────────────────────────────────────
    const brackets = bornBefore1946
      ? nlBox1BracketsAOWPre1946_2026
      : isAOW
        ? nlBox1BracketsAOW2026
        : nlBox1Brackets2026;

    const { totalTax: box1TaxRaw, marginalRate, perBracket } = calculateProgressiveTax(
      taxableIncome,
      brackets,
    );

    const box1PerBracket = perBracket
      .filter(pb => pb.taxOwed > 0 || pb.bracket.min < taxableIncome)
      .map((pb, i) => ({
        bracketLabel: `Schijf ${i + 1}`,
        taxableAmount: pb.taxOwed / pb.bracket.rate || 0,
        rate: pb.bracket.rate,
        taxOwed: pb.taxOwed,
      }));

    // ── 5. Tax credits ────────────────────────────────────────────────────
    // AHK uses verzamelinkomen = taxable income (simplified — box 2/3 excluded)
    const ahkUncapped = calcAHK(taxableIncome);
    const ahk = Math.min(box1TaxRaw, ahkUncapped);
    
    // Arbeidskorting uses the (untaxed) labour income figure
    const akUncapped = calcArbeidskorting(grossAnnual, isAOW);
    const akCappedByRemaining = Math.min(box1TaxRaw - ahk, akUncapped);
    const ak = Math.max(0, akCappedByRemaining);
    
    const iack = iackEligible ? calcIACK(grossAnnual) : 0;
    const ok = isAOW ? calcOuderenkorting(taxableIncome) : 0;

    // Credits cannot exceed the tax owed
    const totalCredits = Math.min(box1TaxRaw, ahk + ak + iack + ok);
    const incomeTaxAnnual = Math.max(0, box1TaxRaw - totalCredits);
    
    // ── 6. Social security breakdown ──────────────────────────────────────
    // Dutch Box 1 rates bundle social security. Extract the estimated components.
    // For under-AOW taxpayers: first bracket is 35.75% = 8.1% income tax + 27.65% social
    // Social breakdown: AOW 17.9%, WLZ 9.65%, ANW 0.1%
    const socialSecurityRate = isAOW ? 0.1975 : 0.2765; // AOW-age: no AOW premium (17.9%), only WLZ + ANW
    const firstBracketIncome = Math.min(taxableIncome, brackets[0].max ?? taxableIncome);
    const estimatedSocialSecurity = firstBracketIncome * socialSecurityRate;
    
    const socialSecurityBreakdown = {
      aow: isAOW ? 0 : firstBracketIncome * 0.179,      // 17.9% - AOW state pension
      wlz: firstBracketIncome * 0.0965,                  // 9.65% - Long-term care
      anw: firstBracketIncome * 0.001,                   // 0.1% - Survivors benefit
      total: estimatedSocialSecurity,
    };

    // ── 6. Net income ─────────────────────────────────────────────────────
    const netAnnual = grossTotal - incomeTaxAnnual;
    const netMonthly = netAnnual / 12;
    const divisor = periodDivisor(payPeriod);
    const netPerPeriod = netAnnual / divisor;
    const periodLabel = payPeriod;

    const effectiveRate = grossTotal > 0 ? incomeTaxAnnual / grossTotal : 0;
    const takeHomePercentage = grossTotal > 0 ? netAnnual / grossTotal : 0;

    return {
      grossBase: grossAnnual,
      vakantiegeld,
      grossTotal,
      taxableIncome,
      thirtyPctAllowance,
      box1TaxRaw,
      box1PerBracket,
      socialSecurityBreakdown,
      algemeenHeffingskorting: ahk,
      algemeenHeffingskortingUncapped: ahkUncapped,
      arbeidskorting: ak,
      arbeidskortingUncapped: akUncapped,
      iack: Math.min(Math.max(0, box1TaxRaw - ahk - ak), iack),
      ouderenkorting: ok,
      totalCredits,
      incomeTaxAnnual,
      netAnnual,
      netMonthly,
      netPerPeriod,
      periodLabel,
      effectiveRate,
      marginalRate,
      takeHomePercentage,
    };
  },
};
