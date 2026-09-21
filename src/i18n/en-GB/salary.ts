export const salary = {
  categoryTitle: 'UK Salary Calculators',
  categoryIntro: 'Calculate your take-home pay, hourly rates, and salary conversions for the UK.',
  takeHomePay: {
    title: 'UK Take Home Pay Calculator 2026',
    h1: 'UK Take Home Pay Calculator 2026',
    intro:
      'Estimate your net take-home pay after UK income tax and National Insurance contributions for the 2025–26 tax year.',
    fields: {
      grossAnnual: 'Annual Gross Salary',
      filingStatus: 'Tax Code',
      payFrequency: 'Pay Frequency',
    },
    filingStatuses: {
      standard: 'Standard (1257L)',
      scottish: 'Scottish taxpayer (S prefix)',
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
      incomeTax: 'Income Tax',
      nationalInsurance: 'National Insurance (Employee)',
      studentLoan: 'Student Loan',
      effectiveRate: 'Effective Tax Rate',
    },
  },
  salaryToHourly: {
    title: 'Salary to Hourly Calculator UK',
    h1: 'Salary to Hourly Rate Calculator UK',
    intro: 'Convert your annual salary to an equivalent hourly rate based on your working hours.',
  },
  payFrequency: {
    title: 'Pay Frequency Converter UK',
    h1: 'Pay Frequency Converter UK',
    intro: 'Convert your UK pay between weekly, fortnightly, monthly, and annual amounts.',
  },
  salaryRaise: {
    title: 'Salary Raise Calculator UK',
    h1: 'Salary Raise Calculator UK',
    intro: 'Calculate your new UK salary after a percentage or flat-amount pay rise.',
  },
} as const;
