import { useMemo, useState } from 'preact/hooks';
import {
  gbRedundancyPayEngine,
  TAX_FREE_ALLOWANCE,
  WEEKLY_PAY_CAP_GB_2026,
} from '../../calculators/labor/engines/gbRedundancyPay';

const fmt = (v: number, digits = 2) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits === 0 ? 0 : 2,
  }).format(v);

const BAND_LABELS: Record<string, { label: string; rule: string }> = {
  under22: { label: 'Aged under 22', rule: '½ week’s pay per year' },
  '22to40': { label: 'Aged 22 to 40', rule: '1 week’s pay per year' },
  age41plus: { label: 'Aged 41 and over', rule: '1½ weeks’ pay per year' },
};

export default function GbRedundancyPayCalculator() {
  const [age, setAge] = useState('45');
  const [years, setYears] = useState('10');
  const [weeklyPay, setWeeklyPay] = useState('800');

  const ageNum = parseFloat(age) || 0;
  const yearsNum = parseFloat(years) || 0;
  const weeklyPayNum = parseFloat(weeklyPay) || 0;

  const result = useMemo(() => {
    const v = gbRedundancyPayEngine.validate({
      age: ageNum,
      yearsOfService: yearsNum,
      grossWeeklyPay: weeklyPayNum,
    });
    if (!v.valid) return null;
    return gbRedundancyPayEngine.calculate(v.data, undefined as never, 2026);
  }, [ageNum, yearsNum, weeklyPayNum]);

  return (
    <div className="space-y-6">

      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Your situation
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Your age (at end of employment)
            </label>
            <input
              type="number" min="16" max="100" step="1"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
              value={age}
              onInput={e => setAge((e.target as HTMLInputElement).value)}
            />
            <p className="mt-1 text-xs text-slate-400">
              The multiplier is set by your age in each year of service.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Complete years of service
            </label>
            <input
              type="number" min="0" max="60" step="1"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
              value={years}
              onInput={e => setYears((e.target as HTMLInputElement).value)}
            />
            <p className="mt-1 text-xs text-slate-400">
              Only the last 20 years count. 2+ years to qualify.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Gross weekly pay (£)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">£</span>
              <input
                type="number" min="0" step="10"
                className="w-full rounded-md border border-slate-300 py-2 pl-7 pr-3 text-slate-900 focus:border-emerald-500 focus:outline-none"
                value={weeklyPay}
                onInput={e => setWeeklyPay((e.target as HTMLInputElement).value)}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Average over the 12 weeks before your notice. Capped at {fmt(WEEKLY_PAY_CAP_GB_2026, 0)}/week.
            </p>
          </div>

        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      {result && (
        <div className="space-y-4" role="region" aria-live="polite">

          {/* Hero */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white">
            <p className="text-sm font-medium text-emerald-100">
              Estimated statutory redundancy pay 2026/27
            </p>
            <p className="mt-1 text-5xl font-bold tracking-tight">{fmt(result.statutoryPay)}</p>
            <p className="mt-2 text-sm text-emerald-100">
              {result.totalWeeks} weeks’ pay × {fmt(result.cappedWeeklyPay)} per week
              {result.capApplied && (
                <span> (your pay exceeded the {fmt(WEEKLY_PAY_CAP_GB_2026, 0)} statutory cap)</span>
              )}
            </p>
          </div>

          {/* Breakdown */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-700">How it’s worked out</h3>
            </div>
            <div className="divide-y divide-slate-100 text-sm">
              {result.bands.map(line => (
                <div key={line.band} className="flex justify-between px-5 py-3">
                  <span className="text-slate-600">
                    {BAND_LABELS[line.band].label}
                    <span className="block text-xs text-slate-400">{BAND_LABELS[line.band].rule}</span>
                  </span>
                  <span className="text-right font-medium text-slate-900">
                    {line.years} yr{line.years === 1 ? '' : 's'} → {line.weeks} weeks
                  </span>
                </div>
              ))}
              <div className="flex justify-between bg-slate-50 px-5 py-3 text-sm">
                <span className="text-slate-600">Weekly pay used</span>
                <span className="font-medium text-slate-900">
                  {fmt(result.cappedWeeklyPay)}
                  {result.capApplied && (
                    <span className="block text-xs font-normal text-amber-600">
                      Capped from {fmt(weeklyPayNum)}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between bg-emerald-50 px-5 py-4 text-base font-bold text-emerald-900">
                <span>Statutory redundancy pay</span>
                <span>{fmt(result.statutoryPay)}</span>
              </div>
            </div>
          </div>

          {!result.qualifiesForStatutory && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <strong>Heads up:</strong> statutory redundancy pay normally requires 2 or more years of
              continuous employment with the same employer. With under 2 years, your employer is not
              legally required to pay statutory redundancy — though your contract may say otherwise.
            </div>
          )}

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
            <strong>Tax:</strong> the first combined {fmt(TAX_FREE_ALLOWANCE, 0)} of genuine
            redundancy pay (statutory + any enhanced payment) is normally free of Income Tax and
            employee National Insurance. Statutory pay alone can never exceed {fmt(22530, 0)}, so it
            is tax-free on its own — only larger packages with enhanced payments can breach the{' '}
            {fmt(TAX_FREE_ALLOWANCE, 0)} limit.
          </div>

          <p className="text-xs text-slate-400">
            Statutory minimum only, using the {fmt(WEEKLY_PAY_CAP_GB_2026, 0)}/week cap for
            redundancies on or after 6 April 2026. Your employer may pay more under an enhanced or
            contractual redundancy scheme. Estimate only — for disputes, Acas advice is free.
          </p>
        </div>
      )}
    </div>
  );
}
