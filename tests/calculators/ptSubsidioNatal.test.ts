import { describe, expect, it } from 'vitest';
import { ptSubsidioNatalEngine } from '../../src/calculators/labor/engines/ptSubsidioNatal';

describe('ptSubsidioNatalEngine', () => {
  it('pays one full month of salary for a full year (12 months)', () => {
    const result = ptSubsidioNatalEngine.calculate(
      { baseMonthly: 1400, monthsWorked: 12, duodecimos: false },
      undefined as never,
      2026,
    );
    expect(result.subsidioBruto).toBe(1400);
    expect(result.duodecimoMensal).toBe(0);
  });

  it('pays proportionally for a partial year', () => {
    const result = ptSubsidioNatalEngine.calculate(
      { baseMonthly: 1200, monthsWorked: 6, duodecimos: false },
      undefined as never,
      2026,
    );
    expect(result.subsidioBruto).toBe(600);
  });

  it('computes monthly duodécimos as 1/12 of the proportional subsidy', () => {
    const result = ptSubsidioNatalEngine.calculate(
      { baseMonthly: 1200, monthsWorked: 6, duodecimos: true },
      undefined as never,
      2026,
    );
    expect(result.subsidioBruto).toBe(600);
    expect(result.duodecimoMensal).toBe(50);
  });

  it('computes monthly duodécimos as 1/12 of the full subsidy for a full year', () => {
    const result = ptSubsidioNatalEngine.calculate(
      { baseMonthly: 2400, monthsWorked: 12, duodecimos: true },
      undefined as never,
      2026,
    );
    expect(result.subsidioBruto).toBe(2400);
    expect(result.duodecimoMensal).toBe(200);
  });

  it('returns zero subsidy for zero months worked', () => {
    const result = ptSubsidioNatalEngine.calculate(
      { baseMonthly: 1400, monthsWorked: 0, duodecimos: false },
      undefined as never,
      2026,
    );
    expect(result.subsidioBruto).toBe(0);
  });

  it('echoes the input fields in the result', () => {
    const result = ptSubsidioNatalEngine.calculate(
      { baseMonthly: 1000, monthsWorked: 9, duodecimos: true },
      undefined as never,
      2026,
    );
    expect(result.baseMonthly).toBe(1000);
    expect(result.monthsWorked).toBe(9);
    expect(result.duodecimos).toBe(true);
  });

  describe('validation', () => {
    it('accepts valid input', () => {
      const v = ptSubsidioNatalEngine.validate({ baseMonthly: 1400, monthsWorked: 12, duodecimos: false });
      expect(v.valid).toBe(true);
    });

    it('rejects non-positive base salary', () => {
      const v = ptSubsidioNatalEngine.validate({ baseMonthly: 0, monthsWorked: 12, duodecimos: false });
      expect(v.valid).toBe(false);
      if (!v.valid) expect(v.errors.baseMonthly).toBe('errors.mustBePositive');
    });

    it('rejects months worked above 12', () => {
      const v = ptSubsidioNatalEngine.validate({ baseMonthly: 1400, monthsWorked: 13, duodecimos: false });
      expect(v.valid).toBe(false);
      if (!v.valid) expect(v.errors.monthsWorked).toBe('errors.invalidNumber');
    });

    it('rejects negative months worked', () => {
      const v = ptSubsidioNatalEngine.validate({ baseMonthly: 1400, monthsWorked: -1, duodecimos: false });
      expect(v.valid).toBe(false);
      if (!v.valid) expect(v.errors.monthsWorked).toBe('errors.invalidNumber');
    });

    it('rejects NaN inputs', () => {
      const v = ptSubsidioNatalEngine.validate({ baseMonthly: NaN, monthsWorked: NaN, duodecimos: false });
      expect(v.valid).toBe(false);
    });
  });
});
