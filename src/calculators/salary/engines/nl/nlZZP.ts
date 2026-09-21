import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  nlBox1Brackets2026,
  nlAlgemeneHeffingskorting2026,
  nlArbeidskorting2026,
  nlZZPData2026,
  NL_VAKANTIEGELD_RATE,
} from '../../../../data/salary/nl/nlTaxData2026';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface NlZZPInput {
  /** Annual revenue (omzet) in EUR. */
  annualRevenue: number;
  /** Business costs / expenses deductible from revenue. */
  businessCosts?: number;
  /** Whether the starter's extra deduction (startersaftrek) applies (first 3 years). */
  isStarter?: boolean;
  /** Hourly rate — used to back-calculate revenue if annualRevenue not directly entered. */
  hourlyRate?: number;
  /** Billable hours per year (used with hourlyRate). */
  billableHours?: number;
  /** Include vakantiegeld reserve (8% of profit) in cost estimate. */
  includeVakantiegeldReserve?: boolean;
}

export interface NlZZPResult {
  annualRevenue: number;
  businessCosts: number;
  grossProfit: number;
  zelfstandigenaftrek: number;
  startersaftrek: number;
  profitAfterEntrepreneurDeductions: number;
  mkbWinstvrijstelling: number;
  taxableProfit: number;
  box1TaxRaw: number;
  algemeenHeffingskorting: number;
  arbeidskorting: number;
  totalCredits: number;
  incomeTax: number;
  /** Estimated ZZP pension / AOW reserve (not deducted — informational). */
  pensionReserveInfo: number;
  /** Estimated VAT obligation (21% on revenue — informational only, actual may differ). */
  vatObligationInfo: number;
  /** Vakantiegeld reserve if requested. */
  vakantiegeldReserve: number;
  netAnnual: number;
  netMonthly: number;
  effectiveRate: number;
  /** Implied hourly rate if billableHours provided. */
  impliedHourlyRate: number | null;
  /** Break-even rate to at least match employee on minimum wage. */
  minimumViableHourlyRate: number | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function calcAHK(verzamelinkomen: number): number {
  const { maxCredit, flatUpTo, phaseOutRate, zeroAt } = nlAlgemeneHeffingskorting2026;
  if (verzamelinkomen <= flatUpTo) return maxCredit;
  if (verzamelinkomen >= zeroAt) return 0;
  return Math.max(0, maxCredit - phaseOutRate * (verzamelinkomen - flatUpTo));
}

function calcArbeidskorting(labourIncome: number): number {
  const segs = nlArbeidskorting2026.segments;
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

// ─── Engine ────────────────────────────────────────────────────────────────

export const nlZZPEngine: CalculatorEngine<NlZZPInput, NlZZPResult, never> = {
  validate(input: NlZZPInput): ValidationResult<NlZZPInput> {
    const errors: Partial<Record<keyof NlZZPInput, string>> = {};

    // Resolve revenue from hourlyRate × hours if annualRevenue not given
    const hasRevenue = input.annualRevenue > 0 && !Number.isNaN(input.annualRevenue);
    const hasHourly = input.hourlyRate && input.billableHours;

    if (!hasRevenue && !hasHourly) {
      errors.annualRevenue = 'errors.invalidNumber';
    }
    if (input.businessCosts !== undefined && (Number.isNaN(input.businessCosts) || input.businessCosts < 0)) {
      errors.businessCosts = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: NlZZPInput): NlZZPResult {
    const {
      annualRevenue: rawRevenue,
      businessCosts = 0,
      isStarter = false,
      hourlyRate,
      billableHours,
      includeVakantiegeldReserve = false,
    } = input;

    // ── 1. Resolve revenue ────────────────────────────────────────────
    const annualRevenue =
      rawRevenue > 0
        ? rawRevenue
        : (hourlyRate ?? 0) * (billableHours ?? 0);

    const impliedHourlyRate =
      hourlyRate && hourlyRate > 0
        ? hourlyRate
        : billableHours && billableHours > 0
          ? annualRevenue / billableHours
          : null;

    // ── 2. Profit calculation ─────────────────────────────────────────
    const grossProfit = Math.max(0, annualRevenue - businessCosts);

    // Zelfstandigenaftrek (cannot exceed profit)
    const zelfstandigenaftrek = Math.min(grossProfit, nlZZPData2026.zelfstandigenaftrek);
    // Startersaftrek: additional €2.123 in first 3 years
    const startersaftrek = isStarter
      ? Math.min(grossProfit - zelfstandigenaftrek, nlZZPData2026.startersaftrek)
      : 0;

    const profitAfterEntrepreneurDeductions = Math.max(
      0,
      grossProfit - zelfstandigenaftrek - startersaftrek,
    );

    // MKB-winstvrijstelling: 13.31% of remaining profit (reduces taxable profit)
    const mkbWinstvrijstelling =
      profitAfterEntrepreneurDeductions * nlZZPData2026.mkbWinstvrijstelling;

    const taxableProfit = Math.max(0, profitAfterEntrepreneurDeductions - mkbWinstvrijstelling);

    // ── 3. Box 1 tax ──────────────────────────────────────────────────
    const { totalTax: box1TaxRaw } = calculateProgressiveTax(taxableProfit, nlBox1Brackets2026);

    // ── 4. Credits ────────────────────────────────────────────────────
    const ahk = calcAHK(taxableProfit);
    const ak = calcArbeidskorting(grossProfit); // ZZP labour income = grossProfit
    const totalCredits = Math.min(box1TaxRaw, ahk + ak);
    const incomeTax = Math.max(0, box1TaxRaw - totalCredits);

    // ── 5. Reserves (informational) ───────────────────────────────────
    // ~10% pension reserve is common advice for ZZP (not tax-deductible here)
    const pensionReserveInfo = grossProfit * 0.10;
    // VAT: ZZP typically collects 21% BTW on revenue and remits it quarterly
    const vatObligationInfo = annualRevenue * 0.21;
    // Vakantiegeld reserve (build up 8% monthly for time off)
    const vakantiegeldReserve = includeVakantiegeldReserve ? grossProfit * NL_VAKANTIEGELD_RATE : 0;

    // ── 6. Net ────────────────────────────────────────────────────────
    const netAnnual = grossProfit - incomeTax - vakantiegeldReserve;
    const netMonthly = netAnnual / 12;
    const effectiveRate = annualRevenue > 0 ? incomeTax / annualRevenue : 0;

    // Break-even hourly rate: aim for at least minimum wage employee net
    // Very rough: min employee annual gross ~€29.393 → net ~€24.000 after tax
    const minimumTargetNet = 24_000;
    const minimumViableHourlyRate =
      billableHours && billableHours > 0
        ? (minimumTargetNet + incomeTax + businessCosts) / billableHours
        : null;

    return {
      annualRevenue,
      businessCosts,
      grossProfit,
      zelfstandigenaftrek,
      startersaftrek,
      profitAfterEntrepreneurDeductions,
      mkbWinstvrijstelling,
      taxableProfit,
      box1TaxRaw,
      algemeenHeffingskorting: Math.min(box1TaxRaw, ahk),
      arbeidskorting: Math.min(box1TaxRaw - Math.min(box1TaxRaw, ahk), ak),
      totalCredits,
      incomeTax,
      pensionReserveInfo,
      vatObligationInfo,
      vakantiegeldReserve,
      netAnnual,
      netMonthly,
      effectiveRate,
      impliedHourlyRate,
      minimumViableHourlyRate,
    };
  },
};
