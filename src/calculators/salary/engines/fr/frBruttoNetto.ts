import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  FR_PSS_MONTHLY_2026,
  FR_VIEILLESSE_PLAFONNEE_EMPLOYEE,
  FR_VIEILLESSE_DEPLAFONNEE_EMPLOYEE,
  FR_AGIRC_T1_EMPLOYEE,
  FR_AGIRC_T2_EMPLOYEE,
  FR_CEG_T1_EMPLOYEE,
  FR_CEG_T2_EMPLOYEE,
  FR_CET_EMPLOYEE,
  FR_CSG_CRDS_BASE,
  FR_CSG_CRDS_EMPLOYEE,
} from '../../../../data/salary/fr/frTaxData2026';

// France net salary, monthly, 2026 — DRAFT, not yet committed to repo main.
// Scope: gross minus EMPLOYEE social contributions, BEFORE income-tax
// withholding (prélèvement à la source). See FR-ENGINE-DRAFT.md.
// NOTE: CalculatorEngine requires calculate(input, config, year) — all 3 args.
// This engine accepts them; config is unused (no cadre/non-cadre split yet)
// and year must be 2026, otherwise validate() fails.

export interface FrBruttoNettoInput {
  grossMonthly: number;
}

export interface FrBruttoNettoResult {
  grossMonthly: number;
  vieillessePlafonnee: number;
  vieillesseDeplafonnee: number;
  agircArrco: number;
  ceg: number;
  cet: number;
  csgCrds: number;
  totalEmployeeDeductions: number;
  netMonthly: number;
}

export const frBruttoNettoEngine: CalculatorEngine<FrBruttoNettoInput, FrBruttoNettoResult, never> = {
  validate(input: FrBruttoNettoInput): ValidationResult<FrBruttoNettoInput> {
    const errors: Partial<Record<keyof FrBruttoNettoInput, string>> = {};
    if (input.grossMonthly === undefined || Number.isNaN(input.grossMonthly) || input.grossMonthly <= 0) {
      errors.grossMonthly = 'errors.invalidNumber';
    }
    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },
  calculate(input: FrBruttoNettoInput, _config: never, year: number): FrBruttoNettoResult {
    if (year !== 2026) throw new Error('frBruttoNettoEngine supports year 2026 only');
    const gross = input.grossMonthly;
    const t1 = Math.min(gross, FR_PSS_MONTHLY_2026);
    const t2 = Math.max(0, gross - FR_PSS_MONTHLY_2026);
    const vieillessePlafonnee = t1 * FR_VIEILLESSE_PLAFONNEE_EMPLOYEE;
    const vieillesseDeplafonnee = gross * FR_VIEILLESSE_DEPLAFONNEE_EMPLOYEE;
    const agircArrco = t1 * FR_AGIRC_T1_EMPLOYEE + t2 * FR_AGIRC_T2_EMPLOYEE;
    const ceg = t1 * FR_CEG_T1_EMPLOYEE + t2 * FR_CEG_T2_EMPLOYEE;
    // CET only when gross exceeds the PSS, on the full gross (T1+T2).
    const cet = gross > FR_PSS_MONTHLY_2026 ? gross * FR_CET_EMPLOYEE : 0;
    const csgCrds = gross * FR_CSG_CRDS_BASE * FR_CSG_CRDS_EMPLOYEE;
    const total = vieillessePlafonnee + vieillesseDeplafonnee + agircArrco + ceg + cet + csgCrds;
    return {
      grossMonthly: gross,
      vieillessePlafonnee,
      vieillesseDeplafonnee,
      agircArrco,
      ceg,
      cet,
      csgCrds,
      totalEmployeeDeductions: total,
      netMonthly: gross - total,
    };
  },
};
