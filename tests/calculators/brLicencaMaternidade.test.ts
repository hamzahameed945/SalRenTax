import { describe, expect, it } from 'vitest';
import {
  brLicencaMaternidadeEngine,
  INSS_CEILING_2026,
  MATERNITY_LEAVE_DAYS,
  MATERNITY_MONTHLY_PAYMENTS,
} from '../../src/calculators/labor/engines/brLicencaMaternidade';

describe('brLicencaMaternidade engine', () => {
  it('pays 100% of salary in 4 monthly installments for 120 days', () => {
    const r = brLicencaMaternidadeEngine.calculate({ monthlySalary: 3000 }, {} as never, 2026);
    expect(r.leaveDays).toBe(MATERNITY_LEAVE_DAYS); // 120
    expect(r.monthlyPayments).toBe(MATERNITY_MONTHLY_PAYMENTS); // 4
    expect(r.monthlyBenefit).toBe(3000);
    expect(r.totalBenefit).toBe(12000);
    expect(r.isCapped).toBe(false);
    expect(r.cappedAmount).toBe(0);
  });

  it('caps the benefit at the 2026 INSS ceiling', () => {
    const r = brLicencaMaternidadeEngine.calculate({ monthlySalary: 15000 }, {} as never, 2026);
    expect(INSS_CEILING_2026).toBe(8475.55);
    expect(r.monthlyBenefit).toBe(8475.55);
    expect(r.totalBenefit).toBe(33902.2); // 8475.55 x 4
    expect(r.isCapped).toBe(true);
    expect(r.cappedAmount).toBe(6524.45); // 15000 - 8475.55
  });

  it('does not cap a salary exactly at the ceiling', () => {
    const r = brLicencaMaternidadeEngine.calculate({ monthlySalary: 8475.55 }, {} as never, 2026);
    expect(r.monthlyBenefit).toBe(8475.55);
    expect(r.isCapped).toBe(false);
  });

  it('rejects non-positive salaries', () => {
    expect(brLicencaMaternidadeEngine.validate({ monthlySalary: 0 }).valid).toBe(false);
    expect(brLicencaMaternidadeEngine.validate({ monthlySalary: -500 }).valid).toBe(false);
    expect(brLicencaMaternidadeEngine.validate({ monthlySalary: Number.NaN }).valid).toBe(false);
  });

  it('validates a correct input', () => {
    const v = brLicencaMaternidadeEngine.validate({ monthlySalary: 4500 });
    expect(v.valid).toBe(true);
  });
});
