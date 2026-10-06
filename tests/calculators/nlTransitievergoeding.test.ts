import { describe, expect, it } from 'vitest';
import {
  transitievergoedingEngine,
  NL_TRANSITIEVERGOEDING_MAX_2026,
} from '../../src/calculators/salary/engines/nl/nlTransitievergoeding';

describe('transitievergoeding engine', () => {
  it('computes 1/3 monthly salary per service year', () => {
    // €4000/mo, 6 years -> 4000/3 x 6 = €8000
    const r = transitievergoedingEngine.calculate(
      { brutoMaandsalaris: 4000, dienstjaren: 6 },
      {} as never,
      2026,
    );
    expect(r.brutoVergoeding).toBe(8000);
    expect(r.capped).toBe(false);
    expect(r.dienstverbandJaren).toBe(6);
  });

  it('pro-rates partial years to the month', () => {
    // €4000/mo, 6 years 6 months -> 4000/3 x 6.5 = €8666.67
    const r = transitievergoedingEngine.calculate(
      { brutoMaandsalaris: 4000, dienstjaren: 6, dienstmaandenExtra: 6 },
      {} as never,
      2026,
    );
    expect(r.brutoVergoeding).toBeCloseTo(8666.67, 1);
    expect(r.dienstverbandJaren).toBe(6.5);
  });

  it('caps at the 2026 statutory maximum of €102.000', () => {
    expect(NL_TRANSITIEVERGOEDING_MAX_2026).toBe(102000);
    // €6000/mo, 60 years -> raw 120000, jaarsalaris €72000 -> capped at €102000
    const r = transitievergoedingEngine.calculate(
      { brutoMaandsalaris: 6000, dienstjaren: 60 },
      {} as never,
      2026,
    );
    expect(r.onafgerondeVergoeding).toBe(120000);
    expect(r.capped).toBe(true);
    expect(r.maxBedrag).toBe(102000);
    expect(r.brutoVergoeding).toBe(102000);
  });

  it('uses the gross annual salary as cap when it exceeds €102.000', () => {
    // €30000/mo, 40 years -> raw 400000, jaarsalaris €360000 -> capped at €360000
    const r = transitievergoedingEngine.calculate(
      { brutoMaandsalaris: 30000, dienstjaren: 40 },
      {} as never,
      2026,
    );
    expect(r.brutoJaarsalaris).toBe(360000);
    expect(r.maxBedrag).toBe(360000);
    expect(r.capped).toBe(true);
    expect(r.brutoVergoeding).toBe(360000);
  });

  it('handles zero service time', () => {
    const r = transitievergoedingEngine.calculate(
      { brutoMaandsalaris: 4000, dienstjaren: 0, dienstmaandenExtra: 0 },
      {} as never,
      2026,
    );
    expect(r.brutoVergoeding).toBe(0);
    expect(r.capped).toBe(false);
  });

  it('validates input', () => {
    expect(transitievergoedingEngine.validate({ brutoMaandsalaris: 4000, dienstjaren: 6 }).valid).toBe(true);
    expect(transitievergoedingEngine.validate({ brutoMaandsalaris: 4000, dienstjaren: 6, dienstmaandenExtra: 12 }).valid).toBe(false);
    expect(transitievergoedingEngine.validate({ brutoMaandsalaris: -100, dienstjaren: 6 }).valid).toBe(false);
    expect(transitievergoedingEngine.validate({ brutoMaandsalaris: 4000, dienstjaren: 6.5 }).valid).toBe(false);
  });
});
