import type { TaxBracket } from '../../../calculators/core/progressiveTax';
import type { DataSource } from '../../../calculators/core/types';

// ─── Sources ────────────────────────────────────────────────────────────────
export const irpfSource2026: DataSource = {
  authority: 'AEAT — Escala general estatal del IRPF 2026 + escalas autonómicas (calculadorarenta.es)',
  url: 'https://calculadorarenta.es/tramos-irpf-por-comunidad/',
  accessedDate: '2026-09-21',
  year: 2026,
};

export const ssSource2026: DataSource = {
  authority: 'BOE — Orden PJC/297/2026 de 30 de marzo (cotización SS 2026)',
  url: 'https://www.iberley.es/noticias/publicada-orden-cotizacion-seguridad-social-2026-36277',
  accessedDate: '2026-09-21',
  year: 2026,
};

// ─── SMI 2026 ────────────────────────────────────────────────────────────────
// SOURCE: Real Decreto 126/2026 de 18 de febrero (asepeyo.es / lamoncloa.gob.es)
/** Salario Mínimo Interprofesional mensual 2026 (14 pagas). */
export const smi2026Monthly  = 1_221;
export const smi2026Annual14 = 17_094; // 14 × 1,221

// ─── Seguridad Social — Régimen General 2026 ─────────────────────────────────
// SOURCE: Orden PJC/297/2026, BOE 31-mar-2026
// Base máxima: 5,101.20 €/mes (payfit.com / cuatrecasas.com — verified 2026-09-21)
export const seguridadSocial2026 = {
  /** Contingencias comunes — cuota trabajador. */
  contingenciasComunesEmployeeRate:  0.0470,
  /** Desempleo — cuota trabajador. */
  desempleoEmployeeRate:             0.0155,
  /** MEI (Mecanismo de Equidad Intergeneracional). */
  meiEmployeeRate:                   0.0015,
  /** Formación Profesional — cuota trabajador (~0.10%). */
  formacionProfesionalEmployeeRate:  0.0010,
  /** Base máxima de cotización mensual 2026 (€/mes). */
  baseMaximaCotizacionMonthly:       5_101.20,
  /** Base mínima general (grupo 7 y ss.) = SMI mensual. */
  baseMinimaCotizacionMonthly:       1_260,   // Orden PJC/297/2026 grupo 7
} as const;

/** Total employee SS rate (contingencias + desempleo + MEI + FP). */
export const totalSSEmployeeRate =
  seguridadSocial2026.contingenciasComunesEmployeeRate +
  seguridadSocial2026.desempleoEmployeeRate +
  seguridadSocial2026.meiEmployeeRate +
  seguridadSocial2026.formacionProfesionalEmployeeRate;  // 0.0650

// ─── IRPF — Escala estatal 2026 ──────────────────────────────────────────────
// SOURCE: AEAT (confirmed by calculadorarenta.es 2026-09-21)
export const irpfStateBrackets2026: TaxBracket[] = [
  { min: 0,        max: 12_450,   rate: 0.095 },
  { min: 12_450,   max: 20_200,   rate: 0.12  },
  { min: 20_200,   max: 35_200,   rate: 0.15  },
  { min: 35_200,   max: 60_000,   rate: 0.185 },
  { min: 60_000,   max: 300_000,  rate: 0.225 },
  { min: 300_000,  max: null,     rate: 0.245 },
];

// ─── IRPF — Escalas autonómicas 2026 ─────────────────────────────────────────
// SOURCE: calculadorarenta.es/tramos-irpf-por-comunidad/ (accessed 2026-09-21)
// Note: País Vasco and Navarra use Concierto/Convenio Económico (foral systems) —
// their IRPF rules differ fundamentally and are NOT modeled here.
export type ComunidadAutonoma =
  | 'andalucia' | 'aragon' | 'asturias' | 'baleares' | 'canarias'
  | 'cantabria' | 'castillalamancha' | 'castillayleon' | 'cataluna'
  | 'extremadura' | 'galicia' | 'madrid' | 'murcia' | 'larioja' | 'valencia';

