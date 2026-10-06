export const labor = {
  categoryTitle: 'Calculadoras Laborais',
  categoryIntro: 'Calcule o subsídio de Natal e outros direitos laborais em Portugal.',
  subsidioNatal: {
    title: 'Calculadora de Subsídio de Natal 2026',
    h1: 'Calculadora de Subsídio de Natal 2026',
    intro:
      'Calcule o valor do seu subsídio de Natal proporcional aos meses trabalhados no ano.',
    fields: {
      baseMonthly: 'Retribuição base mensal ilíquida (€)',
      monthsWorked: 'Meses trabalhados no ano (0–12)',
      duodecimos: 'Receber em duodécimos',
    },
    results: {
      subsidioBruto: 'Subsídio de Natal bruto',
      duodecimoMensal: 'Duodécimo mensal',
      mesesConsiderados: 'Meses considerados',
    },
  },
} as const;
