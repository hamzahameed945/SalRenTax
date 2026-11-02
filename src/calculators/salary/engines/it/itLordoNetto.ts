import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  IT_INPS_EMPLOYEE,
  IT_INPS_EXTRA_RATE,
  IT_INPS_EXTRA_THRESHOLD,
  IT_INPS_CEILING,
  IT_IRPEF_BRACKETS_2026,
} from '../../../../data/salary/it/itTaxData2026';

// Italy net salary, annual (RAL), 2026.
// Scope: gross minus employee INPS minus national IRPEF (on taxable income =
// gross minus INPS, since INPS is deductible). Regional/municipal surcharges
// and the employment tax credit are NOT included; the page states this.
// INPS base is capped at the €122,295 ceiling; the +1% extra applies only to
// the portion of gross above €56,224.
export interface ItLordoNettoInput {
  grossAnnual: number;
}

export interface ItLordoNettoResult {
  grossAnnual: number;
  inps: number;
  inpsExtra: number;
  taxableIncome: number;
  irpef: number;
  totalDeductions: number;
  netAnnual: number;
  netMonthly: number;
}

function irpefOn(taxable: number): number {
  let tax = 0;
  let prev = 0;
  for (const b of IT_IRPEF_BRACKETS_2026) {
    if (taxable <= prev) break;
    const band = Math.min(taxable, b.upTo) - prev;
    tax += band * b.rate;
    prev = b.upTo;
  }
  return tax;
}

export const itLordoNettoEngine: CalculatorEngine<ItLordoNettoInput, ItLordoNettoResult, never> = {
  validate(input: ItLordoNettoInput): ValidationResult<ItLordoNettoInput> {
    const errors: Partial<Record<keyof ItLordoNettoInput, string>> = {};
    if (input.grossAnnual === undefined || Number.isNaN(input.grossAnnual) || input.grossAnnual <= 0) {
      errors.grossAnnual = 'errors.invalidNumber';
    }
    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },
  calculate(input: ItLordoNettoInput, _config: never, year: number): ItLordoNettoResult {
    if (year !== 2026) throw new Error('itLordoNettoEngine supports year 2026 only');
    const gross = input.grossAnnual;
    const inpsBase = Math.min(gross, IT_INPS_CEILING);
    const inps = inpsBase * IT_INPS_EMPLOYEE;
    const inpsExtra = Math.max(0, gross - IT_INPS_EXTRA_THRESHOLD) * IT_INPS_EXTRA_RATE;
    const taxable = gross - inps - inpsExtra;
    const irpef = irpefOn(taxable);
    const total = inps + inpsExtra + irpef;
    return {
      grossAnnual: gross,
      inps,
      inpsExtra,
      taxableIncome: taxable,
      irpef,
      totalDeductions: total,
      netAnnual: gross - total,
      netMonthly: (gross - total) / 12,
    };
  },
};
