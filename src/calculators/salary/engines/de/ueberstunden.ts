import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  einkommensteuer2026,
  lohnsteuerPauschbetraege2026,
  pflegeversicherungAN2026,
  socialInsurance2026,
  solidaritaetszuschlag2026,
} from '../../../../data/salary/de/germanPayrollData2026';

// ─── Types ──────────────────────────────────────────────────────────────────

export type UeberstundenModus = 'stundenlohn' | 'gehalt';

export interface UeberstundenInput {
  /** Anzahl der Überstunden. */
  stunden: number;
  /** Überstundenzuschlag in Prozent (0 = kein Zuschlag). */
  zuschlagProzent: number;
  /** 'stundenlohn': Stundenlohn wird direkt eingegeben; 'gehalt': aus Monatsgehalt abgeleitet. */
  modus: UeberstundenModus;
  /** Stundenlohn in EUR (nur bei modus 'stundenlohn'). */
  stundenlohn?: number;
  /** Monatsbruttogehalt in EUR (nur bei modus 'gehalt'). */
  monatsBrutto?: number;
  /** Vertragliche Wochenarbeitszeit in Stunden (nur bei modus 'gehalt'). */
  wochenStunden?: number;
  /** Jährliches Bruttogehalt 2026 (ohne Überstunden) in EUR. */
  jahresBrutto: number;
}

