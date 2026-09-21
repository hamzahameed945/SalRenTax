export const salary = {
  categoryTitle: 'Salary Calculators',
  categoryIntro:
    'Use these calculators to estimate take-home pay, convert between salary and hourly wages, compare different pay schedules, and see how a raise could change your income.',
  paycheck: {
    title: 'Paycheck Calculator',
    h1: 'US Paycheck Calculator',
    intro:
      'Get a quick estimate of your take-home pay after the main federal payroll deductions. Enter your gross pay, pay schedule, filing status, and eligible pre-tax deductions to see an estimated breakdown.',
    fields: {
      grossPay: 'Gross pay per period',
      payFrequency: 'Pay frequency',
      filingStatus: 'Filing status',
      preTaxDeductions: 'Pre-tax deductions per period',
    },
    payFrequencies: {
      weekly: 'Weekly',
      biweekly: 'Biweekly',
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
      netPay: 'Estimated take-home pay',
      grossPay: 'Gross pay',
      federalIncomeTax: 'Federal income tax',
      socialSecurity: 'Social Security',
      medicare: 'Medicare',
      preTaxDeductions: 'Pre-tax deductions',
      effectiveRate: 'Effective tax rate',
    },
  },
  salaryToHourly: {
    title: 'Salary to Hourly Calculator',
    h1: 'Salary to Hourly Calculator',
    intro:
      'See what your annual salary works out to as an hourly rate, based on the hours and work schedule you choose.',
  },
  hourlyToSalary: {
    title: 'Hourly to Salary Calculator',
    h1: 'Hourly to Salary Calculator',
    intro:
      'Convert an hourly wage into an estimated annual salary based on your usual work schedule.',
  },
  payFrequency: {
    title: 'Pay Frequency Converter',
    h1: 'Pay Frequency Converter',
    intro:
      'Compare the same income across weekly, biweekly, semi-monthly, monthly, and annual pay schedules.',
  },
  salaryRaise: {
    title: 'Salary Raise Calculator',
    h1: 'Salary Raise Calculator',
    intro: 'See how a percentage or fixed-dollar raise changes your salary and hourly rate.',
  },
} as const;
