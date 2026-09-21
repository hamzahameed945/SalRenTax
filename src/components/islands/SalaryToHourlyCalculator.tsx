import { useState, useMemo } from 'preact/hooks';
import type { ErrorTranslations } from './types';
import { salaryToHourlyEngine } from '../../calculators/salary/engines/salaryToHourly';

export interface SalaryToHourlyLabels {
  annualSalary: string;
  hoursPerWeek: string;
  weeksPerYear: string;
  resultsHeading: string;
  hourlyWage: string;
  daily: string;
  weekly: string;
  biweekly: string;
  monthly: string;
  placeholder: string;
}

const DEFAULT_LABELS: SalaryToHourlyLabels = {
  annualSalary:   'Annual Salary',
  hoursPerWeek:   'Hours Per Week',
  weeksPerYear:   'Weeks Per Year',
  resultsHeading: 'Hourly Equivalents',
  hourlyWage:     'Hourly Wage',
  daily:          'Daily',
  weekly:         'Weekly',
  biweekly:       'Bi-weekly',
  monthly:        'Monthly',
  placeholder:    'Enter your annual salary and hours to see the equivalents.',
};

export default function SalaryToHourlyCalculator({
  t = { errors: {} },
  locale = 'en-US',
  currency = 'USD',
  labels,
}: {
  t?: ErrorTranslations;
  locale?: string;
  currency?: string;
  labels?: Partial<SalaryToHourlyLabels>;
}) {
  const l = { ...DEFAULT_LABELS, ...labels };

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
        data: salaryToHourlyEngine.calculate(validation.data, {} as never, new Date().getFullYear()),
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
          <label class="block text-sm font-medium text-slate-700 mb-1">{l.annualSalary}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={annualSalary}
            onInput={(e) => setAnnualSalary((e.target as HTMLInputElement).value)}
          />
          {result.error?.annualSalary && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.annualSalary] || result.error.annualSalary}
            </p>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{l.hoursPerWeek}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={hoursPerWeek}
            onInput={(e) => setHoursPerWeek((e.target as HTMLInputElement).value)}
          />
          {result.error?.hoursPerWeek && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.hoursPerWeek] || result.error.hoursPerWeek}
            </p>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{l.weeksPerYear}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={weeksPerYear}
            onInput={(e) => setWeeksPerYear((e.target as HTMLInputElement).value)}
          />
          {result.error?.weeksPerYear && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.weeksPerYear] || result.error.weeksPerYear}
            </p>
          )}
        </div>
      </div>

      <div class="rounded-xl bg-slate-50 p-6">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">{l.resultsHeading}</h3>
        {result.data ? (
          <div class="space-y-4">
            <div>
              <p class="text-sm text-slate-500">{l.hourlyWage}</p>
              <p class="text-3xl font-bold text-accent">{formatCurrency(result.data.hourlyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.daily}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.dailyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.weekly}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.weeklyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.biweekly}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.biweeklyWage)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.monthly}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.monthlyWage)}</p>
            </div>
          </div>
        ) : (
          <p class="text-slate-500 text-sm">{l.placeholder}</p>
        )}
      </div>
    </div>
  );
}
