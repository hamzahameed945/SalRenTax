import { useState, useMemo } from 'preact/hooks';
import { nlOverurenEngine } from '../../calculators/salary/engines/nl/nlOveruren';

interface Props { locale: string; }

const fmt = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const PRESETS: { label: string; value: number }[] = [
  { label: '125%', value: 25 },
  { label: '150%', value: 50 },
  { label: '200%', value: 100 },
];

export default function NlOverurenCalculator({ locale }: Props) {
  const [mode, setMode] = useState<'salaris' | 'uurloon'>('salaris');
  const [brutoMaandsalaris, setBrutoMaandsalaris] = useState('3500');
  const [urenPerWeek, setUrenPerWeek] = useState('40');
  const [uurloon, setUurloon] = useState('20');
  const [overuren, setOveruren] = useState('8');
  const [toeslagPercent, setToeslagPercent] = useState('50');

  const result = useMemo(() => {
    const input = {
      brutoMaandsalaris: mode === 'salaris' ? parseFloat(brutoMaandsalaris) || 0 : undefined,
      urenPerWeek: mode === 'salaris' ? parseFloat(urenPerWeek) || 0 : undefined,
      uurloon: mode === 'uurloon' ? parseFloat(uurloon) || 0 : undefined,
      overuren: parseFloat(overuren) || 0,
      toeslagPercent: parseFloat(toeslagPercent) || 0,
    };
    const v = nlOverurenEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: nlOverurenEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [mode, brutoMaandsalaris, urenPerWeek, uurloon, overuren, toeslagPercent]);

  const d = result.data;

  return (
    <div class="space-y-6">
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Uw gegevens</h2>

        <div class="flex gap-2 mb-4" role="tablist" aria-label="Manier van invoer">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'salaris'}
            class={`rounded-md px-4 py-2 text-sm font-medium ${mode === 'salaris' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
            onClick={() => setMode('salaris')}
          >
            Uurloon uit salaris
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'uurloon'}
            class={`rounded-md px-4 py-2 text-sm font-medium ${mode === 'uurloon' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
            onClick={() => setMode('uurloon')}
          >
            Uurloon direct
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          {mode === 'salaris' ? (
            <>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Bruto maandsalaris</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
                  <input
                    type="number" min="0" step="100"
                    class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={brutoMaandsalaris}
                    onInput={e => setBrutoMaandsalaris((e.target as HTMLInputElement).value)}
                    placeholder="3500"
                  />
                </div>
                {result.errors?.brutoMaandsalaris && <p class="mt-1 text-xs text-red-600">Ongeldig bedrag</p>}
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Uren per week (contract)</label>
                <input
                  type="number" min="1" max="100" step="1"
                  class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={urenPerWeek}
                  onInput={e => setUrenPerWeek((e.target as HTMLInputElement).value)}
                  placeholder="40"
                />
                {result.errors?.urenPerWeek && <p class="mt-1 text-xs text-red-600">Ongeldig aantal uren</p>}
              </div>
            </>
          ) : (
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Uurloon (bruto)</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
                <input
                  type="number" min="0" step="0.1"
                  class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={uurloon}
                  onInput={e => setUurloon((e.target as HTMLInputElement).value)}
                  placeholder="20"
                />
              </div>
              {result.errors?.uurloon && <p class="mt-1 text-xs text-red-600">Ongeldig uurloon</p>}
            </div>
          )}

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Aantal overuren</label>
            <input
              type="number" min="0" step="0.5"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={overuren}
              onInput={e => setOveruren((e.target as HTMLInputElement).value)}
              placeholder="8"
            />
            {result.errors?.overuren && <p class="mt-1 text-xs text-red-600">Ongeldig aantal uren</p>}
          </div>
        </div>

        <div class="mt-4">
          <span class="block text-sm font-medium text-slate-700 mb-2">
            Overwerktoeslag <span class="text-slate-400 font-normal">(bovenop normaal uurloon)</span>
          </span>
          <div class="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.value}
                type="button"
                class={`rounded-md px-4 py-2 text-sm font-medium ${Number(toeslagPercent) === p.value ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
                onClick={() => setToeslagPercent(String(p.value))}
              >
                {p.label}
              </button>
            ))}
            <div class="relative">
              <input
                type="number" min="0" max="300" step="1"
                aria-label="Eigen toeslagpercentage"
                class="w-24 rounded-md border border-slate-300 px-3 py-2 pr-8 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={toeslagPercent}
                onInput={e => setToeslagPercent((e.target as HTMLInputElement).value)}
              />
              <span class="absolute inset-y-0 right-3 flex items-center text-slate-400 text-sm">%</span>
            </div>
          </div>
        </div>
      </div>

      {d && (
        <div role="region" aria-live="polite">
          <div class="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white mb-4">
            <p class="text-sm font-medium text-indigo-200">Bruto overwerkvergoeding</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(locale, d.brutoOverwerkvergoeding)}</p>
            <p class="mt-2 text-sm text-indigo-100">
              {Number(overuren) || 0} overuren × {fmt(locale, d.overurentarief)} per uur
              {d.uurloonAfgeleid && ` (uurloon ${fmt(locale, d.uurloon)} afgeleid uit maandsalaris)`}
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-sm">
              <h3 class="font-semibold text-slate-700">Berekening</h3>
              <div class="space-y-2 divide-y divide-slate-100">
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Normaal uurloon</span>
                  <span>{fmt(locale, d.uurloon)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Overurentarief ({Number(toeslagPercent) + 100}%)</span>
                  <span>{fmt(locale, d.overurentarief)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Basis: uurloon × overuren</span>
                  <span>{fmt(locale, d.basisComponent)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Toeslagcomponent</span>
                  <span class="font-medium text-indigo-700">{fmt(locale, d.toeslagComponent)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-700 font-semibold">
                  <span>Totaal bruto</span>
                  <span>{fmt(locale, d.brutoOverwerkvergoeding)}</span>
                </div>
              </div>
            </div>
            <div class="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm">
              <h3 class="font-semibold text-amber-800">Let op</h3>
              <p class="mt-2 text-amber-900">
                De toeslag voor overwerk hangt af van uw CAO of arbeidsovereenkomst. In veel sectoren wordt
                overwerk niet uitbetaald maar omgezet in <strong>tijd-voor-tijd</strong> (extra vrije uren).
                Controleer uw contract voordat u uitgaat van een uitbetaling.
              </p>
            </div>
          </div>
        </div>
      )}

      <p class="text-xs text-slate-400">
        Uurloon wordt afgeleid als bruto maandsalaris × 12 / 52 / uren per week. De weergegeven bedragen zijn bruto;
        over de vergoeding wordt loonheffing ingehouden.
      </p>
    </div>
  );
}
