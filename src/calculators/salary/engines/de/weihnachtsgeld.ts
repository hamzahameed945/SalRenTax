import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  einkommensteuer2026,
  lohnsteuerPauschbetraege2026,
  pflegeversicherungAN2026,
  socialInsurance2026,
  solidaritaetszuschlag2026,
} from '../../../../data/salary/de/germanPayrollData2026';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WeihnachtsgeldInput {
  /** Weihnachtsgeld brutto in EUR. */
  bonusBrutto: number;
  /** Jährliches Bruttogehalt (ohne Weihnachtsgeld) in EUR. */
  jahresBrutto: number;
}

export interface WeihnachtsgeldResult {
  bonusBrutto: number;
  jahresBrutto: number;
  /**
   * Geschätzter Grenzsteuersatz am Jahresbrutto (Grundtarif, § 32a EStG 2026),
   * z. B. 0.35 = 35 %. Nur zur Einordnung; die Lohnsteuer wird nach der
   * Jahrestabellen-Differenzmethode berechnet.
   */
  marginalRate: number;
  /**
   * Lohnsteuer auf das Weihnachtsgeld nach der Jahrestabellen-Differenzmethode
   * für sonstige Bezüge: ESt(Jahresbrutto + Bonus) − ESt(Jahresbrutto).
   */
  lohnsteuerGeschaetzt: number;
  /** Geschätzter Solidaritätszuschlag auf das Weihnachtsgeld (meist 0). */
  soliGeschaetzt: number;
  /** Geschätzte Arbeitnehmer-Sozialversicherung auf das Weihnachtsgeld. */
  sozialversicherungGeschaetzt: number;
  /** Weihnachtsgeld netto (Schätzung). */
  nettoGeschaetzt: number;
  /** Immer true: Das Ergebnis ist eine Schätzung, keine Lohnabrechnung. */
  isSchaetzung: true;
  /**
   * Hinweis an die UI: Annahmen (Steuerklasse I, kinderlos, Ø Zusatzbeitrag,
   * keine Kirchensteuer) und dass die tatsächliche Lohnabrechnung maßgeblich ist.
   */
  hinweis: string;
}

// ─── § 32a EStG 2026: Steuer und Grenzsteuersatz ────────────────────────────
// Vereinfachte Näherung: Einzelveranlagung (Grundtarif), Steuerklasse I,
// abzüglich Arbeitnehmer-Pauschbetrag (1.230 €) und
// Sonderausgaben-Pauschbetrag (36 €) vom Jahresbrutto. Sonderfälle
// (Splitting, Kinder, Kirche, tatsächliche Werbungskosten)
// sind bewusst nicht modelliert — siehe Hinweis unten.

function zuVersteuerndesEinkommen(jahresBrutto: number): number {
  return Math.max(
    0,
    jahresBrutto -
      lohnsteuerPauschbetraege2026.arbeitnehmerPauschbetrag -
      lohnsteuerPauschbetraege2026.sonderausgabenPauschSingle,
  );
}

/** Tarifliche Einkommensteuer nach § 32a EStG 2026 (Grundtarif). */
function calcESt(zvE: number): number {
  const x = Math.floor(zvE);
  const e = einkommensteuer2026;

  if (x <= e.grundfreibetrag) return 0;

  if (x <= e.zone2To) {
    const y = (x - e.grundfreibetrag) / 10_000;
    return Math.floor((e.zone2CoeffA * y + e.zone2CoeffB) * y);
  }

  if (x <= e.zone3To) {
    const z = (x - (e.zone3From - 1)) / 10_000;
    return Math.floor((e.zone3CoeffA * z + e.zone3CoeffB) * z + e.zone3Constant);
  }

  if (x <= e.zone4To) {
    return Math.floor(e.zone4Rate * x - e.zone4Deduction);
  }

  return Math.floor(e.zone5Rate * x - e.zone5Deduction);
}

/** Grenzsteuersatz (analytische Ableitung der §-32a-Formel) am gegebenen zvE. */
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

/** Soli auf die Bonus-Lohnsteuer: fällig, sobald die tarifliche ESt die
 *  Freigrenze (Single 2026: 20.350 €) überschreitet. */
function calcSoliOnBonus(estAnnualWithBonus: number, lohnsteuerBonus: number): number {
  const s = solidaritaetszuschlag2026;
  if (estAnnualWithBonus <= s.freigrenzeSingle) return 0;
  // Außerhalb der Freigrenze: 5,5 % auf die Bonus-Lohnsteuer (einfache Näherung,
  // Milderungszone bewusst nicht modelliert).
  return lohnsteuerBonus * s.rate;
}

// ─── Sozialversicherung 2026 (Arbeitnehmer-Anteil) ──────────────────────────
// Auf sonstige Bezüge fallen SV-Beiträge an, soweit die jährlichen
// Beitragsbemessungsgrenzen durch das laufende Gehalt noch nicht
// ausgeschöpft sind.

