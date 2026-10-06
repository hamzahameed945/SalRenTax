import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  einkommensteuer2026,
  lohnsteuerPauschbetraege2026,
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
   * z. B. 0.35 = 35 %.
   */
  marginalRate: number;
  /** Geschätzte Lohnsteuer auf das Weihnachtsgeld. */
  lohnsteuerGeschaetzt: number;
  /** Geschätzter Solidaritätszuschlag auf das Weihnachtsgeld (meist 0). */
  soliGeschaetzt: number;
  /** Weihnachtsgeld netto (Schätzung). */
  nettoGeschaetzt: number;
  /** Immer true: Das Ergebnis ist eine grobe Schätzung, keine Lohnabrechnung. */
  isSchaetzung: true;
  /**
   * Hinweis an die UI: Der Arbeitgeber berechnet die Lohnsteuer auf
   * Weihnachtsgeld nach der Jahrestabellen-Methode (sonstige Bezüge); die
   * tatsächliche Lohnabrechnung kann abweichen.
   */
  hinweis: string;
}

// ─── § 32a EStG 2026: Steuer und Grenzsteuersatz ───────────────────────────
// Vereinfachte Näherung: Einzelveranlagung (Grundtarif), Steuerklasse I,
// abzüglich Arbeitnehmer-Pauschbetrag (1.230 €) und
// Sonderausgaben-Pauschbetrag (36 €) vom Jahresbrutto. Sonderfälle
// (Splitting, Kinder, Kirche, SV-Beiträge, tatsächliche Werbungskosten)
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
function calcSoliOnBonus(estAnnualWithoutBonus: number, lohnsteuerBonus: number): number {
  const s = solidaritaetszuschlag2026;
  if (estAnnualWithoutBonus + lohnsteuerBonus <= s.freigrenzeSingle) return 0;
  // Außerhalb der Freigrenze: 5,5 % auf die Bonus-Lohnsteuer (einfache Näherung,
  // Milderungszone bewusst nicht modelliert).
  return lohnsteuerBonus * s.rate;
}

export const weihnachtsgeldHinweis =
  'Schätzung auf Basis des Einkommensteuertarifs 2026 (§ 32a EStG, Grundtarif, ' +
  'Steuerklasse I). Der Arbeitgeber berechnet das Weihnachtsgeld als sonstige ' +
  'Bezüge nach der Jahrestabellen-Methode — die tatsächliche Lohnabrechnung ' +
  '(inkl. Sozialversicherungsbeiträgen, Steuerklasse, Kirchensteuer) ist ' +
  'maßgeblich und kann abweichen.';

export const weihnachtsgeldEngine: CalculatorEngine<WeihnachtsgeldInput, WeihnachtsgeldResult, never> = {
  validate(input: WeihnachtsgeldInput): ValidationResult<WeihnachtsgeldInput> {
    const errors: Partial<Record<keyof WeihnachtsgeldInput, string>> = {};

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

    const zvE = zuVersteuerndesEinkommen(jahresBrutto);
    const marginalRate = calcMarginalRate(zvE);

    // Schätzung: Lohnsteuer auf das Weihnachtsgeld ≈ Brutto × Grenzsteuersatz.
    const lohnsteuerGeschaetzt = bonusBrutto * marginalRate;

    const estAnnual = calcESt(zvE);
    const soliGeschaetzt = calcSoliOnBonus(estAnnual, lohnsteuerGeschaetzt);

    const nettoGeschaetzt = Math.max(0, bonusBrutto - lohnsteuerGeschaetzt - soliGeschaetzt);

    return {
      bonusBrutto,
      jahresBrutto,
      marginalRate,
      lohnsteuerGeschaetzt,
      soliGeschaetzt,
      nettoGeschaetzt,
      isSchaetzung: true,
      hinweis: weihnachtsgeldHinweis,
    };
  },
};
