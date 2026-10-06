import { useMemo, useState } from 'preact/hooks';
import {
  usSeveranceEngine,
  type SeniorityTier,
  type SeveranceVerdict,
} from '../../calculators/labor/engines/usSeverance';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const verdictCopy: Record<Exclude<SeveranceVerdict, 'no-offer'>, { label: string; className: string; detail: string }> = {
  'below-market': {
    label: 'Below market',
    className: 'bg-red-100 text-red-800',
    detail: 'This offer sits under the typical market benchmark for your salary, service and seniority. It may be worth negotiating.',
  },
  market: {
    label: 'Market',
    className: 'bg-amber-100 text-amber-800',
    detail: 'This offer sits inside the typical market benchmark. There may still be room to negotiate extras such as healthcare or outplacement.',
  },
  strong: {
    label: 'Strong',
    className: 'bg-green-100 text-green-800',
    detail: 'This offer sits above the typical market benchmark — a strong package for your salary, service and seniority.',
  },
};

export default function UsSeveranceCalculator() {
  const [annualSalary, setAnnualSalary] = useState('85000');
  const [yearsOfService, setYearsOfService] = useState('5');
  const [seniorityTier, setSeniorityTier] = useState<SeniorityTier>('individual-contributor');
  const [offeredWeeks, setOfferedWeeks] = useState('');

  const result = useMemo(() => {
    const validation = usSeveranceEngine.validate({
      annualSalary: Number(annualSalary),
      yearsOfService: Number(yearsOfService),
      seniorityTier,
      offeredSeveranceWeeks: offeredWeeks.trim() === '' ? undefined : Number(offeredWeeks),
    });

    return validation.valid ? usSeveranceEngine.calculate(validation.data, {} as never, 2026) : null;
  }, [annualSalary, yearsOfService, seniorityTier, offeredWeeks]);

  const verdict = result && result.verdict !== 'no-offer' ? verdictCopy[result.verdict] : null;

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="us-sev-salary">
          Annual salary (USD)
          <input
            id="us-sev-salary"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="1000"
            value={annualSalary}
            onInput={(event) => setAnnualSalary((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="us-sev-years">
          Years of service
          <input
            id="us-sev-years"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.5"
            value={yearsOfService}
            onInput={(event) => setYearsOfService((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="us-sev-tier">
          Seniority
          <select
            id="us-sev-tier"
            class="mt-1 w-full rounded border p-2"
            value={seniorityTier}
            onChange={(event) => setSeniorityTier((event.target as HTMLSelectElement).value as SeniorityTier)}
          >
            <option value="individual-contributor">Individual contributor</option>
            <option value="manager">Manager</option>
            <option value="executive">Executive</option>
          </select>
        </label>
        <label class="block text-sm font-medium" for="us-sev-offered">
          Severance offered (weeks of pay, optional)
          <input
            id="us-sev-offered"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 8"
            value={offeredWeeks}
            onInput={(event) => setOfferedWeeks((event.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Market benchmark range</p>
        <p class="text-3xl font-bold text-accent">
          {result ? `${formatCurrency(result.lowAmount)} – ${formatCurrency(result.highAmount)}` : '—'}
        </p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Weeks of pay</dt>
              <dd>
                {result.lowWeeks} – {result.highWeeks} weeks
              </dd>
            </div>
            <div class="flex justify-between">
              <dt>Weekly pay equivalent</dt>
              <dd>{formatCurrency(result.weeklyPay)} / week</dd>
            </div>
            <div class="flex justify-between">
              <dt>Midpoint of range</dt>
              <dd>{formatCurrency(result.midAmount)}</dd>
            </div>
          </dl>
        )}
        {verdict && (
          <div class="mt-4 rounded-lg bg-white p-4">
            <p class={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${verdict.className}`}>
              {verdict.label}
            </p>
            <p class="mt-2 text-sm text-slate-600">{verdict.detail}</p>
          </div>
        )}
        <p class="mt-3 text-xs text-slate-500">
          Market benchmark only — not legal advice. Based on the common 1–2 weeks of pay per year
          of service rule, adjusted by seniority. No US federal law requires severance pay.
        </p>
      </div>
    </div>
  );
}
