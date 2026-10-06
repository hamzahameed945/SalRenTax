import { describe, expect, it } from 'vitest';
import {
  usHouseAffordabilityEngine,
  monthlyPaymentFactor,
  MORTGAGE_ANNUAL_RATE_2026,
  MORTGAGE_TERM_MONTHS,
  FRONT_END_RATIO,
} from '../../src/calculators/salary/engines/usHouseAffordability';
import { usPaycheckEngine } from '../../src/calculators/salary/engines/usPaycheck';

function calc(stateCode: string, annualSalary: number) {
  return usHouseAffordabilityEngine.calculate(
    { annualSalary, stateCode },
    { countryCode: 'US' },
    2026,
  );
}

describe('monthlyPaymentFactor', () => {
  it('matches the textbook amortization formula for 7.28% / 30yr', () => {
    const r = MORTGAGE_ANNUAL_RATE_2026 / 12;
    const growth = Math.pow(1 + r, MORTGAGE_TERM_MONTHS);
    const expected = (r * growth) / (growth - 1);
    expect(monthlyPaymentFactor(MORTGAGE_ANNUAL_RATE_2026, MORTGAGE_TERM_MONTHS)).toBeCloseTo(
      expected,
      12,
    );
    // Sanity: ~$6.84 per $1,000 borrowed per month
    expect(monthlyPaymentFactor(0.0728, 360) * 1000).toBeCloseTo(6.84, 1);
  });
});

describe('usHouseAffordabilityEngine', () => {
  it('applies the 28% front-end rule on gross monthly income', () => {
    const r = calc('TX', 120000);
    expect(r.maxMonthlyHousingPayment).toBeCloseTo((120000 / 12) * FRONT_END_RATIO, 6);
    expect(r.maxMonthlyHousingPayment).toBeCloseTo(2800, 6);
  });

  it('solves a home price whose PITI equals the 28% budget', () => {
    const r = calc('TX', 100000);
    expect(r.monthlyPiti).toBeCloseTo(r.maxMonthlyHousingPayment, 0);
    // Independent check: P = budget / (0.8f + tax/12 + ins/12)
    const f = monthlyPaymentFactor(0.0728, 360);
    const expected =
      (100000 / 12) * 0.28 / (0.8 * f + 0.014 / 12 + 0.002 / 12);
    expect(r.maxHomePrice).toBeCloseTo(expected, 0);
    expect(r.maxHomePrice).toBeGreaterThan(300000);
    expect(r.maxHomePrice).toBeLessThan(400000);
  });

  it('charges a higher property-tax state a lower affordable price at the same salary', () => {
    const nj = calc('NJ', 100000); // 1.88% effective
    const hi = calc('HI', 100000); // 0.29% effective
    expect(nj.maxHomePrice).toBeLessThan(hi.maxHomePrice);
    expect(nj.monthlyPropertyTax).toBeGreaterThan(hi.monthlyPropertyTax);
    // Both still satisfy the 28% rule
    expect(nj.monthlyPiti).toBeCloseTo(nj.maxMonthlyHousingPayment, 0);
    expect(hi.monthlyPiti).toBeCloseTo(hi.maxMonthlyHousingPayment, 0);
  });

  it('uses a 20% down payment with no PMI', () => {
    const r = calc('CA', 150000);
    expect(r.downPayment).toBeCloseTo(r.maxHomePrice * 0.2, 2);
    expect(r.loanAmount).toBeCloseTo(r.maxHomePrice * 0.8, 2);
  });

  it('derives take-home pay from the verified usPaycheck engine', () => {
    const r = calc('AZ', 80000);
    const paycheck = usPaycheckEngine.calculate(
      {
        grossPayPerPeriod: 80000,
        payFrequency: 'annually',
        filingStatus: 'single',
        preTaxDeductionsPerPeriod: 0,
        stateCode: 'AZ',
      },
      { countryCode: 'US' },
      2026,
    );
    const expectedNet =
      paycheck.annualGrossPay -
      paycheck.annualFederalIncomeTax -
      paycheck.annualSocialSecurity -
      paycheck.annualMedicare -
      (paycheck.annualStateIncomeTax ?? 0);
    expect(r.annualTakeHomePay).toBeCloseTo(expectedNet, 2);
    expect(r.monthlyTakeHomePay).toBeCloseTo(expectedNet / 12, 2);
  });

  it('breaks PITI into principal+interest, tax, and insurance parts', () => {
    const r = calc('FL', 75000);
    expect(r.monthlyPrincipalAndInterest).toBeGreaterThan(0);
    expect(r.monthlyPropertyTax).toBeGreaterThan(0);
    expect(r.monthlyHomeownerInsurance).toBeGreaterThan(0);
    expect(
      r.monthlyPrincipalAndInterest + r.monthlyPropertyTax + r.monthlyHomeownerInsurance,
    ).toBeCloseTo(r.monthlyPiti, 6);
  });

  it('rejects unknown state codes', () => {
    expect(
      usHouseAffordabilityEngine.validate({ annualSalary: 100000, stateCode: 'XX' }).valid,
    ).toBe(false);
    expect(() =>
      calc('XX', 100000),
    ).toThrow(/Unknown state code/);
  });

  it('rejects non-positive salaries', () => {
    expect(
      usHouseAffordabilityEngine.validate({ annualSalary: 0, stateCode: 'TX' }).valid,
    ).toBe(false);
    expect(
      usHouseAffordabilityEngine.validate({ annualSalary: -5000, stateCode: 'TX' }).valid,
    ).toBe(false);
  });

  it('only supports tax year 2026', () => {
    expect(() =>
      usHouseAffordabilityEngine.calculate(
        { annualSalary: 100000, stateCode: 'TX' },
        { countryCode: 'US' },
        2025,
      ),
    ).toThrow(/2026/);
  });

  it('accepts lowercase state codes', () => {
    const r = calc('tx', 100000);
    expect(r.stateCode).toBe('TX');
    expect(r.stateName).toBe('Texas');
  });
});
