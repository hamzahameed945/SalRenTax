import type { TaxBracket } from '../../../calculators/core/progressiveTax';
import type { DataSource } from '../../../calculators/core/types';

// SOURCE: Agencia Tributaria (AEAT) — escala general estatal del IRPF,
//         cross-checked against multiple independent tax-guide summaries
//         (all agreeing on the same thresholds and state-only rates).
// YEAR: 2026 (Renta 2025 campaign figures, unchanged for the state scale)
// VERIFY: Re-check against the AEAT's published "Algoritmo de cálculo del
//         tipo de retención" before each tax year.
export const irpfSource2026: DataSource = {
  authority: 'Agencia Tributaria (AEAT) — Escala general estatal del IRPF',
  url: 'https://sede.agenciatributaria.gob.es/Sede/Retenciones.shtml',
  accessedDate: '2026-09-17',
  year: 2026,
};

/**
 * 2026 IRPF — STATE PORTION ONLY (escala general estatal). Spain's total
 * IRPF is state + autonomous-community scale, and the community scale
 * varies across Spain's 17 regions plus Ceuta/Melilla. This engine
 * deliberately implements only the well-corroborated, nationwide state
 * scale — the same simplification already used for US federal-only tax
 * (no state tax) in this project. A full 17-region implementation would
 * require verifying each community's scale separately; not done here.
 */
export const irpfStateBrackets2026: TaxBracket[] = [
  { min: 0, max: 12_450, rate: 0.095 },
  { min: 12_450, max: 20_200, rate: 0.12 },
  { min: 20_200, max: 35_200, rate: 0.15 },
  { min: 35_200, max: 60_000, rate: 0.185 },
  { min: 60_000, max: 300_000, rate: 0.225 },
  { min: 300_000, max: null, rate: 0.245 },
];

/**
 * Mínimo personal (general personal allowance), applied as a simplified
 * approximation of the base liquidable before applying the scale above.
 * The real Spanish mechanism (deducción en cuota rather than a simple
 * subtraction from the base) is more complex; this is a commonly used
 * simplification, not the exact legal computation.
 */
export const minimoPersonal2026 = 5_550;

// SOURCE: BOE (Boletín Oficial del Estado) — Orden PJC/297/2026, de 30 de
//         marzo, por la que se desarrollan las normas legales de
//         cotización a la Seguridad Social para el ejercicio 2026.
// YEAR: 2026
// VERIFY: Re-check the Orden de Cotización every year (usually published
//         Q1) before relying on these rates.
export const seguridadSocialSource2026: DataSource = {
  authority: 'Boletín Oficial del Estado — Orden PJC/297/2026 (cotización Seguridad Social)',
  url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-7296',
  accessedDate: '2026-09-17',
  year: 2026,
};

/**
 * 2026 Seguridad Social employee (trabajador) contribution rates, Régimen
 * General, contrato indefinido. Only the three components independently
 * confirmed this session are included; Formación Profesional's exact
 * employee-share split for 2026 was not independently confirmed and is
 * NOT included, so this total is a slight underestimate of the real
 * deduction (historically ~0.10% of base).
 */
export const seguridadSocial2026 = {
  contingenciasComunesEmployeeRate: 0.047,
  desempleoEmployeeRate: 0.0155,
  meiEmployeeRate: 0.0015,
  /** Base máxima de cotización, EUR/month. */
  baseMaximaCotizacionMonthly: 5_101.2,
  /** Formación Profesional employee share is NOT included — see note above. */
  formacionProfesionalIncluded: false,
} as const;
