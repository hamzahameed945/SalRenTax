import type { DataSource } from '../../../calculators/core/types';

// ─── Sources ────────────────────────────────────────────────────────────────
export const minimumWageSource2026: DataSource = {
  authority: 'Bundesregierung — Fünfte Mindestlohnanpassungsverordnung (MiLoV5)',
  url: 'https://www.bundesregierung.de/breg-de/aktuelles/mindestlohn-faq-1688186',
  accessedDate: '2026-09-21',
  year: 2026,
};

export const socialInsuranceSource2026: DataSource = {
  authority: 'BARMER — Sozialversicherungswerte 2026 / Beitragsbemessungsgrenzen',
  url: 'https://www.barmer.de/firmenkunden/sozialversicherung/aenderungen-2026/sozialversicherungswerte-2026-1239210',
  accessedDate: '2026-09-21',
  year: 2026,
};

export const incomeTaxSource2026: DataSource = {
  authority: 'dejure.org — § 32a EStG Einkommensteuertarif 2026 (Steuerfortentwicklungsgesetz v. 23.12.2024)',
  url: 'https://dejure.org/gesetze/EStG/32a.html',
  accessedDate: '2026-09-21',
  year: 2026,
};

// ─── Mindestlohn ────────────────────────────────────────────────────────────
/** Gesetzlicher Mindestlohn 2026, EUR/Stunde (MiLoV5). */
export const mindestlohn2026 = 13.90;

/** Geringfügigkeitsgrenze (Minijob) 2026: 13.90 × 130/3 ≈ 603 EUR/Monat. */
export const geringfuegigkeitsgrenze2026 = 603;

/** Midijob-Obergrenze 2026. */
export const midijobObergrenze2026 = 2_000;

// ─── Sozialversicherung 2026 ────────────────────────────────────────────────
// Source: BARMER Sozialversicherungswerte 2026 (accessed 2026-09-21)
export const socialInsurance2026 = {
  /** Rentenversicherung (RV) — 50/50 split. */
  pensionInsuranceRate: 0.186,
  /** Arbeitslosenversicherung (AlV) — 50/50 split. */
  unemploymentInsuranceRate: 0.026,
  /** GKV allgemeiner Beitragssatz — 50/50 split. */
  healthInsuranceGeneralRate: 0.146,
  /** Durchschnittlicher Zusatzbeitrag 2026 — 50/50 split (varies by Krankenkasse). */
  healthInsuranceAverageSupplementRate: 0.029,
  /** PV Gesamtbeitragssatz (Eltern mit mind. 1 Kind). */
  longTermCareInsuranceRateWithChildren: 0.034,
  /** Kinderlosenzuschlag — allein vom Arbeitnehmer getragen. */
  longTermCareInsuranceChildlessSurcharge: 0.006,
  /** Arbeitgeberanteil PV (fest). */
  employerLongTermCareShare: 0.017,
  /** PV Sachsen: AN-Anteil base (Arbeitnehmer zahlt mehr). */
  longTermCareInsuranceSaxonyEmployeeExtra: 0.005,
  /** BBG RV/AlV EUR/Monat. */
  pensionUnemploymentCeilingMonthly: 8_450,
  /** BBG KV/PV EUR/Monat. */
  healthCareCeilingMonthly: 5_812.50,
} as const;

/**
 * Pflegeversicherung AN-Anteil 2026 nach Kinderzahl.
 * Basis: PV-Gesamtbeitrag 3.4%, AG-Anteil fix 1.7%.
 * AN-Anteil Basisrate (1 Kind oder bei Arbeitgeberwechsel ohne Nachweis) = 1.7%.
 * Kinderlosenzuschlag +0.6% → kinderlos AN = 2.3%.
 * Abschlag je weiterem Kind unter 25: -0.25% (max 4 Abschläge, ab 2. Kind).
 * Source: lohndialog.de / vdek.com / PUEG 2023 (accessed 2026-09-21).
 */
export const pflegeversicherungAN2026 = {
  kinderlos:       0.023,   // 0 Kinder (über 23 Jahre)
  einKind:         0.017,   // 1 Kind
  zweiKinder:      0.0145,  // 2 Kinder unter 25
  dreiKinder:      0.012,   // 3 Kinder unter 25
  vierKinder:      0.0095,  // 4 Kinder unter 25
  fuenfPlusKinder: 0.007,   // 5+ Kinder unter 25
} as const;

/** PV AN-Anteil für Sachsen (Arbeitnehmer trägt 0.5% mehr). */
export const pflegeversicherungANSachsen2026 = {
  kinderlos:       0.028,
  einKind:         0.022,
  zweiKinder:      0.0195,
  dreiKinder:      0.017,
  vierKinder:      0.0145,
  fuenfPlusKinder: 0.012,
} as const;

