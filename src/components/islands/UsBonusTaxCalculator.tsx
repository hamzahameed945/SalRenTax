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
  const [filingStatus, setFilingStatus] = useState<'single' | 'marriedJointly'>('single');
  const [stateCode, setStateCode] = useState(initialStateCode);
  const [annualSalary, setAnnualSalary] = useState(String(initialSalary));
  const [ytdSupplementalWages, setYtdSupplementalWages] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [submitted, setSubmitted] = useState({
    bonusGross,
    filingStatus,
    stateCode,
    annualSalary,
    ytdSupplementalWages,
  });

  const result = useMemo(() => {
    const validation = usBonusTaxEngine.validate({
      bonusGross: Number(submitted.bonusGross),
      filingStatus: submitted.filingStatus,
      stateCode: submitted.stateCode,
      annualSalary: Number(submitted.annualSalary),
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
        <label class="block text-sm font-medium" for="us-bonus-filing">
          Filing status
          <select
            id="us-bonus-filing"
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
          State
          <select
            id="us-bonus-state"
            class={inputClass}
            value={stateCode}
            onChange={(e) => setStateCode((e.target as HTMLSelectElement).value)}
          >
            {US_BONUS_STATE_OPTIONS.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </label>
        <label class="block text-sm font-medium" for="us-bonus-salary">
          Your 2026 salary from the same employer ($)
          <input
            id="us-bonus-salary"
            class={inputClass}
            type="number"
            min="0"
            step="100"
            value={annualSalary}
            onInput={(e) => setAnnualSalary((e.target as HTMLInputElement).value)}
          />
        </label>
        <button
          type="button"
          class="w-full rounded border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide' : 'Show'} advanced options
        </button>
        {showAdvanced && (
          <div class="space-y-4 rounded border border-slate-200 bg-slate-50 p-4">
            <label class="block text-sm font-medium" for="us-bonus-ytd">
              YTD supplemental wages already paid in 2026 ($)
              <input
                id="us-bonus-ytd"
                class={inputClass}
                type="number"
                min="0"
                step="100"
                value={ytdSupplementalWages}
                onInput={(e) => setYtdSupplementalWages((e.target as HTMLInputElement).value)}
              />
            </label>
            <p class="text-xs text-slate-500">
              Supplemental wages above $1,000,000 in a year are withheld at 37% (aggregated
              supplemental rate).
            </p>
          </div>
        )}
        <p class="text-xs text-slate-500">
          Note: For most employees, the bonus is withheld at the {formatPercent(FEDERAL_SUPPLEMENTAL_WITHHOLDING_2026)} federal supplemental rate, plus Social
          Security and Medicare. Actual tax on the bonus may differ at filing time.
        </p>
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
            onClick={() =>
              setSubmitted({ bonusGross, filingStatus, stateCode, annualSalary, ytdSupplementalWages })
            }
          >
            Calculate
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setBonusGross(String(initialBonus));
              setFilingStatus('single');
              setStateCode(initialStateCode);
              setAnnualSalary(String(initialSalary));
              setYtdSupplementalWages('');
              setShowAdvanced(false);
              setSubmitted({
                bonusGross: String(initialBonus),
                filingStatus: 'single',
                stateCode: initialStateCode,
                annualSalary: String(initialSalary),
                ytdSupplementalWages: '',
              });
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Bonus breakdown</h3>
        {result ? (
          <div class="space-y-4">
            <div>
              <span class="text-sm text-slate-500">Net bonus</span>
              <p class="text-3xl font-bold text-accent">{formatCurrency(result.netBonus)}</p>
            </div>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between border-b pb-1">
                <dt>Gross bonus</dt>
                <dd>{formatCurrency(result.bonusGross)}</dd>
              </div>
              <div class="flex justify-between border-b pb-1">
                <dt>Federal withholding</dt>
                <dd>-{formatCurrency(result.federalWithholding)}</dd>
              </div>
              <div class="flex justify-between border-b pb-1">
                <dt>Social Security</dt>
                <dd>-{formatCurrency(result.socialSecurity)}</dd>
              </div>
              <div class="flex justify-between border-b pb-1">
                <dt>Medicare</dt>
                <dd>-{formatCurrency(result.medicare + result.additionalMedicare)}</dd>
              </div>
              <div class="flex justify-between border-b pb-1">
                <dt>State tax ({stateName})</dt>
                <dd>-{formatCurrency(result.stateTax)}</dd>
              </div>
              <div class="flex justify-between border-b pb-1">
                <dt>Total withholding</dt>
                <dd>-{formatCurrency(result.totalWithholding)}</dd>
              </div>
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
                  value: result.medicare + result.additionalMedicare,
                  color: '#db2777',
                },
                { label: `State tax (${stateName})`, value: result.stateTax, color: '#ea580c' },
              ]}
            />
            <div class="space-y-1 text-sm text-slate-600">
              <p>Withholding on bonus: {formatPercent(result.withholdingRate)}</p>
              <p>
                Estimated actual tax on the bonus:{' '}
                {formatCurrency(result.actualFederalTaxOnBonus)}
                {result.withholdingVsActual > 0
                  ? ` (${formatCurrency(result.withholdingVsActual)} more withheld than estimated actual tax)`
                  : result.withholdingVsActual < 0
                    ? ` (${formatCurrency(-result.withholdingVsActual)} less withheld than estimated actual tax)`
                    : ' (matches estimated actual tax)'}
              </p>
              {result.bonusWithheldAt37 && (
                <p>Withheld at the 37% rate because supplemental wages exceed $1,000,000.</p>
              )}
              <p>Marginal rate on the bonus: {formatPercent(result.marginalRate)}</p>
            </div>
          </div>
        ) : (
          <p class="text-sm text-slate-500">No valid bonus breakdown to show.</p>
        )}
      </div>
    </div>
  );
}
