import { describe, expect, it } from 'vitest';
import { brSalarioLiquidoEngine } from '../../src/calculators/salary/engines/brSalarioLiquido';
describe('Brazil net salary 2026',()=>{
  it('handles a low salary with no IRRF',()=>{const r=brSalarioLiquidoEngine.calculate({grossMonthly:3036}, {} as never, 2026);expect(r.inss).toBeCloseTo(252.92,1);expect(r.irrf).toBe(0);});
  it('handles a mid-range salary with the 2026 reduction',()=>{const r=brSalarioLiquidoEngine.calculate({grossMonthly:4000}, {} as never, 2026);expect(r.inss).toBeCloseTo(368.60,1);expect(r.irrf).toBe(0);expect(r.netMonthly).toBeCloseTo(3631.40,1);});
});