// ─── Lohnsteuer / Einkommensteuer 2026 (§ 32a EStG) ────────────────────────
// Source: dejure.org § 32a EStG (Steuerfortentwicklungsgesetz v. 23.12.2024)
// Confirmed by: finanz-tools.de/einkommensteuer/berechnung-formeln/2026
//
// Zone 1: zvE ≤ 12.348 → ESt = 0
// Zone 2: 12.349–17.799 → y = (zvE − 12348)/10000; ESt = (914.51·y + 1400)·y
// Zone 3: 17.800–69.878 → z = (zvE − 17799)/10000; ESt = (173.10·z + 2397)·z + 1034.87
// Zone 4: 69.879–277.825 → ESt = 0.42·x − 11135.63
// Zone 5: ≥ 277.826 → ESt = 0.45·x − 19470.38
export const einkommensteuer2026 = {
  grundfreibetrag:    12_348,    // Single; ×2 for joint (Splitting)
  zone2From:          12_349,
  zone2To:            17_799,
  zone2CoeffA:        914.51,
  zone2CoeffB:        1_400,
  zone3From:          17_800,
  zone3To:            69_878,
  zone3CoeffA:        173.10,
  zone3CoeffB:        2_397,
  zone3Constant:      1_034.87,
  zone4From:          69_879,
  zone4To:            277_825,
  zone4Rate:          0.42,
  zone4Deduction:     11_135.63,
  zone5From:          277_826,
  zone5Rate:          0.45,
  zone5Deduction:     19_470.38,
} as const;

// ─── Solidaritätszuschlag 2026 ──────────────────────────────────────────────
// Source: Steuerfortentwicklungsgesetz (SteFeG) v. 23.12.2024;
//         wp-westerfelhaus.de (accessed 2026-09-21)
// Freigrenze (Jahresgrenze für tarifliche ESt):
//   Single: 20.350 EUR, Zusammenveranlagte: 40.700 EUR
// Milderungszone: Soli = 11.9% × (ESt − Freigrenze), bis Soli = 5.5% × ESt
// Spitzensatz: 5.5% der tariflichen ESt
export const solidaritaetszuschlag2026 = {
  rate:                    0.055,
  freigrenzeSingle:        20_350,
  freigrenzeSplitting:     40_700,
  milderungsRate:          0.119,   // 11.9% of (ESt − Freigrenze) in Milderungszone
} as const;

// ─── Kirchensteuer 2026 ─────────────────────────────────────────────────────
// Bayern: 8% der Lohnsteuer; alle anderen Bundesländer: 9%
export const kirchensteuer2026 = {
  rateBayern:   0.08,
  rateOther:    0.09,
} as const;

// ─── Steuerklassen & Pauschbeträge 2026 ────────────────────────────────────
// Source: haufe.de — Lohnsteuererhebung Frei- und Pauschbeträge 2026
// Arbeitnehmer-Pauschbetrag (Werbungskostenpauschale): 1.230 EUR
// Sonderausgaben-Pauschbetrag: 36 EUR (single) / 72 EUR (joint)
// Entlastungsbetrag Alleinerziehende (SK II): 4.260 EUR + 240 EUR/weiteres Kind
export const lohnsteuerPauschbetraege2026 = {
  arbeitnehmerPauschbetrag:     1_230,
  sonderausgabenPauschSingle:   36,
  sonderausgabenPauschJoint:    72,
  entlastungsbetragSK2:         4_260,
  entlastungsbetragSK2PerKind:  240,
  kinderfreibetragProKind:      6_828,   // beide Eltern zusammen; SK I/II: die Hälfte
  bea:                          2_928,   // Betreuungs-/Erziehungs-/Ausbildungsfreibetrag (beide)
} as const;

/**
 * Steuerklassen I–VI: welche Freibeträge/Modifikationen gelten.
 *
 * SK I  – Ledig/verwitwet/geschieden/dauernd getrennt: Grundtarif
 * SK II – Alleinerziehend: Grundtarif + Entlastungsbetrag
 * SK III – Verheiratet, Alleinverdiener oder Besserverdiener: Splitting-äquivalent
 * SK IV – Verheiratet, ähnliche Gehälter (beide Grundtarif)
 * SK V  – Verheiratet, Geringverdiener (kein Grundfreibetrag)
 * SK VI – Zweiter Job: kein Grundfreibetrag, kein AN-Pauschbetrag
 */
export const steuerklassen2026 = {
  I:   { splitting: false, grundfreibetrag: true,  anPausch: true,  entlastung: false, faktor: 1 },
  II:  { splitting: false, grundfreibetrag: true,  anPausch: true,  entlastung: true,  faktor: 1 },
  III: { splitting: true,  grundfreibetrag: true,  anPausch: true,  entlastung: false, faktor: 1 },
  IV:  { splitting: false, grundfreibetrag: true,  anPausch: true,  entlastung: false, faktor: 1 },
  V:   { splitting: false, grundfreibetrag: false, anPausch: false, entlastung: false, faktor: 1 },
  VI:  { splitting: false, grundfreibetrag: false, anPausch: false, entlastung: false, faktor: 1 },
} as const;

export type Steuerklasse = keyof typeof steuerklassen2026;

export const einkommensteuer2026Supported = true; // now implemented
