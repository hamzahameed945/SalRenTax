import type { DataSource } from '../../../calculators/core/types';

// SOURCE: Bundeskabinett, "Fünfte Mindestlohnanpassungsverordnung" (MiLoV5),
//         beschlossen 29.10.2025, verkündet im Bundesgesetzblatt am 07.11.2025.
// YEAR: 2026
// VERIFY: Re-check against the Bundesgesetzblatt before each calendar year.
export const minimumWageSource2026: DataSource = {
  authority: 'Bundesregierung — Fünfte Mindestlohnanpassungsverordnung (MiLoV5)',
  url: 'https://www.bundesregierung.de/breg-de/aktuelles/mindestlohn-faq-1688186',
  accessedDate: '2026-09-17',
  year: 2026,
};

/** Statutory minimum wage (gesetzlicher Mindestlohn), euros per hour. */
export const mindestlohn2026 = 13.9;

/** Geringfügigkeitsgrenze (minijob earnings limit): mindestlohn * 130 / 3, rounded up to full euro. */
export const geringfuegigkeitsgrenze2026 = 603;

// SOURCE: Deutsche Rentenversicherung Knappschaft-Bahn-See, "Die
//         Sozialversicherungsrechengrößen 2026" (official statutory pension
//         insurer), cross-checked against TK (Techniker Krankenkasse) and
//         lohn-info.de/taxmaro.com summaries — all agree on these rates.
// YEAR: 2026
// VERIFY: Re-check contribution rates and thresholds every January.
export const socialInsuranceSource2026: DataSource = {
  authority:
    'Deutsche Rentenversicherung Knappschaft-Bahn-See — Sozialversicherungsrechengrößen 2026',
  url: 'https://www.deutsche-rentenversicherung.de/KnappschaftBahnSee/DE/Aktuelles/Meldungen/2026/2026_01_02_Sozialversicherungsrechengroessen2026?nn=6a09839eca84ce5471c5378d',
  accessedDate: '2026-09-17',
  year: 2026,
};

/**
 * 2026 German social insurance (Sozialversicherung) rates. Each rate below is
 * the TOTAL rate; the employee (Arbeitnehmer) share is half except where
 * noted. Krankenversicherung's Zusatzbeitrag is a 2026 nationwide AVERAGE —
 * actual health-insurer-specific rates vary and are not modeled here.
 */
export const socialInsurance2026 = {
  /** Rentenversicherung (statutory pension insurance) — split 50/50. */
  pensionInsuranceRate: 0.186,
  /** Arbeitslosenversicherung (unemployment insurance) — split 50/50. */
  unemploymentInsuranceRate: 0.026,
  /** Krankenversicherung allgemeiner Beitragssatz (general health insurance rate) — split 50/50. */
  healthInsuranceGeneralRate: 0.146,
  /** Average Zusatzbeitrag (health-insurer-specific surcharge) for 2026 — split 50/50. */
  healthInsuranceAverageSupplementRate: 0.029,
  /** Pflegeversicherung (long-term care insurance), base rate for people with children — employer pays a fixed 1.7%, employee pays the remainder. */
  longTermCareInsuranceRateWithChildren: 0.036,
  /** Pflegeversicherung surcharge for childless employees over 23 (added entirely to the employee share). */
  longTermCareInsuranceChildlessSurcharge: 0.006,
  employerLongTermCareShare: 0.017,
  /** Beitragsbemessungsgrenze (contribution ceiling), Rentenversicherung/Arbeitslosenversicherung, EUR/month. */
  pensionUnemploymentCeilingMonthly: 8_450,
  /** Beitragsbemessungsgrenze, Kranken-/Pflegeversicherung, EUR/month. */
  healthCareCeilingMonthly: 5_812.5,
} as const;

/**
 * German income tax (Lohnsteuer / Einkommensteuer, § 32a EStG) is
 * INTENTIONALLY NOT implemented in this data file. The zone boundaries are
 * well corroborated (Grundfreibetrag 2026: 12,348 EUR single / 24,696 EUR
 * married; top rate 42% from 69,879 EUR; Reichensteuer 45% from 277,826 EUR),
 * but the exact quadratic-formula coefficients for the two progression
 * zones differ between the secondary sources checked this session (e.g. a
 * 12,349–17,799 EUR zone-2 boundary with one coefficient set vs. a
 * 12,349–17,005 EUR boundary with a different set), and the authoritative
 * primary source (gesetze-im-internet.de/estg/__32a.html and the BMF's
 * amtliches Lohnsteuer-Handbuch) could not be fetched this session (robots
 * disallowed / bot-check page). Per the project's data-integrity rule,
 * income tax is left in a clearly-marked unsupported state rather than
 * computed from an unverified formula — see
 * src/calculators/salary/engines/de/bruttoNetto.ts and DATA-SOURCES.md.
 */
export const einkommensteuer2026Supported = false;
