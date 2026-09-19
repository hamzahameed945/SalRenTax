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
} as const;
