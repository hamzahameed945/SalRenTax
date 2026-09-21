import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  imss2026,
  isrMonthlyBrackets2026,
  subsidioEmpleo2026,
  umaMonthly2026,
} from '../../../../data/salary/mx/mexicoPayrollData2026';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MexicoSalaryInput {
  /** Monthly gross salary (salario mensual bruto), MXN. */
  grossMonthly: number;
  /**
   * Pay period for display. Engine always works monthly internally.
   * 'monthly' | 'biweekly' | 'weekly'
   */
  payPeriod?: 'monthly' | 'biweekly' | 'weekly';
}

export interface MexicoSalaryBreakdown {
  grossMonthly: number;

  // ── IMSS employee (obrero) deductions ──────────────────────────────
  /** SBC mensual after applying the 25×UMA cap. */
  sbcMonthly: number;
  /** EM excedente sobre 3 UMAs — cuota obrera (0.40%). */
  imssEmExcedenteObrero: number;
  /** EM prestaciones en dinero — cuota obrera (0.25%). */
  imssEmPrestacionesDineroObrero: number;
  /** Invalidez y Vida — cuota obrera (0.125%). */
  imssIvObrero: number;
  /** Cesantía en Edad Avanzada y Vejez — cuota obrera (1.125%). */
  imssCyvObrero: number;
  /** Total IMSS employee deductions. */
  totalImssObrero: number;

  // ── ISR ──────────────────────────────────────────────────────────
  /** Taxable base after IMSS deduction. */
  isrTaxableBase: number;
  /** Raw ISR before subsidio. */
  isrBruto: number;
  /** Subsidio para el empleo applied (0 if income > limit). */
  subsidioEmpleo: number;
  /**
   * Net ISR after subsidio.
   * If subsidio > ISR bruto, employer pays the difference to worker (negative = credit).
   */
  isrNeto: number;
  isrEffectiveRate: number;

  // ── Employer side (informational) ─────────────────────────────────
  imssEmCuotaFijaPatron: number;
  imssEmExcedentePatron: number;
  imssEmPrestacionesDineroPatron: number;
  imssIvPatron: number;
  imssGpsPatron: number;
  imssRetiroPatron: number;
  imssCyvPatron: number;
  infonavitPatron: number;
  totalCostoPatron: number;