export const irpfRegionalBrackets2026: Record<ComunidadAutonoma, TaxBracket[]> = {
  andalucia: [
    { min: 0,        max: 12_450,  rate: 0.095 },
    { min: 12_450,   max: 20_200,  rate: 0.12  },
    { min: 20_200,   max: 28_000,  rate: 0.15  },
    { min: 28_000,   max: 35_200,  rate: 0.155 },
    { min: 35_200,   max: 50_000,  rate: 0.175 },
    { min: 50_000,   max: 60_000,  rate: 0.185 },
    { min: 60_000,   max: 120_000, rate: 0.228 },
    { min: 120_000,  max: null,    rate: 0.245 },
  ],
  aragon: [
    { min: 0,        max: 12_450,  rate: 0.10  },
    { min: 12_450,   max: 20_200,  rate: 0.125 },
    { min: 20_200,   max: 34_000,  rate: 0.155 },
    { min: 34_000,   max: 50_000,  rate: 0.19  },
    { min: 50_000,   max: 60_000,  rate: 0.21  },
    { min: 60_000,   max: 70_000,  rate: 0.225 },
    { min: 70_000,   max: 90_000,  rate: 0.235 },
    { min: 90_000,   max: 130_000, rate: 0.245 },
    { min: 130_000,  max: 150_000, rate: 0.25  },
    { min: 150_000,  max: null,    rate: 0.255 },
  ],
  asturias: [
    { min: 0,        max: 12_450,  rate: 0.10  },
    { min: 12_450,   max: 17_707,  rate: 0.12  },
    { min: 17_707,   max: 33_007,  rate: 0.14  },
    { min: 33_007,   max: 53_407,  rate: 0.188 },
    { min: 53_407,   max: 70_000,  rate: 0.213 },
    { min: 70_000,   max: 90_000,  rate: 0.225 },
    { min: 90_000,   max: 175_000, rate: 0.25  },
    { min: 175_000,  max: null,    rate: 0.255 },
  ],
  baleares: [
    { min: 0,        max: 10_000,  rate: 0.095 },
    { min: 10_000,   max: 18_000,  rate: 0.118 },
    { min: 18_000,   max: 30_000,  rate: 0.148 },
    { min: 30_000,   max: 48_000,  rate: 0.175 },
    { min: 48_000,   max: 70_000,  rate: 0.19  },
    { min: 70_000,   max: 90_000,  rate: 0.225 },
    { min: 90_000,   max: 175_000, rate: 0.235 },
    { min: 175_000,  max: null,    rate: 0.245 },
  ],
  canarias: [
    { min: 0,        max: 12_450,  rate: 0.09  },
    { min: 12_450,   max: 17_707,  rate: 0.115 },
    { min: 17_707,   max: 33_007,  rate: 0.14  },
    { min: 33_007,   max: 53_407,  rate: 0.185 },
    { min: 53_407,   max: 90_000,  rate: 0.235 },
    { min: 90_000,   max: 120_000, rate: 0.245 },
    { min: 120_000,  max: null,    rate: 0.26  },
  ],
  cantabria: [
    { min: 0,        max: 12_450,  rate: 0.095 },
    { min: 12_450,   max: 20_200,  rate: 0.12  },
    { min: 20_200,   max: 35_200,  rate: 0.15  },
    { min: 35_200,   max: 46_000,  rate: 0.175 },
    { min: 46_000,   max: 60_000,  rate: 0.19  },
    { min: 60_000,   max: 90_000,  rate: 0.22  },
    { min: 90_000,   max: 150_000, rate: 0.235 },
    { min: 150_000,  max: null,    rate: 0.255 },
  ],
  castillalamancha: [
    { min: 0,        max: 12_450,  rate: 0.095 },
    { min: 12_450,   max: 20_200,  rate: 0.12  },
    { min: 20_200,   max: 35_200,  rate: 0.15  },
    { min: 35_200,   max: 60_000,  rate: 0.185 },
    { min: 60_000,   max: null,    rate: 0.225 },
  ],
  castillayleon: [
    { min: 0,        max: 12_450,  rate: 0.09  },
    { min: 12_450,   max: 20_200,  rate: 0.12  },
    { min: 20_200,   max: 35_200,  rate: 0.14  },
    { min: 35_200,   max: 53_407,  rate: 0.175 },
    { min: 53_407,   max: null,    rate: 0.215 },
  ],
  cataluna: [
    { min: 0,        max: 12_450,  rate: 0.105 },
    { min: 12_450,   max: 17_707,  rate: 0.12  },
    { min: 17_707,   max: 33_007,  rate: 0.148 },
    { min: 33_007,   max: 53_407,  rate: 0.17  },
    { min: 53_407,   max: 90_000,  rate: 0.208 },
    { min: 90_000,   max: 120_000, rate: 0.218 },
    { min: 120_000,  max: 175_000, rate: 0.235 },
    { min: 175_000,  max: null,    rate: 0.255 },
  ],
  extremadura: [
    { min: 0,        max: 12_450,  rate: 0.095 },
    { min: 12_450,   max: 20_200,  rate: 0.12  },
    { min: 20_200,   max: 24_000,  rate: 0.145 },
    { min: 24_000,   max: 35_200,  rate: 0.165 },
    { min: 35_200,   max: 60_000,  rate: 0.20  },
    { min: 60_000,   max: 80_000,  rate: 0.23  },
    { min: 80_000,   max: 100_000, rate: 0.245 },
    { min: 100_000,  max: 120_000, rate: 0.25  },
    { min: 120_000,  max: null,    rate: 0.255 },
  ],
  galicia: [
    { min: 0,        max: 12_450,  rate: 0.095 },
    { min: 12_450,   max: 20_200,  rate: 0.118 },
    { min: 20_200,   max: 35_200,  rate: 0.148 },
    { min: 35_200,   max: 60_000,  rate: 0.185 },
    { min: 60_000,   max: null,    rate: 0.225 },
  ],
  madrid: [
    { min: 0,        max: 12_450,  rate: 0.085 },
    { min: 12_450,   max: 17_707,  rate: 0.108 },
    { min: 17_707,   max: 33_007,  rate: 0.128 },
    { min: 33_007,   max: 53_407,  rate: 0.158 },
    { min: 53_407,   max: null,    rate: 0.205 },
  ],
  murcia: [
    { min: 0,        max: 12_450,  rate: 0.095 },
    { min: 12_450,   max: 20_200,  rate: 0.118 },
    { min: 20_200,   max: 34_000,  rate: 0.148 },
    { min: 34_000,   max: 60_000,  rate: 0.19  },
    { min: 60_000,   max: 120_000, rate: 0.235 },
    { min: 120_000,  max: null,    rate: 0.245 },
  ],
  larioja: [
    { min: 0,        max: 12_450,  rate: 0.09  },
    { min: 12_450,   max: 20_200,  rate: 0.118 },
    { min: 20_200,   max: 35_200,  rate: 0.15  },
    { min: 35_200,   max: 50_000,  rate: 0.19  },
    { min: 50_000,   max: 65_000,  rate: 0.22  },
    { min: 65_000,   max: 80_000,  rate: 0.235 },
    { min: 80_000,   max: 120_000, rate: 0.245 },
    { min: 120_000,  max: null,    rate: 0.27  },
  ],
  valencia: [
    { min: 0,        max: 12_450,  rate: 0.10  },
    { min: 12_450,   max: 17_707,  rate: 0.12  },
    { min: 17_707,   max: 33_007,  rate: 0.14  },
    { min: 33_007,   max: 53_407,  rate: 0.175 },
    { min: 53_407,   max: 65_000,  rate: 0.19  },
    { min: 65_000,   max: 80_000,  rate: 0.235 },
    { min: 80_000,   max: 120_000, rate: 0.245 },
    { min: 120_000,  max: 140_000, rate: 0.25  },
    { min: 140_000,  max: 175_000, rate: 0.255 },
    { min: 175_000,  max: null,    rate: 0.295 },
  ],
};

