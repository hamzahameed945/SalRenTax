import { useMemo, useState } from 'preact/hooks';
import { dePartTimeSalaryEngine } from '../../calculators/salary/engines/dePartTimeSalary';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

export default function DePartTimeSalaryCalculator() {
  const [fullTimeMonthlyGross, setFullTimeMonthlyGross] = useState('4000');
  const [fullTimeHoursPerWeek, setFullTimeHoursPerWeek] = useState('40');
  const [partTimeHoursPerWeek, setPartTimeHoursPerWeek] = useState('20');

  const [submitted, setSubmitted] = useState({
    fullTimeMonthlyGross,
    fullTimeHoursPerWeek,
    partTimeHoursPerWeek,
  });

  const result = useMemo(() => {
    const validation = dePartTimeSalaryEngine.validate({
      fullTimeMonthlyGross: Number(submitted.fullTimeMonthlyGross),
      fullTimeHoursPerWeek: Number(submitted.fullTimeHoursPerWeek),
      partTimeHoursPerWeek: Number(submitted.partTimeHoursPerWeek),
    });
    return validation.valid
      ? dePartTimeSalaryEngine.calculate(validation.data, {} as never, 2026)
      : null;
  }, [submitted]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="de-parttime-gross">
          Vollzeit-Bruttogehalt / Monat
          <input
            id="de-parttime-gross"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={fullTimeMonthlyGross}
            onInput={(event) => setFullTimeMonthlyGross((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="de-parttime-fullhours">
          Vollzeitstunden / Woche
          <input
            id="de-parttime-fullhours"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            value={fullTimeHoursPerWeek}
            onInput={(event) => setFullTimeHoursPerWeek((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="de-parttime-hours">
          Teilzeitstunden / Woche
          <input
            id="de-parttime-hours"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            value={partTimeHoursPerWeek}
            onInput={(event) => setPartTimeHoursPerWeek((event.target as HTMLInputElement).value)}
          />
        </label>
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
            onClick={() => setSubmitted({ fullTimeMonthlyGross, fullTimeHoursPerWeek, partTimeHoursPerWeek })}
          >
            Berechnen
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setFullTimeMonthlyGross('4000');
              setFullTimeHoursPerWeek('40');
              setPartTimeHoursPerWeek('20');
              setSubmitted({ fullTimeMonthlyGross: '4000', fullTimeHoursPerWeek: '40', partTimeHoursPerWeek: '20' });
            }}
          >
            Zurücksetzen
          </button>
        </div>
      </div>
      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Teilzeit-Bruttogehalt</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.partTimeMonthlyGross) : '—'}</p>
        {result && (
          <div class="mt-4 space-y-1 text-sm text-slate-600">
            <p>Jahresgehalt (Teilzeit): {formatCurrency(result.annualGross)}</p>
            <p>Reduktion gegenüber Vollzeit: {result.reductionPercent.toFixed(1)} %</p>
          </div>
        )}
      </div>
    </div>
  );
}
