import { useState, useMemo } from 'preact/hooks';
import type { ErrorTranslations } from './types';
import { hourlyToSalaryEngine } from '../../calculators/salary/engines/hourlyToSalary';

export default function HourlyToSalaryCalculator({ t, locale }: { t: ErrorTranslations; locale: string }) {
  const [hourlyWage, setHourlyWage] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [weeksPerYear, setWeeksPerYear] = useState('52');

  const result = useMemo(() => {
    const input = {
      hourlyWage: parseFloat(hourlyWage),
      hoursPerWeek: parseFloat(hoursPerWeek),
      weeksPerYear: parseFloat(weeksPerYear),
    };

    const validation = hourlyToSalaryEngine.validate(input);
    if (validation.valid) {
      return {
        data: hourlyToSalaryEngine.calculate(
          validation.data,
          {} as never,
          new Date().getFullYear(),
        ),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [hourlyWage, hoursPerWeek, weeksPerYear]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div class="grid gap-8 md:grid-cols-2">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Hourly Wage ($)</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={hourlyWage}
            onInput={(e) => setHourlyWage((e.target as HTMLInputElement).value)}
            placeholder="e.g. 25"
          />
          {result.error?.hourlyWage && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.hourlyWage] || result.error.hourlyWage}
            </p>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Hours Per Week</label>
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
          <label class="block text-sm font-medium text-slate-700 mb-1">Weeks Per Year</label>
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
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Salary Equivalents</h3>
        {result.data ? (
          <div class="space-y-4">
            <div>
              <p class="text-sm text-slate-500">Annual Salary</p>
              <p class="text-3xl font-bold text-accent">
                {formatCurrency(result.data.annualSalary)}
              </p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">Monthly</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.monthlyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">Bi-weekly</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.biweeklyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">Weekly</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.weeklyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">Daily</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.dailyWage)}</p>
            </div>
          </div>
        ) : (
          <p class="text-slate-500 text-sm">
            Enter your hourly wage and hours to see the equivalents.
          </p>
        )}
      </div>
    </div>
  );
}
