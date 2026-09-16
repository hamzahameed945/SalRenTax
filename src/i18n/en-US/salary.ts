export const salary = {
  categoryTitle: 'Salary Calculators',
  categoryIntro: 'Calculate take-home pay, hourly wages, pay frequencies, and salary raises.',
  paycheck: {
    title: 'Paycheck Calculator',
    h1: 'US Paycheck Calculator',
    intro:
      'Estimate your net take-home pay by calculating federal income tax, Social Security, and Medicare deductions.',
    fields: {
      grossPay: 'Gross Pay per Period',
      payFrequency: 'Pay Frequency',
      filingStatus: 'Filing Status',
      preTaxDeductions: 'Pre-Tax Deductions per Period',
    },
    payFrequencies: {
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      semimonthly: 'Semi-monthly',
      monthly: 'Monthly',
      annually: 'Annually',
      daily: 'Daily',
      hourly: 'Hourly',
    },
    filingStatuses: {
      single: 'Single',
      marriedJointly: 'Married filing jointly',
      marriedSeparately: 'Married filing separately',
      headOfHousehold: 'Head of household',
    },
    calculate: 'Calculate',
    reset: 'Reset',
    results: {
      netPay: 'Net Take-Home Pay',
      grossPay: 'Gross Pay',
      federalIncomeTax: 'Federal Income Tax',
      socialSecurity: 'Social Security',
      medicare: 'Medicare',
      preTaxDeductions: 'Pre-Tax Deductions',
      effectiveRate: 'Effective Tax Rate',
    },
  },
  salaryToHourly: {
    title: 'Salary to Hourly Calculator',
    h1: 'Salary to Hourly Calculator',
    intro:
      'Convert your annual salary into an equivalent hourly wage based on your typical work hours.',
  },
  hourlyToSalary: {
    title: 'Hourly to Salary Calculator',
    h1: 'Hourly to Salary Calculator',
    intro: 'Convert your hourly wage into an equivalent annual salary.',
  },
  payFrequency: {
    title: 'Pay Frequency Converter',
    h1: 'Pay Frequency Converter',
    intro:
      'Compare what your paycheck would look like if paid weekly, bi-weekly, monthly, or annually.',
  },
  salaryRaise: {
    title: 'Salary Raise Calculator',
    h1: 'Salary Raise Calculator',
    intro: 'Calculate your new salary after receiving a percentage or flat-amount raise.',
  },
} as const;
