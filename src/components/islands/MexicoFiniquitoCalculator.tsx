import { useMemo, useState } from 'preact/hooks';
import {
  mxFiniquitoEngine,
  type MxDismissalType,
} from '../../calculators/labor/engines/mxFiniquito';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

export default function MexicoFiniquitoCalculator() {
  const [dailyWage, setDailyWage] = useState('500');
  const [yearsWorked, setYearsWorked] = useState('3');
  const [daysVacationPending, setDaysVacationPending] = useState('8');
  const [monthsWorkedThisYear, setMonthsWorkedThisYear] = useState('6');
  const [dismissalType, setDismissalType] = useState<MxDismissalType>('unjustifiedDismissal');

  const result = useMemo(() => {
    const validation = mxFiniquitoEngine.validate({
      dailyWage: Number(dailyWage),
      yearsWorked: Number(yearsWorked),
      daysVacationPending: Number(daysVacationPending),
      monthsWorkedThisYear: Number(monthsWorkedThisYear),
      dismissalType,
    });
    return validation.valid ? mxFiniquitoEngine.calculate(validation.data, {} as never, 2026) : null;
  }, [dailyWage, yearsWorked, daysVacationPending, monthsWorkedThisYear, dismissalType]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="mx-liquidacion-daily">
          Salario diario integrado (MXN)
          <input
            id="mx-liquidacion-daily"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={dailyWage}
            onInput={(event) => setDailyWage((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="mx-liquidacion-years">
          Años trabajados
          <input
            id="mx-liquidacion-years"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.1"
            value={yearsWorked}
            onInput={(event) => setYearsWorked((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="mx-liquidacion-vacation">
          Vacaciones pendientes (días)
          <input
            id="mx-liquidacion-vacation"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            max="60"
            value={daysVacationPending}
            onInput={(event) => setDaysVacationPending((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="mx-liquidacion-months">
          Meses trabajados este año
          <input
            id="mx-liquidacion-months"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            max="12"
            value={monthsWorkedThisYear}
            onInput={(event) => setMonthsWorkedThisYear((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="mx-liquidacion-type">
          Situación
          <select
            id="mx-liquidacion-type"
            class="mt-1 w-full rounded border p-2"
            value={dismissalType}
            onChange={(event) => setDismissalType((event.target as HTMLSelectElement).value as MxDismissalType)}
          >
            <option value="voluntary">Renuncia</option>
            <option value="justifiedDismissal">Despido justificado</option>
            <option value="unjustifiedDismissal">Despido injustificado</option>
          </select>
        </label>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Estimación total</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.totalLiquidacion) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Aguinaldo proporcional</dt>
              <dd>{formatCurrency(result.proportionalBonus)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Vacaciones</dt>
              <dd>{formatCurrency(result.proportionalVacations)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Prima vacacional</dt>
              <dd>{formatCurrency(result.vacationBonus)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Indemnización 90 días</dt>
              <dd>{formatCurrency(result.severancePay)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>20 días/año</dt>
              <dd>{formatCurrency(result.additionalSeverance)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Prima de antigüedad</dt>
              <dd>{formatCurrency(result.seniorityPremium)}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
