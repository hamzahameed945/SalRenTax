import { useMemo, useState } from 'preact/hooks';
import { ptSubsidioNatalEngine } from '../../calculators/labor/engines/ptSubsidioNatal';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

interface Props {
  initialSalary?: number;
}

export default function PtSubsidioNatalCalculator({ initialSalary }: Props) {
  const [baseMonthly, setBaseMonthly] = useState(String(initialSalary ?? 1400));
  const [monthsWorked, setMonthsWorked] = useState('12');
  const [duodecimos, setDuodecimos] = useState(false);

  const result = useMemo(() => {
    const validation = ptSubsidioNatalEngine.validate({
      baseMonthly: Number(baseMonthly),
      monthsWorked: Number(monthsWorked),
      duodecimos,
    });
    return validation.valid ? ptSubsidioNatalEngine.calculate(validation.data) : null;
  }, [baseMonthly, monthsWorked, duodecimos]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="pt-sn-salario">
          Retribuição base mensal ilíquida (€)
          <input
            id="pt-sn-salario"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={baseMonthly}
            onInput={(e) => setBaseMonthly((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="pt-sn-meses">
          Meses trabalhados em 2026 (0–12)
          <input
            id="pt-sn-meses"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            max="12"
            step="1"
            value={monthsWorked}
            onInput={(e) => setMonthsWorked((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="flex items-center gap-2 text-sm font-medium" for="pt-sn-duodecimos">
          <input
            id="pt-sn-duodecimos"
            type="checkbox"
            class="h-4 w-4"
            checked={duodecimos}
            onChange={(e) => setDuodecimos((e.target as HTMLInputElement).checked)}
          />
          Receber em duodécimos (1/12 por mês)
        </label>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Subsídio de Natal bruto — 2026</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.subsidioBruto) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Retribuição base mensal</dt>
              <dd>{formatCurrency(result.baseMonthly)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Meses trabalhados</dt>
              <dd>{result.monthsWorked} de 12</dd>
            </div>
            {result.duodecimos && (
              <div class="flex justify-between">
                <dt>Duodécimo mensal</dt>
                <dd>{formatCurrency(result.duodecimoMensal)}</dd>
              </div>
            )}
          </dl>
        )}
        <p class="mt-4 text-xs text-slate-500">
          Estimativa bruta segundo o Código do Trabalho, art. 263.º. O subsídio de Natal está sujeito a retenção de IRS e a descontos para a Segurança Social, como o salário.
        </p>
      </div>
    </div>
  );
}
