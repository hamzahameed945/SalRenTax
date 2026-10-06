/**
 * 2026 Microempreendedor Individual (MEI) fixed monthly tax figures.
 *
 * Sources:
 * - Receita Federal / Portal do Empreendedor — DAS-MEI values recomputed from
 *   the 2026 national minimum wage (Decreto nº 12.797/2025: R$ 1.621,00).
 *   DAS = 5% of the minimum wage (R$ 81,05) + R$ 1,00 ICMS for
 *   commerce/industry + R$ 5,00 ISS for services.
 * - Lei Complementar nº 123/2006 — annual revenue limit R$ 81.000
 *   (20% tolerance: R$ 97.200, beyond which desenquadramento is retroactive).
 */
export const brMei2026 = {
  minimumWage: 1621.0,
  inssRate: 0.05,
  inssBase: 81.05, // 5% of R$ 1.621,00
  das: {
    comercio: 82.05, // 81,05 INSS + 1,00 ICMS
    servicos: 86.05, // 81,05 INSS + 5,00 ISS
    ambos: 87.05, // 81,05 INSS + 1,00 ICMS + 5,00 ISS
  },
  revenueLimit: 81000,
  revenueLimitTolerance: 97200, // +20%: complementary DAS + ME from next year
  sources: [
    'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/quero-ser-mei',
    'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/regimes-e-controles-especiais/simples-nacional',
  ],
} as const;

export type MeiActivity = keyof typeof brMei2026.das;
