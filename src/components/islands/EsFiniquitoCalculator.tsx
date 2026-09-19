import { useMemo, useState } from 'preact/hooks';
import {
  esFiniquitoEngine,
  type EsDismissalType,
} from '../../calculators/labor/engines/esFiniquito';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

export default function EsFiniquitoCalculator() {
  const [grossAnnual, setGrossAnnual] = useState('30000');
  const [yearsWorked, setYearsWorked] = useState('5');
  const [daysHolidayPending, setDaysHolidayPending] = useState('10');
  const [dismissalType, setDismissalType] = useState<EsDismissalType>('unfairDismissal');

  const result = useMemo(() => {
    const validation = esFiniquitoEngine.validate({
      grossAnnual: Number(grossAnnual),
      yearsWorked: Number(yearsWorked),
      daysHolidayPending: Number(daysHolidayPending),
      dismissalType,
    });
    return validation.valid ? esFiniquitoEngine.calculate(validation.data, {} as never, 2026) : null;
  }, [grossAnnual, yearsWorked, daysHolidayPending, dismissalType]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="es-finiquito-gross">
          Salario bruto anual (€)
          <input
            id="es-finiquito-gross"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={grossAnnual}
            onInput={(event) => setGrossAnnual((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="es-finiquito-years">
          Años trabajados
          <input
            id="es-finiquito-years"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.1"
            value={yearsWorked}
            onInput={(event) => setYearsWorked((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="es-finiquito-vacation">
          Vacaciones pendientes (días)
          <input
            id="es-finiquito-vacation"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            max="365"
            value={daysHolidayPending}
            onInput={(event) => setDaysHolidayPending((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="es-finiquito-type">
          Situación
          <select
            id="es-finiquito-type"
            class="mt-1 w-full rounded border p-2"
            value={dismissalType}
            onChange={(event) => setDismissalType((event.target as HTMLSelectElement).value as EsDismissalType)}
          >
            <option value="voluntary">Baja voluntaria</option>
            <option value="objectiveDismissal">Despido objetivo</option>
            <option value="unfairDismissal">Despido improcedente</option>
          </select>
        </label>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Estimación total</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.totalFiniquito) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Pagas extra proporcionales</dt>
              <dd>{formatCurrency(result.proportionalPay)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Vacaciones</dt>
              <dd>{formatCurrency(result.holidayPay)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Indemnización</dt>
              <dd>{formatCurrency(result.severancePay)}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
