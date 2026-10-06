import { useMemo, useState } from 'preact/hooks';
import {
  usBonusTaxEngine,
  US_BONUS_STATE_OPTIONS,
  FEDERAL_SUPPLEMENTAL_WITHHOLDING_2026,
} from '../../calculators/salary/engines/us/usBonusTax';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(value);

interface Props {
  initialBonus?: number;
  initialSalary?: number;
  initialStateCode?: string;
}

export default function UsBonusTaxCalculator({
  initialBonus = 10000,
  initialSalary = 40000,
  initialStateCode = 'TX',
}: Props) {
  const [bonusGross, setBonusGross] = useState(String(initialBonus));
  const [filingStatus, setFilingStatus] = useState<'single' | 'marriedJointly'>('single');
  const [stateCode, setStateCode] = useState(initialStateCode);
  const [annualSalary, setAnnualSalary] = useState(String(initialSalary));
  const [ytdSupplementalWages, setYtdSupplementalWages] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const result = useMemo(() => {
    const validation = usBonusTaxEngine.validate({
      bonusGross: Number(bonusGross),
      filingStatus,
      stateCode,
      annualSalary: Number(annualSalary),
      ytdSupplementalWages: ytdSupplementalWages === '' ? 0 : Number(ytdSupplementalWages),
    });
    return validation.valid ? usBonusTaxEngine.calculate(validation.data) : null;
  }, [bonusGross, filingStatus, stateCode, annualSalary, ytdSupplementalWages]);

  const inputClass = 'mt-1 w-full rounded border p-2';
  const stateName = US_BONUS_STATE_OPTIONS.find((s) => s.code === stateCode)?.name ?? stateCode;

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="us-bonus-amount">
          Bonus amount (gross, $)
          <input
            id="us-bonus-amount"
            class={inputClass}
            type="number"
            min="1"
            step="100"
            value={bonusGross}
            onInput={(e) => setBonusGross((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="us-bonus-salary">
          Your 2026 salary from the same employer ($)
          <input
            id="us-bonus-salary"
            class={inputClass}
            type="number"
            min="0"
            step="1000"
            value={annualSalary}
            onInput={(e) => setAnnualSalary((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="us-bonus-status">
          Filing status
          <select
            id="us-bonus-status"
            class={inputClass}
            value={filingStatus}
            onChange={(e) => setFilingStatus((e.target as HTMLSelectElement).value as 'single' | 'marriedJointly')}
          >
            <option value="single">Single</option>
            <option value="marriedJointly">Married filing jointly</option>
          </select>
        </label>
        <label class="block text-sm font-medium" for="us-bonus-state">
          State (for the state tax estimate)
          <select
            id="us-bonus-state"
            class={inputClass}
            value={stateCode}
            onChange={(e) => setStateCode((e.target as HTMLSelectElement).value)}
          >
            {US_BONUS_STATE_OPTIONS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div>
          <button
            type="button"
            class="text-sm text-blue-700 underline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} advanced options
          </button>
          {showAdvanced && (
            <label class="mt-2 block text-sm font-medium" for="us-bonus-ytd">
              Supplemental wages already paid to you in 2026 ($)
              <input
                id="us-bonus-ytd"
                class={inputClass}
                type="number"
                min="0"
                step="100"
                value={ytdSupplementalWages}
                placeholder="0"
                onInput={(e) => setYtdSupplementalWages((e.target as HTMLInputElement).value)}
              />
              <span class="mt-1 block text-xs font-normal text-slate-500">
                Needed only if your 2026 supplemental wages (bonuses, commissions, payouts) from
                this employer are near or above $1,000,000 — the excess is withheld at 37%.
              </span>
            </label>
          )}
        </div>
        <p class="text-xs text-slate-500">
          The 22% is <strong>withholding, not your actual tax</strong>. When you file your 2026
          return, this bonus is taxed at your marginal rate — you may get some of the withholding
          back, or owe a little more. See the comparison on the right.
        </p>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Net bonus after withholding</p>
        <p class="text-3xl font-bold text-accent">
          {result ? formatCurrency(result.netBonus) : '—'}
        </p>
        {result && (
          <>
            <dl class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <dt>
                  Federal income tax withheld
                  <span class="block text-xs text-slate-500">
                    {formatPercent(FEDERAL_SUPPLEMENTAL_WITHHOLDING_2026.flatRate)} supplemental
                    rate
                    {result.bonusWithheldAt37 > 0 &&
                      `; ${formatCurrency(result.bonusWithheldAt37)} at 37% above $1M`}
                  </span>
                </dt>
                <dd>{formatCurrency(result.federalWithholding)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>
                  Social Security (6.2%)
                  <span class="block text-xs text-slate-500">
                    on wages below the $184,500 wage base
                  </span>
                </dt>
                <dd>{formatCurrency(result.socialSecurity)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>
                  Medicare (1.45%)
                  {result.additionalMedicare > 0 && (
                    <span class="block text-xs text-slate-500">
                      + {formatCurrency(result.additionalMedicare)} additional 0.9% above $200k wages
                    </span>
                  )}
                </dt>
                <dd>{formatCurrency(roundToCents(result.medicare + result.additionalMedicare))}</dd>
              </div>
              <div class="flex justify-between">
                <dt>
                  {stateName} state tax (estimated)
                  <span class="block text-xs text-slate-500">
                    marginal state liability on the bonus
                  </span>
                </dt>
                <dd>{formatCurrency(result.stateTax)}</dd>
              </div>
              <div class="flex justify-between font-semibold">
                <dt>Total withheld</dt>
                <dd>{formatCurrency(result.totalWithholding)}</dd>
              </div>
              <hr class="border-slate-200" />
              <div class="flex justify-between">
                <dt>
                  Actual federal tax on this bonus (estimate)
                  <span class="block text-xs text-slate-500">
                    {formatPercent(result.marginalRate)} — your marginal rate, not 22%
                  </span>
                </dt>
                <dd>{formatCurrency(result.actualFederalTaxOnBonus)}</dd>
              </div>
              <div
                class={`flex justify-between font-semibold ${
                  result.withholdingVsActual >= 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                <dt>
                  {result.withholdingVsActual >= 0
                    ? 'Over-withheld: likely back in your refund'
                    : 'Under-withheld: likely owed at filing time'}
                </dt>
                <dd>
                  {formatCurrency(Math.abs(result.withholdingVsActual))}
                </dd>
              </div>
            </dl>
            <p class="mt-4 text-xs text-slate-500">
              Estimate only. Federal supplemental withholding per IRS Publication 15 (2026): 22% up
              to $1M, 37% above. Your pay stub and tax professional are definitive.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const roundToCents = (n: number) => Math.round(n * 100) / 100;
