import { useMemo, useState } from 'preact/hooks';
import { brHorasExtrasEngine } from '../../calculators/labor/engines/brHorasExtras';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function BrHorasExtrasCalculator() {
  const [monthlySalary, setMonthlySalary] = useState('3000');
  const [monthlyHours, setMonthlyHours] = useState('220');
  const [overtimeHours, setOvertimeHours] = useState('10');
  const [premiumPercent, setPremiumPercent] = useState('50');
  const [submitted, setSubmitted] = useState({
    monthlySalary,
    monthlyHours,
    overtimeHours,
    premiumPercent,
  });

  const result = useMemo(() => {
    const validation = brHorasExtrasEngine.validate({
      monthlySalary: Number(submitted.monthlySalary),
      monthlyHours: Number(submitted.monthlyHours),
      overtimeHours: Number(submitted.overtimeHours),
      premiumPercent: Number(submitted.premiumPercent),
    });
    return validation.valid
      ? brHorasExtrasEngine.calculate(validation.data, {} as never, 2026)
      : null;
  }, [submitted]);

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
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
            onClick={() => setSubmitted({ monthlySalary, monthlyHours, overtimeHours, premiumPercent })}
          >
            Calcular
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setMonthlySalary('3000');
              setMonthlyHours('220');
              setOvertimeHours('10');
              setPremiumPercent('50');
              setSubmitted({ monthlySalary: '3000', monthlyHours: '220', overtimeHours: '10', premiumPercent: '50' });
            }}
          >
            Limpar
          </button>
        </div>
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
