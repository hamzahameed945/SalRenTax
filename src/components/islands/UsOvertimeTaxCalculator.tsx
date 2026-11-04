import { useMemo, useState } from 'preact/hooks';
import PayBreakdownChart from './PayBreakdownChart';
import {
  usOvertimeTaxEngine,
  FEDERAL_BRACKET_OPTIONS_2026,
} from '../../calculators/salary/engines/us/usOvertimeTax';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const formatPercent = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(value);

interface Props {
  initialHourlyRate?: number;
  initialOvertimeHours?: number;
  initialSalary?: number;
}

export default function UsOvertimeTaxCalculator({
  initialHourlyRate = 25,
  initialOvertimeHours = 200,
  initialSalary = 60000,
}: Props) {
  const [hourlyRate, setHourlyRate] = useState(String(initialHourlyRate));
  const [overtimeHours, setOvertimeHours] = useState(String(initialOvertimeHours));
  const [filingStatus, setFilingStatus] = useState<'single' | 'marriedJointly'>('single');
  const [useBracket, setUseBracket] = useState(false);
  const [annualSalary, setAnnualSalary] = useState(String(initialSalary));
  const [taxBracket, setTaxBracket] = useState('0.22');

  const [submitted, setSubmitted] = useState({
    hourlyRate,
    overtimeHours,
    filingStatus,
    useBracket,
    annualSalary,
    taxBracket,
  });

  const result = useMemo(() => {
    const validation = usOvertimeTaxEngine.validate({
      hourlyRate: Number(submitted.hourlyRate),
      overtimeHours: Number(submitted.overtimeHours),
      filingStatus: submitted.filingStatus,
      annualSalary: submitted.useBracket ? undefined : Number(submitted.annualSalary),
      taxBracket: submitted.useBracket ? Number(submitted.taxBracket) : undefined,
    });
    return validation.valid ? usOvertimeTaxEngine.calculate(validation.data) : null;
  }, [submitted]);

  const inputClass = 'mt-1 w-full rounded border p-2';

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="us-ot-rate">
          Regular hourly rate ($)
          <input
            id="us-ot-rate"
            class={inputClass}
            type="number"
            min="1"
            step="0.5"
            value={hourlyRate}
            onInput={(e) => setHourlyRate((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="us-ot-hours">
          Overtime hours in 2026
          <input
            id="us-ot-hours"
            class={inputClass}
            type="number"
            min="0"
            step="1"
            value={overtimeHours}
            onInput={(e) => setOvertimeHours((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="us-ot-status">
          Filing status
          <select
            id="us-ot-status"
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
        <fieldset class="space-y-2">
          <legend class="text-sm font-medium">How to work out your tax bracket</legend>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="us-ot-mode"
              checked={!useBracket}
              onChange={() => setUseBracket(false)}
            />
            Estimate it from my salary
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="us-ot-mode"
              checked={useBracket}
              onChange={() => setUseBracket(true)}
            />
            I know my marginal bracket
          </label>
        </fieldset>
        {!useBracket ? (
          <label class="block text-sm font-medium" for="us-ot-salary">
            Estimated total 2026 wages ($), overtime included
            <input
              id="us-ot-salary"
              class={inputClass}
              type="number"
              min="1"
              step="1000"
              value={annualSalary}
              onInput={(e) => setAnnualSalary((e.target as HTMLInputElement).value)}
            />
          </label>
        ) : (
          <label class="block text-sm font-medium" for="us-ot-bracket">
            Your 2026 federal marginal tax bracket
            <select
              id="us-ot-bracket"
              class={inputClass}
              value={taxBracket}
              onChange={(e) => setTaxBracket((e.target as HTMLSelectElement).value)}
            >
              {FEDERAL_BRACKET_OPTIONS_2026.map((b) => (
                <option key={b} value={b}>
                  {formatPercent(b)}
                </option>
              ))}
            </select>
          </label>
        )}
        <p class="text-xs text-slate-500">
          For most employees, the premium is taxed as ordinary income and the deduction is
          claimed when you file. The $10,000 deduction is not available in your paycheck, but you
          can adjust your withholding to account for it.
        </p>
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
            onClick={() =>
              setSubmitted({
                hourlyRate,
                overtimeHours,
                filingStatus,
                useBracket,
                annualSalary,
                taxBracket,
              })
            }
          >
            Calculate
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setHourlyRate(String(initialHourlyRate));
              setOvertimeHours(String(initialOvertimeHours));
              setFilingStatus('single');
              setUseBracket(false);
              setAnnualSalary(String(initialSalary));
              setTaxBracket('0.22');
              setSubmitted({
                hourlyRate: String(initialHourlyRate),
                overtimeHours: String(initialOvertimeHours),
                filingStatus: 'single',
                useBracket: false,
                annualSalary: String(initialSalary),
                taxBracket: '0.22',
              });
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Overtime gross pay (2026)</p>
        <p class="text-3xl font-bold text-accent">
          {result ? formatCurrency(result.overtimeGross) : '—'}
        </p>
        {result ? (
          <>
            <dl class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <dt>Base pay (regular rate × overtime hours)</dt>
                <dd>{formatCurrency(result.baseComponent)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Overtime premium (0.5 × rate × overtime hours)</dt>
                <dd>{formatCurrency(result.premiumComponent)}</dd>
              </div>
              <div class="flex justify-between font-medium">
                <dt>Gross pay</dt>
                <dd>{formatCurrency(result.overtimeGross)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Federal income tax (marginal bracket)</dt>
                <dd>-{formatCurrency(result.taxOnOvertime)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Social Security + Medicare</dt>
                <dd>-{formatCurrency(result.ficaOnOvertime)}</dd>
                <span class="text-xs text-slate-500">
                  FICA applies to all overtime pay; the deduction does not reduce it
                </span>
              </div>
              <div class="flex justify-between font-medium">
                <dt>Net after tax</dt>
                <dd>{formatCurrency(result.netAfterTax)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Tax bracket used</dt>
                <dd>{formatPercent(result.marginalRate)}</dd>
                <span class="text-xs text-slate-500">
                  {result.bracketDerived ? '(estimated from salary)' : '(directly entered)'}
                </span>
              </div>
              <div class="flex justify-between">
                <dt>Deductible overtime premium</dt>
                <dd>{formatCurrency(result.deductiblePremium)}</dd>
                <span class="text-xs text-slate-500">
                  up to the $10,000 deduction cap (no double count)
                </span>
              </div>
              <div class="flex justify-between">
                <dt>Estimated tax saving from the deduction</dt>
                <dd>{formatCurrency(result.taxSavings)}</dd>
                <span class="text-xs text-slate-500">you get this when you file</span>
              </div>
              <div class="flex justify-between font-medium">
                <dt>Estimated net after tax</dt>
                <dd>{formatCurrency(result.effectiveNet)}</dd>
                <span class="text-xs text-slate-500">includes the deduction benefit</span>
              </div>
            </dl>
            <PayBreakdownChart
              title="Overtime pay breakdown"
              format={(value) => formatCurrency(value)}
              segments={[
                { label: 'Overtime pay after tax', value: result.netAfterTax, color: '#0d9488' },
                { label: 'Federal income tax', value: result.taxOnOvertime, color: '#2563eb' },
                {
                  label: 'Social Security + Medicare',
                  value: result.ficaOnOvertime,
                  color: '#7c3aed',
                },
              ]}
            />
            <p class="mt-4 text-xs text-slate-500">
              The $10,000 deduction is capped at your deductible premium and phases out above
              $150,000 ($300,000 joint) MAGI. Only the premium portion — not the full overtime pay
              — is deductible.
            </p>
            {result.phaseOutApplied && (
              <p class="mt-4 text-sm text-amber-700">
                Your MAGI exceeds the phase-out threshold, so the $10,000 deduction is reduced.
              </p>
            )}
          </>
        ) : (
          <p class="text-sm text-slate-500">No valid overtime calculation to show.</p>
        )}
      </div>
    </div>
  );
}
