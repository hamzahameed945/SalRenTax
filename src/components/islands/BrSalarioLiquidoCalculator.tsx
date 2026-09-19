import { useMemo, useState } from 'preact/hooks';
import { brSalarioLiquidoEngine } from '../../calculators/salary/engines/brSalarioLiquido';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function BrSalarioLiquidoCalculator() {
  const [grossMonthly, setGrossMonthly] = useState('4000');

  const result = useMemo(() => {
    const validation = brSalarioLiquidoEngine.validate({ grossMonthly: Number(grossMonthly) });
    return validation.valid
      ? brSalarioLiquidoEngine.calculate(validation.data, {} as never, 2026)
      : null;
  }, [grossMonthly]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div>
        <label class="block text-sm font-medium" for="br-net-gross">
          Salário bruto mensal (R$)
          <input
            id="br-net-gross"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={grossMonthly}
            onInput={(event) => setGrossMonthly((event.target as HTMLInputElement).value)}
          />
        </label>
        <p class="mt-3 text-xs text-slate-500">
          Estimativa com INSS 2026 e IRRF 2026. Dependentes, pensão, outras deduções e benefícios não são modelados.
        </p>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Salário líquido estimado</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.netMonthly) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>INSS</dt>
              <dd>-{formatCurrency(result.inss)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>IRRF</dt>
              <dd>-{formatCurrency(result.irrf)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Base tributável estimada</dt>
              <dd>{formatCurrency(result.taxableIncome)}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
