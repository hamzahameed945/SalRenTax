import { useState, useMemo } from 'preact/hooks';
import { rentAffordabilityEngine } from '../../calculators/rent/engines/rentAffordability';

export default function RentAffordabilityCalculator({ locale }: { locale: string }) {
  const [grossIncome, setGrossIncome] = useState('');
  const [netIncome, setNetIncome] = useState('');
  const [payFrequency, setPayFrequency] = useState<'annually' | 'monthly' | 'biweekly' | 'weekly'>(
    'annually',
  );
  const [targetGrossPercentage, setTargetGrossPercentage] = useState('30');

  const result = useMemo(() => {
    const input = {
      grossIncomePerPeriod: parseFloat(grossIncome),
      netIncomePerPeriod: netIncome ? parseFloat(netIncome) : undefined,
      payFrequency,
      targetGrossPercentage: parseFloat(targetGrossPercentage),
    };

    const validation = rentAffordabilityEngine.validate(input);
    if (validation.valid) {
      return {
        data: rentAffordabilityEngine.calculate(
          validation.data,
          {} as never,
          new Date().getFullYear(),
        ),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [grossIncome, netIncome, payFrequency, targetGrossPercentage]);

  return (
    <div class="grid gap-8 md:grid-cols-2">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Gross Income</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={grossIncome}
            onInput={(e) => setGrossIncome((e.target as HTMLInputElement).value)}
            placeholder="e.g. 60000"
          />
          {result.error?.grossIncomePerPeriod && (
            <p class="mt-1 text-sm text-red-600">{result.error.grossIncomePerPeriod}</p>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Net Income (Optional)</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={netIncome}
            onInput={(e) => setNetIncome((e.target as HTMLInputElement).value)}
            placeholder="e.g. 48000"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Pay Frequency</label>
          <select
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={payFrequency}
            onChange={(e) =>
              setPayFrequency(
                (e.target as HTMLSelectElement).value as
                  'annually' | 'monthly' | 'biweekly' | 'weekly',
              )
            }
          >
            <option value="annually">Annually</option>
            <option value="monthly">Monthly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            Target Rent Percentage (%)
          </label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={targetGrossPercentage}
            onInput={(e) => setTargetGrossPercentage((e.target as HTMLInputElement).value)}
            placeholder="e.g. 30"
          />
          {result.error?.targetGrossPercentage && (
            <p class="mt-1 text-sm text-red-600">{result.error.targetGrossPercentage}</p>
          )}
        </div>
      </div>

      <div class="rounded-xl bg-slate-50 p-6">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Affordability Guidelines</h3>
        {result.data ? (
          <div class="space-y-4">
            <div>
              <p class="text-sm text-slate-500">Recommended Rent (Gross 30% rule)</p>
              <p class="text-3xl font-bold text-accent">
                {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
                  result.data.recommendedRentGross,
                )}
              </p>
            </div>

            <div class="pt-4 border-t border-slate-200">
              <p class="text-sm text-slate-500 mb-1">Monthly Gross Income</p>
              <p class="font-medium text-slate-900">
                {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
                  result.data.monthlyGrossIncome,
                )}
              </p>
            </div>

            {result.data.monthlyNetIncome && result.data.recommendedRentNet && (
              <>
                <div class="pt-4 border-t border-slate-200">
                  <p class="text-sm text-slate-500 mb-1">Recommended Rent (Net 30% rule)</p>
                  <p class="font-medium text-amber-600">
                    {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
                      result.data.recommendedRentNet,
                    )}
                  </p>
                </div>
                <div class="pt-4 border-t border-slate-200">
                  <p class="text-sm text-slate-500 mb-1">Monthly Net Income</p>
                  <p class="font-medium text-slate-900">
                    {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
                      result.data.monthlyNetIncome,
                    )}
                  </p>
                </div>
              </>
            )}

            <div class="mt-6 text-sm text-slate-600">
              <p>
                Based on your {targetGrossPercentage}% target, your estimated rent matches standard
                affordability guidelines.
              </p>
            </div>
          </div>
        ) : (
          <p class="text-slate-500 text-sm">
            Enter your income details to see your affordability estimate.
          </p>
        )}
      </div>
    </div>
  );
}
