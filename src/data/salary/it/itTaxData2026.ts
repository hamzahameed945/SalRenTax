// Italy 2026 — verified 2026-11-02 from multiple 2026 guides (PwC Tax Summaries,
// MEF Budget Law summary, Agenzia delle Entrate via payroll guides).
// IRPEF: Law 199/2025 (Budget Law 2026) cut the middle rate from 35% to 33%.
// Scope: employee INPS + national IRPEF only. Regional/municipal surcharges
// (vary by residence) and the employment tax credit are NOT included — see
// ITALY-RESEARCH-2026-11-02.md.
export const IT_INPS_EMPLOYEE = 0.0919;
export const IT_INPS_EXTRA_RATE = 0.01;
export const IT_INPS_EXTRA_THRESHOLD = 56224;
export const IT_INPS_CEILING = 122295;

export const IT_IRPEF_BRACKETS_2026 = [
  { upTo: 28000, rate: 0.23 },
  { upTo: 50000, rate: 0.33 },
  { upTo: Infinity, rate: 0.43 },
] as const;
