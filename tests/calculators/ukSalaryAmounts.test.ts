import { describe, expect, it } from 'vitest';
import { ukPaycheckEngine } from '../../src/calculators/salary/engines/gb/ukPaycheck';

// UK 2026/27 verified figures (HMRC):
// Personal allowance £12,570; PAYE 20% to £50,270 / 40% to £125,140 / 45% above.
// Employee NI Class 1: 8% between £12,570 and £50,270, 2% above.
// These are the exact figures used on the 8 UK salary-amount pages
// (/en-gb/salary/{amount}-after-tax/).
const AMOUNTS = [
  {
    gross: 20000,
    incomeTax: 1486,
    ni: 594.4,
    net: 17919.6,
    monthly: 1493.3,
    weekly: 17919.6 / 52,
  },
  {
    gross: 25000,
    incomeTax: 2486,
    ni: 994.4,
    net: 21519.6,
    monthly: 1793.3,
    weekly: 21519.6 / 52,
  },
  {
    gross: 30000,
    incomeTax: 3486,
    ni: 1394.4,
    net: 25119.6,
    monthly: 2093.3,
    weekly: 25119.6 / 52,
  },
  {
    gross: 40000,
    incomeTax: 5486,
    ni: 2194.4,
    net: 32319.6,
    monthly: 2693.3,
    weekly: 32319.6 / 52,
  },
  {
    gross: 50000,
    incomeTax: 7486,
    ni: 2994.4,
    net: 39519.6,
    monthly: 3293.3,
    weekly: 39519.6 / 52,
  },
  {
    gross: 60000,
    incomeTax: 11432,
    ni: 3210.6,
    net: 45357.4,
    monthly: 45357.4 / 12,
    weekly: 45357.4 / 52,
  },
  {
    gross: 80000,
    incomeTax: 19432,
    ni: 3610.6,
    net: 56957.4,
    monthly: 56957.4 / 12,
    weekly: 56957.4 / 52,
  },
  {
    gross: 100000,
    incomeTax: 27432,
    ni: 4010.6,
    net: 68557.4,
    monthly: 68557.4 / 12,
    weekly: 68557.4 / 52,
  },
];

describe('uk salary-amount pages (2026/27)', () => {
  it.each(AMOUNTS)(
    'computes the exact breakdown for £$gross (income tax, NI, net)',
    ({ gross, incomeTax, ni, net }) => {
      const r = ukPaycheckEngine.calculate(
        { grossAnnual: gross, payFrequency: 'annually', region: 'england' },
        {} as never,
        2026,
      );
      expect(r.incomeTaxAnnual).toBeCloseTo(incomeTax, 2);
      expect(r.nationalInsuranceAnnual).toBeCloseTo(ni, 2);
      expect(r.netAnnualPay).toBeCloseTo(net, 2);
      expect(r.personalAllowance).toBe(12570);
    },
  );

  it.each(AMOUNTS)(
    'splits £$gross into correct monthly/weekly take-home',
    ({ gross, monthly, weekly }) => {
      const monthlyR = ukPaycheckEngine.calculate(
        { grossAnnual: gross, payFrequency: 'monthly', region: 'england' },
        {} as never,
        2026,
      );
      expect(monthlyR.netPayPerPeriod).toBeCloseTo(monthly, 2);
      const weeklyR = ukPaycheckEngine.calculate(
        { grossAnnual: gross, payFrequency: 'weekly', region: 'england' },
        {} as never,
        2026,
      );
      expect(weeklyR.netPayPerPeriod).toBeCloseTo(weekly, 2);
    },
  );

  it('charges employee NI at the post-2024 8%/2% rates, not the stale 12% rate (£30k → ≈ £1,394, NOT £2,091)', () => {
    const r = ukPaycheckEngine.calculate(
      { grossAnnual: 30000, payFrequency: 'annually', region: 'england' },
      {} as never,
      2026,
    );
    const wrongStaleRateNI = (30000 - 12570) * 0.12; // pre-2024 12% rate
    expect(wrongStaleRateNI).toBeCloseTo(2091.6, 1);
    expect(r.nationalInsuranceAnnual).toBeCloseTo(1394.4, 1);
    expect(r.nationalInsuranceAnnual).not.toBeCloseTo(wrongStaleRateNI, 0);
  });

  it('applies the higher rate correctly above £50,270 (£60k)', () => {
    const r = ukPaycheckEngine.calculate(
      { grossAnnual: 60000, payFrequency: 'annually', region: 'england' },
      {} as never,
      2026,
    );
    // 20% on £37,700 of taxable income + 40% on £9,730 above
    expect(r.incomeTaxAnnual).toBeCloseTo(37700 * 0.2 + 9730 * 0.4, 2);
    // 8% NI to £50,270 + 2% above
    expect(r.nationalInsuranceAnnual).toBeCloseTo(37700 * 0.08 + 9730 * 0.02, 2);
  });

  it('keeps the full £12,570 personal allowance at exactly £100,000 (no taper)', () => {
    const r = ukPaycheckEngine.calculate(
      { grossAnnual: 100000, payFrequency: 'annually', region: 'england' },
      {} as never,
      2026,
    );
    expect(r.personalAllowance).toBe(12570);
  });
});
