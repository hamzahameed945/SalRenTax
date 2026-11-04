import { useState, useMemo } from 'preact/hooks';
import { frBruttoNettoEngine } from '../../calculators/salary/engines/fr/frBruttoNetto';
import PayBreakdownChart from './PayBreakdownChart';

interface Props {
  locale: string;
  initialSalary?: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div class="flex justify-between px-5 py-2 text-slate-600">
      <span>{label}</span>
      <span>−{fmt(Math.abs(value))}</span>
    </div>
  );
}

export default function FrBruttoNettoCalculator(props: Props) {
  const [grossMonthly, setGrossMonthly] = useState(String(props.initialSalary ?? 3000));
  const [submitted, setSubmitted] = useState({ grossMonthly: String(props.initialSalary ?? 3000) });
  const input = useMemo(() => ({
    grossMonthly: parseFloat(submitted.grossMonthly) || 0,
  }), [submitted]);
  const result = useMemo(() => {
    const v = frBruttoNettoEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: frBruttoNettoEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [input]);
  const d = result.data;
  return (
    <div class="space-y-6">
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Vos données</h2>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            Salaire mensuel brut <span class="text-slate-400 font-normal">(€)</span>
          </label>
          <div class="relative max-w-xs">
            <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
            <input
              type="number" min="0" step="100"
              class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              value={grossMonthly}
              onInput={e => setGrossMonthly((e.target as HTMLInputElement).value)}
              placeholder="p. ex. 3000"
            />
          </div>
          {result.errors?.grossMonthly && <p class="mt-1 text-xs text-red-600">Entrez un montant valide</p>}
        </div>
        <div class="mt-4 flex gap-3">
          <button type="button" class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark" onClick={() => setSubmitted({ grossMonthly })}>Calculer</button>
          <button type="button" class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { const reset = { grossMonthly: String(props.initialSalary ?? 3000) }; setGrossMonthly(reset.grossMonthly); setSubmitted(reset); }}>Réinitialiser</button>
        </div>
      </div>
      {d && (
        <div class="space-y-4" role="region" aria-live="polite">
          <div class="rounded-xl bg-gradient-to-br from-blue-700 to-blue-800 p-6 text-white">
            <p class="text-sm font-medium text-blue-200">Salaire net mensuel</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(d.netMonthly)}</p>
            <div class="mt-3 flex flex-wrap gap-5 text-sm text-blue-100">
              <span>Net annuel : <strong class="text-white">{fmt(d.netMonthly * 12)}</strong></span>
              <span>Taux de prélèvement effectif : <strong class="text-white">{fmtPct(d.totalEmployeeDeductions / d.grossMonthly)}</strong></span>
            </div>
            <p class="mt-3 text-xs text-blue-200">Net après cotisations salariales, avant prélèvement à la source.</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Détail complet</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">
              <div class="flex justify-between px-5 py-3 font-medium text-slate-800">
                <span>Salaire brut mensuel</span>
                <span>{fmt(d.grossMonthly)}</span>
              </div>
              <Row label="Vieillesse plafonnée (6,90 %)" value={d.vieillessePlafonnee} />
              <Row label="Vieillesse déplafonnée (0,40 %)" value={d.vieillesseDeplafonnee} />
              <Row label="Retraite complémentaire Agirc-Arrco" value={d.agircArrco} />
              <Row label="Contribution d’équilibre général (CEG)" value={d.ceg} />
              {d.cet > 0 && <Row label="Contribution d’équilibre technique (CET)" value={d.cet} />}
              <Row label="CSG / CRDS (9,70 % sur 98,25 % du brut)" value={d.csgCrds} />
              <div class="flex justify-between px-5 py-3 font-medium text-slate-800 border-t border-slate-200">
                <span>Total des cotisations salariales</span>
                <span>{fmt(d.totalEmployeeDeductions)}</span>
              </div>
            </div>
          </div>
          <PayBreakdownChart title="Répartition du salaire brut" format={(v) => fmt(v)} segments={[
            { label: 'Salaire net', value: d.netMonthly, color: '#0f766e' },
            { label: 'Vieillesse plafonnée (6,90 %)', value: d.vieillessePlafonnee, color: '#0369a1' },
            { label: 'Vieillesse déplafonnée (0,40 %)', value: d.vieillesseDeplafonnee, color: '#2563eb' },
            { label: 'Retraite complémentaire Agirc-Arrco', value: d.agircArrco, color: '#7c3aed' },
            { label: 'Contribution d’équilibre général (CEG)', value: d.ceg, color: '#b45309' },
            { label: 'Contribution d’équilibre technique (CET)', value: d.cet, color: '#475569' },
            { label: 'CSG / CRDS (9,70 % sur 98,25 % du brut)', value: d.csgCrds, color: '#dc2626' },
          ]} />
        </div>
      )}
    </div>
  );
}
