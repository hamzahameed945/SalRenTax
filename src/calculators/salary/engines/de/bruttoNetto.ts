import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  socialInsurance2026,
  pflegeversicherungAN2026,
  pflegeversicherungANSachsen2026,
  einkommensteuer2026,
  solidaritaetszuschlag2026,
  kirchensteuer2026,
  lohnsteuerPauschbetraege2026,
  steuerklassen2026,
  type Steuerklasse,
} from '../../../../data/salary/de/germanPayrollData2026';

// ─── Types ──────────────────────────────────────────────────────────────────

export type KirchensteuerRegion = 'none' | 'bayern' | 'other';

export interface BruttoNettoInput {
  /** Monthly gross salary in EUR. */
  grossMonthly: number;
  /** Steuerklasse I–VI. Default: I. */
  steuerklasse?: Steuerklasse;
  /** Number of children under 25 (affects Pflegeversicherung and Kinderfreibetrag). */
  numberOfChildren?: number;
  /** Kirchensteuer region. 'none' = not a church member. */
  kirchensteuerRegion?: KirchensteuerRegion;
  /** Whether employee works in Sachsen (affects PV split). */
  isSachsen?: boolean;
}

export interface BruttoNettoBreakdown {
  /** Monthly gross (input). */
  grossMonthly: number;
  /** Annual gross (×12). */
  grossAnnual: number;

  // ── Social insurance (monthly) ──────────────────────────────────────
  pensionInsuranceEmployee: number;
  unemploymentInsuranceEmployee: number;
  healthInsuranceEmployee: number;
  longTermCareInsuranceEmployee: number;
  totalSocialInsuranceEmployee: number;

  /** Same four deductions on the employer side (informational). */
  pensionInsuranceEmployer: number;
  unemploymentInsuranceEmployer: number;
  healthInsuranceEmployer: number;
  longTermCareInsuranceEmployer: number;
  totalSocialInsuranceEmployer: number;

  // ── Income tax (annual, then divided to monthly) ────────────────────
  /** Annual taxable income after all Pauschbeträge/Freibeträge. */
  taxableIncomeAnnual: number;
  /** Annual Lohnsteuer (§ 32a). */
  lohnsteuerAnnual: number;
  /** Monthly Lohnsteuer. */
  lohnsteuerMonthly: number;
  /** Annual Solidaritätszuschlag. */
  soliAnnual: number;
  /** Monthly Soli. */
  soliMonthly: number;
  /** Annual Kirchensteuer (0 if not a church member). */
  kirchensteuerAnnual: number;
  /** Monthly Kirchensteuer. */
  kirchensteuerMonthly: number;

  /** Kirchensteuer rate used (0, 8%, or 9%). */
  kirchensteuerRate: number;
  /** Steuerklasse used. */
  steuerklasse: Steuerklasse;

  // ── Net ─────────────────────────────────────────────────────────────
  /** Monthly net (gross − SI − Lohnsteuer − Soli − Kirche). */
  netMonthly: number;
  /** Annual net. */
  netAnnual: number;
  /** Effective total deduction rate (all deductions / gross). */
  effectiveRate: number;
  /** Marginal income-tax rate on last euro of annual income. */
  marginalTaxRate: number;
}

// ─── Pflegeversicherung AN-rate helper ──────────────────────────────────────

function getPflegeAN(children: number, isSachsen: boolean): number {
  const table = isSachsen ? pflegeversicherungANSachsen2026 : pflegeversicherungAN2026;
  if (children === 0) return table.kinderlos;
  if (children === 1) return table.einKind;
  if (children === 2) return table.zweiKinder;
  if (children === 3) return table.dreiKinder;
  if (children === 4) return table.vierKinder;
  return table.fuenfPlusKinder;
}

// ─── § 32a EStG 2026 income-tax formula ────────────────────────────────────

function calcESt(zvE: number): number {
  const x = Math.floor(zvE); // round down to whole euro per §32a
  const e = einkommensteuer2026;

  if (x <= e.grundfreibetrag) return 0;

  if (x <= e.zone2To) {
    const y = (x - e.grundfreibetrag) / 10_000;
    return Math.floor((e.zone2CoeffA * y + e.zone2CoeffB) * y);
  }

  if (x <= e.zone3To) {
    // § 32a: z = (zvE − 17799) / 10000  — zone3From - 1 = 17799
    const z = (x - (e.zone3From - 1)) / 10_000;
    return Math.floor((e.zone3CoeffA * z + e.zone3CoeffB) * z + e.zone3Constant);
  }

  if (x <= e.zone4To) {
    return Math.floor(e.zone4Rate * x - e.zone4Deduction);
  }

  return Math.floor(e.zone5Rate * x - e.zone5Deduction);
}

