import type { TaxBracket } from '../../../calculators/core/progressiveTax';
import type { DataSource } from '../../../calculators/core/types';

// ─── Sources ────────────────────────────────────────────────────────────────
export const isrSource2026: DataSource = {
  authority: 'SAT — Resolución Miscelánea Fiscal 2026, Anexo 8 (Art. 96 y 152 LISR), DOF 28-12-2025',
  url: 'https://consisa.com.mx/tablas-isr',
  accessedDate: '2026-09-21',
  year: 2026,
};

export const imssSource2026: DataSource = {
  authority: 'Ley del Seguro Social — Cuotas obrero-patronales 2026 (FiscalTools MX / SDV Asesores)',
  url: 'https://fiscaltools.mx/blog/cuotas-imss-2026',
  accessedDate: '2026-09-21',
  year: 2026,
};

export const subsidioSource2026: DataSource = {
  authority: 'DOF 31-12-2025 — Decreto subsidio para el empleo 2026 (ContadorMX)',
  url: 'https://contadormx.com/tabla-de-subsidio-al-empleo-2026/',
  accessedDate: '2026-09-21',
  year: 2026,
};

// ─── UMA y salario mínimo 2026 ───────────────────────────────────────────────
// SOURCE: INEGI UMA vigente 1-feb-2026; CONASAMI salario mínimo general 2026
/** UMA diaria 2026 (vigente 1-feb-2026). */
export const umaDaily2026    = 117.31;
/** UMA mensual 2026. */
export const umaMonthly2026  = 3_566.22;
/** UMA anual 2026. */
export const umaAnnual2026   = 42_794.64;

/** Salario mínimo general diario 2026 (CONASAMI, DOF 09-dic-2025). */
export const salarioMinimoGeneral2026 = 315.04;
/** Salario mínimo Zona Libre de la Frontera Norte 2026. */
export const salarioMinimoFrontera2026 = 440.87;

// ─── ISR — tarifa mensual 2026 (Art. 96 LISR) ────────────────────────────────
// SOURCE: SAT RMF 2026 Anexo 8, DOF 28-12-2025, confirmed by consisa.com.mx
// Rates 1.92% – 35%, inflation-adjusted 13.21% vs 2023 tariff.
export const isrMonthlyBrackets2026: TaxBracket[] = [
  { min: 0,          max: 844.59,     rate: 0.0192 },
  { min: 844.59,     max: 7_168.51,   rate: 0.064  },
  { min: 7_168.51,   max: 12_598.02,  rate: 0.1088 },
  { min: 12_598.02,  max: 14_644.64,  rate: 0.16   },
  { min: 14_644.64,  max: 17_533.64,  rate: 0.1792 },
  { min: 17_533.64,  max: 35_362.83,  rate: 0.2136 },
  { min: 35_362.83,  max: 55_736.68,  rate: 0.2352 },
  { min: 55_736.68,  max: 106_410.50, rate: 0.30   },
  { min: 106_410.50, max: 141_880.66, rate: 0.32   },
  { min: 141_880.66, max: 425_641.99, rate: 0.34   },
  { min: 425_641.99, max: null,       rate: 0.35   },
];

// ─── Subsidio para el empleo 2026 ────────────────────────────────────────────
// SOURCE: DOF 31-12-2025 — Decreto por el que se modifica el diverso que
// otorga el subsidio para el empleo.
// Enero 2026 transitorio: 15.59% × UMA 2025 = $536.21
// Feb–Dic 2026 definitivo: 15.02% × UMA 2026 ($3,566.22) = $535.65
// Límite de ingreso mensual: $11,492.66
// Desde 2024: cuota fija mensual (no tabla por rangos), se acredita contra ISR.
// Si subsidio > ISR → el patrón ENTREGA la diferencia al trabajador.
export const subsidioEmpleo2026 = {
  montoCuotaFija:     535.65,     // Feb–Dic 2026 (definitivo)
  montoCuotaEnero:    536.21,     // Enero 2026 (transitorio)
  limiteIngreso:      11_492.66,  // Tope mensual de ingreso para aplicar
} as const;

