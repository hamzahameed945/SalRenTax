import { useState, useMemo } from 'preact/hooks';
import type { ErrorTranslations } from './types';
import { payFrequencyConverterEngine } from '../../calculators/salary/engines/payFrequencyConverter';
import type { PayFrequency } from '../../calculators/core/frequency';

export interface PayFrequencyLabels {
  payAmount: string;
  currentFrequency: string;
  hoursPerWeek: string;
  resultsHeading: string;
  annually: string;
  monthly: string;
  semimonthly: string;
  biweekly: string;
  weekly: string;
  daily: string;
  hourly: string;
  placeholder: string;
}

const DEFAULT_LABELS: PayFrequencyLabels = {
  payAmount:        'Pay Amount',
  currentFrequency: 'Current Pay Frequency',
  hoursPerWeek:     'Hours Per Week',
  resultsHeading:   'Frequency Equivalents',
  annually:         'Annually',
  monthly:          'Monthly',
  semimonthly:      'Semi-monthly (twice a month)',
  biweekly:         'Bi-weekly (every two weeks)',
  weekly:           'Weekly',
  daily:            'Daily',
  hourly:           'Hourly',
  placeholder:      'Enter your pay and frequency to see all equivalents.',
};

export default function PayFrequencyConverter({
  t,
  locale,
  currency = 'USD',
  labels,
}: {
  t: ErrorTranslations;
  locale: string;
  currency?: string;
  labels?: Partial<PayFrequencyLabels>;
}) {
  const l = { ...DEFAULT_LABELS, ...labels };

  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<PayFrequency>('biweekly');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');

  const result = useMemo(() => {
    const input = {
      amount: parseFloat(amount),
      frequency,
      hoursPerWeek: parseFloat(hoursPerWeek),
    };
    const validation = payFrequencyConverterEngine.validate(input);
    if (validation.valid) {
      return {
        data: payFrequencyConverterEngine.calculate(validation.data, {} as never, new Date().getFullYear()),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [amount, frequency, hoursPerWeek]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);

  return (
    <div class="grid gap-8 md:grid-cols-2">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{l.payAmount}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={amount}
            onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
          />
          {result.error?.amount && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.amount] || result.error.amount}
            </p>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{l.currentFrequency}</label>
          <select
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={frequency}
            onChange={(e) => setFrequency((e.target as HTMLSelectElement).value as PayFrequency)}
          >
            <option value="annually">{l.annually}</option>
            <option value="monthly">{l.monthly}</option>
            <option value="semimonthly">{l.semimonthly}</option>
            <option value="biweekly">{l.biweekly}</option>
            <option value="weekly">{l.weekly}</option>
            <option value="daily">{l.daily}</option>
            <option value="hourly">{l.hourly}</option>
          </select>
          {result.error?.frequency && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.frequency] || result.error.frequency}
            </p>
          )}
        </div>

        {frequency === 'hourly' && (
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
        )}
      </div>

      <div class="rounded-xl bg-slate-50 p-6">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">{l.resultsHeading}</h3>
        {result.data ? (
          <div class="space-y-4">
            <div>
              <p class="text-sm text-slate-500">{l.annually}</p>
              <p class="text-3xl font-bold text-accent">{formatCurrency(result.data.annually)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.monthly}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.monthly)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.semimonthly}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.semimonthly)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.biweekly}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.biweekly)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.weekly}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.weekly)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.daily}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.daily)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">{l.hourly}</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.hourly)}</p>
            </div>
          </div>
        ) : (
          <p class="text-slate-500 text-sm">{l.placeholder}</p>
        )}
      </div>
    </div>
  );
}
