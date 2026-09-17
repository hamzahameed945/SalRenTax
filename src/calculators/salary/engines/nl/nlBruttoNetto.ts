import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  nlBox1Brackets2026,
  nlAlgemeneHeffingskorting2026,
  nlArbeidskorting2026,
} from '../../../../data/salary/nl/nlTaxData2026';

export interface NlBruttoNettoInput {
  /** Annual gross salary, EUR. */
  grossAnnual: number;
  /** Age — affects AOW/national insurance component of box 1 tax. */
  age?: number;
}

export interface NlBruttoNettoResult {
  grossAnnual: number;
  incomeTaxAnnual: number;
  netAnnual: number;
  netMonthly: number;
  effectiveRate: number;
  /** Simplified — heffingskortingen are approximated. */
  simplified: boolean;
}

export const nlBruttoNettoEngine: CalculatorEngine<NlBruttoNettoInput, NlBruttoNettoResult, never> = {
  validate(input: NlBruttoNettoInput): ValidationResult<NlBruttoNettoInput> {
    const errors: Partial<Record<keyof NlBruttoNettoInput, string>> = {};

    if (!input.grossAnnual || Number.isNaN(input.grossAnnual)) {
      errors.grossAnnual = 'errors.invalidNumber';
    } else if (input.grossAnnual <= 0) {
      errors.grossAnnual = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: NlBruttoNettoInput): NlBruttoNettoResult {
    const gross = input.grossAnnual;

    // Box 1 tax before credits
    const { totalTax: rawTax } = calculateProgressiveTax(gross, nlBox1Brackets2026);

    // Algemene heffingskorting (phases out above phaseOutStart)
    let ahk = nlAlgemeneHeffingskorting2026.maxCredit as number;
    if (gross > nlAlgemeneHeffingskorting2026.phaseOutStart) {
      const phaseOut = (gross - nlAlgemeneHeffingskorting2026.phaseOutStart) * nlAlgemeneHeffingskorting2026.phaseOutRate;
      ahk = Math.max(0, ahk - phaseOut);
    }

    // Arbeidskorting: simplified — apply max up to the raw tax
    const arbeidskorting = Math.min(nlArbeidskorting2026.maxCredit, rawTax);

    const incomeTaxAnnual = Math.max(0, rawTax - ahk - arbeidskorting);
    const netAnnual = gross - incomeTaxAnnual;

    return {
      grossAnnual: gross,
      incomeTaxAnnual,
      netAnnual,
      netMonthly: netAnnual / 12,
      effectiveRate: gross > 0 ? incomeTaxAnnual / gross : 0,
      simplified: true,
    };
  },
};
