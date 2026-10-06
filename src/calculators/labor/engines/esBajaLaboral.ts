import type { CalculatorEngine, ValidationResult } from '../../core/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EsBajaLaboralInput {
  /** Monthly contribution base (base de cotización del mes anterior), EUR. */
  baseCotizacionMensual: number;
  /** Days of medical leave (incapacidad temporal), 1–365. */
  diasBaja: number;
}

export interface EsBajaLaboralTramo60 {
  /** Days in the 60% tranche (days 4–20). */
  dias: number;
  /** Total 60% benefit. */
  importe: number;
  /** Days 4–15: paid by the employer (pago delegado). */
  diasEmpresa: number;
  /** Employer-paid portion of the 60% tranche. */
  importeEmpresa: number;
  /** Days 16–20: paid directly by INSS/Mutua. */
  diasInss: number;
  /** INSS/Mutua-paid portion of the 60% tranche. */
  importeInss: number;
}

export interface EsBajaLaboralResult {
  /** Daily regulatory base: baseCotizacionMensual / 30. */
  baseReguladoraDiaria: number;
  /** Total estimated benefit (sum of the paid tranches). */
  totalPrestacion: number;
  desglose: {
    /** Days 1–3: no benefit (periodo de carencia). */
    diasCarencia: number;
    /** 60% tranche: days 4–20, split employer (4–15) vs INSS/Mutua (16–20). */
    tramo60: EsBajaLaboralTramo60;
    /** 75% tranche: day 21 onwards, paid by INSS/Mutua. */
    tramo75: { dias: number; importe: number };
  };
  /** i18n key for the estimate disclaimer; the UI layer provides the copy. */
  noteKey: string;
}

// ─── Engine ─────────────────────────────────────────────────────────────────

/**
 * Incapacidad temporal por contingencias comunes (enfermedad común o
 * accidente no laboral), LGSS Arts. 128 y ss. Simplified estimate:
 *   - Base reguladora diaria = base de cotización del mes anterior / 30
 *   - Days 1–3: 0% (periodo de carencia)
 *   - Days 4–20: 60% of the daily base (employer pays days 4–15,
 *     INSS/Mutua pays days 16–20)
 *   - Day 21 onwards: 75% of the daily base (INSS/Mutua)
 * Percentages are stable in the 2026 regulatory framework; many collective
 * agreements top the benefit up to 100% of salary, which this estimate
 * does NOT model.
 */
const TASA_TRAMO_60 = 0.6;
const TASA_TRAMO_75 = 0.75;
const DIAS_CARENCIA = 3;
const DIAS_TRAMO_60 = 17; // days 4–20
const DIAS_PAGO_EMPRESA = 12; // days 4–15 (pago delegado)

export const esBajaLaboralEngine: CalculatorEngine<EsBajaLaboralInput, EsBajaLaboralResult, never> = {
  validate(input: EsBajaLaboralInput): ValidationResult<EsBajaLaboralInput> {
    const errors: Partial<Record<keyof EsBajaLaboralInput, string>> = {};

    if (!input.baseCotizacionMensual || typeof input.baseCotizacionMensual === 'number' && Number.isNaN(input.baseCotizacionMensual)) {
      errors.baseCotizacionMensual = 'errors.invalidNumber';
    } else if (input.baseCotizacionMensual <= 0) {
      errors.baseCotizacionMensual = 'errors.mustBePositive';
    }

    const d = input.diasBaja;
    if (
      d === undefined ||
      d === null ||
      typeof d === 'number' && Number.isNaN(d) ||
      !Number.isInteger(d) ||
      d < 1 ||
      d > 365
    ) {
      errors.diasBaja = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: EsBajaLaboralInput): EsBajaLaboralResult {
    const dias = Math.floor(input.diasBaja);
    const baseReguladoraDiaria = input.baseCotizacionMensual / 30;

    const diasCarencia = Math.min(dias, DIAS_CARENCIA);
    const dias60 = Math.min(Math.max(dias - DIAS_CARENCIA, 0), DIAS_TRAMO_60);
    const diasEmpresa = Math.min(Math.max(dias - DIAS_CARENCIA, 0), DIAS_PAGO_EMPRESA);
    const diasInss = dias60 - diasEmpresa;
    const dias75 = Math.max(dias - DIAS_CARENCIA - DIAS_TRAMO_60, 0);

    const diario60 = baseReguladoraDiaria * TASA_TRAMO_60;
    const diario75 = baseReguladoraDiaria * TASA_TRAMO_75;

    const importeEmpresa = diasEmpresa * diario60;
    const importeInss = diasInss * diario60;
    const importe60 = importeEmpresa + importeInss;
    const importe75 = dias75 * diario75;
    const totalPrestacion = importe60 + importe75;

    return {
      baseReguladoraDiaria,
      totalPrestacion,
      desglose: {
        diasCarencia,
        tramo60: {
          dias: dias60,
          importe: importe60,
          diasEmpresa,
          importeEmpresa,
          diasInss,
          importeInss,
        },
        tramo75: { dias: dias75, importe: importe75 },
      },
      noteKey: 'esBajaLaboral.estimateNote',
    };
  },
};
