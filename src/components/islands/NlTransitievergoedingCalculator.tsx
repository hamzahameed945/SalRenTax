import { useState, useMemo } from 'preact/hooks';
import { transitievergoedingEngine } from '../../calculators/salary/engines/nl/nlTransitievergoeding';

interface Props { locale: string; }

const fmt = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export default function NlTransitievergoedingCalculator({ locale }: Props) {
  const [brutoMaandsalaris, setBrutoMaandsalaris] = useState('4000');
  const [dienstjaren, setDienstjaren] = useState('6');
  const [dienstmaandenExtra, setDienstmaandenExtra] = useState('0');

  const result = useMemo(() => {
    const input = {
      brutoMaandsalaris: parseFloat(brutoMaandsalaris) || 0,
      dienstjaren: parseInt(dienstjaren, 10) || 0,
      dienstmaandenExtra: parseInt(dienstmaandenExtra, 10) || 0,
    };
    const v = transitievergoedingEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: transitievergoedingEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [brutoMaandsalaris, dienstjaren, dienstmaandenExtra]);

  const d = result.data;
  const jarenFmt = d ? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(d.dienstverbandJaren) : '';

  return (
    <div class="space-y-6">
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Uw gegevens</h2>
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Bruto maandsalaris <span class="text-slate-400 font-normal">(incl. vakantiegeld en andere looncomponenten)</span>
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input
                type="number" min="0" step="100"
                class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={brutoMaandsalaris}
                onInput={e => setBrutoMaandsalaris((e.target as HTMLInputElement).value)}
                placeholder="4000"
              />
            </div>
            {result.errors?.brutoMaandsalaris && <p class="mt-1 text-xs text-red-600">Ongeldig bedrag</p>}
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Volledige dienstjaren</label>
            <input
              type="number" min="0" step="1"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={dienstjaren}
              onInput={e => setDienstjaren((e.target as HTMLInputElement).value)}
              placeholder="6"
            />
            {result.errors?.dienstjaren && <p class="mt-1 text-xs text-red-600">Ongeldig aantal jaren</p>}
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Extra maanden (0–11)</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={dienstmaandenExtra}
              onChange={e => setDienstmaandenExtra((e.target as HTMLSelectElement).value)}
            >
              {[0,1,2,3,4,5,6,7,8,9,10,11].map(m => (
                <option key={m} value={m}>{m} {m === 1 ? 'maand' : 'maanden'}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {d && (
        <div role="region" aria-live="polite">
          <div class="rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 p-6 text-white mb-4">
            <p class="text-sm font-medium text-teal-200">Transitievergoeding (bruto)</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(locale, d.brutoVergoeding)}</p>
            <p class="mt-2 text-sm text-teal-100">
              {jarenFmt} dienstjaren × ⅓ × {fmt(locale, d.brutoMaandsalaris)}
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-sm">
              <h3 class="font-semibold text-slate-700">Berekening</h3>
              <div class="space-y-2 divide-y divide-slate-100">
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Dienstverband</span>
                  <span>{jarenFmt} jaar</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Vergoeding per dienstjaar (⅓ maandsalaris)</span>
                  <span>{fmt(locale, d.brutoMaandsalaris / 3)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Bruto vergoeding (ongecapt)</span>
                  <span>{fmt(locale, d.onafgerondeVergoeding)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Wettelijk maximum 2026</span>
                  <span>{fmt(locale, d.maxBedrag)}{d.maxBedrag > 102000 ? ' (uw jaarsalaris)' : ''}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-700 font-semibold">
                  <span>Totaal bruto</span>
                  <span>{fmt(locale, d.brutoVergoeding)}</span>
                </div>
              </div>
              {d.capped && (
                <p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                  Het berekende bedrag is afgetopt op het wettelijk maximum van {fmt(locale, d.maxBedrag)}.
                </p>
              )}
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-5 text-sm">
              <h3 class="font-semibold text-slate-700">Goed om te weten</h3>
              <ul class="mt-2 space-y-2 text-slate-600 list-disc pl-4">
                <li>U bouwt recht op vanaf de eerste werkdag (ook tijdens de proeftijd).</li>
                <li>Telt mee in het maandsalaris: vakantiegeld (8%), vaste eindejaarsuitkering, ploegentoeslag en variabele componenten zoals bonus.</li>
                <li>De vergoeding is belast: er wordt loonheffing over ingehouden.</li>
                <li>Geen recht bij ernstig verwijtbaar handelen, ontslag op AOW-leeftijd of faillissement.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <p class="text-xs text-slate-400">
        Formule sinds 2020 (WAB): ⅓ bruto maandsalaris per dienstjaar, naar rato voor resterende maanden.
        Maximum 2026: €102.000 bruto, of één bruto jaarsalaris als dat hoger is.
      </p>
    </div>
  );
}
