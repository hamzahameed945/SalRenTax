import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  irpfStateBrackets2026,
  irpfRegionalBrackets2026,
  seguridadSocial2026,
  minimoPersonal2026,
  reduccionRendimientosTrabajo2026,
  type ComunidadAutonoma,
} from '../../../../data/salary/es/spainPayrollData2026';

// ─── Types ──────────────────────────────────────────────────────────────────

export type { ComunidadAutonoma };

export interface SpainSalaryInput {
  /** Annual gross salary, EUR. */
  grossAnnual: number;
  /** Pay periods per year: 12 standard, 14 with extra "pagas". */
  paymentsPerYear: 12 | 14;
  /** Autonomous community for full IRPF (state + regional). Default: 'madrid'. */
  comunidadAutonoma?: ComunidadAutonoma;
  /** Taxpayer age — affects mínimo personal. */
  age?: number;
}

export interface SpainSalaryBreakdown {
  grossAnnual: number;
  grossPerPayment: number;

  // ── Seguridad Social (employee, annual) ──────────────────────────────
  /** Base de cotización annual (capped at baseMaximaCotizacionMonthly × 12). */
  ssBaseAnual: number;
  ssContingenciasComunes: number;   // 4.70%
  ssDesempleo: number;              // 1.55%
  ssMei: number;                    // 0.15%
  ssFormacionProfesional: number;   // 0.10%
  ssTotalEmployee: number;          // sum of above

  // ── IRPF base construction ───────────────────────────────────────────
  /** Rendimiento íntegro (= grossAnnual). */
  rendimientoIntegro: number;
  /** Gastos deducibles mínimos (Art. 19.2.f = €2,000). */
  gastoDeducible: number;
  /** Rendimiento neto = rendimientoIntegro − SS − gastoDeducible. */
  rendimientoNeto: number;
  /** Reducción por rendimientos del trabajo (Art. 20 LIRPF). */
  reduccionRendimientosTrabajo: number;
  /** Rendimiento neto reducido = rendimientoNeto − reducción. */
  rendimientoNetoReducido: number;
  /** Mínimo personal applied. */
  minimoPersonal: number;
  /** Base liquidable general (taxable base for IRPF brackets). */
  baseLiquidable: number;

  // ── IRPF (annual) ────────────────────────────────────────────────────
  irpfStateAnnual: number;
  irpfRegionalAnnual: number;
  irpfTotalAnnual: number;
  irpfEffectiveTotal: number;       // % of grossAnnual
  comunidadAutonoma: ComunidadAutonoma;

  // ── Net ──────────────────────────────────────────────────────────────
  netAnnual: number;
  netPerPayment: number;
  netMonthly: number;               // always annual/12

