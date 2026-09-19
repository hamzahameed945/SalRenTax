export const salary = {
  categoryTitle: 'Ireland Salary Calculators',
  categoryIntro: 'Calculate your take-home pay after Irish income tax (PAYE), USC, and PRSI.',
  takeHomePay: {
    title: 'Ireland Take Home Pay Calculator 2026',
    h1: 'Ireland Take Home Pay Calculator 2026',
    intro:
      'Estimate your net take-home pay after PAYE income tax, Universal Social Charge (USC), and Pay Related Social Insurance (PRSI) for 2026.',
    fields: {
      grossAnnual: 'Annual Gross Salary',
      maritalStatus: 'Marital Status',
      payFrequency: 'Pay Frequency',
    },
    maritalStatuses: {
      single: 'Single',
      married: 'Married / Civil Partner',
    },
    payFrequencies: {
      monthly: 'Monthly',
      weekly: 'Weekly',
      biweekly: 'Fortnightly',
      annually: 'Annually',
    },
    results: {
      netPay: 'Net Take-Home Pay',
      grossPay: 'Gross Pay',
      incomeTax: 'PAYE Income Tax',
      usc: 'Universal Social Charge (USC)',
      prsi: 'PRSI',
      effectiveRate: 'Effective Tax Rate',
    },
  },
} as const;
