import type { TaxBracket } from '../../../calculators/core/progressiveTax';
import type { DataSource } from '../../../calculators/core/types';

// ─── Primary source ────────────────────────────────────────────────────────
// Belastingdienst — Voorlopige aanslag 2026: tarieven en heffingskortingen
// https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen
// Verified: 2026-09-21
// Additional verification from CountryTaxCalc.com and official government sources
// YEAR: 2026

export const nlIncomeTaxSource2026: DataSource = {
  authority: 'Belastingdienst — Tarieven en heffingskortingen voorlopige aanslag 2026',
  url: 'https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen',
  accessedDate: '2026-09-21',
  year: 2026,
};

// ─── Box 1 — income + national insurance combined rates ────────────────────
// NOTE: The rates INCLUDE premies volksverzekeringen (AOW + ANW + WLZ).
// For AOW-pensioners the first-bracket rate is LOWER (17.85%) because they
// no longer pay AOW premiums. See nlBox1BracketsAOW2026 below.

/** Dutch Box 1 brackets for taxpayers BELOW AOW age (standard). */
export const nlBox1Brackets2026: TaxBracket[] = [
  { min: 0,      max: 38_883, rate: 0.3575 },   // Schijf 1 — 35.75%
  { min: 38_883, max: 78_426, rate: 0.3756 },   // Schijf 2 — 37.56%
  { min: 78_426, max: null,   rate: 0.4950 },   // Schijf 3 — 49.50% (toptarief)
];

/** Dutch Box 1 brackets for taxpayers AT or ABOVE AOW age (born on/after 1 Jan 1946).
 *  First bracket uses 17.85% (no AOW premium). */
export const nlBox1BracketsAOW2026: TaxBracket[] = [
  { min: 0,      max: 38_883, rate: 0.1785 },   // Schijf 1 — 17.85% (geen AOW)
  { min: 38_883, max: 78_426, rate: 0.3756 },   // Schijf 2 — 37.56%
  { min: 78_426, max: null,   rate: 0.4950 },   // Schijf 3 — 49.50%
];

/** Dutch Box 1 brackets for taxpayers born BEFORE 1 Jan 1946 (higher schijf-1 ceiling). */
export const nlBox1BracketsAOWPre1946_2026: TaxBracket[] = [
  { min: 0,      max: 41_123, rate: 0.1785 },   // Schijf 1 — 17.85%
  { min: 41_123, max: 78_426, rate: 0.3756 },   // Schijf 2 — 37.56%
  { min: 78_426, max: null,   rate: 0.4950 },   // Schijf 3 — 49.50%
];

// ─── Algemene heffingskorting (AHK) ───────────────────────────────────────
// Max €3.115 — flat below €29.736, phases out at 6.398% above €29.736, reaches €0 at €78.426
export const nlAlgemeneHeffingskorting2026 = {
  maxCredit:      3_115,
  flatUpTo:       29_736,
  phaseOutRate:   0.06398,   // 6.398% of (verzamelinkomen − €29.736)
  zeroAt:         78_426,
} as const;

// ─── Arbeidskorting (employment credit) ───────────────────────────────────
// SOURCE: Tabel arbeidskorting 2026 — Belastingdienst
// https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/arbeidskorting/tabel-arbeidskorting-2026
// Four-segment piecewise formula (below AOW age):
//   0 – €11.965          : 8.324%  × arbeidsinkomen
//   €11.966 – €25.845    : €996    + 31.009% × (arbeidsinkomen − €11.965)
//   €25.846 – €45.592    : €5.300  + 1.950%  × (arbeidsinkomen − €25.845)
//   €45.593 – €132.920   : €5.685  − 6.510%  × (arbeidsinkomen − €45.592)
//   > €132.920           : €0
export const nlArbeidskorting2026 = {
  maxCredit: 5_685,
  segments: [
    { from: 0,       to: 11_965,  base: 0,     rate: 0.08324,  phaseOut: false },
    { from: 11_965,  to: 25_845,  base: 996,   rate: 0.31009,  phaseOut: false },
    { from: 25_845,  to: 45_592,  base: 5_300, rate: 0.01950,  phaseOut: false },
    { from: 45_592,  to: 132_920, base: 5_685, rate: 0.06510,  phaseOut: true  },
    { from: 132_920, to: null,    base: 0,     rate: 0,        phaseOut: false },
  ],
} as const;

