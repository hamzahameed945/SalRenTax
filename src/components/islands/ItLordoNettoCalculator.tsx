import { useState, useMemo } from 'preact/hooks';
import { itLordoNettoEngine } from '../../calculators/salary/engines/it/itLordoNetto';

interface Props { locale: string; initialSalary?: number; }

const fmt = (v: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
const fmtPct = (v: number) => `${(v * 100).toFixed(1)} %`;

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div class="flex justify-between px-5 py-2 text-slate-600">
      <span>{label}</span>
      <span>−{fmt(Math.abs(value))}</span>
    </div>
  );
}

export default function ItLordoNettoCalculator(props: Props) {
  const [grossAnnual, setGrossAnnual] = useState(String(props.initialSalary ?? 30000));

  const input = useMemo(() => ({
    grossAnnual: parseFloat(grossAnnual) || 0,
  }), [grossAnnual]);

  const result = useMemo(() => {
    const v = itLordoNettoEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: itLordoNettoEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [input]);

  const d = result.data;

  return (
    <div class="space-y-6">
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">I tuoi dati</h2>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            Retribuzione annua lorda — RAL <span class="text-slate-400 font-normal">(€)</span>
          </label>
          <div class="relative max-w-xs">
            <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
            <input
              type="number" min="0" step="1000"
              class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={grossAnnual}
              onInput={e => setGrossAnnual((e.target as HTMLInputElement).value)}
              placeholder="es. 30000"
            />
          </div>
          {result.errors?.grossAnnual && <p class="mt-1 text-xs text-red-600">Inserisci un importo valido</p>}
        </div>
      </div>

      {d && (
        <div class="space-y-4" role="region" aria-live="polite">
          <div class="rounded-xl bg-gradient-to-br from-blue-700 to-blue-800 p-6 text-white">
            <p class="text-sm font-medium text-blue-200">Stipendio netto annuo</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(d.netAnnual)}</p>
            <div class="mt-3 flex flex-wrap gap-5 text-sm text-blue-100">
              <span>Netto mensile (su 12 mensilità): <strong class="text-white">{fmt(d.netMonthly)}</strong></span>
              <span>Aliquota effettiva: <strong class="text-white">{fmtPct(d.totalDeductions / d.grossAnnual)}</strong></span>
            </div>
            <p class="mt-3 text-xs text-blue-200">Netto dopo INPS e IRPEF nazionale; addizionali regionali e comunali e detrazione per lavoro dipendente non incluse.</p>
          </div>

          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Dettaglio completo</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">
              <div class="flex justify-between px-5 py-3 font-medium text-slate-800">
                <span>Retribuzione annua lorda</span>
                <span>{fmt(d.grossAnnual)}</span>
              </div>
              <Row label="Contributi INPS (9,19%)" value={d.inps} />
              {d.inpsExtra > 0 && <Row label="Contributo INPS aggiuntivo (+1% sopra €56.224)" value={d.inpsExtra} />}
              <div class="flex justify-between px-5 py-2 text-slate-600">
                <span>Reddito imponibile</span>
                <span>{fmt(d.taxableIncome)}</span>
              </div>
              <Row label="IRPEF nazionale (23% / 33% / 43%)" value={d.irpef} />
              <div class="flex justify-between px-5 py-3 font-medium text-slate-800 border-t border-slate-200">
                <span>Totale trattenute</span>
                <span>−{fmt(d.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
