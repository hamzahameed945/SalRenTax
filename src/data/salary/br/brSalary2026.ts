/**
 * 2026 Brazilian salary deductions used by the simplified net-salary tool.
 * Sources are official INSS and Receita Federal publications listed below.
 */
export const brSalary2026 = {
  inss: {
    ceiling: 8475.55,
    brackets: [
      { upTo: 1621.0, rate: 0.075 },
      { upTo: 2902.84, rate: 0.09 },
      { upTo: 4354.27, rate: 0.12 },
      { upTo: 8475.55, rate: 0.14 },
    ],
  },
  irrf: {
    simplifiedDeduction: 607.2,
    dependentDeduction: 189.59,
    brackets: [
      { upTo: 2428.8, rate: 0, deduction: 0 },
      { upTo: 2826.65, rate: 0.075, deduction: 182.16 },
      { upTo: 3751.05, rate: 0.15, deduction: 394.16 },
      { upTo: 4664.68, rate: 0.225, deduction: 675.49 },
      { upTo: Infinity, rate: 0.275, deduction: 908.73 },
    ],
    reductionForMonthlyIncome: {
      fullExemptionUpTo: 5000,
      phaseOutUpTo: 7350,
      base: 978.62,
      slope: 0.133145,
    },
  },
  sources: [
    'https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal',
    'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/2026',
  ],
} as const;
