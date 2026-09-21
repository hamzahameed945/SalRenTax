import { describe, expect, it } from 'vitest';
import { mindestlohnEngine } from '../../src/calculators/salary/engines/de/mindestlohn';
import { bruttoNettoEngine } from '../../src/calculators/salary/engines/de/bruttoNetto';
import { spainSalaryEngine } from '../../src/calculators/salary/engines/es/spainSalary';
import { ukPaycheckEngine } from '../../src/calculators/salary/engines/gb/ukPaycheck';
import { irelandPaycheckEngine } from '../../src/calculators/salary/engines/ie/irelandPaycheck';
import { mexicoSalaryEngine } from '../../src/calculators/salary/engines/mx/mexicoSalary';
import { nlBruttoNettoEngine } from '../../src/calculators/salary/engines/nl/nlBruttoNetto';
import { brRescisaoEngine } from '../../src/calculators/labor/engines/brRescisao';
import { brDecimoTerceiroEngine } from '../../src/calculators/labor/engines/brDecimoTerceiro';
import { esFiniquitoEngine } from '../../src/calculators/labor/engines/esFiniquito';
import { mxFiniquitoEngine } from '../../src/calculators/labor/engines/mxFiniquito';
import { txStateEngine } from '../../src/calculators/salary/engines/usStates/tx';

describe('calculator engine coverage', () => {
  it('covers the German minimum wage engine', () => {
    const result = mindestlohnEngine.calculate(
      { hoursPerWeek: 40, weeksPerYear: 52 },
      undefined as never,
      2026,
    );
    expect(result.hourlyWage).toBe(13.9);
    expect(result.annualWage).toBeCloseTo(13.9 * 40 * 52);
  });

  it('covers the German gross-to-social-net engine', () => {
    const result = bruttoNettoEngine.calculate(
      { grossMonthly: 5000, steuerklasse: 'I', numberOfChildren: 0 },
      undefined as never,
      2026,
    );
    expect(result.totalSocialInsuranceEmployee).toBeGreaterThan(0);
    expect(result.netMonthly).toBeLessThan(5000);
    expect(result.lohnsteuerMonthly).toBeGreaterThan(0);
  });

  it('covers the Spain salary engine', () => {
    const result = spainSalaryEngine.calculate(
      { grossAnnual: 60000, paymentsPerYear: 12 },
      undefined as never,
      2026,
    );
    expect(result.ssTotalEmployee).toBeGreaterThan(0);
    expect(result.netAnnual).toBeLessThan(60000);
    expect(result.irpfTotalAnnual).toBeGreaterThan(0);
  });

  it('covers the UK paycheck engine', () => {
    const result = ukPaycheckEngine.calculate(
      { grossAnnual: 50000, payFrequency: 'monthly' },
      undefined as never,
      2026,
    );
    expect(result.incomeTaxAnnual).toBeGreaterThan(0);
    expect(result.nationalInsuranceAnnual).toBeGreaterThan(0);
    expect(result.netAnnualPay).toBeLessThan(50000);
  });

  it('covers the Ireland paycheck engine', () => {
    const result = irelandPaycheckEngine.calculate(
      { grossAnnual: 50000, payFrequency: 'monthly', maritalStatus: 'single' },
      undefined as never,
      2026,
    );
    expect(result.payeAnnual).toBeGreaterThan(0);
    expect(result.uscAnnual).toBeGreaterThan(0);
    expect(result.prsiAnnual).toBeGreaterThan(0);
    expect(result.netAnnualPay).toBeLessThan(50000);
  });

  it('covers the Mexico salary engine', () => {
    const result = mexicoSalaryEngine.calculate({ grossMonthly: 15000 }, undefined as never, 2026);
    expect(result.isrBruto).toBeGreaterThanOrEqual(0);
    expect(result.netMonthly).toBeLessThan(15000);
    expect(result.totalImssObrero).toBeGreaterThan(0);
  });

  it('covers the Netherlands gross-to-net engine', () => {
    const result = nlBruttoNettoEngine.calculate({ grossAnnual: 60000, age: 30 }, undefined as never, 2026);
    expect(result.incomeTaxAnnual).toBeGreaterThanOrEqual(0);
    expect(result.netAnnual).toBeLessThanOrEqual(60000);
    expect(result.effectiveRate).toBeGreaterThanOrEqual(0);
  });

  it('covers the Brazil rescisao engine', () => {
    const result = brRescisaoEngine.calculate(
      {
        grossMonthly: 3000,
        monthsWorked: 6,
        daysVacationPending: 10,
        dismissalType: 'demissaoSemJustaCausa',
      },
      undefined as never,
      2026,
    );
    expect(result.avisoPrevio).toBe(3000);
    expect(result.multaFgts).toBeGreaterThan(0);
    expect(result.totalRescisao).toBeGreaterThan(3000);
  });

  it('covers the Brazil 13th salary engine', () => {
    const result = brDecimoTerceiroEngine.calculate(
      { grossMonthly: 3000, monthsWorked: 6 },
      undefined as never,
      2026,
    );
    expect(result.totalDecimoTerceiro).toBe(1500);
    expect(result.firstInstallment).toBe(750);
    expect(result.secondInstallment).toBe(750);
  });

  it('covers the Spain finiquito engine and its severance cap', () => {
    const result = esFiniquitoEngine.calculate(
      {
        grossAnnual: 30000,
        yearsWorked: 5,
        daysHolidayPending: 10,
        dismissalType: 'unfairDismissal',
      },
      undefined as never,
      2026,
    );
    expect(result.severancePay).toBeCloseTo(30000 / 365 * 33 * 5);
    expect(result.severancePay).toBeLessThanOrEqual(60000);
  });

  it('covers the Mexico finiquito engine proportional aguinaldo', () => {
    const result = mxFiniquitoEngine.calculate(
      {
        dailyWage: 500,
        yearsWorked: 3,
        daysVacationPending: 8,
        monthsWorkedThisYear: 6,
        dismissalType: 'unjustifiedDismissal',
      },
      undefined as never,
      2026,
    );
    expect(result.proportionalBonus).toBe(3750);
    expect(result.severancePay).toBe(45000);
    expect(result.additionalSeverance).toBe(30000);
  });

  it('covers the Texas no-income-tax state engine', () => {
    const result = txStateEngine.calculate(
      {
        grossPayPerPeriod: 2000,
        payFrequency: 'biweekly',
        filingStatus: 'single',
        preTaxDeductionsPerPeriod: 0,
        stateCode: 'TX',
      },
      52000,
      0,
    );
    expect(result.annualStateIncomeTax).toBe(0);
    expect(result.effectiveStateRate).toBe(0);
  });
});