// ─── IMSS — cuotas obrero-patronales 2026 ────────────────────────────────────
// SOURCE: FiscalTools MX (fiscaltools.mx/blog/cuotas-imss-2026), accessed 2026-09-21
// Cross-checked against SDV Asesores (sdv.com.mx/recursos/tablas-imss-2026/)
//
// Base: Salario Base de Cotización (SBC) mensual.
// Tope SBC: 25 × UMA diaria × 30.4 días ≈ 89,173 MXN/mes.
// La cuota fija de EM se calcula sobre la UMA mensual, no sobre el SBC.
// El excedente de EM aplica sólo cuando SBC > 3 × UMA mensual.
export const imss2026 = {
  // ── Enfermedades y Maternidad (EM) ────────────────────────────────────
  /** Cuota fija patrón: 20.40% × UMA mensual. Employee = $0 on this portion. */
  emCuotaFijaPatronRate:      0.2040,   // sobre UMA mensual — sólo patrón
  /** Excedente sobre 3 UMAs: patrón 1.10%, trabajador 0.40%. */
  emExcedentePatronRate:      0.0110,
  emExcedenteOberoRate:       0.0040,   // trabajador
  emExcedenteBase:            3,        // múltiplo de UMA mensual para el excedente
  /** Prestaciones en dinero: patrón 0.70%, trabajador 0.25%. */
  emPrestacionesDineroPatron: 0.0070,
  emPrestacionesDineroObrero: 0.0025,   // trabajador

  // ── Invalidez y Vida (IV) ──────────────────────────────────────────────
  ivPatronRate:   0.00625,
  ivObreroRate:   0.00125,   // trabajador

  // ── Guarderías y Prestaciones Sociales (GPS) ───────────────────────────
  gpsPatronRate:  0.0100,    // sólo patrón

  // ── Retiro (SAR / AFORE) ───────────────────────────────────────────────
  retiroPatronRate: 0.0200,  // sólo patrón

  // ── Cesantía en Edad Avanzada y Vejez (CyV) ────────────────────────────
  // Cuota obrera: 1.125% (fija desde reforma LSS DOF 16-12-2020).
  // Cuota patronal: escalonada (3.150% para salario mínimo → menor porcentaje
  // para salarios superiores, con tablas por rangos). Aquí usamos 3.150%
  // como aproximación para la mayoría de los trabajadores.
  cyvObreroRate:  0.01125,
  cyvPatronRate:  0.0315,    // promedio; varía por rango salarial vs SM

  // ── INFONAVIT ──────────────────────────────────────────────────────────
  infonavitPatronRate: 0.0500,  // sólo patrón

  // ── Riesgos de Trabajo (RT) ────────────────────────────────────────────
  /** Prima media de siniestralidad (0.50% clase I). Varía por empresa. */
  rtPatronRateDefault: 0.0050,

  // ── Tope SBC ──────────────────────────────────────────────────────────
  /** Tope máximo SBC diario: 25 × UMA diaria. */
  sbcTopeDiario:    25 * umaDaily2026,        // $2,932.75
  sbcTopeMensual:   25 * umaDaily2026 * 30.4, // ≈ $89,155.60
} as const;

// ─── Prima de antigüedad — tope salarial ────────────────────────────────────
// Art. 162 LFT: el salario diario para prima de antigüedad no puede exceder
// el doble del salario mínimo general.
/** 2 × salario mínimo general diario 2026. */
export const primaAntiguedadTopeDiario2026 = 2 * salarioMinimoGeneral2026; // $630.08

// ─── LFT Art. 76 — tabla de días de vacaciones (reforma 2023) ────────────────
// Vigente desde 1-ene-2023. Mínimos por año de servicio:
// Año 1: 12 días, Año 2: 14, Año 3: 16, Año 4: 18, Año 5: 20
// Años 6–10: +2 días cada 5 años. Años 11+: +2 días cada 5 años.
export const diasVacacionesPorAno2026: Record<number, number> = {
  1: 12, 2: 14, 3: 16, 4: 18, 5: 20,
  6: 22, 7: 22, 8: 22, 9: 22, 10: 22,
  11: 24, 12: 24, 13: 24, 14: 24, 15: 24,
  16: 26, 17: 26, 18: 26, 19: 26, 20: 26,
};

/** Returns statutory minimum vacation days for given complete years worked (LFT Art. 76, 2023). */
export function vacacionesMinimas(anosCompletos: number): number {
  if (anosCompletos <= 0) return 0;
  if (anosCompletos <= 20) return diasVacacionesPorAno2026[anosCompletos] ?? 26;
  // After 20 years: 26 + 2 days per additional 5-year block
  const extra = Math.floor((anosCompletos - 20) / 5) * 2;
  return 26 + extra;
}
