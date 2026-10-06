import { useMemo, useState } from 'preact/hooks';
import {
  gbMaternityAllowanceEngine,
  GB_MA_TEST_PERIOD_WEEKS,
  GB_MA_MIN_WORK_WEEKS,
  GB_MA_MIN_HIGH_EARNING_WEEKS,
  GB_MA_HIGH_EARNING_THRESHOLD,
  GB_MA_FULL_CLASS2_WEEKS,
  type GbMaWorkStatus,
  type GbMaIneligibilityReason,
} from '../../calculators/labor/engines/gbMaternityAllowance';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 }).format(v);

const WORK_STATUS_OPTIONS: { value: GbMaWorkStatus; label: string; hint: string }[] = [
  { value: 'employed', label: 'Employed', hint: 'You work for an employer but cannot get Statutory Maternity Pay' },
  { value: 'selfEmployed', label: 'Self-employed', hint: 'Registered with HMRC as self-employed' },
  { value: 'recentlyStopped', label: 'Recently stopped working', hint: 'You were employed but have stopped' },
  { value: 'spouseBusiness', label: 'Unpaid work for my spouse or civil partner\u2019s business', hint: '£27/week for up to 14 weeks' },
];

const REASON_COPY: Record<GbMaIneligibilityReason, string> = {
  'receives-smp':
    'You said you get Statutory Maternity Pay from another job — in that case you cannot get Maternity Allowance.',
  'too-few-work-weeks':
    `You need to have worked at least ${GB_MA_MIN_WORK_WEEKS} weeks in the ${GB_MA_TEST_PERIOD_WEEKS}-week test period before your baby\u2019s due date.`,
  'too-few-high-earning-weeks':
    `You need to have earned at least £${GB_MA_HIGH_EARNING_THRESHOLD}/week in at least ${GB_MA_MIN_HIGH_EARNING_WEEKS} of those weeks.`,
};