  // ── Net ───────────────────────────────────────────────────────────
  netMonthly: number;
  netBiweekly: number;
  netWeekly: number;
  effectiveTotalDeductionRate: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcImssObrero(sbcMonthly: number): {
  emExcedente: number;
  emPrestaciones: number;
  iv: number;
  cyv: number;
  total: number;
} {
  const si = imss2026;
  const uma3 = umaMonthly2026 * si.emExcedenteBase; // 3 × UMA mensual

  // EM excedente: only when SBC > 3 × UMA
  const emExcedenteBase = Math.max(0, sbcMonthly - uma3);
  const emExcedente     = emExcedenteBase * si.emExcedenteOberoRate;

  const emPrestaciones  = sbcMonthly * si.emPrestacionesDineroObrero;
  const iv              = sbcMonthly * si.ivObreroRate;
  const cyv             = sbcMonthly * si.cyvObreroRate;

  return {
    emExcedente,
    emPrestaciones,
    iv,
    cyv,
    total: emExcedente + emPrestaciones + iv + cyv,
  };
}

function calcImssPatron(sbcMonthly: number): {
  emCuotaFija: number;
  emExcedente: number;
  emPrestaciones: number;
  iv: number;
  gps: number;
  retiro: number;
  cyv: number;
  infonavit: number;
  total: number;
} {
  const si = imss2026;
  const uma3 = umaMonthly2026 * si.emExcedenteBase;

  const emCuotaFija    = umaMonthly2026 * si.emCuotaFijaPatronRate;
  const emExcBase      = Math.max(0, sbcMonthly - uma3);
  const emExcedente    = emExcBase * si.emExcedentePatronRate;
  const emPrestaciones = sbcMonthly * si.emPrestacionesDineroPatron;
  const iv             = sbcMonthly * si.ivPatronRate;
  const gps            = sbcMonthly * si.gpsPatronRate;
  const retiro         = sbcMonthly * si.retiroPatronRate;
  const cyv            = sbcMonthly * si.cyvPatronRate;
  const infonavit      = sbcMonthly * si.infonavitPatronRate;

  return {
    emCuotaFija, emExcedente, emPrestaciones, iv, gps, retiro, cyv, infonavit,
    total: emCuotaFija + emExcedente + emPrestaciones + iv + gps + retiro + cyv + infonavit,
  };
}

// ─── Engine ─────────────────────────────────────────────────────────────────

export const mexicoSalaryEngine: CalculatorEngine<MexicoSalaryInput, MexicoSalaryBreakdown, never> = {
  validate(input: MexicoSalaryInput): ValidationResult<MexicoSalaryInput> {
    const errors: Partial<Record<keyof MexicoSalaryInput, string>> = {};

    if (!input.grossMonthly || Number.isNaN(input.grossMonthly)) {
      errors.grossMonthly = 'errors.invalidNumber';
    } else if (input.grossMonthly <= 0) {
      errors.grossMonthly = 'errors.mustBePositive';
    } else if (input.grossMonthly > 10_000_000) {
      errors.grossMonthly = 'errors.tooHigh';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: MexicoSalaryInput): MexicoSalaryBreakdown {
    const { grossMonthly } = input;

    // ── 1. SBC — apply 25×UMA cap ───────────────────────────────────────
    const sbcMonthly = Math.min(grossMonthly, imss2026.sbcTopeMensual);

    // ── 2. IMSS obrero ───────────────────────────────────────────────────
    const obrero = calcImssObrero(sbcMonthly);

    // ── 3. ISR taxable base (gross minus IMSS obrero per Art. 109 LISR) ─
    const isrTaxableBase = Math.max(0, grossMonthly - obrero.total);
    const { totalTax: isrBruto, effectiveRate } = calculateProgressiveTax(
      isrTaxableBase,
      isrMonthlyBrackets2026,
    );

    // ── 4. Subsidio para el empleo ───────────────────────────────────────
    // Fixed cuota fija if gross ≤ limit; zero otherwise.
    const subsidio =
      grossMonthly <= subsidioEmpleo2026.limiteIngreso
        ? subsidioEmpleo2026.montoCuotaFija
        : 0;

    // Net ISR: can be negative (employer must pay worker the credit)
    const isrNeto = isrBruto - subsidio;

    // ── 5. Patron (employer cost — informational) ────────────────────────
    const patron = calcImssPatron(sbcMonthly);
    const totalCostoPatron = grossMonthly + patron.total;

    // ── 6. Net ───────────────────────────────────────────────────────────
    // If isrNeto < 0, worker receives the subsidio credit (employer pays it)
    const netMonthly = grossMonthly - obrero.total - Math.max(0, isrNeto);
    // Add subsidio credit back if applicable
    const netMonthlyFinal = isrNeto < 0
      ? netMonthly + Math.abs(isrNeto)  // employer pays credit to worker
      : netMonthly;

    const totalDeductions = obrero.total + Math.max(0, isrNeto);
    const effectiveTotalDeductionRate = grossMonthly > 0 ? totalDeductions / grossMonthly : 0;

    return {
      grossMonthly,
      sbcMonthly,

      imssEmExcedenteObrero:          obrero.emExcedente,
      imssEmPrestacionesDineroObrero: obrero.emPrestaciones,
      imssIvObrero:                   obrero.iv,
      imssCyvObrero:                  obrero.cyv,
      totalImssObrero:                obrero.total,

      isrTaxableBase,
      isrBruto,
      subsidioEmpleo:  subsidio,
      isrNeto,
      isrEffectiveRate: effectiveRate,

      imssEmCuotaFijaPatron:          patron.emCuotaFija,
      imssEmExcedentePatron:          patron.emExcedente,
      imssEmPrestacionesDineroPatron: patron.emPrestaciones,
      imssIvPatron:                   patron.iv,
      imssGpsPatron:                  patron.gps,
      imssRetiroPatron:               patron.retiro,
      imssCyvPatron:                  patron.cyv,
      infonavitPatron:                patron.infonavit,
      totalCostoPatron,

      netMonthly:  netMonthlyFinal,
      netBiweekly: netMonthlyFinal / 2,
      netWeekly:   netMonthlyFinal * 12 / 52,
      effectiveTotalDeductionRate,
    };
  },
};
