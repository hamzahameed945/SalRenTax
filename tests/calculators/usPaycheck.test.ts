import { describe, expect, it } from 'vitest';
import { usPaycheckEngine } from '../../src/calculators/salary/engines/usPaycheck';
import { PERIODS_PER_YEAR } from '../../src/calculators/core/frequency';
import { fica2026, standardDeduction2026 } from '../../src/data/salary/us/federalTax2026';

const CONFIG = { countryCode: 'US' as const };

describe('usPaycheckEngine.validate', () => {
  it('rejects zero or negative gross pay', () => {
    const result = usPaycheckEngine.validate({
      grossPayPerPeriod: 0,
      payFrequency: 'biweekly',
      filingStatus: 'single',
      preTaxDeductionsPerPeriod: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.grossPayPerPeriod).toBeDefined();
  });

  it('accepts a valid input', () => {
    const result = usPaycheckEngine.validate({
      grossPayPerPeriod: 2000,
      payFrequency: 'biweekly',
      filingStatus: 'single',
      preTaxDeductionsPerPeriod: 100,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects negative pre-tax deductions', () => {
    const result = usPaycheckEngine.validate({
      grossPayPerPeriod: 2000,
      payFrequency: 'biweekly',
      filingStatus: 'single',
      preTaxDeductionsPerPeriod: -10,
    });
    expect(result.valid).toBe(false);
  });
});

describe('usPaycheckEngine.calculate', () => {
  it('throws for an unsupported tax year', () => {
    expect(() =>
      usPaycheckEngine.calculate(
        {
          grossPayPerPeriod: 2000,
          payFrequency: 'biweekly',
          filingStatus: 'single',
          preTaxDeductionsPerPeriod: 0,
        },
        CONFIG,
        2025,
      ),
    ).toThrow();
  });

  it('applies the standard deduction before computing federal tax', () => {
    // Annual gross exactly equal to the single standard deduction -> zero taxable income -> zero federal tax.
    const annual = standardDeduction2026.single;
    const result = usPaycheckEngine.calculate(
      {
        grossPayPerPeriod: annual,
        payFrequency: 'annually',
        filingStatus: 'single',
        preTaxDeductionsPerPeriod: 0,
      },
      CONFIG,
      2026,
    );
    expect(result.annualFederalIncomeTax).toBeCloseTo(0);
  });

  it('caps Social Security tax at the wage base', () => {
    const highAnnual = fica2026.socialSecurityWageBase + 50_000;
    const result = usPaycheckEngine.calculate(
      {
        grossPayPerPeriod: highAnnual,
        payFrequency: 'annually',
        filingStatus: 'single',
        preTaxDeductionsPerPeriod: 0,
      },
      CONFIG,
      2026,
    );
    expect(result.annualSocialSecurity).toBeCloseTo(
      fica2026.socialSecurityWageBase * fica2026.socialSecurityRate,
    );
  });

  it('applies Medicare tax to all wages with no cap', () => {
    const highAnnual = fica2026.socialSecurityWageBase + 50_000;
    const result = usPaycheckEngine.calculate(
      {
        grossPayPerPeriod: highAnnual,
        payFrequency: 'annually',
        filingStatus: 'single',
        preTaxDeductionsPerPeriod: 0,
      },
      CONFIG,
      2026,
    );
    expect(result.annualMedicare).toBeCloseTo(highAnnual * fica2026.medicareRate);
  });

  it('divides annual figures evenly across pay periods', () => {
    const result = usPaycheckEngine.calculate(
      {
        grossPayPerPeriod: 3000,
        payFrequency: 'biweekly',
        filingStatus: 'single',
        preTaxDeductionsPerPeriod: 0,
      },
      CONFIG,
      2026,
    );
    expect(result.annualGrossPay).toBeCloseTo(3000 * PERIODS_PER_YEAR.biweekly);
  });

  it('reduces net pay by pre-tax deductions', () => {
    const withDeduction = usPaycheckEngine.calculate(
      {
        grossPayPerPeriod: 3000,
        payFrequency: 'biweekly',
        filingStatus: 'single',
        preTaxDeductionsPerPeriod: 200,
      },
      CONFIG,
      2026,
    );
    const withoutDeduction = usPaycheckEngine.calculate(
      {
        grossPayPerPeriod: 3000,
        payFrequency: 'biweekly',
        filingStatus: 'single',
        preTaxDeductionsPerPeriod: 0,
      },
      CONFIG,
      2026,
    );
    // Net pay should be higher without pre-tax deductions removed from take-home,
    // even though taxable income (and thus tax) is lower with the deduction.
    expect(withDeduction.netPayPerPeriod).toBeLessThan(withoutDeduction.netPayPerPeriod);
  });

  it('produces a lower effective rate for married filing jointly than single at the same income', () => {
    const single = usPaycheckEngine.calculate(
      {
        grossPayPerPeriod: 120_000,
        payFrequency: 'annually',
        filingStatus: 'single',
        preTaxDeductionsPerPeriod: 0,
      },
      CONFIG,
      2026,
    );
    const married = usPaycheckEngine.calculate(
      {
        grossPayPerPeriod: 120_000,
        payFrequency: 'annually',
        filingStatus: 'marriedJointly',
        preTaxDeductionsPerPeriod: 0,
      },
      CONFIG,
      2026,
    );
    expect(married.effectiveFederalRate).toBeLessThan(single.effectiveFederalRate);
  });
});
