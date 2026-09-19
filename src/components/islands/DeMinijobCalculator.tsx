import { useMemo, useState } from 'preact/hooks';
import { deMinijobEngine } from '../../calculators/salary/engines/deMinijob';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

export default function DeMinijobCalculator() {
  const [hourlyWage, setHourlyWage] = useState('13.90');
  const [hoursPerMonth, setHoursPerMonth] = useState('40');

  const result = useMemo(() => {
    const validation = deMinijobEngine.validate({
      hourlyWage: Number(hourlyWage),
      hoursPerMonth: Number(hoursPerMonth),
    });
    return validation.valid ? deMinijobEngine.calculate(validation.data, {} as never, 2026) : null;
  }, [hourlyWage, hoursPerMonth]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="de-minijob-wage">
          Stundenlohn
          <input
            id="de-minijob-wage"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={hourlyWage}
            onInput={(event) => setHourlyWage((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="de-minijob-hours">
          Stunden pro Monat
          <input
            id="de-minijob-hours"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.1"
            value={hoursPerMonth}
            onInput={(event) => setHoursPerMonth((event.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Monatlicher Bruttolohn</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.monthlyGross) : '—'}</p>
        {result && (
          <p class={result.withinLimit ? 'mt-3 text-sm text-emerald-700' : 'mt-3 text-sm text-red-700'}>
            {result.withinLimit ? 'Innerhalb der 603-€-Grenze.' : 'Über der 603-€-Grenze.'} Max. Stunden bei diesem Lohn: {result.hoursAtLimit.toFixed(1)}
          </p>
        )}
      </div>
    </div>
  );
}
