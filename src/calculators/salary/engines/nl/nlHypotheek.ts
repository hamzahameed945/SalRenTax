import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { NL_VAKANTIEGELD_RATE, nlBox1Brackets2026 } from '../../../../data/salary/nl/nlTaxData2026';

// ─── Nibud 2026 financieringslastpercentages ("woonquote") ───────────────────
// Verified 2026 table, transcribed from the Nibud-derived "Woonquote 2026"
// publication (hypotheker.nl, media/3venb13y/woonquote_2026.pdf); spot-checked
// against homefinance.nl (24,4% at €82–84k, 25,0% at €95–98k — identical).
//
// IMPORTANT METHOD NOTE: the official Nibud tables are actually
// rate-dependent (a matrix per toetsrente). The publicly published 2026
// single-column table does not state which rate it assumes. This engine uses
// the verified 2026 values as the reference table and treats the mortgage
// interest rate as a separate, clearly-labelled assumption (default 4,0%,
// indicative 10-jaar-vast 2026 — adjustable in the UI). Advise users that a
// lender applies the rate-matched table.
//
// Table: lower bound of gross annual toetsinkomen (EUR) → max % of income
// that may go to gross mortgage costs.
const NIBUD_2026_TABLE: Array<[number, number]> = [
  [0, 19.30],
  [30000, 20.20],
  [31000, 21.10],
  [32000, 21.60],
  [33000, 21.70],
  [61000, 21.80],
  [63000, 21.90],
  [64000, 22.00],
  [65000, 22.10],
  [66000, 22.20],
  [67000, 22.30],
  [69000, 22.50],
  [70000, 22.70],
  [71000, 22.90],
  [72000, 23.10],
  [73000, 23.30],
  [74000, 23.50],
  [75000, 23.70],
  [76000, 23.80],
  [77000, 24.00],
  [78000, 24.10],
  [79000, 24.20],
  [80000, 24.30],
  [82000, 24.40],
  [84000, 24.50],
  [86000, 24.60],
  [89000, 24.70],
  [91000, 24.80],
  [94000, 24.90],
  [95000, 25.00],
  [98000, 25.10],
  [100000, 25.20],
  [101000, 25.30],
  [103000, 25.40],
  [104000, 25.50],
  [106000, 25.60],
  [108000, 25.70],
  [109000, 25.80],
  [111000, 25.90],
  [115000, 26.00],
  [117000, 26.10],
  [119000, 26.20],
  [121000, 26.30],
  [123000, 26.40],
  [125000, 26.50],
];

/** NHG kostengrens 2026 (nhg.nl, officieel). */
export const NHG_GRENS_2026 = 470_000;
/** Nibud 2026 tegemoetkoming alleenstaanden: extra leenruimte. */
export const NIBUD_ALLEENSTAANDE_EXTRA_2026 = 17_000;
/** Indicatieve hypotheekrente 10 jaar vast, 2026 (laagste NHG-tarieven ~3,6%, gemiddelde ~4,1% — sept 2026). */
export const INDICATIEVE_RENTE_2026 = 0.04;

// ─── Types ─────────────────────────────────────────────────────────────────

export interface NlHypotheekInput {
  /** Bruto maandsalaris in EUR, exclusief vakantiegeld. */
  grossMonthly: number;
  /** Bruto maandsalaris partner (excl. vakantiegeld). Telt sinds 2023 volledig mee (Nibud). */
  partnerGrossMonthly?: number;
  /** Tel 8% vakantiegeld mee in het toetsinkomen (default true). */
  includeVakantiegeld?: boolean;
  /** Jaarlijkse hypotheekrente als fractie (default 0.04). */
  annualInterestRate?: number;
  /** Looptijd in jaren (default 30). */
  loanTermYears?: number;
  /** Overige maandlasten (bv. studieschuld) die van de max. maandlast af gaan. */
  otherMonthlyDebts?: number;
  /** Alleenstaande aanvrager → +€17.000 extra leenruimte (Nibud 2026). */
  singleApplicant?: boolean;
}