export default function GbMaternityAllowanceCalculator() {
  const [workStatus, setWorkStatus] = useState<GbMaWorkStatus>('employed');
  const [weeksWorked, setWeeksWorked] = useState('40');
  const [weeksAtLeast30, setWeeksAtLeast30] = useState('40');
  const [averageWeeklyEarnings, setAverageWeeklyEarnings] = useState('500');
  const [class2WeeksPaid, setClass2WeeksPaid] = useState('13');
  const [receivesSmp, setReceivesSmp] = useState(false);

  const input = {
    workStatus,
    weeksWorked: Math.max(0, parseInt(weeksWorked, 10) || 0),
    weeksAtLeast30: Math.max(0, parseInt(weeksAtLeast30, 10) || 0),
    averageWeeklyEarnings: Math.max(0, parseFloat(averageWeeklyEarnings) || 0),
    class2WeeksPaid: Math.max(0, parseInt(class2WeeksPaid, 10) || 0),
    receivesSmpFromAnotherJob: receivesSmp,
  };

  const valid = gbMaternityAllowanceEngine.validate(input).valid;

  const result = useMemo(() => {
    if (!valid) return null;
    return gbMaternityAllowanceEngine.calculate(input, {} as never, 2026);
  }, [workStatus, weeksWorked, weeksAtLeast30, averageWeeklyEarnings, class2WeeksPaid, receivesSmp]);

  const isSelfEmployed = workStatus === 'selfEmployed';
  const isSpouseBusiness = workStatus === 'spouseBusiness';

  return (
    <div className="space-y-6">

      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Your situation</h2>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700 mb-2">
            How did you work in the 66 weeks before your baby\u2019s due date?
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {WORK_STATUS_OPTIONS.map(o => (
              <label
                key={o.value}
                className={`cursor-pointer rounded-lg border px-4 py-3 text-sm transition ${
                  workStatus === o.value
                    ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="gb-ma-status"
                  className="sr-only"
                  checked={workStatus === o.value}
                  onChange={() => setWorkStatus(o.value)}
                />
                <span className="block font-medium text-slate-900">{o.label}</span>
                <span className="block text-xs text-slate-500">{o.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Weeks worked in the test period
            </label>
            <input
              type="number" min="0" max="66" step="1"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
              value={weeksWorked}
              onInput={e => setWeeksWorked((e.target as HTMLInputElement).value)}
            />
            <p className="mt-1 text-xs text-slate-400">
              Employed or self-employed weeks (part-weeks count), out of 66. Need at least 26.
            </p>
          </div>

          {!isSpouseBusiness && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Weeks earning £30/week or more
              </label>
              <input
                type="number" min="0" max="66" step="1"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
                value={weeksAtLeast30}
                onInput={e => setWeeksAtLeast30((e.target as HTMLInputElement).value)}
              />
              <p className="mt-1 text-xs text-slate-400">
                Need at least 13. Weeks do not have to be together.
              </p>
            </div>
          )}

          {!isSpouseBusiness && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Average weekly earnings — best 13 weeks (£)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">£</span>
                <input
                  type="number" min="0" step="1"
                  className="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
                  value={averageWeeklyEarnings}
                  onInput={e => setAverageWeeklyEarnings((e.target as HTMLInputElement).value)}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Average of your 13 highest-earning weeks before tax. Used for the 90% test.
              </p>
            </div>
          )}

          {isSelfEmployed && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Weeks of Class 2 National Insurance paid
              </label>
              <input
                type="number" min="0" max="66" step="1"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
                value={class2WeeksPaid}
                onInput={e => setClass2WeeksPaid((e.target as HTMLInputElement).value)}
              />
              <p className="mt-1 text-xs text-slate-400">
                Need at least 13 for the full rate; fewer means a reduced rate.
              </p>
            </div>
          )}
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={receivesSmp}
            onChange={e => setReceivesSmp((e.target as HTMLInputElement).checked)}
          />
          <span>I get Statutory Maternity Pay (SMP) from an employer for this pregnancy.</span>
        </label>
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      {result && (
        <div className="space-y-4" role="region" aria-live="polite">

          {/* Hero */}
          <div className={`rounded-xl p-6 text-white ${result.eligible ? 'bg-gradient-to-br from-emerald-600 to-emerald-800' : 'bg-gradient-to-br from-slate-500 to-slate-700'}`}>
            <p className="text-sm font-medium text-emerald-100">
              {result.eligible ? 'Estimated Maternity Allowance (2026/27)' : 'Maternity Allowance (2026/27)'}
            </p>
            <p className="mt-1 text-5xl font-bold tracking-tight">{fmt(result.totalAmount)}</p>
            <p className="mt-2 text-sm text-emerald-100">
              {result.eligible
                ? `${fmt(result.weeklyRate)}/week for ${result.paidWeeks} weeks`
                : 'You do not appear to be eligible under the current rules'}
            </p>
          </div>

          {/* Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">Eligibility &amp; payment breakdown</h3>
            </div>
            <div className="divide-y divide-slate-100 text-sm">
              <div className="flex justify-between px-5 py-3">
                <span className="text-slate-600">Work situation</span>
                <span className="font-medium text-slate-900 text-right">
                  {WORK_STATUS_OPTIONS.find(o => o.value === workStatus)?.label}
                </span>
              </div>
              <div className="flex justify-between px-5 py-3">
                <span className="text-slate-600">Weeks worked (need ≥ 26 of 66)</span>
                <span className="font-medium text-slate-900">{input.weeksWorked}</span>
              </div>
              {!isSpouseBusiness && (
                <div className="flex justify-between px-5 py-3">
                  <span className="text-slate-600">Weeks at £30+/week (need ≥ 13)</span>
                  <span className="font-medium text-slate-900">{input.weeksAtLeast30}</span>
                </div>
              )}
              <div className="flex justify-between px-5 py-3">
                <span className="text-slate-600">Weekly rate basis</span>
                <span className="font-medium text-slate-900 text-right">
                  {result.rateBasis === 'standard' && '£194.32 standard rate (2026/27)'}
                  {result.rateBasis === 'ninety-percent' && `90% of average weekly earnings (${fmt(input.averageWeeklyEarnings)})`}
                  {result.rateBasis === 'reduced' && 'Reduced rate — Class 2 NI shortfall (pro-rata)'}
                  {result.rateBasis === 'minimum' && result.eligible && '£27/week — spouse/partner business or no Class 2 NI'}
                  {!result.eligible && 'Not eligible'}
                </span>
              </div>
              <div className="flex justify-between px-5 py-3">
                <span className="text-slate-600">Weekly payment</span>
                <span className="font-medium text-slate-900">{fmt(result.weeklyRate)}</span>
              </div>
              <div className={`flex justify-between px-5 py-4 font-bold text-base ${result.eligible ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-700'}`}>
                <span>Total over {result.paidWeeks || 39} weeks</span>
                <span>{fmt(result.totalAmount)}</span>
              </div>
            </div>
          </div>

          {!result.eligible && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 space-y-2">
              <p><strong>Why not:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                {result.ineligibilityReasons.map(r => <li key={r}>{REASON_COPY[r]}</li>)}
              </ul>
            </div>
          )}

          {result.eligible && result.rateBasis === 'reduced' && result.class2ShortfallWeeks > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <strong>Raise your payment:</strong> you are {result.class2ShortfallWeeks} Class 2 week{result.class2ShortfallWeeks === 1 ? '' : 's'} short of the 13-week
              full-rate threshold. After you apply, HMRC will tell you how many contributions to top up
              (Class 2 costs {fmt(result.class2WeeklyCost)}/week) and your payments can be increased and backdated.
            </div>
          )}

          {result.eligible && isSpouseBusiness && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800">
              <strong>Note:</strong> this route also requires your spouse or civil partner to have been
              registered as self-employed with HMRC and paying Class 2 NI during the same 26 weeks.
            </div>
          )}

          {result.eligible && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
              <strong>Good to know:</strong> Maternity Allowance is not taxable and is paid every 2 or 4 weeks.
              You can claim from 26 weeks into your pregnancy, and payments can start from the 11th week
              before your baby is due.
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Rates: £194.32/week standard and £27/week fallback for 2026/27 (5 April 2026 – 3 April 2027),
        per GOV.UK. Class 2 NI costs £3.65/week. Estimate only — Jobcentre Plus decides entitlement
        on your actual claim record.
      </p>
    </div>
  );
}