// ─── Lohnsteuer for a given annual gross & Steuerklasse ────────────────────

function calcLohnsteuer(
  annualGross: number,
  sk: Steuerklasse,
  numberOfChildren: number,
): { lohnsteuer: number; zvE: number; marginalRate: number } {
  const skCfg = steuerklassen2026[sk];
  const p = lohnsteuerPauschbetraege2026;

  // Step 1 — deductions from gross
  let zvE = annualGross;

  // Arbeitnehmer-Pauschbetrag (SK I–V only, not VI)
  if (skCfg.anPausch) {
    zvE -= p.arbeitnehmerPauschbetrag;
  }

  // Sonderausgaben-Pauschbetrag
  zvE -= skCfg.splitting ? p.sonderausgabenPauschJoint : p.sonderausgabenPauschSingle;

  // Entlastungsbetrag für Alleinerziehende (SK II)
  if (skCfg.entlastung) {
    const extra = numberOfChildren > 1
      ? p.entlastungsbetragSK2PerKind * (numberOfChildren - 1)
      : 0;
    zvE -= p.entlastungsbetragSK2 + extra;
  }

  // Kinderfreibeträge — SK I/II gets half per child; SK III gets full (other parent has SK V)
  // Only applied if Kinderfreibetrag is more beneficial than Kindergeld — simplified: always apply
  if (numberOfChildren > 0 && skCfg.grundfreibetrag) {
    const kindFB = sk === 'III'
      ? (p.kinderfreibetragProKind + p.bea) * numberOfChildren
      : ((p.kinderfreibetragProKind + p.bea) / 2) * numberOfChildren;
    zvE -= kindFB;
  }

  zvE = Math.max(0, zvE);

  // Step 2 — apply Splitting for SK III (Ehegattensplitting)
  let estSingle: number;
  let marginalRate: number;

  if (skCfg.splitting) {
    // zvE already represents one person's share; multiply tax by 2
    const halfZvE = zvE / 2;
    estSingle = calcESt(halfZvE) * 2;
    marginalRate = calcMarginalRate(halfZvE);
  } else {
    estSingle = calcESt(zvE);
    marginalRate = calcMarginalRate(zvE);
  }

  // SK V: lumpsum approach — no Grundfreibetrag: effectively zvE = annualGross after minimal deductions
  // (already handled by skCfg.grundfreibetrag = false → no Kinderfreibetrag deducted; zvE stays high)

  return { lohnsteuer: estSingle, zvE, marginalRate };
}

function calcMarginalRate(zvE: number): number {
  const e = einkommensteuer2026;
  if (zvE <= e.grundfreibetrag) return 0;
  if (zvE <= e.zone2To) {
    const y = (zvE - e.grundfreibetrag) / 10_000;
    return (2 * e.zone2CoeffA * y + e.zone2CoeffB) / 10_000;
  }
  if (zvE <= e.zone3To) {
    const z = (zvE - (e.zone3From - 1)) / 10_000;
    return (2 * e.zone3CoeffA * z + e.zone3CoeffB) / 10_000;
  }
  if (zvE <= e.zone4To) return e.zone4Rate;
  return e.zone5Rate;
}

// ─── Solidaritätszuschlag ───────────────────────────────────────────────────

function calcSoli(lohnsteuerAnnual: number, isSplitting: boolean): number {
  const s = solidaritaetszuschlag2026;
  const freigrenze = isSplitting ? s.freigrenzeSplitting : s.freigrenzeSingle;
  if (lohnsteuerAnnual <= freigrenze) return 0;
  // Milderungszone: min(5.5% × ESt, 11.9% × (ESt − Freigrenze))
  const full = lohnsteuerAnnual * s.rate;
  const milder = (lohnsteuerAnnual - freigrenze) * s.milderungsRate;
  return Math.min(full, milder);
}

// ─── Engine ─────────────────────────────────────────────────────────────────

