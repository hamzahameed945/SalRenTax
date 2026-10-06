import { useMemo, useState } from 'preact/hooks';
import {
  usHouseAffordabilityEngine,
  type FilingStatus,
} from '../../calculators/salary/engines/usHouseAffordability';
import { US_STATES } from '../../data/salary/us/effectivePropertyTaxRates2026';
import { getLocaleConfig } from '../../data/locales';
import { formatCurrency, formatPercent } from '../../lib/formatting/format';

const config = getLocaleConfig('en-US');
const FILING_STATUSES: FilingStatus[] = ['single', 'marriedJointly'];

const filingStatusLabel: Record<FilingStatus, string> = {
  single: 'Single',
  marriedJointly: 'Married filing jointly',
};

export default function HouseAffordabilityCalculator({
  stateCode,
  initialAnnualSalary,
}: {
  stateCode?: string;
  initialAnnualSalary?: string;
}) {
  const [salary, setSalary] = useState(initialAnnualSalary ?? '100000');
  const [state, setState] = useState(stateCode ?? 'TX');
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');

  const validation = usHouseAffordabilityEngine.validate({
    annualSalary: Number(salary),
    stateCode: state,
    filingStatus,
  });

  const result = useMemo(() => {
    if (!validation.valid) return null;
    return usHouseAffordabilityEngine.calculate(
      { annualSalary: Number(salary), stateCode: state, filingStatus },
      { countryCode: 'US' },
      2026,
    );
  }, [salary, state, filingStatus]);

  return (
    <div class="grid gap-8 md:grid-cols-2">
      <form
        class="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700" for="ha-salary">
            Gross annual salary
          </label>
          <input
            id="ha-salary"
            type="number"
            min="1"
            step="1000"
            value={salary}
            onInput={(e) => setSalary((e.target as HTMLInputElement).value)}
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-lg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700" for="ha-state">
            State
          </label>
          <select
            id="ha-state"
            value={state}
            onChange={(e) => setState((e.target as HTMLSelectElement).value)}
            class="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {US_STATES.map((s) => (
              <option value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700" for="ha-filing">
            Filing status
          </label>
          <select
            id="ha-filing"
            value={filingStatus}
            onChange={(e) =>
              setFilingStatus((e.target as HTMLSelectElement).value as FilingStatus)
            }
            class="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {FILING_STATUSES.map((status) => (
              <option value={status}>{filingStatusLabel[status]}</option>
            ))}
          </select>
        </div>

        <p class="text-xs text-slate-500">
          Uses the 28% rule on gross income, a 30-year fixed rate of 7.28% (Freddie Mac,
          Oct 2026), 20% down, and {result ? result.stateName : 'state'}'s effective
          property tax rate.
        </p>
      </form>

      <div
        class="rounded-xl border border-slate-200 bg-slate-50 p-6"
        role="region"
        aria-live="polite"
        aria-label="House affordability results"
      >
        {result ? (
          <div class="space-y-3">
            <p class="text-sm font-medium uppercase tracking-wide text-slate-500">
              Max home price
            </p>
            <p class="text-4xl font-bold text-accent">
              {formatCurrency(Math.round(result.maxHomePrice / 100) * 100, config)}
            </p>
            <p class="text-sm text-slate-600">
              Max monthly PITI:{' '}
              <strong>{formatCurrency(Math.round(result.monthlyPiti), config)}</strong> (28% of
              gross)
            </p>
            <dl class="mt-4 space-y-2 text-sm text-slate-700">
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>Down payment (20%)</dt>
                <dd>{formatCurrency(Math.round(result.downPayment), config)}</dd>
              </div>
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>Principal &amp; interest</dt>
                <dd>{formatCurrency(Math.round(result.monthlyPrincipalAndInterest), config)}/mo</dd>
              </div>
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>
                  Property tax ({formatPercent(result.propertyTaxEffectiveRate, config, 2)})
                </dt>
                <dd>{formatCurrency(Math.round(result.monthlyPropertyTax), config)}/mo</dd>
              </div>
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>Homeowner's insurance</dt>
                <dd>{formatCurrency(Math.round(result.monthlyHomeownerInsurance), config)}/mo</dd>
              </div>
              <div class="flex justify-between pt-1 font-medium">
                <dt>Monthly take-home</dt>
                <dd>{formatCurrency(Math.round(result.monthlyTakeHomePay), config)}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p class="text-sm text-slate-500">
            Enter a valid salary above to see your affordability estimate.
          </p>
        )}
      </div>
    </div>
  );
}
