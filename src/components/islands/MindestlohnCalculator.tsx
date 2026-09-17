import { useState, useMemo } from 'preact/hooks';
import { mindestlohnEngine } from '../../calculators/salary/engines/de/mindestlohn';
import { deDE } from '../../i18n/de-DE';

export default function MindestlohnCalculator({ locale }: { locale: string }) {
  const t = deDE.salary.mindestlohn;
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [weeksPerYear, setWeeksPerYear] = useState('52');

  const result = useMemo(() => {
    const input = {
      hoursPerWeek: parseFloat(hoursPerWeek),
      weeksPerYear: parseFloat(weeksPerYear),
    };
    const validation = mindestlohnEngine.validate(input);
    if (validation.valid) {
      return {
        data: mindestlohnEngine.calculate(validation.data, {} as never, 2026),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [hoursPerWeek, weeksPerYear]);

  const fmt = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div class="grid gap-8 md:grid-cols-2">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.hoursPerWeek}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={hoursPerWeek}
            onInput={(e) => setHoursPerWeek((e.target as HTMLInputElement).value)}
            placeholder="z. B. 40"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.weeksPerYear}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={weeksPerYear}
            onInput={(e) => setWeeksPerYear((e.target as HTMLInputElement).value)}
            placeholder="z. B. 52"
          />
        </div>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" role="region" aria-live="polite">
        {result.data ? (
          <div class="space-y-4">
            <div>
              <p class="text-sm text-slate-500">{t.results.hourlyWage}</p>
              <p class="text-3xl font-bold text-accent">{fmt(result.data.hourlyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{t.results.weeklyWage}</p>
              <p class="font-medium text-slate-900">{fmt(result.data.weeklyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{t.results.monthlyWage}</p>
              <p class="font-medium text-slate-900">{fmt(result.data.monthlyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{t.results.annualWage}</p>
              <p class="font-medium text-slate-900">{fmt(result.data.annualWage)}</p>
            </div>
            <p class="pt-2 text-sm text-slate-500">
              {result.data.aboveMinijobLimit ? t.results.aboveMinijobLimit : t.results.belowMinijobLimit}
            </p>
          </div>
        ) : (
          <p class="text-slate-500 text-sm">Geben Sie Ihre Wochenstunden ein, um den Lohn zu berechnen.</p>
        )}
      </div>
    </div>
  );
}
