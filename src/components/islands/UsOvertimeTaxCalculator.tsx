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
            max="600"
            step="1"
            value={overtimeHours}
            onInput={(e) => setOvertimeHours((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="us-ot-filing">
          Filing status
          <select
            id="us-ot-filing"
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
          <legend class="text-sm font-medium">How to estimate your federal rate</legend>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="us-ot-rate-mode"
              checked={!useBracket}
              onChange={() => setUseBracket(false)}
            />
            Estimate from my annual salary
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="us-ot-rate-mode"
              checked={useBracket}
              onChange={() => setUseBracket(true)}
            />
            Use a federal tax bracket directly
          </label>
        </fieldset>
        {!useBracket ? (
          <label class="block text-sm font-medium" for="us-ot-salary">
            Annual salary ($)
            <input
              id="us-ot-salary"
              class={inputClass}
              type="number"
              min="0"
              step="100"
              value={annualSalary}
              onInput={(e) => setAnnualSalary((e.target as HTMLInputElement).value)}
            />
          </label>
        ) : (
          <label class="block text-sm font-medium" for="us-ot-bracket">
            Federal tax bracket
            <select
              id="us-ot-bracket"
              class={inputClass}
              value={taxBracket}
              onChange={(e) => setTaxBracket((e.target as HTMLSelectElement).value)}
            >
              {FEDERAL_BRACKET_OPTIONS_2026.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <p class="text-xs text-slate-500">
          The $10,000 overtime deduction is claimed when you file your return, not in your
          regular paycheck, and it does not reduce Social Security or Medicare tax.
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

      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Overtime pay</h3>
        {result ? (
          <>
            <div>
              <span class="text-sm text-slate-500">Overtime pay after tax</span>
              <p class="text-3xl font-bold text-accent">{formatCurrency(result.netAfterTax)}</p>
            </div>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between border-b pb-1">
                <dt>Base pay for overtime hours</dt>
                <dd>{formatCurrency(result.basePay)}</dd>
              </div>
              <div class="flex justify-between border-b pb-1">
                <dt>Overtime premium (0.5× rate)</dt>
                <dd>{formatCurrency(result.premiumPay)}</dd>
              </div>
              <div class="flex justify-between border-b pb-1">
                <dt>Overtime gross pay</dt>
                <dd>{formatCurrency(result.overtimeGross)}</dd>
              </div>
              <div class="flex justify-between border-b pb-1">
                <dt>Federal income tax on overtime</dt>
                <dd>-{formatCurrency(result.taxOnOvertime)}</dd>
              </div>
              <div class="flex justify-between border-b pb-1">
                <dt>Social Security + Medicare</dt>
                <dd>-{formatCurrency(result.ficaOnOvertime)}</dd>
              </div>
              <div class="flex justify-between border-b pb-1">
                <dt>Total pay (regular + overtime)</dt>
                <dd>{formatCurrency(result.totalPay)}</dd>
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
            <p class="text-xs text-slate-500">
              Federal rate used: {formatPercent(result.federalRate)} ({result.rateSource}).
              Eligible for the 2026 overtime deduction: {formatCurrency(result.eligibleDeduction)}.
            </p>
          </>
        ) : (
          <p class="text-sm text-slate-500">No valid overtime calculation to show.</p>
        )}
      </div>
    </div>
  );
}
