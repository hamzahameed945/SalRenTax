import type { TaxBracket } from '../../../calculators/core/progressiveTax';
import type { DataSource } from '../../../calculators/core/types';

// SOURCE: Consultorio Fiscal No. 874 (UNAM, Facultad de Contaduría y
//         Administración) — "Tarifa del mes de enero de 2026, para
//         efectuar los pagos provisionales mensuales... Art. 96 LISR",
//         cross-checked against multiple independent 2026 ISR-table
//         publications, all reporting identical limite/cuota-fija/tasa
//         figures for every bracket checked, and citing Anexo 8 of the
//         Resolución Miscelánea Fiscal 2026 (DOF 28-12-2025).
// YEAR: 2026 (January monthly tariff; the SAT publishes small monthly
//       inflation-indexed adjustments, so later months in 2026 will use
//       slightly different thresholds — this engine uses only the
//       January table).
// VERIFY: Re-check against the SAT's published Anexo 8 / DOF each month
//         if month-level precision matters.
export const isrSource2026: DataSource = {
  authority: 'SAT / Resolución Miscelánea Fiscal 2026, Anexo 8 (Art. 96 LISR) — vía Consultorio Fiscal UNAM',
  url: 'https://consultoriofiscal.unam.mx/docs/Cuadros%20Permanentes%202026.pdf',
  accessedDate: '2026-09-17',
  year: 2026,
};

/**
 * ISR — tarifa mensual de enero de 2026 (Art. 96 LISR), aplicable a
 * ingresos por sueldos y salarios. `calculateProgressiveTax` computes the
 * cumulative tax bracket-by-bracket, which is mathematically equivalent
 * to the official "cuota fija + % sobre excedente" method as long as the
 * bracket boundaries and marginal rates are exact (they are, per the
 * source above) — no separately-sourced "cuota fija" values are needed.
 */
export const isrMonthlyBrackets2026: TaxBracket[] = [
  { min: 0, max: 844.59, rate: 0.0192 },
  { min: 844.59, max: 7_168.51, rate: 0.064 },
  { min: 7_168.51, max: 12_598.02, rate: 0.1088 },
  { min: 12_598.02, max: 14_644.64, rate: 0.16 },
  { min: 14_644.64, max: 17_533.64, rate: 0.1792 },
  { min: 17_533.64, max: 35_362.83, rate: 0.2136 },
  { min: 35_362.83, max: 55_736.68, rate: 0.2352 },
  { min: 55_736.68, max: 106_410.5, rate: 0.3 },
  { min: 106_410.5, max: 141_880.66, rate: 0.32 },
  { min: 141_880.66, max: 425_641.99, rate: 0.34 },
  // Top bracket's lower bound follows directly from the previous
  // bracket's published upper bound; its 35% rate is independently
  // confirmed ("tasas del 1.92% al 35%") by multiple sources.
  { min: 425_641.99, max: null, rate: 0.35 },
];

// SOURCE: Ley del Seguro Social, Artículo Décimo Noveno Transitorio
//         (reforma LSS, DOF 16-12-2020) — Cesantía en Edad Avanzada y
//         Vejez, cuota obrera. This is the ONLY IMSS branch with a fixed,
//         consistently-cited employee rate across sources this session;
//         other branches (Enfermedades y Maternidad, Invalidez y Vida)
//         had conflicting total-percentage figures across sources
//         (ranging 1.65%–3.15%) and are NOT included — see
//         `otherImssBranchesIncluded: false` below and DATA-SOURCES.md.
export const imssSource2026: DataSource = {
  authority: 'Ley del Seguro Social — Art. Décimo Noveno Transitorio (Cesantía y Vejez, cuota obrera)',
  url: 'https://knowmygovt.com/mexico/imss-seguridad-social/tabla-imss/',
  accessedDate: '2026-09-17',
  year: 2026,
};

export const imss2026 = {
  /** Cesantía en Edad Avanzada y Vejez — cuota obrera, fixed regardless of salary tier. */
  cesantiaYVejezEmployeeRate: 0.01125,
  otherImssBranchesIncluded: false,
} as const;

/** UMA (Unidad de Medida y Actualización) 2026, published by INEGI, effective 1 Feb 2026. */
export const uma2026Monthly = 3_566.22;
