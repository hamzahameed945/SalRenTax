import { useState, useMemo } from 'preact/hooks';
import { nlVakantiegeldEngine } from '../../calculators/salary/engines/nl/nlVakantiegeld';

interface Props { locale: string; }

const fmt = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const fmtPct = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1 }).format(v);

export default function NlVakantiegeldCalculator({ locale }: Props) {
  const [grossAnnual, setGrossAnnual]     = useState('45000');
  const [monthsWorked, setMonthsWorked]   = useState('12');
  const [customRate, setCustomRate]       = useState('8');

  const result = useMemo(() => {
    const input = {
      grossAnnual:  parseFloat(grossAnnual) || 0,
      monthsWorked: parseInt(monthsWorked, 10) || 12,
      customRate:   parseFloat(customRate) / 100 || 0.08,
    };
    const v = nlVakantiegeldEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: nlVakantiegeldEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [grossAnnual, monthsWorked, customRate]);

  const d = result.data;

  return (
    <div class="space-y-6">
      {/* Inputs */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Uw gegevens</h2>
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Bruto jaarsalaris</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input
                type="number" min="0" step="500"
                class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={grossAnnual}
                onInput={e => setGrossAnnual((e.target as HTMLInputElement).value)}
                placeholder="45000"
              />
            </div>
            {result.errors?.grossAnnual && <p class="mt-1 text-xs text-red-600">Ongeldig bedrag</p>}
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Gewerkte maanden</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={monthsWorked}
              onChange={e => setMonthsWorked((e.target as HTMLSelectElement).value)}
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>{m} {m === 1 ? 'maand' : 'maanden'}</option>
              ))}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Vakantiegeld % <span class="text-slate-400 font-normal">(min. 8%)</span>
            </label>
            <div class="relative">
              <input
                type="number" min="8" max="25" step="0.5"
                class="w-full rounded-md border border-slate-300 px-3 py-2 pr-8 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={customRate}
                onInput={e => setCustomRate((e.target as HTMLInputElement).value)}
              />
              <span class="absolute inset-y-0 right-3 flex items-center text-slate-400 text-sm">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {d && (
        <div role="region" aria-live="polite">
          {/* Hero */}
          <div class="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white mb-4">
            <p class="text-sm font-medium text-emerald-200">Vakantiegeld uitbetaling</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(locale, d.vakantiegeldProRata)}</p>
            <p class="mt-2 text-sm text-emerald-100">
              Opgebouwd over {d.monthsWorked} {d.monthsWorked === 1 ? 'maand' : 'maanden'} · tarief {fmtPct(locale, d.rate)}
            </p>
          </div>

          {/* Detail cards */}
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-sm">
              <h3 class="font-semibold text-slate-700">Vakantiegeld overzicht</h3>
              <div class="space-y-2 divide-y divide-slate-100">
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Bruto jaarsalaris</span>
                  <span>{fmt(locale, d.grossAnnual)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Volledig jaarlijks vakantiegeld</span>
                  <span class="font-medium">{fmt(locale, d.vakantiegeldAnnual)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Pro-rata ({d.monthsWorked}/12)</span>
                  <span class="font-medium text-emerald-700">{fmt(locale, d.vakantiegeldProRata)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-700 font-semibold">
                  <span>Totaal pakket (jaar + vakantiegeld)</span>
                  <span>{fmt(locale, d.totalPackage)}</span>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-sm">
              <h3 class="font-semibold text-slate-700">Maandelijkse opbouw</h3>
              <div class="space-y-2 divide-y divide-slate-100">
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Opbouw per maand</span>
                  <span class="font-medium">{fmt(locale, d.monthlyAccrual)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Effectief maandloon (incl. opbouw)</span>
                  <span class="font-medium text-blue-700">{fmt(locale, d.effectiveMonthlyGross)}</span>
                </div>
              </div>
              <p class="text-xs text-slate-400 pt-2">
                Werkgevers betalen vakantiegeld doorgaans in mei, of bij uitdiensttreding.
              </p>
            </div>
          </div>
        </div>
      )}

      <p class="text-xs text-slate-400">
        De wettelijke minimumvakantiebijslag is 8% van het bruto jaarsalaris (Wet minimumloon en minimumvakantiebijslag).
        CAO-afspraken kunnen een hoger percentage voorschrijven.
      </p>
    </div>
  );
}
