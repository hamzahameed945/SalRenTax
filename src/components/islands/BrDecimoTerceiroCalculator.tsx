import { useMemo, useState } from 'preact/hooks';
import { brDecimoTerceiroEngine } from '../../calculators/labor/engines/brDecimoTerceiro';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function BrDecimoTerceiroCalculator() {
  const [grossMonthly, setGrossMonthly] = useState('3000');
  const [monthsWorked, setMonthsWorked] = useState('12');

  const result = useMemo(() => {
    const validation = brDecimoTerceiroEngine.validate({
      grossMonthly: Number(grossMonthly),
      monthsWorked: Number(monthsWorked),
    });

    return validation.valid
      ? brDecimoTerceiroEngine.calculate(validation.data, {} as never, 2026)
      : null;
  }, [grossMonthly, monthsWorked]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="br-13-gross">
          Salário bruto mensal
          <input
            id="br-13-gross"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={grossMonthly}
            onInput={(event) => setGrossMonthly((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="br-13-months">
          Meses trabalhados (1–12)
          <input
            id="br-13-months"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            max="12"
            value={monthsWorked}
            onInput={(event) => setMonthsWorked((event.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">13º salário bruto</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.totalDecimoTerceiro) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>1ª parcela</dt>
              <dd>{formatCurrency(result.firstInstallment)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>2ª parcela</dt>
              <dd>{formatCurrency(result.secondInstallment)}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
