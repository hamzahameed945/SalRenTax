import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { nlBruttoNettoEngine, type NlBruttoNettoBreakdown } from './nlBruttoNetto';
import {
  nlBox1Brackets2026,
  nlAlgemeneHeffingskorting2026,
  nlArbeidskorting2026,
  nlZZPData2026,
  nlZvwData2026,
  NL_VAKANTIEGELD_RATE,
} from '../../../../data/salary/nl/nlTaxData2026';

/**
 * Netherlands ZZP vs loondienst comparison engine (2026).
 *
 * ZZP side: uurtarief × declarabele uren → jaaromzet − zakelijke kosten →
 * zelfstandigenaftrek (€1.200, requires 1.225-hour urencriterium) →
 * MKB-winstvrijstelling (12.70%) → box 1 inkomstenbelasting (minus
 * arbeidskorting + algemene heffingskorting) → Zvw-bijdrage (4.85%, self-paid)
 * → netto/jaar and netto/maand.
 *
 * Loondienst side: bruto maandsalaris (× 12, optional 8% vakantiegeld) via the
 * existing nlBruttoNettoEngine → loonbelasting + embedded SV → netto/maand.
 *
 * Verified 2026 figures (2026-10-06):
 * - zelfstandigenaftrek €1.200 (Belastingdienst, KVK)
 * - MKB-winstvrijstelling 12,70% (Knab, Rabobank, Informer)
 * - Zvw verlaagde bijdrage 4,85% over max. €79.409 (KVK)
 * - box 1 schijven 35,75% / 37,56% / 49,50% (Belastingdienst voorlopige aanslag)
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export interface NlZZPLoondienstInput {
  /** ZZP hourly rate in EUR, excl. BTW. */
  hourlyRate: number;
  /** Billable hours per year. */
  billableHours: number;
  /** Deductible business costs per year. Defaults to 0. */
  businessCosts?: number;
  /** Employee gross monthly salary in EUR. */
  grossMonthlySalary: number;
  /** Whether the 1.225-hour urencriterium is met (needed for zelfstandigenaftrek).
   *  Defaults to billableHours >= 1225. */
  urencriteriumMet?: boolean;
  /** Add 8% statutory vakantiegeld on top of the employee's annual salary.
   *  Defaults to true. */
  includeVakantiegeld?: boolean;
}

export interface NlZZPSideResult {
  jaarOmzet: number;
  zakelijkeKosten: number;
  brutoWinst: number;
  urencriteriumMet: boolean;
  zelfstandigenaftrek: number;
  winstNaOndernemersaftrek: number;
  mkbWinstvrijstelling: number;
  belastbareWinst: number;
  box1TaxRaw: number;
  algemeenHeffingskorting: number;
  arbeidskorting: number;
  inkomstenbelasting: number;
  /** Self-paid Zvw contribution (indicatief). */
  zvwBijdrage: number;
  nettoJaar: number;
  nettoMaand: number;
  /** Net per billable hour — the real take-home value of each declared hour. */
  nettoPerDeclarabelUur: number | null;
  /** Total tax+Zvw burden as share of revenue. */
  effectiefTarief: number;
}

export interface NlLoondienstSideResult {
  brutoMaand: number;
  vakantiegeld: number;
  brutoJaar: number;
  loonheffing: number;
  box1TaxRaw: number;
  totalCredits: number;
  nettoJaar: number;
  nettoMaand: number;
  /** Net per hour assuming a 40-hour week (2080 hrs/year). Informational. */
  nettoPerUur: number;
  breakdown: NlBruttoNettoBreakdown;
}

export type NlComparisonWinner = 'zzp' | 'loondienst' | 'gelijk';

