import { useMemo, useState } from 'preact/hooks';
import {
  ieChristmasBonusEngine,
  type IeChristmasBonusDuration,
  type IeChristmasBonusPaymentType,
} from '../../calculators/labor/engines/ieChristmasBonus';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);

const PAYMENT_OPTIONS: { value: IeChristmasBonusPaymentType; label: string }[] = [
  { value: 'statePensionContributory', label: 'State Pension (Contributory)' },
  { value: 'statePensionNonContributory', label: 'State Pension (Non-Contributory)' },
  { value: 'disabilityAllowance', label: 'Disability Allowance' },
  { value: 'oneParentFamilyPayment', label: 'One-Parent Family Payment' },
  { value: 'invalidityPension', label: 'Invalidity Pension' },
  { value: 'carersAllowance', label: "Carer's Allowance" },
  { value: 'bereavedPartnersPension', label: "Widow's/Widower's/Surviving Civil Partner's Pension" },
  { value: 'farmAssist', label: 'Farm Assist' },
  { value: 'jobseekersAllowance', label: "Jobseeker's Allowance" },
  { value: 'jobseekersBenefit', label: "Jobseeker's Benefit" },
  { value: 'illnessBenefit', label: 'Illness Benefit' },
  { value: 'supplementaryWelfareAllowance', label: 'Supplementary Welfare Allowance (long-term)' },
];

const DURATION_OPTIONS: { value: IeChristmasBonusDuration; label: string; hint: string }[] = [
  { value: 'under12', label: 'Less than 12 months', hint: 'Started this payment within the last year' },
  { value: '12plus', label: '12 months or more', hint: 'On this payment for a year or longer' },
];

export default function IeChristmasBonusCalculator() {
  const [paymentType, setPaymentType] = useState<IeChristmasBonusPaymentType>('statePensionContributory');
  const [duration, setDuration] = useState<IeChristmasBonusDuration>('12plus');
  const [weekly, setWeekly] = useState('254');

  const weeklyAmount = parseFloat(weekly) || 0;

  const result = useMemo(() => {
    const v = ieChristmasBonusEngine.validate({ paymentType, duration, weeklyAmount });
    if (!v.valid) return null;
    return ieChristmasBonusEngine.calculate(v.data, {} as never, 2026);
  }, [paymentType, duration, weeklyAmount]);

  const needsDuration = ['jobseekersAllowance', 'illnessBenefit', 'supplementaryWelfareAllowance'].includes(paymentType);

  return (
    <div class="space-y-6">

      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Your situation</h2>
        <div class="grid gap-4 sm:grid-cols-2">

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Social welfare payment
            </label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
              value={paymentType}
              onChange={e => setPaymentType((e.target as HTMLSelectElement).value as IeChristmasBonusPaymentType)}
            >
              {PAYMENT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p class="mt-1 text-xs text-slate-400">
              Long-term schemes qualify automatically; jobseeker and illness-type payments have a 12-month rule.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Weekly payment amount (€)
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input
                type="number" min="0" step="1"
                class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
                value={weekly}
                onInput={e => setWeekly((e.target as HTMLInputElement).value)}
              />
            </div>
            <p class="mt-1 text-xs text-slate-400">
              Your normal weekly rate before any bonus.
            </p>
          </div>

        </div>

        <fieldset class="mt-4">
          <legend class="text-sm font-medium text-slate-700 mb-2">
            How long have you been receiving this payment?
          </legend>
          <div class="grid gap-2 sm:grid-cols-2">
            {DURATION_OPTIONS.map(o => (
              <label
                key={o.value}
                class={`cursor-pointer rounded-lg border px-4 py-3 text-sm transition ${
                  duration === o.value
                    ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="ie-xmas-duration"
                  class="sr-only"
                  checked={duration === o.value}
                  onChange={() => setDuration(o.value)}
                />
                <span class="block font-medium text-slate-900">{o.label}</span>
                <span class="block text-xs text-slate-500">{o.hint}</span>
              </label>
            ))}
          </div>
          {!needsDuration && (
            <p class="mt-2 text-xs text-slate-400">
              This payment is a long-term scheme, so the duration does not affect your bonus.
            </p>
          )}
        </fieldset>
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      {result && (
        <div class="space-y-4" role="region" aria-live="polite">

          {/* Hero */}
          <div class={`rounded-xl p-6 text-white ${result.qualifies ? 'bg-gradient-to-br from-emerald-600 to-emerald-800' : 'bg-gradient-to-br from-slate-500 to-slate-700'}`}>
            <p class="text-sm font-medium text-emerald-100">
              {result.qualifies ? 'Estimated Christmas Bonus 2026' : 'Christmas Bonus 2026'}
            </p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(result.bonusAmount)}</p>
            <p class="mt-2 text-sm text-emerald-100">
              {result.qualifies
                ? `100% of your weekly payment (${fmt(result.weeklyAmount)})${result.minimumApplied ? ' — raised to the €20 statutory minimum' : ''}`
                : 'You do not appear to qualify under the current rules'}
            </p>
          </div>

          {/* Breakdown */}
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Eligibility check</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">
              <div class="flex justify-between px-5 py-3">
                <span class="text-slate-600">Payment checked</span>
                <span class="font-medium text-slate-900 text-right">
                  {PAYMENT_OPTIONS.find(o => o.value === paymentType)?.label}
                </span>
              </div>
              <div class="flex justify-between px-5 py-3">
                <span class="text-slate-600">Duration</span>
                <span class="font-medium text-slate-900">
                  {duration === '12plus' ? '12 months or more' : 'Less than 12 months'}
                </span>
              </div>
              <div class="flex justify-between px-5 py-3">
                <span class="text-slate-600">Rule applied</span>
                <span class="font-medium text-slate-900 text-right">
                  {result.rule === 'long-term' && 'Long-term scheme — qualifies automatically'}
                  {result.rule === 'needs-12-months' && result.durationRequirementMet && '12-month rule — requirement met'}
                  {result.rule === 'needs-12-months' && !result.durationRequirementMet && '12-month rule — requirement not met'}
                  {result.rule === 'short-term-excluded' && 'Short-term scheme — never qualifies'}
                </span>
              </div>
              <div class={`flex justify-between px-5 py-4 font-bold text-base ${result.qualifies ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-700'}`}>
                <span>Your bonus</span>
                <span>{fmt(result.bonusAmount)}</span>
              </div>
            </div>
          </div>

          {result.qualifies && (
            <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
              <strong>When you'll get it:</strong> the bonus is paid automatically — no application needed —
              in the first week of December, together with your normal weekly payment, on the same day
              you usually get paid.
            </div>
          )}
          {!result.qualifies && result.rule === 'needs-12-months' && (
            <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <strong>Why not:</strong> this payment only qualifies for the Christmas Bonus after
              12 months of continuous receipt (312 claim paid days for Jobseeker's Allowance).
              Once you reach 12 months, you should qualify automatically.
            </div>
          )}
          {!result.qualifies && result.rule === 'short-term-excluded' && (
            <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <strong>Why not:</strong> Jobseeker's Benefit is a short-term scheme and has never been
              a qualifying payment for the Christmas Bonus. Only long-term social welfare payments qualify.
            </div>
          )}
        </div>
      )}

      <p class="text-xs text-slate-400">
        Expected 2026 rules (based on the confirmed 2025 payment, announced with Budget 2027 on
        6 October 2026 — final details await Department of Social Protection confirmation).
        Estimate only — the Department decides eligibility on your actual claim record.
      </p>
    </div>
  );
}
