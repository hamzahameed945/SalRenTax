import { describe, expect, it } from 'vitest';
import { brRescisaoEngine } from '../../src/calculators/labor/engines/brRescisao';

describe('Brazil rescisão validation', () => {
  const base = {
    grossMonthly: 3000,
    monthsWorked: 6,
    daysVacationPending: 10,
    dismissalType: 'demissaoSemJustaCausa' as const,
  };

  it('rejects negative vacation days', () => {
    const result = brRescisaoEngine.validate({ ...base, daysVacationPending: -1 });
    expect(result.valid).toBe(false);
  });

  it('rejects vacation days above 30', () => {
    const result = brRescisaoEngine.validate({ ...base, daysVacationPending: 31 });
    expect(result.valid).toBe(false);
  });
});
