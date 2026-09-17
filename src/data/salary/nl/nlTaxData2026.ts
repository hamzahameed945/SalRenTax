import type { TaxBracket } from '../../../calculators/core/progressiveTax';
import type { DataSource } from '../../../calculators/core/types';

// SOURCE: Belastingdienst — Tarieven voor de loonbelasting 2026
// Box 1 (loon + inkomen uit werk en woning) — schijventarief 2026
// Schijf 1 (AOW-leeftijd niet bereikt): 35,82% tot €38.441
// Schijf 2: 37,48% op €38.441–€76.817
// Schijf 3 (toptarief): 49,50% boven €76.817
// NOTE: The 35.82% / 37.48% rates include both income tax AND national insurance premiums (AOW + ANW + WLZ).
// YEAR: 2026
// VERIFY: Re-check at https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffing_over_uw_inkomen/tarieven_box1/
export const nlIncomeTaxSource2026: DataSource = {
  authority: 'Belastingdienst — Tarieven loonbelasting/inkomstenbelasting box 1 2026',
  url: 'https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffing_over_uw_inkomen/tarieven_box1/',
  accessedDate: '2026-09-18',
  year: 2026,
};

/** Dutch Box 1 income tax brackets (includes national insurance premiums). */
export const nlBox1Brackets2026: TaxBracket[] = [
  { min: 0, max: 38_441, rate: 0.3582 },
  { min: 38_441, max: 76_817, rate: 0.3748 },
  { min: 76_817, max: null, rate: 0.495 },
];

/** Algemene heffingskorting (general tax credit) 2026 — reduces tax payable. Phases out above €24,812. */
export const nlAlgemeneHeffingskorting2026 = {
  maxCredit: 3_362,
  phaseOutStart: 24_812,
  phaseOutRate: 0.0629,
} as const;

/** Arbeidskorting (employment credit) 2026 — applies to employment income. */
export const nlArbeidskorting2026 = {
  maxCredit: 5_158,
} as const;