const BBG_RV_AV_JAHR = socialInsurance2026.pensionUnemploymentCeilingMonthly * 12; // 101.400 €
const BBG_KV_PV_JAHR = socialInsurance2026.healthCareCeilingMonthly * 12; // 69.750 €

/** AN-Anteil RV + AlV: (18,6 % + 2,6 %) / 2. */
const AN_SATZ_RV_AV =
  (socialInsurance2026.pensionInsuranceRate + socialInsurance2026.unemploymentInsuranceRate) / 2;

/** AN-Anteil KV + PV (kinderlos, Ø Zusatzbeitrag): (14,6 % + 2,9 %) / 2 + 2,3 %. */
const AN_SATZ_KV_PV =
  (socialInsurance2026.healthInsuranceGeneralRate +
    socialInsurance2026.healthInsuranceAverageSupplementRate) /
    2 +
  pflegeversicherungAN2026.kinderlos;

/**
 * Geschätzte Arbeitnehmer-SV auf den Bonus. Berücksichtigt, dass das
 * Jahresbruttogehalt die Beitragsbemessungsgrenzen bereits teilweise
 * ausschöpft.
 */
function calcSozialversicherung(bonusBrutto: number, jahresBrutto: number): number {
  const raumRvAv = Math.max(0, BBG_RV_AV_JAHR - jahresBrutto);
  const raumKvPv = Math.max(0, BBG_KV_PV_JAHR - jahresBrutto);
  return (
    Math.min(bonusBrutto, raumRvAv) * AN_SATZ_RV_AV +
    Math.min(bonusBrutto, raumKvPv) * AN_SATZ_KV_PV
  );
}

export const weihnachtsgeldHinweis =
  'Schätzung nach der Jahrestabellen-Differenzmethode für sonstige Bezüge ' +
  '(Einkommensteuertarif 2026, § 32a EStG, Grundtarif/Steuerklasse I) inkl. ' +
  'Arbeitnehmer-Sozialversicherung 2026 (kinderlos, Ø Zusatzbeitrag). ' +
  'Annahmen: keine Kirchensteuer, keine weiteren Steuerklassenmerkmale. ' +
  'Die tatsächliche Lohnabrechnung Ihres Arbeitgebers ist maßgeblich und kann abweichen.';

export const weihnachtsgeldEngine: CalculatorEngine<WeihnachtsgeldInput, WeihnachtsgeldResult, never> = {
  validate(input: WeihnachtsgeldInput): ValidationResult<WeihnachtsgeldInput> {
    const errors: Partial<Record<keyof WeihnachtsgeldInput, string>> = {} as Partial<
      Record<keyof WeihnachtsgeldInput, string>
    >;

    if (input.bonusBrutto === undefined || Number.isNaN(input.bonusBrutto)) {
      errors.bonusBrutto = 'errors.invalidNumber';
    } else if (input.bonusBrutto <= 0) {
      errors.bonusBrutto = 'errors.mustBePositive';
    } else if (input.bonusBrutto > 250_000) {
      errors.bonusBrutto = 'errors.tooHigh';
    }

    if (input.jahresBrutto === undefined || Number.isNaN(input.jahresBrutto)) {
      errors.jahresBrutto = 'errors.invalidNumber';
    } else if (input.jahresBrutto <= 0) {
      errors.jahresBrutto = 'errors.mustBePositive';
    } else if (input.jahresBrutto > 2_000_000) {
      errors.jahresBrutto = 'errors.tooHigh';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: WeihnachtsgeldInput): WeihnachtsgeldResult {
    const { bonusBrutto, jahresBrutto } = input;

    const zvEOhne = zuVersteuerndesEinkommen(jahresBrutto);
    const zvEMit = zuVersteuerndesEinkommen(jahresBrutto + bonusBrutto);
    const marginalRate = calcMarginalRate(zvEOhne);

    // Jahrestabellen-Differenzmethode für sonstige Bezüge:
    // Lohnsteuer auf den Bonus = ESt(Gehalt + Bonus) − ESt(Gehalt).
    const estOhne = calcESt(zvEOhne);
    const estMit = calcESt(zvEMit);
    const lohnsteuerGeschaetzt = Math.max(0, estMit - estOhne);

    const soliGeschaetzt = calcSoliOnBonus(estMit, lohnsteuerGeschaetzt);

    const sozialversicherungGeschaetzt = calcSozialversicherung(bonusBrutto, jahresBrutto);

    const nettoGeschaetzt = Math.max(
      0,
      bonusBrutto - lohnsteuerGeschaetzt - soliGeschaetzt - sozialversicherungGeschaetzt,
    );

    return {
      bonusBrutto,
      jahresBrutto,
      marginalRate,
      lohnsteuerGeschaetzt,
      soliGeschaetzt,
      sozialversicherungGeschaetzt,
      nettoGeschaetzt,
      isSchaetzung: true,
      hinweis: weihnachtsgeldHinweis,
    };
  },
};
