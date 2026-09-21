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
  salaryToHourly: {
    title: 'Salary to Hourly Calculator Ireland',
    h1: 'Salary to Hourly Rate Calculator Ireland',
    intro: 'Convert your annual Irish salary to an equivalent hourly rate based on your working hours.',
  },
  payFrequency: {
    title: 'Pay Frequency Converter Ireland',
    h1: 'Pay Frequency Converter Ireland',
    intro: 'Convert your Irish pay between weekly, fortnightly, monthly, and annual amounts.',
  },
  salaryRaise: {
    title: 'Salary Raise Calculator Ireland',
    h1: 'Salary Raise Calculator Ireland',
    intro: 'Calculate your new Irish salary after a percentage or flat-amount pay increase.',
  },
} as const;