export interface NlZZPLoondienstResult {
  zzp: NlZZPSideResult;
  loondienst: NlLoondienstSideResult;
  winner: NlComparisonWinner;
  /** zzp.nettoMaand − loondienst.nettoMaand (positive = ZZP wins). */
  verschilNettoMaand: number;
  /** zzp.nettoJaar − loondienst.nettoJaar. */
  verschilNettoJaar: number;
  /** Hourly rate (at the same billable hours) at which ZZP net == employee net.
   *  null when billableHours is 0 or the target is unreachable. */
  breakevenUurtarief: number | null;
  /** How many × the employee's gross hourly wage the ZZP rate is.
   *  Rule of thumb for the sector is 2–3×. */
  zzpTariefMultiplier: number | null;
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

/** Net annual income as a ZZP'er for a given hourly rate (holding other inputs fixed).
 *  Monotonically increasing in hourlyRate — safe for bisection. */
function zzpNetAnnualForRate(
  hourlyRate: number,
  billableHours: number,
  businessCosts: number,
  urencriteriumMet: boolean,
): number {
  const jaarOmzet = hourlyRate * billableHours;
  const brutoWinst = Math.max(0, jaarOmzet - businessCosts);

  const zelfstandigenaftrek = urencriteriumMet
    ? Math.min(brutoWinst, nlZZPData2026.zelfstandigenaftrek)
    : 0;
  const winstNaAftrek = Math.max(0, brutoWinst - zelfstandigenaftrek);
  const mkbVrijstelling = winstNaAftrek * nlZZPData2026.mkbWinstvrijstelling;
  const belastbareWinst = Math.max(0, winstNaAftrek - mkbVrijstelling);

  const { totalTax: box1Raw } = calculateProgressiveTax(belastbareWinst, nlBox1Brackets2026);
  const credits = Math.min(box1Raw, calcAHK(belastbareWinst) + calcArbeidskorting(brutoWinst));
  const inkomstenbelasting = Math.max(0, box1Raw - credits);

  const zvwBijdrage =
    Math.min(belastbareWinst, nlZvwData2026.maxBijdrageInkomen) * nlZvwData2026.ondernemersPercentage;

  return brutoWinst - inkomstenbelasting - zvwBijdrage;
}

// ─── Engine ────────────────────────────────────────────────────────────────

export const nlZZPLoondienstEngine: CalculatorEngine<NlZZPLoondienstInput, NlZZPLoondienstResult, never> = {
  validate(input: NlZZPLoondienstInput): ValidationResult<NlZZPLoondienstInput> {
    const errors: Partial<Record<keyof NlZZPLoondienstInput, string>> = {};

    if (!input.hourlyRate || Number.isNaN(input.hourlyRate) || input.hourlyRate <= 0) {
      errors.hourlyRate = 'errors.mustBePositive';
    } else if (input.hourlyRate > 10_000) {
      errors.hourlyRate = 'errors.tooHigh';
    }
    if (input.billableHours === undefined || Number.isNaN(input.billableHours) || input.billableHours <= 0) {
      errors.billableHours = 'errors.mustBePositive';
    } else if (input.billableHours > 8_760) {
      errors.billableHours = 'errors.tooHigh';
    }
    if (!input.grossMonthlySalary || Number.isNaN(input.grossMonthlySalary) || input.grossMonthlySalary <= 0) {
      errors.grossMonthlySalary = 'errors.mustBePositive';
    } else if (input.grossMonthlySalary > 1_000_000) {
      errors.grossMonthlySalary = 'errors.tooHigh';
    }
    if (input.businessCosts !== undefined && (Number.isNaN(input.businessCosts) || input.businessCosts < 0)) {
      errors.businessCosts = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: NlZZPLoondienstInput, _config: never, year: number): NlZZPLoondienstResult {
    const {
      hourlyRate,
      billableHours,
      businessCosts = 0,
      grossMonthlySalary,
      urencriteriumMet = billableHours >= 1225,
      includeVakantiegeld = true,
    } = input;

    // ── ZZP side ────────────────────────────────────────────────────────
    const jaarOmzet = hourlyRate * billableHours;
    const brutoWinst = Math.max(0, jaarOmzet - businessCosts);

    const zelfstandigenaftrek = urencriteriumMet
      ? Math.min(brutoWinst, nlZZPData2026.zelfstandigenaftrek)
      : 0;
    const winstNaOndernemersaftrek = Math.max(0, brutoWinst - zelfstandigenaftrek);
    const mkbWinstvrijstelling =
      winstNaOndernemersaftrek * nlZZPData2026.mkbWinstvrijstelling;
    const belastbareWinst = Math.max(0, winstNaOndernemersaftrek - mkbWinstvrijstelling);

    const { totalTax: box1TaxRaw } = calculateProgressiveTax(belastbareWinst, nlBox1Brackets2026);
    const algemeenHeffingskortingUncapped = calcAHK(belastbareWinst);
    const arbeidskortingUncapped = calcArbeidskorting(brutoWinst);
    const totalCreditsUncapped = algemeenHeffingskortingUncapped + arbeidskortingUncapped;
    const creditsApplied = Math.min(box1TaxRaw, totalCreditsUncapped);
    const algemeenHeffingskorting = Math.min(box1TaxRaw, algemeenHeffingskortingUncapped);
    const arbeidskorting = Math.max(0, creditsApplied - algemeenHeffingskorting);
    const inkomstenbelasting = Math.max(0, box1TaxRaw - creditsApplied);

    // Zvw: self-paid verlaagde bijdrage on bijdrage-inkomen (indicatief)
    const zvwBijdrage =
      Math.min(belastbareWinst, nlZvwData2026.maxBijdrageInkomen) *
      nlZvwData2026.ondernemersPercentage;

    const zzpNettoJaar = brutoWinst - inkomstenbelasting - zvwBijdrage;
    const zzpNettoMaand = zzpNettoJaar / 12;

    const zzp: NlZZPSideResult = {
      jaarOmzet,
      zakelijkeKosten: businessCosts,
      brutoWinst,
      urencriteriumMet,
      zelfstandigenaftrek,
      winstNaOndernemersaftrek,
      mkbWinstvrijstelling,
      belastbareWinst,
      box1TaxRaw,
      algemeenHeffingskorting,
      arbeidskorting,
      inkomstenbelasting,
      zvwBijdrage,
      nettoJaar: zzpNettoJaar,
      nettoMaand: zzpNettoMaand,
      nettoPerDeclarabelUur: billableHours > 0 ? zzpNettoJaar / billableHours : null,
      effectiefTarief: jaarOmzet > 0 ? (inkomstenbelasting + zvwBijdrage) / jaarOmzet : 0,
    };

    // ── Loondienst side (reuse the verified brute-netto engine) ──────────
    const breakdown = nlBruttoNettoEngine.calculate(
      {
        grossAnnual: grossMonthlySalary * 12,
        includeVakantiegeld,
        payPeriod: 'monthly',
      },
      _config,
      year,
    );

    const loondienst: NlLoondienstSideResult = {
      brutoMaand: grossMonthlySalary,
      vakantiegeld: breakdown.vakantiegeld,
      brutoJaar: breakdown.grossTotal,
      loonheffing: breakdown.incomeTaxAnnual,
      box1TaxRaw: breakdown.box1TaxRaw,
      totalCredits: breakdown.totalCredits,
      nettoJaar: breakdown.netAnnual,
      nettoMaand: breakdown.netMonthly,
      nettoPerUur: breakdown.netAnnual / 2080, // 40-urige werkweek
      breakdown,
    };

    // ── Comparison ──────────────────────────────────────────────────────
    const verschilNettoMaand = zzp.nettoMaand - loondienst.nettoMaand;
    const verschilNettoJaar = zzp.nettoJaar - loondienst.nettoJaar;
    const winner: NlComparisonWinner =
      Math.abs(verschilNettoMaand) < 1
        ? 'gelijk'
        : verschilNettoMaand > 0
          ? 'zzp'
          : 'loondienst';

    // Breakeven hourly rate: solve zzpNetAnnualForRate(rate) == loondienst.nettoJaar
    let breakevenUurtarief: number | null = null;
    if (billableHours > 0 && loondienst.nettoJaar > 0) {
      const target = loondienst.nettoJaar;
      const f = (rate: number) =>
        zzpNetAnnualForRate(rate, billableHours, businessCosts, urencriteriumMet) - target;
      if (f(0) < 0) {
        let hi = Math.max(hourlyRate, 1);
        while (f(hi) < 0 && hi < 1_000_000) hi *= 2;
        if (f(hi) >= 0) {
          let lo = 0;
          for (let i = 0; i < 60; i++) {
            const mid = (lo + hi) / 2;
            if (f(mid) < 0) lo = mid;
            else hi = mid;
          }
          breakevenUurtarief = (lo + hi) / 2;
        }
      } else {
        breakevenUurtarief = 0;
      }
    }

    // Employee gross hourly wage (incl. vakantiegeld) for the multiplier rule of thumb
    const werknemerBrutoPerUur = loondienst.brutoJaar / 2080;
    const zzpTariefMultiplier =
      werknemerBrutoPerUur > 0 ? hourlyRate / werknemerBrutoPerUur : null;

    return {
      zzp,
      loondienst,
      winner,
      verschilNettoMaand,
      verschilNettoJaar,
      breakevenUurtarief,
      zzpTariefMultiplier,
    };
  },
};

/** Vakantiegeld rate re-export for UI copy (avoids importing NL data directly). */
export const ZZPLD_VAKANTIEGELD_RATE = NL_VAKANTIEGELD_RATE;