  effectiveTotalDeductionRate: number;
  marginalIrpfRate: number;         // state + regional marginal on last euro
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMinimoPersonal(age: number | undefined): number {
  if (age === undefined || age < 65) return minimoPersonal2026.general;
  if (age < 75) return minimoPersonal2026.mayores65;
  return minimoPersonal2026.mayores75;
}

/**
 * Reducción por rendimientos del trabajo (Art. 20 LIRPF).
 * Applied when rendimiento neto del trabajo (without gastos deducibles extra) < €19,747.50.
 * RNT for this check = gross − SS − gastoDeducible (€2,000 min).
 */
function calcReduccionRT(rnt: number): number {
  const r = reduccionRendimientosTrabajo2026;
  if (rnt > r.rntLimite) return 0;
  if (rnt <= r.rntTramo1Hasta) return r.reduccionMax;
  if (rnt <= r.rntTramo2Hasta) {
    return Math.max(0, r.reduccionMax - r.faseReduccion1 * (rnt - r.rntTramo1Hasta));
  }
  // Tramo 3: €17,673.52 – €19,747.50
  return Math.max(0, r.reduccionBase2 - r.faseReduccion2 * (rnt - r.rntTramo2Hasta));
}

// ─── Engine ─────────────────────────────────────────────────────────────────

export const spainSalaryEngine: CalculatorEngine<SpainSalaryInput, SpainSalaryBreakdown, never> = {
  validate(input: SpainSalaryInput): ValidationResult<SpainSalaryInput> {
    const errors: Partial<Record<keyof SpainSalaryInput, string>> = {};

    if (!input.grossAnnual || typeof input.grossAnnual === 'number' && Number.isNaN(input.grossAnnual)) {
      errors.grossAnnual = 'errors.invalidNumber';
    } else if (input.grossAnnual <= 0) {
      errors.grossAnnual = 'errors.mustBePositive';
    } else if (input.grossAnnual > 5_000_000) {
      errors.grossAnnual = 'errors.tooHigh';
    }

    if (input.paymentsPerYear !== 12 && input.paymentsPerYear !== 14) {
      errors.paymentsPerYear = 'errors.invalidNumber';
    }

    if (input.age !== undefined && (typeof input.age === 'number' && Number.isNaN(input.age) || input.age < 16 || input.age > 100)) {
      errors.age = 'errors.invalidAge';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: SpainSalaryInput): SpainSalaryBreakdown {
    const {
      grossAnnual,
      paymentsPerYear,
      comunidadAutonoma = 'madrid',
      age,
    } = input;

    // ── 1. Seguridad Social — cap applied per month × 12 (correct basis) ──
    const capMonthly   = seguridadSocial2026.baseMaximaCotizacionMonthly;
    const baseMonthly  = Math.min(grossAnnual / 12, capMonthly);
    const ssBaseAnual  = baseMonthly * 12;  // always × 12 regardless of pay structure

    const ss = seguridadSocial2026;
    const ssCC  = ssBaseAnual * ss.contingenciasComunesEmployeeRate;
    const ssDes = ssBaseAnual * ss.desempleoEmployeeRate;
    const ssMei = ssBaseAnual * ss.meiEmployeeRate;
    const ssFP  = ssBaseAnual * ss.formacionProfesionalEmployeeRate;
    const ssTotal = ssCC + ssDes + ssMei + ssFP;

    // ── 2. Rendimiento neto del trabajo ────────────────────────────────────
    const gastoDeducible = reduccionRendimientosTrabajo2026.gastoDeducibleMin;
    const rendimientoNeto = Math.max(0, grossAnnual - ssTotal - gastoDeducible);

    // ── 3. Reducción Art. 20 (applied to rendimiento neto) ────────────────
    const reduccionRT = calcReduccionRT(rendimientoNeto);
    const rendimientoNetoReducido = Math.max(0, rendimientoNeto - reduccionRT);

    // ── 4. Mínimo personal ─────────────────────────────────────────────────
    const minPersonal = getMinimoPersonal(age);

    // ── 5. Base liquidable ────────────────────────────────────────────────
    const baseLiquidable = Math.max(0, rendimientoNetoReducido - minPersonal);

    // ── 6. IRPF state ─────────────────────────────────────────────────────
    const {
      totalTax: irpfState,
      marginalRate: marginalState,
    } = calculateProgressiveTax(baseLiquidable, irpfStateBrackets2026);

    // ── 7. IRPF regional ──────────────────────────────────────────────────
    const regionalBrackets = irpfRegionalBrackets2026[comunidadAutonoma];
    const {
      totalTax: irpfRegional,
      marginalRate: marginalRegional,
    } = calculateProgressiveTax(baseLiquidable, regionalBrackets);

    const irpfTotal = irpfState + irpfRegional;
    const irpfEffectiveTotal = grossAnnual > 0 ? irpfTotal / grossAnnual : 0;
    const marginalIrpfRate = marginalState + marginalRegional;

    // ── 8. Net ────────────────────────────────────────────────────────────
    const netAnnual  = grossAnnual - ssTotal - irpfTotal;
    const netPerPayment = netAnnual / paymentsPerYear;
    const netMonthly = netAnnual / 12;

    const totalDeductions = ssTotal + irpfTotal;
    const effectiveTotalDeductionRate = grossAnnual > 0 ? totalDeductions / grossAnnual : 0;

    return {
      grossAnnual,
      grossPerPayment: grossAnnual / paymentsPerYear,
      ssBaseAnual,
      ssContingenciasComunes: ssCC,
      ssDesempleo:            ssDes,
      ssMei,
      ssFormacionProfesional: ssFP,
      ssTotalEmployee:        ssTotal,
      rendimientoIntegro:     grossAnnual,
      gastoDeducible,
      rendimientoNeto,
      reduccionRendimientosTrabajo: reduccionRT,
      rendimientoNetoReducido,
      minimoPersonal:         minPersonal,
      baseLiquidable,
      irpfStateAnnual:        irpfState,
      irpfRegionalAnnual:     irpfRegional,
      irpfTotalAnnual:        irpfTotal,
      irpfEffectiveTotal,
      comunidadAutonoma,
      netAnnual,
      netPerPayment,
      netMonthly,
      effectiveTotalDeductionRate,
      marginalIrpfRate,
    };
  },
};