// AOW-age variant (half rates)
export const nlArbeidskortingAOW2026 = {
  maxCredit: 2_840,
  segments: [
    { from: 0,       to: 11_965,  base: 0,     rate: 0.04156,  phaseOut: false },
    { from: 11_965,  to: 25_845,  base: 498,   rate: 0.15483,  phaseOut: false },
    { from: 25_845,  to: 45_592,  base: 2_647, rate: 0.00974,  phaseOut: false },
    { from: 45_592,  to: 132_920, base: 2_840, rate: 0.03250,  phaseOut: true  },
    { from: 132_920, to: null,    base: 0,     rate: 0,        phaseOut: false },
  ],
} as const;

// ─── IACK — Inkomensafhankelijke combinatiekorting ─────────────────────────
// For co-parents with children under 12. Minimum labour income required: €6.239.
// Max €3.032 reached at €32.710+.
export const nlIACK2026 = {
  minIncome:   6_239,
  maxCredit:   3_032,
  phaseInRate: 0.1145,   // 11.45% of (arbeidsinkomen − €6.239)
  maxAt:       32_710,
} as const;

// ─── Ouderenkorting (pensioner's tax credit) ──────────────────────────────
// Applies to AOW-age taxpayers only.
// Max €2.067 — flat below €46.002, phases out at 15% to zero at €59.782.
export const nlOuderenkorting2026 = {
  maxCredit:    2_067,
  flatUpTo:     46_002,
  phaseOutRate: 0.15,
  zeroAt:       59_782,
} as const;

// ─── AOW state pension age ─────────────────────────────────────────────────
// In 2026 the AOW age is 67. Anyone born on or before the day that falls
// 67 years before 31 Dec 2026 is considered AOW-entitled for the full year.
export const NL_AOW_AGE_2026 = 67;

// ─── Minimum wage 2026 ────────────────────────────────────────────────────
// SOURCE: Rijksoverheid — Minimumloon per 1 januari 2026
// https://www.rijksoverheid.nl/onderwerpen/minimumloon/bedragen-minimumloon
// NOTE: Hourly minimum wage — no longer a separate wml — since July 2023.
// As of 1 Jan 2026: €14.06/hour (gross), based on 40-hour reference week.
export const nlMinimumloon2026 = {
  hourlyGross:   14.06,
  weeklyHours:   40,
  monthlyGross:  2_449.44,  // €14.06 × 40 × 52/12 (approx, official: 4⅓ week/month)
  annualGross:   29_393.28, // €14.06 × 40 × 52
  year:          2026,
} as const;

// ─── Holiday allowance (vakantiegeld) ─────────────────────────────────────
// Statutory minimum: 8% of annual gross (Wet minimumloon en minimumvakantiebijslag).
export const NL_VAKANTIEGELD_RATE = 0.08;

// ─── 30% ruling (expat ruling) ────────────────────────────────────────────
// Valid through 2026 at 30% tax-free allowance.
// Salary threshold (excl. holiday pay) for 2026: €48.013 (general), €36.497 (under-30 master's).
// From 2027 it drops to 27%.
export const nlDertigProcentRegeling2026 = {
  rate:             0.30,     // 30% of salary is tax-free allowance
  salaryThreshold:  48_013,
  youngThreshold:   36_497,   // Under 30 with qualifying MSc degree
} as const;

// ─── ZZP tax data ─────────────────────────────────────────────────────────
// Zelfstandigenaftrek 2026: €2.470
// MKB-winstvrijstelling 2026: 13.31% of profit after zelfstandigenaftrek
// SOURCE: Belastingdienst — Zelfstandigenaftrek
// https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/zelfstandigenaftrek/
export const nlZZPData2026 = {
  zelfstandigenaftrek:    2_470,
  mkbWinstvrijstelling:   0.1331,  // 13.31%
  startersaftrek:         2_123,   // Extra deduction for starters (first 3 years)
} as const;
