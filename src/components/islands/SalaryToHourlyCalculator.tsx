import { useState, useMemo } from 'preact/hooks';
import type { ErrorTranslations } from './types';
import { salaryToHourlyEngine } from '../../calculators/salary/engines/salaryToHourly';

export default function SalaryToHourlyCalculator({
  t = { errors: {} },
  locale = 'en-US',
  currency = 'USD',
}: {
  t?: ErrorTranslations;
  locale?: string;
  currency?: string;
}) {
  const [annualSalary, setAnnualSalary] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [weeksPerYear, setWeeksPerYear] = useState('52');

  const result = useMemo(() => {
    const input = {
      annualSalary: parseFloat(annualSalary),
      hoursPerWeek: parseFloat(hoursPerWeek),
      weeksPerYear: parseFloat(weeksPerYear),
    };

    const validation = salaryToHourlyEngine.validate(input);
    if (validation.valid) {
      return {
        data: salaryToHourlyEngine.calculate(
          validation.data,
          {} as never,
          new Date().getFullYear(),
        ),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [annualSalary, hoursPerWeek, weeksPerYear]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);

  return (
    <div class="grid gap-8 md:grid-cols-2">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{locale === 'de-DE' ? 'Jahresgehalt (€)' : 'Annual Salary ($)'}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={annualSalary}
            onInput={(e) => setAnnualSalary((e.target as HTMLInputElement).value)}
            placeholder="e.g. 60000"
          />
          {result.error?.annualSalary && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.annualSalary] || result.error.annualSalary}
            </p>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{locale === 'de-DE' ? 'Stunden pro Woche' : 'Hours Per Week'}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={hoursPerWeek}
            onInput={(e) => setHoursPerWeek((e.target as HTMLInputElement).value)}
            placeholder="e.g. 40"
          />
          {result.error?.hoursPerWeek && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.hoursPerWeek] || result.error.hoursPerWeek}
            </p>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{locale === 'de-DE' ? 'Arbeitswochen pro Jahr' : 'Weeks Per Year'}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={weeksPerYear}
            onInput={(e) => setWeeksPerYear((e.target as HTMLInputElement).value)}
            placeholder="e.g. 52"
          />
          {result.error?.weeksPerYear && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.weeksPerYear] || result.error.weeksPerYear}
            </p>
          )}
        </div>
      </div>

      <div class="rounded-xl bg-slate-50 p-6">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">{locale === 'de-DE' ? 'Stundenlohn und Gehaltsäquivalente' : 'Hourly Equivalents'}</h3>
        {result.data ? (
          <div class="space-y-4">
            <div>
              <p class="text-sm text-slate-500">{locale === 'de-DE' ? 'Stundenlohn' : 'Hourly Wage'}</p>
              <p class="text-3xl font-bold text-accent">{formatCurrency(result.data.hourlyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{locale === 'de-DE' ? 'Täglich' : 'Daily'}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.dailyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{locale === 'de-DE' ? 'Wöchentlich' : 'Weekly'}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.weeklyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{locale === 'de-DE' ? 'Alle zwei Wochen' : 'Bi-weekly'}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.biweeklyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{locale === 'de-DE' ? 'Monatlich' : 'Monthly'}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.monthlyWage)}</p>
            </div>
          </div>
        ) : (
          <p class="text-slate-500 text-sm">
            {locale === 'de-DE' ? 'Geben Sie Jahresgehalt und Arbeitszeit ein, um die Äquivalente zu sehen.' : 'Enter your annual salary and hours to see the equivalents.'}
          </p>
        )}
      </div>
    </div>
  );
}
