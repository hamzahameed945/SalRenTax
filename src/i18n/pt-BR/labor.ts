export const labor = {
  categoryTitle: 'Calculadoras Trabalhistas',
  categoryIntro: 'Calcule rescisão, décimo terceiro salário, férias e outros direitos trabalhistas.',
  rescisao: {
    title: 'Calculadora de Rescisão Trabalhista 2026',
    h1: 'Calculadora de Rescisão Trabalhista 2026',
    intro:
      'Calcule os valores da rescisão do contrato de trabalho conforme a CLT: aviso prévio, férias proporcionais, 13º proporcional e FGTS.',
    fields: {
      grossMonthly: 'Salário mensal bruto',
      monthsWorked: 'Meses trabalhados no último período',
      daysVacationPending: 'Dias de férias pendentes',
      dismissalType: 'Tipo de demissão',
    },
    dismissalTypes: {
      pedidoDeExoneracao: 'Pedido de demissão (sem aviso trabalhado)',
      demissaoSemJustaCausa: 'Demissão sem justa causa (com aviso)',
      demissaoPorJustaCausa: 'Demissão por justa causa',
      rescisaoAcordada: 'Rescisão por acordo',
    },
    results: {
      saldoSalario: 'Saldo de salário',
      feriasProporcionais: 'Férias proporcionais + 1/3',
      decimoTerceiroProportional: '13º proporcional',
      avisoPrevio: 'Aviso prévio (se aplicável)',
      multaFgts: 'Multa FGTS (40%) — sem justa causa',
      totalRescisao: 'Total estimado da rescisão',
    },
  },
  decimoTerceiro: {
    title: 'Calculadora de Décimo Terceiro 2026',
    h1: 'Calculadora de Décimo Terceiro Salário 2026',
    intro: 'Calcule o valor do seu 13º salário proporcional aos meses trabalhados no ano.',
    fields: {
      grossMonthly: 'Salário mensal bruto',
      monthsWorked: 'Meses trabalhados no ano (1–12)',
    },
    results: {
      firstInstallment: '1ª parcela (novembro)',
      secondInstallment: '2ª parcela (dezembro)',
      totalDecimoTerceiro: 'Total 13º salário bruto',
    },
  },
  cltVsMei: {
    title: 'CLT ou MEI: Qual Vale Mais a Pena? Calculadora 2026',
    h1: 'CLT ou MEI: qual vale mais a pena em 2026?',
    intro:
      'Compare quanto sobra no bolso como CLT (com INSS e IRRF) e como MEI (com DAS fixo): líquido mensal, 13º, férias + 1/3 e o total anualizado.',
    fields: {
      grossMonthly: 'Valor mensal bruto (R$)',
      meiActivity: 'Atividade do MEI',
    },
    activityTypes: {
      servicos: 'Serviços (DAS R$ 86,05)',
      comercio: 'Comércio ou indústria (DAS R$ 82,05)',
      ambos: 'Comércio + serviços (DAS R$ 87,05)',
    },
    results: {
      monthlyComparison: 'Comparativo mensal',
      annualComparison: 'Comparativo anual',
      clt: 'CLT',
      mei: 'MEI',
      netMonthly: 'Líquido mensal',
      annualNet: 'Total anual líquido',
      inss: 'INSS',
      irrf: 'IRRF',
      das: 'DAS (imposto fixo MEI)',
      decimoTerceiroNet: '13º salário líquido',
      feriasNet: 'Férias + 1/3 líquidas',
      fgtsAnnual: 'FGTS anual (depósito do empregador)',
      monthlyDifference: 'Diferença mensal (CLT − MEI)',
      annualDifference: 'Diferença anual (CLT − MEI)',
      betterMonthly: 'Melhor no mês',
      betterAnnual: 'Melhor no ano',
      revenueLimitWarning: 'Atenção: o faturamento anual estimado ultrapassa o limite do MEI (R$ 81.000/ano).',
      tie: 'Empate',
    },
  },
} as const;
