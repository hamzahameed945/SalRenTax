import { useMemo, useState } from 'preact/hooks';
import {
  ueberstundenEngine,
  type UeberstundenModus,
} from '../../calculators/salary/engines/de/ueberstunden';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 }).format(value);

interface Props {
  initialStunden?: number;
  initialStundenlohn?: number;
  initialJahresBrutto?: number;
}

export default function DeUeberstundenCalculator({
  initialStunden,
  initialStundenlohn,
  initialJahresBrutto,
}: Props) {
  const [modus, setModus] = useState<UeberstundenModus>('stundenlohn');
  const [stunden, setStunden] = useState(String(initialStunden ?? 10));
  const [zuschlagProzent, setZuschlagProzent] = useState('0');
  const [stundenlohn, setStundenlohn] = useState(String(initialStundenlohn ?? 25));
  const [monatsBrutto, setMonatsBrutto] = useState('4000');
  const [wochenStunden, setWochenStunden] = useState('40');
  const [jahresBrutto, setJahresBrutto] = useState(String(initialJahresBrutto ?? 50000));

  const result = useMemo(() => {
    const monatsBruttoNum = Number(monatsBrutto);
    const input = {
      stunden: Number(stunden),
      zuschlagProzent: Number(zuschlagProzent),
      modus,
      stundenlohn: Number(stundenlohn),
      monatsBrutto: monatsBruttoNum,
      wochenStunden: Number(wochenStunden),
      // Im Gehaltsmodus wird das Jahresbrutto aus dem Monatsgehalt abgeleitet
      // (12 × Monatsbrutto), da der Grenzsteuersatz vom Jahreseinkommen abhängt.
      jahresBrutto: modus === 'gehalt' ? monatsBruttoNum * 12 : Number(jahresBrutto),
    };
    const validation = ueberstundenEngine.validate(input);
    return validation.valid ? ueberstundenEngine.calculate(validation.data) : null;
  }, [modus, stunden, zuschlagProzent, stundenlohn, monatsBrutto, wochenStunden, jahresBrutto]);

  const abgeleitetesJahresbrutto = Number(monatsBrutto) * 12;

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <div>
          <span class="block text-sm font-medium">Wie möchten Sie rechnen?</span>
          <div class="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setModus('stundenlohn')}
              class={`flex-1 rounded border px-3 py-2 text-sm font-medium ${
                modus === 'stundenlohn'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              Stundenlohn eingeben
            </button>
            <button
              type="button"
              onClick={() => setModus('gehalt')}
              class={`flex-1 rounded border px-3 py-2 text-sm font-medium ${
                modus === 'gehalt'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              Aus Monatsgehalt berechnen
            </button>
          </div>
        </div>

        <label class="block text-sm font-medium" for="de-ue-stunden">
          Anzahl Überstunden
          <input
            id="de-ue-stunden"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            step="1"
            value={stunden}
            onInput={(e) => setStunden((e.target as HTMLInputElement).value)}
          />
        </label>

        <label class="block text-sm font-medium" for="de-ue-zuschlag">
          Überstundenzuschlag (%)
          <input
            id="de-ue-zuschlag"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            max="300"
            step="1"
            value={zuschlagProzent}
            onInput={(e) => setZuschlagProzent((e.target as HTMLInputElement).value)}
          />
          <span class="mt-1 block text-xs font-normal text-slate-500">
            Üblich sind je nach Tarifvertrag z. B. 25 % — ohne Regelung 0 % eintragen.
          </span>
        </label>

        {modus === 'stundenlohn' ? (
          <>
            <label class="block text-sm font-medium" for="de-ue-stundenlohn">
              Stundenlohn brutto (€)
              <input
                id="de-ue-stundenlohn"
                class="mt-1 w-full rounded border p-2"
                type="number"
                min="0.01"
                step="0.01"
                value={stundenlohn}
                onInput={(e) => setStundenlohn((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block text-sm font-medium" for="de-ue-jahresbrutto">
              Jahresbruttogehalt 2026 (€, ohne Überstunden)
              <input
                id="de-ue-jahresbrutto"
                class="mt-1 w-full rounded border p-2"
                type="number"
                min="1"
                step="1"
                value={jahresBrutto}
                onInput={(e) => setJahresBrutto((e.target as HTMLInputElement).value)}
              />
              <span class="mt-1 block text-xs font-normal text-slate-500">
                Bestimmt Ihren Grenzsteuersatz und den SV-Spielraum bis zu den
                Beitragsbemessungsgrenzen.
              </span>
            </label>
          </>
        ) : (
          <>
            <label class="block text-sm font-medium" for="de-ue-monatsbrutto">
              Monatsbruttogehalt (€)
              <input
                id="de-ue-monatsbrutto"
                class="mt-1 w-full rounded border p-2"
                type="number"
                min="1"
                step="1"
                value={monatsBrutto}
                onInput={(e) => setMonatsBrutto((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block text-sm font-medium" for="de-ue-wochenstunden">
              Vertragliche Wochenarbeitszeit (Stunden)
              <input
                id="de-ue-wochenstunden"
                class="mt-1 w-full rounded border p-2"
                type="number"
                min="1"
                max="80"
                step="0.5"
                value={wochenStunden}
                onInput={(e) => setWochenStunden((e.target as HTMLInputElement).value)}
              />
            </label>
            <p class="text-xs text-slate-500">
              Jahresbrutto für die Steuer-Schätzung:{' '}
              <strong>{formatCurrency(abgeleitetesJahresbrutto || 0)}</strong> (12 × Monatsgehalt).
            </p>
          </>
        )}

        <p class="text-xs text-slate-500">
          Das Ergebnis ist eine <strong>Schätzung</strong> nach der Differenzmethode
          (Einkommensteuertarif 2026, Steuerklasse I) inkl. Arbeitnehmer-Sozialversicherung
          (kinderlos, Ø Zusatzbeitrag). Ihre tatsächliche Lohnabrechnung ist maßgeblich.
        </p>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Überstunden netto (Schätzung)</p>
        <p class="text-3xl font-bold text-accent">
          {result ? formatCurrency(result.nettoGeschaetzt) : '—'}
        </p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Überstunden brutto</dt>
              <dd>{formatCurrency(result.ueberstundenBrutto)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Effektiver Stundenlohn</dt>
              <dd>{formatCurrency(result.stundenlohnEffektiv)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Geschätzte Lohnsteuer</dt>
              <dd>{formatCurrency(result.lohnsteuerGeschaetzt)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Solidaritätszuschlag (geschätzt)</dt>
              <dd>{formatCurrency(result.soliGeschaetzt)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Sozialversicherung AN (geschätzt)</dt>
              <dd>{formatCurrency(result.sozialversicherungGeschaetzt)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Geschätzter Grenzsteuersatz</dt>
              <dd>{formatPercent(result.marginalRate)}</dd>
            </div>
          </dl>
        )}
        <p class="mt-4 text-xs text-slate-500">{result ? result.hinweis : ''}</p>
      </div>
    </div>
  );
}
