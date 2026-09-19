import { useState, useMemo } from 'preact/hooks';
import type { ErrorTranslations } from './types';
import { payFrequencyConverterEngine } from '../../calculators/salary/engines/payFrequencyConverter';
import type { PayFrequency } from '../../calculators/core/frequency';

export default function PayFrequencyConverter({ t, locale }: { t: ErrorTranslations; locale: string }) {
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
        data: payFrequencyConverterEngine.calculate(
          validation.data,
          {} as never,
          new Date().getFullYear(),
        ),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [amount, frequency, hoursPerWeek]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div class="grid gap-8 md:grid-cols-2">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Pay Amount ($)</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={amount}
            onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
            placeholder="e.g. 2000"
          />
          {result.error?.amount && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.amount] || result.error.amount}
            </p>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Current Pay Frequency</label>
          <select
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={frequency}
            onChange={(e) => setFrequency((e.target as HTMLSelectElement).value as PayFrequency)}
          >
            <option value="annually">Annually</option>
            <option value="monthly">Monthly</option>
            <option value="semimonthly">Semi-monthly (twice a month)</option>
            <option value="biweekly">Bi-weekly (every two weeks)</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
            <option value="hourly">Hourly</option>
          </select>
          {result.error?.frequency && (
            <p class="mt-1 text-sm text-red-600">
              {t.errors?.[result.error.frequency] || result.error.frequency}
            </p>
          )}
        </div>

        {frequency === 'hourly' && (
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
        )}
      </div>

      <div class="rounded-xl bg-slate-50 p-6">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Frequency Equivalents</h3>
        {result.data ? (
          <div class="space-y-4">
            <div>
              <p class="text-sm text-slate-500">Annually</p>
              <p class="text-3xl font-bold text-accent">{formatCurrency(result.data.annually)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">Monthly</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.monthly)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">Semi-monthly</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.semimonthly)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">Bi-weekly</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.biweekly)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">Weekly</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.weekly)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">Daily</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.daily)}</p>
            </div>
            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">Hourly</p>
              <p class="font-medium text-slate-900">{formatCurrency(result.data.hourly)}</p>
            </div>
          </div>
        ) : (
          <p class="text-slate-500 text-sm">Enter your pay and frequency to see all equivalents.</p>
        )}
      </div>
    </div>
  );
}
