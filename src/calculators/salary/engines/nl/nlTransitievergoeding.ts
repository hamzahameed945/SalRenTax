import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { roundToCents } from '../../../core/math';

/**
 * Wettelijk maximum transitievergoeding 2026: €102.000 bruto (bron: art. 7:673 BW,
 * jaarlijks geïndexeerd; 2025: €98.000). Is het bruto jaarsalaris hoger, dan geldt
 * dat jaarsalaris als maximum.
 */
export const NL_TRANSITIEVERGOEDING_MAX_2026 = 102000;

// ─── Types ─────────────────────────────────────────────────────────────────

export interface NlTransitievergoedingInput {
  /**
   * Gross monthly salary in EUR — should include vakantiegeld and other
   * fixed/variable wage components (Besluit loonbegrip transitievergoeding),
   * not just the base salary.
   */
  brutoMaandsalaris: number;
  /** Full years of employment (integer). */
  dienstjaren: number;
  /** Extra months of employment beyond full years (0–11). */
  dienstmaandenExtra?: number;
}

export interface NlTransitievergoedingResult {
  /** Gross monthly salary used (incl. components as entered). */
  brutoMaandsalaris: number;
  /** Employment length in decimal years, e.g. 6.5. */
  dienstverbandJaren: number;
  /** Raw entitlement before applying the cap: maandsalaris / 3 x dienstverbandJaren. */
  onafgerondeVergoeding: number;
  /** Applicable cap: max(NL_TRANSITIEVERGOEDING_MAX_2026, gross annual salary). */
  maxBedrag: number;
  /** Gross annual salary (12 x maandsalaris), used as the alternative cap. */
  brutoJaarsalaris: number;
  /** True when the raw entitlement exceeded the cap. */
  capped: boolean;
  /** Final gross transition payment after applying the cap. */
  brutoVergoeding: number;
}

// ─── Engine ────────────────────────────────────────────────────────────────

export const transitievergoedingEngine: CalculatorEngine<
  NlTransitievergoedingInput,
  NlTransitievergoedingResult,
  never
> = {
  validate(input: NlTransitievergoedingInput): ValidationResult<NlTransitievergoedingInput> {
    const errors: Partial<Record<keyof NlTransitievergoedingInput, string>> = {};

    if (
      input.brutoMaandsalaris === undefined ||
      Number.isNaN(input.brutoMaandsalaris) ||
      input.brutoMaandsalaris <= 0
    ) {
      errors.brutoMaandsalaris = 'errors.mustBePositive';
    }

    if (
      input.dienstjaren === undefined ||
      Number.isNaN(input.dienstjaren) ||
      !Number.isInteger(input.dienstjaren) ||
      input.dienstjaren < 0
    ) {
      errors.dienstjaren = 'errors.invalidNumber';
    }

    const extraMaanden = input.dienstmaandenExtra ?? 0;
    if (
      Number.isNaN(extraMaanden) ||
      !Number.isInteger(extraMaanden) ||
      extraMaanden < 0 ||
      extraMaanden > 11
    ) {
      errors.dienstmaandenExtra = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: NlTransitievergoedingInput): NlTransitievergoedingResult {
    const { brutoMaandsalaris, dienstjaren } = input;
    const dienstmaandenExtra = input.dienstmaandenExtra ?? 0;

    const dienstverbandJaren = dienstjaren + dienstmaandenExtra / 12;
    const onafgerondeVergoeding = (brutoMaandsalaris / 3) * dienstverbandJaren;

    const brutoJaarsalaris = brutoMaandsalaris * 12;
    const maxBedrag = Math.max(NL_TRANSITIEVERGOEDING_MAX_2026, brutoJaarsalaris);
    const capped = onafgerondeVergoeding > maxBedrag;

    return {
      brutoMaandsalaris: roundToCents(brutoMaandsalaris),
      dienstverbandJaren: Math.round(dienstverbandJaren * 100) / 100,
      onafgerondeVergoeding: roundToCents(onafgerondeVergoeding),
      maxBedrag: roundToCents(maxBedrag),
      brutoJaarsalaris: roundToCents(brutoJaarsalaris),
      capped,
      brutoVergoeding: roundToCents(Math.min(onafgerondeVergoeding, maxBedrag)),
    };
  },
};
