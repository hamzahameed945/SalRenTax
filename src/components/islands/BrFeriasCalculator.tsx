import { useMemo, useState } from 'preact/hooks';
import { brFeriasEngine } from '../../calculators/labor/engines/brFerias';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function BrFeriasCalculator() {
  const [monthlySalary, setMonthlySalary] = useState('3000');
  const [vacationDays, setVacationDays] = useState('30');

  const result = useMemo(() => {
    const validation = brFeriasEngine.validate({
      monthlySalary: Number(monthlySalary),
      vacationDays: Number(vacationDays),
    });

    return validation.valid ? brFeriasEngine.calculate(validation.data, {} as never, 2026) : null;
  }, [monthlySalary, vacationDays]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="br-ferias-salary">
          Salário mensal
          <input
            id="br-ferias-salary"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={monthlySalary}
            onInput={(event) => setMonthlySalary((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="br-ferias-days">
          Dias de férias
          <input
            id="br-ferias-days"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            max="30"
            value={vacationDays}
            onInput={(event) => setVacationDays((event.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Férias brutas</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.totalGross) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Remuneração de férias</dt>
              <dd>{formatCurrency(result.baseVacationPay)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>1/3 constitucional</dt>
              <dd>{formatCurrency(result.oneThirdBonus)}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
