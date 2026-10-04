import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { calculateProgressiveTax } from '../../core/progressiveTax';
import {
  isrMonthlyBrackets2026,
  umaDaily2026,
} from '../../../data/salary/mx/mexicoPayrollData2026';

export interface MxAguinaldoInput {
  /** Monthly gross salary (sueldo mensual bruto), MXN. */
  sueldoMensual: number;
  /** Aguinaldo days granted (legal minimum 15, Art. 87 LFT). */
  diasAguinaldo: number;
  /** Months worked in the year (1–12). */
  mesesTrabajados: number;
}

export interface MxAguinaldoResult {
  salarioDiario: number;
  aguinaldoBruto: number;
  /** ISR-exempt portion: up to 30 UMAs (Art. 93 fracc. XIV LISR). */
  montoExento: number;
  baseGravada: number;
  isrEstimado: number;
  aguinaldoNeto: number;
}

/** 30 UMAs diarias 2026 — exención de ISR para aguinaldo. */
export const AGUINALDO_EXENTO_UMA_2026 = 30 * umaDaily2026; // $3,519.30

/**
 * Mexican aguinaldo (Christmas bonus) calculator.
 * Source: LFT Art. 87 (mínimo 15 días, pago antes del 20 de diciembre);
 * LISR Art. 93 fracc. XIV (exención hasta 30 UMAs).
 * - Aguinaldo bruto = (sueldoMensual / 30) × diasAguinaldo × (mesesTrabajados / 12)
 * - ISR estimado sobre la parte gravada con la tarifa mensual Art. 96 LISR 2026.
 */
export const mxAguinaldoEngine: CalculatorEngine<MxAguinaldoInput, MxAguinaldoResult, never> = {
  validate(input: MxAguinaldoInput): ValidationResult<MxAguinaldoInput> {
    const errors: Partial<Record<keyof MxAguinaldoInput, string>> = {};

    if (!input.sueldoMensual || Number.isNaN(input.sueldoMensual) || input.sueldoMensual <= 0) {
      errors.sueldoMensual = 'errors.mustBePositive';
    }
    if (
      input.diasAguinaldo === undefined ||
      Number.isNaN(input.diasAguinaldo) ||
      input.diasAguinaldo < 1 ||
      input.diasAguinaldo > 365
    ) {
      errors.diasAguinaldo = 'errors.invalidNumber';
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

  calculate(input: MxAguinaldoInput): MxAguinaldoResult {
    const salarioDiario = input.sueldoMensual / 30;
    const aguinaldoBruto = salarioDiario * input.diasAguinaldo * (input.mesesTrabajados / 12);
    const montoExento = Math.min(aguinaldoBruto, AGUINALDO_EXENTO_UMA_2026);
    const baseGravada = Math.max(0, aguinaldoBruto - montoExento);
    const isrEstimado = baseGravada > 0 ? calculateProgressiveTax(baseGravada, isrMonthlyBrackets2026).totalTax : 0;
    const aguinaldoNeto = aguinaldoBruto - isrEstimado;

    return { salarioDiario, aguinaldoBruto, montoExento, baseGravada, isrEstimado, aguinaldoNeto };
  },
};
