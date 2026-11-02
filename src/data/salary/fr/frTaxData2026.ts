// France 2026 — DRAFT, not yet committed to repo main.
// Sources: income-tax brackets 2026 (2025 income, law promulgated 19 Feb 2026, +0.9%);
// URSSAF / Agirc-Arrco 2026 rates corroborated via Legisocial + Agirc-Arrco regulation site.
// Scope: employee social contributions only. Income tax (quotient familial, annual)
// is NOT subtracted here — see FR-ENGINE-DRAFT.md scope decision.
export const FR_PSS_MONTHLY_2026 = 4005;
export const FR_PSS_ANNUAL_2026 = 48060;

export const FR_VIEILLESSE_PLAFONNEE_EMPLOYEE = 0.069;
export const FR_VIEILLESSE_DEPLAFONNEE_EMPLOYEE = 0.004;
export const FR_AGIRC_T1_EMPLOYEE = 0.0315;
export const FR_AGIRC_T2_EMPLOYEE = 0.0864;
export const FR_CEG_T1_EMPLOYEE = 0.0086;
export const FR_CEG_T2_EMPLOYEE = 0.0108;
export const FR_CET_EMPLOYEE = 0.0014;
export const FR_CSG_CRDS_BASE = 0.9825;
export const FR_CSG_CRDS_EMPLOYEE = 0.097;

export const FR_INCOME_TAX_BRACKETS_2026 = [
  { upTo: 11600, rate: 0 },
  { upTo: 29579, rate: 0.11 },
  { upTo: 84577, rate: 0.3 },
  { upTo: 181917, rate: 0.41 },
  { upTo: Infinity, rate: 0.45 },
] as const;