export const comunidadNames: Record<ComunidadAutonoma, string> = {
  andalucia:        'Andalucía',
  aragon:           'Aragón',
  asturias:         'Asturias',
  baleares:         'Baleares',
  canarias:         'Canarias',
  cantabria:        'Cantabria',
  castillalamancha: 'Castilla-La Mancha',
  castillayleon:    'Castilla y León',
  cataluna:         'Cataluña',
  extremadura:      'Extremadura',
  galicia:          'Galicia',
  madrid:           'Comunidad de Madrid',
  murcia:           'Murcia',
  larioja:          'La Rioja',
  valencia:         'Comunidad Valenciana',
};

// ─── Mínimo personal ──────────────────────────────────────────────────────────
// Applied as simplified base deduction (acknowledged approximation of real cuota mechanism).
export const minimoPersonal2026 = {
  general:    5_550,   // < 65 años
  mayores65:  6_700,   // 65 ≤ edad < 75
  mayores75:  8_100,   // ≥ 75 años
} as const;

// ─── Reducción rendimientos del trabajo (Art. 20 LIRPF) ──────────────────────
// SOURCE: vademecumlegal.es / agenciatributaria.gob.es (accessed 2026-09-21)
// Applied to rendimiento neto del trabajo when < €19,747.50 and other income < €6,500.
// RNT = gross income - SS employee contributions - gastos deducibles (€2,000 min)
export const reduccionRendimientosTrabajo2026 = {
  /** Gastos deducibles mínimos (Art. 19.2.f LIRPF). */
  gastoDeducibleMin:      2_000,
  /** Full reduction when RNT ≤ €14,852. */
  reduccionMax:           7_302,
  rntTramo1Hasta:         14_852,
  /** Phase-out zone: €14,852 < RNT ≤ €17,673.52. Rate: 1.75×(RNT - 14,852). */
  rntTramo2Hasta:         17_673.52,
  faseReduccion1:         1.75,
  /** Phase-out zone 2: €17,673.52 < RNT ≤ €19,747.50. */
  reduccionBase2:         2_364.34,
  rntTramo3Hasta:         19_747.50,
  faseReduccion2:         1.14,
  /** No reduction when RNT > €19,747.50. */
  rntLimite:              19_747.50,
} as const;
