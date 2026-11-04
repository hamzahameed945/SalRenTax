import { useMemo, useState } from 'preact/hooks';
import PayBreakdownChart from './PayBreakdownChart';
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
  const [annualSalary, setAnnualSalary] = useState(String(initialSalary));
  const [filingStatus, setFilingStatus] = useState<'single' | 'marriedJointly'>('single');
  const [stateCode, setStateCode] = useState(initialStateCode);
  const [ytdSupplementalWages, setYtdSupplementalWages] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [submitted, setSubmitted] = useState({
    bonusGross,
    annualSalary,
    filingStatus,
    stateCode,
    ytdSupplementalWages,
  });

  const result = useMemo(() => {
    const validation = usBonusTaxEngine.validate({
      bonusGross: Number(submitted.bonusGross),
      annualSalary: Number(submitted.annualSalary),
      filingStatus: submitted.filingStatus,
      stateCode: submitted.stateCode,
      ytdSupplementalWages:
        submitted.ytdSupplementalWages === '' ? 0 : Number(submitted.ytdSupplementalWages),
    });
    return validation.valid ? usBonusTaxEngine.calculate(validation.data) : null;
  }, [submitted]);

  const inputClass = 'mt-1 w-full rounded border p-2';
  const stateName =
    US_BONUS_STATE_OPTIONS.find((s) => s.code === submitted.stateCode)?.name ??
    submitted.stateCode;

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
            onChange={(e) =>
              setFilingStatus((e.target as HTMLSelectElement).value as 'single' | 'marriedJointly')
            }
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
            class="text-sm text-accent underline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} advanced options
          </button>
          {showAdvanced && (
            <div class="mt-2 space-y-4 rounded border border-slate-200 bg-slate-50 p-4">
              <label class="block text-sm font-medium" for="us-bonus-ytd">
                Supplemental wages already paid to you in 2026 ($)
                <input
                  id="us-bonus-ytd"
                  class={inputClass}
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={ytdSupplementalWages}
                  onInput={(e) => setYtdSupplementalWages((e.target as HTMLInputElement).value)}
                />
                <span class="text-xs text-slate-500">
                  Not counting this bonus. If your total supplemental wages this year already
                  exceed $1,000,000, use the aggregated supplemental rate for your bonus.
                </span>
              </label>
            </div>
          )}
        </div>
        <p class="text-xs text-slate-500">
          The 22% is the flat federal supplemental withholding rate. The actual tax on the bonus
          will be worked out when you file — this could leave you with a refund or a balance
          due.
        </p>
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
            onClick={() =>
              setSubmitted({
                bonusGross,
                annualSalary,
                filingStatus,
                stateCode,
                ytdSupplementalWages,
              })
            }
          >
            Calculate
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setBonusGross(String(initialBonus));
              setAnnualSalary(String(initialSalary));
              setFilingStatus('single');
              setStateCode(initialStateCode);
              setYtdSupplementalWages('');
              setShowAdvanced(false);
              setSubmitted({
                bonusGross: String(initialBonus),
                annualSalary: String(initialSalary),
                filingStatus: 'single',
                stateCode: initialStateCode,
                ytdSupplementalWages: '',
              });
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Net bonus after withholding</p>
        <p class="text-3xl font-bold text-accent">
          {result ? formatCurrency(result.netBonus) : '—'}
        </p>
        {result ? (
          <>
            <dl class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <dt>Gross bonus</dt>
                <dd>{formatCurrency(result.bonusGross)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Federal income tax withheld</dt>
                <dd>-{formatCurrency(result.federalWithholding)}</dd>
                <span class="text-xs text-slate-500">
                  ({formatPercent(FEDERAL_SUPPLEMENTAL_WITHHOLDING_2026.flatRate)} supplemental
                  rate, 37% on the portion over $1m)
                </span>
              </div>
              <div class="flex justify-between">
                <dt>Social Security (6.2%)</dt>
                <dd>-{formatCurrency(result.socialSecurity)}</dd>
                <span class="text-xs text-slate-500">
                  up to the 2026 wage base; no tax once you reach it
                </span>
              </div>
              <div class="flex justify-between">
                <dt>Medicare (1.45%)</dt>
                <dd>-{formatCurrency(roundToCents(result.medicare + result.additionalMedicare))}</dd>
                <span class="text-xs text-slate-500">
                  1.45% + 0.9% additional Medicare tax on wages over $200,000
                </span>
              </div>
              <div class="flex justify-between">
                <dt>State tax ({stateName}, estimated)</dt>
                <dd>-{formatCurrency(result.stateTax)}</dd>
                <span class="text-xs text-slate-500">marginal rate; state tax rates vary</span>
              </div>
              <div class="flex justify-between font-medium">
                <dt>Total withheld</dt>
                <dd>-{formatCurrency(result.totalWithholding)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Actual federal tax on this bonus</dt>
                <dd>{formatCurrency(result.actualFederalTaxOnBonus)}</dd>
                <span class="text-xs text-slate-500">marginal rate on your total income</span>
              </div>
              {result.withholdingVsActual >= 0 ? (
                <div class="flex justify-between">
                  <dt>Over-withheld</dt>
                  <dd>{formatCurrency(result.withholdingVsActual)}</dd>
                  <span class="text-xs text-slate-500">you may get this back when you file</span>
                </div>
              ) : (
                <div class="flex justify-between">
                  <dt>Under-withheld</dt>
                  <dd>{formatCurrency(-result.withholdingVsActual)}</dd>
                  <span class="text-xs text-slate-500">you may owe this when you file</span>
                </div>
              )}
              {result.bonusWithheldAt37 > 0 && (
                <div class="flex justify-between">
                  <dt>Withheld at 37%</dt>
                  <dd>{formatCurrency(result.bonusWithheldAt37)}</dd>
                  <span class="text-xs text-slate-500">
                    Supplemental wages over $1,000,000 in the year are withheld at 37%
                  </span>
                </div>
              )}
            </dl>
            <PayBreakdownChart
              title="Bonus breakdown"
              format={(value) => formatCurrency(value)}
              segments={[
                { label: 'Net bonus', value: result.netBonus, color: '#0d9488' },
                { label: 'Federal withholding', value: result.federalWithholding, color: '#2563eb' },
                { label: 'Social Security', value: result.socialSecurity, color: '#7c3aed' },
                {
                  label: 'Medicare',
                  value: roundToCents(result.medicare + result.additionalMedicare),
                  color: '#db2777',
                },
                { label: `State tax (${stateName})`, value: result.stateTax, color: '#ea580c' },
              ]}
            />
            <p class="mt-4 text-xs text-slate-500">
              This is an estimate only. The actual tax on the bonus depends on your total income,
              deductions, and the state where you live.
            </p>
          </>
        ) : (
          <p class="text-sm text-slate-500">No valid bonus to calculate.</p>
        )}
      </div>
    </div>
  );
}

const roundToCents = (value: number) => Math.round(value * 100) / 100;
