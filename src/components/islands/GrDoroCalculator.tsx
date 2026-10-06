import { useMemo, useState } from 'preact/hooks';
import { grDoroHristougennonEngine } from '../../calculators/labor/engines/grDoroHristougennon';

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

  const result = useMemo(() => {
    const validation = grDoroHristougennonEngine.validate({
      monthlySalary: Number(monthlySalary),
      daysWorked: Number(daysWorked),
    });
    return validation.valid ? grDoroHristougennonEngine.calculate(validation.data) : null;
  }, [monthlySalary, daysWorked]);

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
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Δώρο Χριστουγέννων 2026 — μικτό</p>
        <p class="text-3xl font-bold text-accent">
          {result ? formatCurrency(result.doroBruto) : '—'}
        </p>
        {result && (
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
              <dt>Αναλογία</dt>
              <dd>{(result.proRataFraction * 100).toFixed(1)} %</dd>
            </div>
            <div class="flex justify-between">
              <dt>Επίδομα αδείας (×1,041666)</dt>
              <dd>{formatCurrency(result.doroBruto - result.baseBonus)}</dd>
            </div>
          </dl>
        )}
        <p class="mt-4 text-xs text-slate-500">
          Εκτίμηση μικτού ποσού 2026. Καταβάλλεται έως 21 Δεκεμβρίου. Το δώρο υπόκειται σε εισφορές
          ΕΦΚΑ και φόρο μισθωτών υπηρεσιών. Ισχύει για τον ιδιωτικό τομέα.
        </p>
      </div>
    </div>
  );
}
