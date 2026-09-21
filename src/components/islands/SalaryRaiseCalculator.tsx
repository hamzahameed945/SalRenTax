import { useState, useMemo } from 'preact/hooks';
import type { ErrorTranslations } from './types';
import { salaryRaiseEngine } from '../../calculators/salary/engines/salaryRaise';

export interface SalaryRaiseLabels {
  currentSalary: string;
  raiseType: string;
  raiseTypePercentage: string;
  raiseTypeFlat: string;
  raiseValuePct: string;
  raiseValueFlat: string;
  hoursPerWeek: string;
  resultsHeading: string;
  newAnnualSalary: string;
  totalIncrease: string;
  monthlyIncrease: string;
  biweeklyIncrease: string;
  hourlyIncrease: string;
  placeholder: string;
}

const DEFAULT_LABELS: SalaryRaiseLabels = {
  currentSalary:      'Current Annual Salary',
  raiseType:          'Raise Type',
  raiseTypePercentage: 'Percentage (%)',
  raiseTypeFlat:      'Flat Amount',
  raiseValuePct:      'Raise Percentage (%)',
  raiseValueFlat:     'Raise Amount',
  hoursPerWeek:       'Hours Per Week',
  resultsHeading:     'Raise Impact',
  newAnnualSalary:    'New Annual Salary',
  totalIncrease:      'Total Increase',
  monthlyIncrease:    'Monthly Increase',
  biweeklyIncrease:   'Bi-weekly Increase',
  hourlyIncrease:     'Hourly Increase',
  placeholder:        'Enter your current salary and expected raise to see the impact.',
};

export default function SalaryRaiseCalculator({
  t,
  locale,
  currency = 'USD',
  labels,
}: {
  t: ErrorTranslations;
  locale: string;
  currency?: string;
  labels?: Partial<SalaryRaiseLabels>;
}) {
  const l = { ...DEFAULT_LABELS, ...labels };

  const [currentSalary, setCurrentSalary] = useState('');
  const [raiseType, setRaiseType] = useState<'percentage' | 'flat'>('percentage');
  const [raiseValue, setRaiseValue] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');

  const result = useMemo(() => {
    const input = {
      currentSalary: parseFloat(currentSalary),
      hoursPerWeek:  parseFloat(hoursPerWeek),
      raisePercentage: raiseType === 'percentage' ? parseFloat(raiseValue) : undefined,
      newSalary: raiseType === 'flat' ? parseFloat(currentSalary) + parseFloat(raiseValue) : undefined,
    };
    if (Number.isNaN(input.raisePercentage) && Number.isNaN(input.newSalary)) {
      return { data: null, error: null };
    }
    const validation = salaryRaiseEngine.validate(input);
    if (validation.valid) {
      return {
        data: salaryRaiseEngine.calculate(validation.data, {} as never, new Date().getFullYear()),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [currentSalary, raiseType, raiseValue, hoursPerWeek]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  const formatPercent = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }).format(value / 100);

  return (
    <div class="grid gap-8 md:grid-cols-2">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{l.currentSalary}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={currentSalary}
            onInput={(e) => setCurrentSalary((e.target as HTMLInputElement).value)}
          />
          {result.error?.currentSalary && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.currentSalary] || result.error.currentSalary}
            </p>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{l.raiseType}</label>
          <select
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={raiseType}
            onChange={(e) => setRaiseType((e.target as HTMLSelectElement).value as 'percentage' | 'flat')}
          >
            <option value="percentage">{l.raiseTypePercentage}</option>
            <option value="flat">{l.raiseTypeFlat}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            {raiseType === 'percentage' ? l.raiseValuePct : l.raiseValueFlat}
          </label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={raiseValue}
            onInput={(e) => setRaiseValue((e.target as HTMLInputElement).value)}
          />
          {result.error?.raisePercentage && raiseType === 'percentage' && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.raisePercentage] || result.error.raisePercentage}
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
      </div>

      <div class="rounded-xl bg-slate-50 p-6">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">{l.resultsHeading}</h3>
        {result.data ? (
          <div class="space-y-4">
            <div>
              <p class="text-sm text-slate-500">{l.newAnnualSalary}</p>
              <p class="text-3xl font-bold text-accent">{formatCurrency(result.data.newSalary)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.totalIncrease}</p>
              <p class="font-medium text-green-600">
                +{formatCurrency(result.data.increaseAmount)} ({formatPercent(result.data.increasePercentage)})
              </p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.monthlyIncrease}</p>
              <p class="font-medium text-green-600">+{formatCurrency(result.data.monthlyDifference)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.biweeklyIncrease}</p>
              <p class="font-medium text-green-600">+{formatCurrency(result.data.biweeklyDifference)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.hourlyIncrease}</p>
              <p class="font-medium text-green-600">+{formatCurrency(result.data.hourlyDifference || 0)}</p>
            </div>
          </div>
        ) : (
          <p class="text-slate-500 text-sm">{l.placeholder}</p>
        )}
      </div>
    </div>
  );
}