export const bruttoNettoEngine: CalculatorEngine<BruttoNettoInput, BruttoNettoBreakdown, never> = {
  validate(input: BruttoNettoInput): ValidationResult<BruttoNettoInput> {
    const errors: Partial<Record<keyof BruttoNettoInput, string>> = {};

    if (!input.grossMonthly || Number.isNaN(input.grossMonthly)) {
      errors.grossMonthly = 'errors.invalidNumber';
    } else if (input.grossMonthly <= 0) {
      errors.grossMonthly = 'errors.mustBePositive';
    } else if (input.grossMonthly > 500_000) {
      errors.grossMonthly = 'errors.tooHigh';
    }

    const kids = input.numberOfChildren ?? 0;
    if (Number.isNaN(kids) || kids < 0 || kids > 20) {
      errors.numberOfChildren = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: BruttoNettoInput): BruttoNettoBreakdown {
    const {
      grossMonthly,
      steuerklasse = 'I',
      numberOfChildren = 0,
      kirchensteuerRegion = 'none',
      isSachsen = false,
    } = input;

    const annualGross = grossMonthly * 12;
    const si = socialInsurance2026;

    // ── Social insurance ────────────────────────────────────────────────
    const pvBase = Math.min(grossMonthly, si.healthCareCeilingMonthly);
    const rvBase = Math.min(grossMonthly, si.pensionUnemploymentCeilingMonthly);

    const pensionAN   = rvBase * (si.pensionInsuranceRate / 2);
    const pensionAG   = rvBase * (si.pensionInsuranceRate / 2);
    const alvAN       = rvBase * (si.unemploymentInsuranceRate / 2);
    const alvAG       = rvBase * (si.unemploymentInsuranceRate / 2);

    const gkvTotalRate = si.healthInsuranceGeneralRate + si.healthInsuranceAverageSupplementRate;
    const gkvAN = pvBase * (gkvTotalRate / 2);
    const gkvAG = pvBase * (gkvTotalRate / 2);

    const pflegeANRate = getPflegeAN(numberOfChildren, isSachsen);
    const pflegeAGRate = isSachsen
      ? si.employerLongTermCareShare - si.longTermCareInsuranceSaxonyEmployeeExtra
      : si.employerLongTermCareShare;
    const pflegeAN = pvBase * pflegeANRate;
    const pflegeAG = pvBase * pflegeAGRate;

    const totalSIAN = pensionAN + alvAN + gkvAN + pflegeAN;
    const totalSIAG = pensionAG + alvAG + gkvAG + pflegeAG;

    // ── Lohnsteuer ──────────────────────────────────────────────────────
    const { lohnsteuer: lohnsteuerAnnual, zvE: taxableIncomeAnnual, marginalRate } =
      calcLohnsteuer(annualGross, steuerklasse, numberOfChildren);

    const lohnsteuerMonthly = lohnsteuerAnnual / 12;

    // ── Solidaritätszuschlag ────────────────────────────────────────────
    const isSplitting = steuerklassen2026[steuerklasse].splitting;
    const soliAnnual = calcSoli(lohnsteuerAnnual, isSplitting);
    const soliMonthly = soliAnnual / 12;

    // ── Kirchensteuer ───────────────────────────────────────────────────
    let kirchensteuerRate = 0;
    if (kirchensteuerRegion === 'bayern') kirchensteuerRate = kirchensteuer2026.rateBayern;
    else if (kirchensteuerRegion === 'other') kirchensteuerRate = kirchensteuer2026.rateOther;

    const kirchensteuerAnnual = lohnsteuerAnnual * kirchensteuerRate;
    const kirchensteuerMonthly = kirchensteuerAnnual / 12;

    // ── Net ─────────────────────────────────────────────────────────────
    const netMonthly =
      grossMonthly - totalSIAN - lohnsteuerMonthly - soliMonthly - kirchensteuerMonthly;
    const netAnnual = netMonthly * 12;

    const totalDeductionsMonthly =
      totalSIAN + lohnsteuerMonthly + soliMonthly + kirchensteuerMonthly;
    const effectiveRate = grossMonthly > 0 ? totalDeductionsMonthly / grossMonthly : 0;

    return {
      grossMonthly,
      grossAnnual: annualGross,
      pensionInsuranceEmployee:       pensionAN,
      unemploymentInsuranceEmployee:  alvAN,
      healthInsuranceEmployee:        gkvAN,
      longTermCareInsuranceEmployee:  pflegeAN,
      totalSocialInsuranceEmployee:   totalSIAN,
      pensionInsuranceEmployer:       pensionAG,
      unemploymentInsuranceEmployer:  alvAG,
      healthInsuranceEmployer:        gkvAG,
      longTermCareInsuranceEmployer:  pflegeAG,
      totalSocialInsuranceEmployer:   totalSIAG,
      taxableIncomeAnnual,
      lohnsteuerAnnual,
      lohnsteuerMonthly,
      soliAnnual,
      soliMonthly,
      kirchensteuerAnnual,
      kirchensteuerMonthly,
      kirchensteuerRate,
      steuerklasse,
      netMonthly,
      netAnnual,
      effectiveRate,
      marginalTaxRate: marginalRate,
    };
  },
};
