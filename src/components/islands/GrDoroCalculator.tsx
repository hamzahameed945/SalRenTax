import { useMemo, useState } from 'preact/hooks';
import { grDoroHristougennonEngine } from '../../calculators/labor/engines/grDoroHristougennon';
import PayBreakdownChart from './PayBreakdownChart';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);

interface Props {
  initialSalary?: number;
}

export default function GrDoroCalculator({ initialSalary }: Props) {
  const [monthlySalary, setMonthlySalary] = useState(String(initialSalary ?? 1500));
  const [daysWorked, setDaysWorked] = useState('243');
  const [submitted, setSubmitted] = useState({
    monthlySalary,
    daysWorked,
  });

  const result = useMemo(() => {
    const validation = grDoroHristougennonEngine.validate({
      monthlySalary: Number(submitted.monthlySalary),
      daysWorked: Number(submitted.daysWorked),
    });
    return validation.valid ? grDoroHristougennonEngine.calculate(validation.data) : null;
  }, [submitted]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="gr-doro-salary">
          Μηνιαίος μισθός (€) — τακτικές αποδοχές της 10ης Δεκεμβρίου
          <input
            id="gr-doro-salary"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={monthlySalary}
            onInput={(e) => setMonthlySalary((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="gr-doro-days">
          Ημέρες εργασίας (1 Μαΐου – 31 Δεκεμβρίου)
          <input
            id="gr-doro-days"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            max="243"
            value={daysWorked}
            onInput={(e) => setDaysWorked((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
            onClick={() => setSubmitted({ monthlySalary, daysWorked })}
          >
            Υπολογισμός
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setMonthlySalary(String(initialSalary ?? 1500));
              setDaysWorked('243');
              setSubmitted({ monthlySalary: String(initialSalary ?? 1500), daysWorked: '243' });
            }}
          >
            Επαναφορά
          </button>
        </div>
      </div>
      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Δώρο Χριστουγέννων 2026 — μικτό</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.doroBruto) : '—'}</p>
        {result && (
          <>
            <dl class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <dt>Μηνιαίος μισθός</dt>
                <dd>{formatCurrency(result.monthlySalary)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Ημέρες εργασίας</dt>
                <dd>{result.daysWorked} από 243</dd>
              </div>
              <div class="flex justify-between">
                <dt>Επίδομα αδείας (×1,041666)</dt>
                <dd>{formatCurrency(result.doroBruto - result.baseBonus)}</dd>
              </div>
            </dl>
            <PayBreakdownChart
              title="Κατανομή του δώρου"
              format={formatCurrency}
              segments={[
                { label: 'Βασικό δώρο', value: result.baseBonus, color: '#0d9488' },
                { label: 'Επίδομα αδείας', value: result.doroBruto - result.baseBonus, color: '#2563eb' },
              ]}
            />
          </>
        )}
        <p class="mt-4 text-xs text-slate-500">
          Η εκτίμηση αφορά μισθωτούς με αμοιβή με το μήνα, για το διάστημα από την 1η Μαΐου έως την 31η Δεκεμβρίου, και το ποσό του δώρου Χριστουγέννων για όσους δεν έχουν απολυθεί.
        </p>
      </div>
    </div>
  );
}
