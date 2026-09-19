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
} as const;
