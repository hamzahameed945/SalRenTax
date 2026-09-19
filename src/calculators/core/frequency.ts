export type PayFrequency =
  'annually' | 'monthly' | 'semimonthly' | 'biweekly' | 'weekly' | 'daily' | 'hourly';

export const PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  annually: 1,
  monthly: 12,
  semimonthly: 24,
  biweekly: 26,
  weekly: 52,
  daily: 260, // Assuming 5 days a week, 52 weeks = 260 working days
  hourly: 2080, // Assuming 40 hours a week, 52 weeks = 2080 working hours
};

export function annualize(amountPerPeriod: number, frequency: PayFrequency): number {
  return amountPerPeriod * PERIODS_PER_YEAR[frequency];
}

export function deannualize(annualAmount: number, frequency: PayFrequency): number {
  return annualAmount / PERIODS_PER_YEAR[frequency];
}

export function convertFrequency(amount: number, from: PayFrequency, to: PayFrequency): number {
  const annual = annualize(amount, from);
  return deannualize(annual, to);
}