export interface UeberstundenResult {
  stunden: number;
  zuschlagProzent: number;
  /** Effektiver Stundenlohn in EUR: eingegeben oder aus Monatsgehalt abgeleitet. */
  stundenlohnEffektiv: number;
  /** Überstunden brutto in EUR (inkl. Zuschlag). */
  ueberstundenBrutto: number;
  /**
   * Geschätzter Grenzsteuersatz am Jahresbrutto (Grundtarif, § 32a EStG 2026),
   * z. B. 0.35 = 35 %. Nur zur Einordnung; die Lohnsteuer wird nach der
   * Differenzmethode berechnet.
   */
  marginalRate: number;
  /**
   * Lohnsteuer auf die Überstunden nach der Differenzmethode:
   * ESt(Jahresbrutto + Überstunden) − ESt(Jahresbrutto).
   */
  lohnsteuerGeschaetzt: number;
  /** Geschätzter Solidaritätszuschlag auf die Überstunden (meist 0). */
  soliGeschaetzt: number;
  /** Geschätzte Arbeitnehmer-Sozialversicherung auf die Überstunden. */
  sozialversicherungGeschaetzt: number;
  /** Überstunden netto (Schätzung). */
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

/** Soli auf die Zusatz-Lohnsteuer: fällig, sobald die tarifliche ESt die
 *  Freigrenze (Single 2026: 20.350 €) überschreitet. */
function calcSoliOnZusatz(estAnnualMit: number, lohnsteuerZusatz: number): number {
  const s = solidaritaetszuschlag2026;
  if (estAnnualMit <= s.freigrenzeSingle) return 0;
  // Außerhalb der Freigrenze: 5,5 % auf die Zusatz-Lohnsteuer (einfache Näherung,
  // Milderungszone bewusst nicht modelliert).
  return lohnsteuerZusatz * s.rate;
}

// ─── Sozialversicherung 2026 (Arbeitnehmer-Anteil) ──────────────────────────
// Auf ausgezahlte Überstunden fallen SV-Beiträge an, soweit die jährlichen
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
 * Geschätzte Arbeitnehmer-SV auf die Überstunden. Berücksichtigt, dass das
 * Jahresbruttogehalt die Beitragsbemessungsgrenzen bereits teilweise
 * ausschöpft.
 */
function calcSozialversicherung(zusatzBrutto: number, jahresBrutto: number): number {
  const raumRvAv = Math.max(0, BBG_RV_AV_JAHR - jahresBrutto);
  const raumKvPv = Math.max(0, BBG_KV_PV_JAHR - jahresBrutto);
  return (
    Math.min(zusatzBrutto, raumRvAv) * AN_SATZ_RV_AV +
    Math.min(zusatzBrutto, raumKvPv) * AN_SATZ_KV_PV
  );
}

/**
 * Stundenlohn aus Monatsbruttogehalt ableiten (übliche deutsche Umrechnung:
 * Monatsbrutto × 3 / (Wochenstunden × 13), d. h. Quartalsgehalt durch
 * Quartalsarbeitsstunden).
 */
export function stundenlohnAusGehalt(monatsBrutto: number, wochenStunden: number): number {
  return (monatsBrutto * 3) / (wochenStunden * 13);
}

export const ueberstundenHinweis =
  'Schätzung nach der Differenzmethode für zusätzliches Arbeitseinkommen ' +
  '(Einkommensteuertarif 2026, § 32a EStG, Grundtarif/Steuerklasse I) inkl. ' +
  'Arbeitnehmer-Sozialversicherung 2026 (kinderlos, Ø Zusatzbeitrag). ' +
  'Annahmen: keine Kirchensteuer, keine weiteren Steuerklassenmerkmale, ' +
  'Überstunden werden wie laufender Arbeitslohn behandelt (keine sonstigen Bezüge). ' +
  'Die tatsächliche Lohnabrechnung Ihres Arbeitgebers ist maßgeblich und kann abweichen.';

export const ueberstundenEngine: CalculatorEngine<UeberstundenInput, UeberstundenResult, never> = {
  validate(input: UeberstundenInput): ValidationResult<UeberstundenInput> {
    const errors: Partial<Record<string, string>> = {};

    if (input.stunden === undefined || Number.isNaN(input.stunden)) {
      errors.stunden = 'errors.invalidNumber';
    } else if (input.stunden <= 0) {
      errors.stunden = 'errors.mustBePositive';
    } else if (input.stunden > 2000) {
      errors.stunden = 'errors.tooHigh';
    }

    if (input.zuschlagProzent === undefined || Number.isNaN(input.zuschlagProzent)) {
      errors.zuschlagProzent = 'errors.invalidNumber';
    } else if (input.zuschlagProzent < 0 || input.zuschlagProzent > 300) {
      errors.zuschlagProzent = 'errors.tooHigh';
    }

    if (input.modus === 'stundenlohn') {
      if (input.stundenlohn === undefined || Number.isNaN(input.stundenlohn)) {
        errors.stundenlohn = 'errors.invalidNumber';
      } else if (input.stundenlohn <= 0) {
        errors.stundenlohn = 'errors.mustBePositive';
      } else if (input.stundenlohn > 1000) {
        errors.stundenlohn = 'errors.tooHigh';
      }
    } else if (input.modus === 'gehalt') {
      if (input.monatsBrutto === undefined || Number.isNaN(input.monatsBrutto)) {
        errors.monatsBrutto = 'errors.invalidNumber';
      } else if (input.monatsBrutto <= 0) {
        errors.monatsBrutto = 'errors.mustBePositive';
      } else if (input.monatsBrutto > 500_000) {
        errors.monatsBrutto = 'errors.tooHigh';
      }
      if (input.wochenStunden === undefined || Number.isNaN(input.wochenStunden)) {
        errors.wochenStunden = 'errors.invalidNumber';
      } else if (input.wochenStunden <= 0) {
        errors.wochenStunden = 'errors.mustBePositive';
      } else if (input.wochenStunden > 80) {
        errors.wochenStunden = 'errors.tooHigh';
      }
    } else {
      errors.modus = 'errors.invalidNumber';
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

  calculate(input: UeberstundenInput): UeberstundenResult {
    const { stunden, zuschlagProzent, modus, jahresBrutto } = input;

    const stundenlohnEffektiv =
      modus === 'stundenlohn'
        ? (input.stundenlohn as number)
        : stundenlohnAusGehalt(input.monatsBrutto as number, input.wochenStunden as number);

    const ueberstundenBrutto = stunden * stundenlohnEffektiv * (1 + zuschlagProzent / 100);

    const zvEOhne = zuVersteuerndesEinkommen(jahresBrutto);
    const zvEMit = zuVersteuerndesEinkommen(jahresBrutto + ueberstundenBrutto);
    const marginalRate = calcMarginalRate(zvEOhne);

    // Differenzmethode: Lohnsteuer auf die Überstunden =
    // ESt(Gehalt + Überstunden) − ESt(Gehalt).
    const estOhne = calcESt(zvEOhne);
    const estMit = calcESt(zvEMit);
    const lohnsteuerGeschaetzt = Math.max(0, estMit - estOhne);

    const soliGeschaetzt = calcSoliOnZusatz(estMit, lohnsteuerGeschaetzt);

    const sozialversicherungGeschaetzt = calcSozialversicherung(ueberstundenBrutto, jahresBrutto);

    const nettoGeschaetzt = Math.max(
      0,
      ueberstundenBrutto - lohnsteuerGeschaetzt - soliGeschaetzt - sozialversicherungGeschaetzt,
    );

    return {
      stunden,
      zuschlagProzent,
      stundenlohnEffektiv,
      ueberstundenBrutto,
      marginalRate,
      lohnsteuerGeschaetzt,
      soliGeschaetzt,
      sozialversicherungGeschaetzt,
      nettoGeschaetzt,
      isSchaetzung: true,
      hinweis: ueberstundenHinweis,
    };
  },
};
