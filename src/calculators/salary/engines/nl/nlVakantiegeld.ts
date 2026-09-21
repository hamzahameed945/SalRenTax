import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { NL_VAKANTIEGELD_RATE } from '../../../../data/salary/nl/nlTaxData2026';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface NlVakantiegeldInput {
  /** Annual gross salary in EUR (excl. vakantiegeld). */
  grossAnnual: number;
  /** Number of months worked in the vakantiegeld year (default 12). */
  monthsWorked?: number;
  /** Custom vakantiegeld percentage (default 8%). Some CAOs specify higher rates. */
  customRate?: number;
}

export interface NlVakantiegeldResult {
  grossAnnual: number;
  monthsWorked: number;
  rate: number;
  /** Total vakantiegeld (annual amount). */
  vakantiegeldAnnual: number;
  /** Vakantiegeld for the months worked only. */
  vakantiegeldProRata: number;
  /** Gross salary + vakantiegeld combined (pro-rata). */
  totalPackage: number;
  /** Monthly accrual — how much builds up each month. */
  monthlyAccrual: number;
  /** Effective combined monthly average including accrual. */
  effectiveMonthlyGross: number;
}

// ─── Engine ────────────────────────────────────────────────────────────────

export const nlVakantiegeldEngine: CalculatorEngine<NlVakantiegeldInput, NlVakantiegeldResult, never> = {
  validate(input: NlVakantiegeldInput): ValidationResult<NlVakantiegeldInput> {
    const errors: Partial<Record<keyof NlVakantiegeldInput, string>> = {};

    if (!input.grossAnnual || typeof input.grossAnnual === 'number' && Number.isNaN(input.grossAnnual)) {
      errors.grossAnnual = 'errors.invalidNumber';
    } else if (input.grossAnnual <= 0) {
      errors.grossAnnual = 'errors.mustBePositive';
    }

    const months = input.monthsWorked ?? 12;
    if (typeof months === 'number' && Number.isNaN(months) || months < 1 || months > 12) {
      errors.monthsWorked = 'errors.invalidMonths';
    }

    const rate = input.customRate ?? NL_VAKANTIEGELD_RATE;
    if (typeof rate === 'number' && Number.isNaN(rate) || rate < 0.08 || rate > 0.25) {
      errors.customRate = 'errors.invalidRate';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: NlVakantiegeldInput): NlVakantiegeldResult {
    const {
      grossAnnual,
      monthsWorked = 12,
      customRate = NL_VAKANTIEGELD_RATE,
    } = input;

    const vakantiegeldAnnual = grossAnnual * customRate;
    const vakantiegeldProRata = vakantiegeldAnnual * (monthsWorked / 12);
    const totalPackage = grossAnnual + vakantiegeldProRata;
    const monthlyAccrual = vakantiegeldAnnual / 12;
    const effectiveMonthlyGross = (grossAnnual + vakantiegeldAnnual) / 12;

    return {
      grossAnnual,
      monthsWorked,
      rate: customRate,
      vakantiegeldAnnual,
      vakantiegeldProRata,
      totalPackage,
      monthlyAccrual,
      effectiveMonthlyGross,
    };
  },
};