export interface NlHypotheekResult {
  toetsinkomenAnnual: number;
  financieringslastPercentage: number;
  /** Max. bruto maandlast na aftrek van overige lasten (annuïteit). */
  maxBrutoMaandlast: number;
  maxHypotheek: number;
  /** Bruto maandlast bij de maximale hypotheek (= maxBrutoMaandlast). */
  maandlastBruto: number;
  /** Rentedeel van de eerste maand. */
  eersteMaandRente: number;
  /** Aflossingsdeel van de eerste maand. */
  eersteMaandAflossing: number;
  /** Marginaal box-1-tarief 2026 bij dit toetsinkomen. */
  marginalBox1Rate: number;
  /** Indicatieve netto maandlast na hypotheekrenteaftrek (eerste maand). */
  nettoMaandlastIndicatie: number;
  /** Toegepaste alleenstaande-bonus (€17.000 of €0). */
  singleBonus: number;
  nhgGrens: number;
  pastBinnenNHG: boolean;
  annualInterestRate: number;
  loanTermYears: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Look up the Nibud 2026 financieringslastpercentage for a gross annual test income. */
export function nibudFinancieringslastPercentage2026(toetsinkomenAnnual: number): number {
  let pct = NIBUD_2026_TABLE[0][1];
  for (const [lowerBound, p] of NIBUD_2026_TABLE) {
    if (toetsinkomenAnnual >= lowerBound) pct = p;
    else break;
  }
  return pct;
}

/** Present value of a €1/month annuity: converts monthly capacity → max loan. */
export function annuityFactor(annualRate: number, years: number): number {
  const r = annualRate / 12;
  const n = Math.round(years * 12);
  if (r <= 0) return n;
  return (1 - Math.pow(1 + r, -n)) / r;
}

function marginalBox1Rate2026(toetsinkomenAnnual: number): number {
  for (const b of nlBox1Brackets2026) {
    if (b.max === null || toetsinkomenAnnual < b.max) return b.rate;
  }
  return nlBox1Brackets2026[nlBox1Brackets2026.length - 1].rate;
}

// ─── Engine ────────────────────────────────────────────────────────────────

export const nlHypotheekEngine: CalculatorEngine<NlHypotheekInput, NlHypotheekResult, never> = {
  validate(input: NlHypotheekInput): ValidationResult<NlHypotheekInput> {
    const errors: Partial<Record<keyof NlHypotheekInput, string>> = {};

    if (input.grossMonthly === undefined || input.grossMonthly === null || Number.isNaN(input.grossMonthly)) {
      errors.grossMonthly = 'errors.invalidNumber';
    } else if (input.grossMonthly <= 0) {
      errors.grossMonthly = 'errors.mustBePositive';
    }

    const partner = input.partnerGrossMonthly ?? 0;
    if (Number.isNaN(partner) || partner < 0) {
      errors.partnerGrossMonthly = 'errors.invalidNumber';
    }

    const rate = input.annualInterestRate ?? INDICATIEVE_RENTE_2026;
    if (Number.isNaN(rate) || rate < 0.005 || rate > 0.15) {
      errors.annualInterestRate = 'errors.invalidRate';
    }

    const term = input.loanTermYears ?? 30;
    if (!Number.isInteger(term) || term < 5 || term > 30) {
      errors.loanTermYears = 'errors.invalidTerm';
    }

    const debts = input.otherMonthlyDebts ?? 0;
    if (Number.isNaN(debts) || debts < 0) {
      errors.otherMonthlyDebts = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: NlHypotheekInput): NlHypotheekResult {
    const {
      grossMonthly,
      partnerGrossMonthly = 0,
      includeVakantiegeld = true,
      annualInterestRate = INDICATIEVE_RENTE_2026,
      loanTermYears = 30,
      otherMonthlyDebts = 0,
      singleApplicant = false,
    } = input;

    const vakantiegeldFactor = includeVakantiegeld ? 1 + NL_VAKANTIEGELD_RATE : 1;
    // Tweede inkomen telt sinds 2023 volledig mee (Nibud Advies hypotheeknormen 2026).
    const toetsinkomenAnnual = (grossMonthly + partnerGrossMonthly) * 12 * vakantiegeldFactor;

    const financieringslastPercentage = nibudFinancieringslastPercentage2026(toetsinkomenAnnual);

    const maxBrutoMaandlast = Math.max(0, (toetsinkomenAnnual * financieringslastPercentage) / 100 / 12 - otherMonthlyDebts);

    const factor = annuityFactor(annualInterestRate, loanTermYears);
    const singleBonus = singleApplicant ? NIBUD_ALLEENSTAANDE_EXTRA_2026 : 0;
    // Nibud 2026: alleenstaanden mogen €17.000 extra lenen bovenop de
    // norm — de werkelijke annuïteit valt daardoor iets hoger uit.
    const maxHypotheek = maxBrutoMaandlast * factor + singleBonus;
    const maandlastBruto = maxHypotheek / factor;

    const monthlyRate = annualInterestRate / 12;
    const eersteMaandRente = maxHypotheek * monthlyRate;
    const eersteMaandAflossing = maandlastBruto - eersteMaandRente;

    const marginalBox1Rate = marginalBox1Rate2026(toetsinkomenAnnual);
    // Indicatie: renteaftrek tegen marginaal tarief, verrekend per maand.
    const nettoMaandlastIndicatie = maxBrutoMaandlast - (eersteMaandRente * marginalBox1Rate);

    return {
      toetsinkomenAnnual,
      financieringslastPercentage,
      maxBrutoMaandlast,
      maxHypotheek,
      maandlastBruto: maxBrutoMaandlast,
      eersteMaandRente,
      eersteMaandAflossing,
      marginalBox1Rate,
      nettoMaandlastIndicatie,
      singleBonus,
      nhgGrens: NHG_GRENS_2026,
      pastBinnenNHG: maxHypotheek <= NHG_GRENS_2026,
      annualInterestRate,
      loanTermYears,
    };
  },
};
