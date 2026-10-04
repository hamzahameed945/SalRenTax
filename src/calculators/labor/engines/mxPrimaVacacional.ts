import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { calculateProgressiveTax } from '../../core/progressiveTax';
import {
  isrMonthlyBrackets2026,
  umaDaily2026,
} from '../../../data/salary/mx/mexicoPayrollData2026';

export interface MxPrimaVacacionalInput {
  /** Monthly gross salary (sueldo mensual bruto), MXN. */
  sueldoMensual: number;
  /** Vacation days (legal minimum 12 in the first year, LFT Art. 76). */
  diasVacaciones: number;
  /** Months worked in the year (1–12). */
  mesesTrabajados: number;
}

export interface MxPrimaVacacionalResult {
  salarioDiario: number;
  primaBruta: number;
  /** ISR-exempt portion: up to 15 UMAs (Art. 93 fracc. XIV LISR). */
  montoExento: number;
  baseGravada: number;
  isrEstimado: number;
  primaNeta: number;
}

/** 15 UMAs diarias 2026 — exención de ISR para prima vacacional. */
export const PRIMA_VACACIONAL_EXENTO_UMA_2026 = 15 * umaDaily2026; // $1,759.65

/**
 * Mexican prima vacacional calculator.
 * Source: LFT Art. 80 (mínimo 25% del salario de vacaciones);
 * LISR Art. 93 fracc. XIV (exención hasta 15 UMAs).
 * - Prima bruta = (sueldoMensual / 30) × diasVacaciones × 0.25 × (mesesTrabajados / 12)
 * - ISR estimado sobre la parte gravada con la tarifa mensual Art. 96 LISR 2026.
 */
export const mxPrimaVacacionalEngine: CalculatorEngine<MxPrimaVacacionalInput, MxPrimaVacacionalResult, never> = {
  validate(input: MxPrimaVacacionalInput): ValidationResult<MxPrimaVacacionalInput> {
    const errors: Partial<Record<keyof MxPrimaVacacionalInput, string>> = {};

    if (!input.sueldoMensual || Number.isNaN(input.sueldoMensual) || input.sueldoMensual <= 0) {
      errors.sueldoMensual = 'errors.mustBePositive';
    }
    if (
      input.diasVacaciones === undefined ||
      Number.isNaN(input.diasVacaciones) ||
      input.diasVacaciones < 1 ||
      input.diasVacaciones > 365
    ) {
      errors.diasVacaciones = 'errors.invalidNumber';
    }
    if (
      input.mesesTrabajados === undefined ||
      Number.isNaN(input.mesesTrabajados) ||
      input.mesesTrabajados < 1 ||
      input.mesesTrabajados > 12
    ) {
      errors.mesesTrabajados = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: MxPrimaVacacionalInput): MxPrimaVacacionalResult {
    const salarioDiario = input.sueldoMensual / 30;
    const primaBruta = salarioDiario * input.diasVacaciones * 0.25 * (input.mesesTrabajados / 12);
    const montoExento = Math.min(primaBruta, PRIMA_VACACIONAL_EXENTO_UMA_2026);
    const baseGravada = Math.max(0, primaBruta - montoExento);
    const isrEstimado = baseGravada > 0 ? calculateProgressiveTax(baseGravada, isrMonthlyBrackets2026).totalTax : 0;
    const primaNeta = primaBruta - isrEstimado;

    return { salarioDiario, primaBruta, montoExento, baseGravada, isrEstimado, primaNeta };
  },
};
