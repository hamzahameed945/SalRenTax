import { useMemo, useState } from 'preact/hooks';
import { brHorasExtrasEngine } from '../../calculators/labor/engines/brHorasExtras';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function BrHorasExtrasCalculator() {
  const [monthlySalary, setMonthlySalary] = useState('3000');
  const [monthlyHours, setMonthlyHours] = useState('220');
  const [overtimeHours, setOvertimeHours] = useState('10');
  const [premiumPercent, setPremiumPercent] = useState('50');

  const result = useMemo(() => {
    const validation = brHorasExtrasEngine.validate({
      monthlySalary: Number(monthlySalary),
      monthlyHours: Number(monthlyHours),
      overtimeHours: Number(overtimeHours),
      premiumPercent: Number(premiumPercent),
    });

    return validation.valid ? brHorasExtrasEngine.calculate(validation.data, {} as never, 2026) : null;
  }, [monthlySalary, monthlyHours, overtimeHours, premiumPercent]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="br-extra-salary">
          Salário mensal
          <input
            id="br-extra-salary"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={monthlySalary}
            onInput={(event) => setMonthlySalary((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="br-extra-hours">
          Horas mensais
          <input
            id="br-extra-hours"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            value={monthlyHours}
            onInput={(event) => setMonthlyHours((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="br-extra-overtime">
          Horas extras
          <input
            id="br-extra-overtime"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            value={overtimeHours}
            onInput={(event) => setOvertimeHours((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="br-extra-premium">
          Adicional (%)
          <input
            id="br-extra-premium"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="1"
            value={premiumPercent}
            onInput={(event) => setPremiumPercent((event.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Pagamento por horas extras</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.overtimePay) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Hora normal</dt>
              <dd>{formatCurrency(result.hourlyRate)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Hora extra</dt>
              <dd>{formatCurrency(result.overtimeRate)}</dd>
            </div>
          </dl>
        )}
        <p class="mt-3 text-xs text-slate-500">
          O adicional padrão do formulário é 50%; ajuste conforme seu acordo ou categoria profissional.
        </p>
      </div>
    </div>
  );
}
