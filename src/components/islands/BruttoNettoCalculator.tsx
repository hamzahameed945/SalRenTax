import { useState, useMemo } from 'preact/hooks';
import { bruttoNettoEngine, type KirchensteuerRegion } from '../../calculators/salary/engines/de/bruttoNetto';
import type { Steuerklasse } from '../../data/salary/de/germanPayrollData2026';

interface Props { locale?: string; defaultKirchensteuer?: KirchensteuerRegion; }

const fmt = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
const fmtPct = (v: number) =>
  `${(v * 100).toFixed(1).replace('.', ',')} %`;

const SK_LABELS: Record<Steuerklasse, string> = {
  I:   'I — Ledig / Geschieden',
  II:  'II — Alleinerziehend',
  III: 'III — Verheiratet (Besserverdiener)',
  IV:  'IV — Verheiratet (gleiche Gehälter)',
  V:   'V — Verheiratet (Geringverdiener)',
  VI:  'VI — Zweiter Job',
};

export default function BruttoNettoCalculator({
  locale = 'de-DE',
  defaultKirchensteuer = 'none',
}: Props) {
  // ── Inputs ─────────────────────────────────────────────────────────────
  const [grossMonthly, setGrossMonthly]         = useState('3500');
  const [steuerklasse, setSteuerklasse]         = useState<Steuerklasse>('I');
  const [numberOfChildren, setNumberOfChildren] = useState('0');
  const [kirchensteuer, setKirchensteuer]       = useState<KirchensteuerRegion>(defaultKirchensteuer);
  const [isSachsen, setIsSachsen]               = useState(false);
  // What-if
  const [whatIfGross, setWhatIfGross]           = useState('');
  const [showWhatIf, setShowWhatIf]             = useState(false);

  const input = useMemo(() => ({
    grossMonthly:       parseFloat(grossMonthly) || 0,
    steuerklasse,
    numberOfChildren:   parseInt(numberOfChildren, 10) || 0,
    kirchensteuerRegion: kirchensteuer,
    isSachsen,
  }), [grossMonthly, steuerklasse, numberOfChildren, kirchensteuer, isSachsen]);

  const result = useMemo(() => {
    const v = bruttoNettoEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: bruttoNettoEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [input]);

  const whatIfResult = useMemo(() => {
    if (!whatIfGross || !showWhatIf) return null;
    const v = bruttoNettoEngine.validate({ ...input, grossMonthly: parseFloat(whatIfGross) || 0 });
    if (!v.valid) return null;
    return bruttoNettoEngine.calculate(v.data, {} as never, 2026);
  }, [whatIfGross, showWhatIf, input]);

  const d = result.data;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div class="space-y-6">

      {/* ── Input panel ──────────────────────────────────────────────── */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Ihre Angaben</h2>
        <div class="grid gap-4 sm:grid-cols-2">

          {/* Gross */}
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Monatliches Bruttogehalt</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input
                type="number" min="0" step="100"
                class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={grossMonthly}
                onInput={e => setGrossMonthly((e.target as HTMLInputElement).value)}
                placeholder="z. B. 3500"
              />
            </div>
            {result.errors?.grossMonthly && <p class="mt-1 text-xs text-red-600">Ungültiger Betrag</p>}
          </div>

          {/* Steuerklasse */}
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Steuerklasse</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={steuerklasse}
              onChange={e => setSteuerklasse((e.target as HTMLSelectElement).value as Steuerklasse)}
            >
              {(Object.keys(SK_LABELS) as Steuerklasse[]).map(sk => (
                <option key={sk} value={sk}>{SK_LABELS[sk]}</option>
              ))}
            </select>
          </div>

          {/* Children */}
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Kinder unter 25 <span class="text-slate-400 font-normal">(Pflegeversicherung)</span>
            </label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={numberOfChildren}
              onChange={e => setNumberOfChildren((e.target as HTMLSelectElement).value)}
            >
              <option value="0">0 — kinderlos (Zuschlag +0,6 %)</option>
              <option value="1">1 Kind</option>
              <option value="2">2 Kinder</option>
              <option value="3">3 Kinder</option>
              <option value="4">4 Kinder</option>
              <option value="5">5+ Kinder</option>
            </select>
          </div>

          {/* Kirchensteuer */}
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Kirchensteuer</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={kirchensteuer}
              onChange={e => setKirchensteuer((e.target as HTMLSelectElement).value as KirchensteuerRegion)}
            >
              <option value="none">Kein Mitglied</option>
              <option value="other">Kirchenmitglied — 9 % (alle BL außer Bayern)</option>
              <option value="bayern">Kirchenmitglied — 8 % (Bayern)</option>
            </select>
          </div>

          {/* Sachsen toggle */}
          <div class="sm:col-span-2">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox" checked={isSachsen}
                onChange={e => setIsSachsen((e.target as HTMLInputElement).checked)}
                class="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span class="text-sm text-slate-700">
                Arbeitsstätte in Sachsen
                <span class="text-slate-400 font-normal ml-1">(abweichende PV-Aufteilung: AN trägt +0,5 %)</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────────────── */}
      {d && (
        <div class="space-y-4" role="region" aria-live="polite">

          {/* Hero */}
          <div class="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
            <p class="text-sm font-medium text-slate-300">Netto pro Monat</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(locale, d.netMonthly)}</p>
            <div class="mt-3 flex flex-wrap gap-5 text-sm text-slate-300">
              <span>Netto/Jahr: <strong class="text-white">{fmt(locale, d.netAnnual)}</strong></span>
              <span>Eff. Rate: <strong class="text-white">{fmtPct(d.effectiveRate)}</strong></span>
              <span>Grenzsteuersatz: <strong class="text-white">{fmtPct(d.marginalTaxRate)}</strong></span>
              <span>SK: <strong class="text-white">{d.steuerklasse}</strong></span>
            </div>
          </div>

          {/* Full breakdown */}
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Vollständige Abrechnung</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">

              {/* Gross */}
              <div class="flex justify-between px-5 py-3 font-medium text-slate-800">
                <span>Bruttogehalt monatlich</span>
                <span>{fmt(locale, d.grossMonthly)}</span>
              </div>

              {/* Social insurance */}
              <div class="px-5 py-3 space-y-1 bg-red-50">
                <p class="text-xs font-semibold uppercase tracking-wide text-red-400 mb-2">Sozialversicherung (Arbeitnehmer)</p>
                <Row label="Rentenversicherung (9,3 %)" value={-d.pensionInsuranceEmployee} locale={locale} />
                <Row label="Arbeitslosenversicherung (1,3 %)" value={-d.unemploymentInsuranceEmployee} locale={locale} />
                <Row label="Krankenversicherung (8,75 % Ø)" value={-d.healthInsuranceEmployee} locale={locale} />
                <Row
                  label={`Pflegeversicherung (${fmtPct(d.longTermCareInsuranceEmployee / Math.min(d.grossMonthly, 5812.5))})`}
                  value={-d.longTermCareInsuranceEmployee}
                  locale={locale}
                />
                <div class="flex justify-between pt-2 border-t border-red-200 font-medium text-red-700">
                  <span>Sozialversicherung gesamt</span>
                  <span>−{fmt(locale, d.totalSocialInsuranceEmployee)}</span>
                </div>
              </div>

              {/* Tax */}
              <div class="px-5 py-3 space-y-1 bg-orange-50">
                <p class="text-xs font-semibold uppercase tracking-wide text-orange-400 mb-2">Steuern</p>
                <Row label={`Lohnsteuer SK ${d.steuerklasse} (zvE ${fmt(locale, d.taxableIncomeAnnual)}/Jahr)`} value={-d.lohnsteuerMonthly} locale={locale} />
                {d.soliMonthly > 0 && (
                  <Row label="Solidaritätszuschlag" value={-d.soliMonthly} locale={locale} />
                )}
                {d.kirchensteuerMonthly > 0 && (
                  <Row label={`Kirchensteuer (${fmtPct(d.kirchensteuerRate)})`} value={-d.kirchensteuerMonthly} locale={locale} />
                )}
                {d.soliMonthly === 0 && (
                  <p class="text-xs text-orange-600 pl-4">Kein Solidaritätszuschlag (unter Freigrenze)</p>
                )}
              </div>

              {/* Net */}
              <div class="flex justify-between px-5 py-4 bg-slate-800 text-white font-bold text-base">
                <span>Nettogehalt monatlich</span>
                <span>{fmt(locale, d.netMonthly)}</span>
              </div>
            </div>
          </div>

          {/* Employer cost info */}
          <details class="rounded-xl border border-slate-200 overflow-hidden">
            <summary class="bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 cursor-pointer select-none">
              Arbeitgeberkosten (informativ)
            </summary>
            <div class="divide-y divide-slate-100 text-sm bg-white">
              <Row label="Rentenversicherung AG (9,3 %)" value={d.pensionInsuranceEmployer} locale={locale} color="slate" />
              <Row label="Arbeitslosenversicherung AG (1,3 %)" value={d.unemploymentInsuranceEmployer} locale={locale} color="slate" />
              <Row label="Krankenversicherung AG (8,75 % Ø)" value={d.healthInsuranceEmployer} locale={locale} color="slate" />
              <Row label="Pflegeversicherung AG" value={d.longTermCareInsuranceEmployer} locale={locale} color="slate" />
              <div class="flex justify-between px-5 py-3 font-medium text-slate-800 bg-slate-50">
                <span>Gesamtkosten Arbeitgeber/Monat</span>
                <span>{fmt(locale, d.grossMonthly + d.totalSocialInsuranceEmployer)}</span>
              </div>
            </div>
          </details>

          {/* What-if */}
          <div class="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-blue-800">Was wäre wenn … Gehaltserhöhung simulieren</h3>
              <button
                onClick={() => setShowWhatIf(v => !v)}
                class="text-xs font-medium text-blue-700 hover:text-blue-900 underline"
              >
                {showWhatIf ? 'Ausblenden' : 'Vergleichen'}
              </button>
            </div>
            {showWhatIf && (
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-blue-800 mb-1">Neues Bruttogehalt</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-3 flex items-center text-blue-400 text-sm">€</span>
                    <input
                      type="number" min="0" step="100"
                      class="w-full rounded-md border border-blue-300 bg-white pl-7 pr-3 py-2 text-slate-900 focus:outline-none"
                      value={whatIfGross}
                      onInput={e => setWhatIfGross((e.target as HTMLInputElement).value)}
                      placeholder="z. B. 4000"
                    />
                  </div>
                </div>
                {whatIfResult && (
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="rounded-lg bg-white border border-blue-200 p-3">
                      <p class="text-xs text-slate-500 mb-1">Aktuelles Netto/Monat</p>
                      <p class="text-lg font-bold text-slate-800">{fmt(locale, d.netMonthly)}</p>
                    </div>
                    <div class="rounded-lg bg-white border border-blue-200 p-3">
                      <p class="text-xs text-slate-500 mb-1">Neues Netto/Monat</p>
                      <p class="text-lg font-bold text-green-700">{fmt(locale, whatIfResult.netMonthly)}</p>
                    </div>
                    <div class="col-span-2 rounded-lg bg-white border border-blue-200 p-3">
                      <p class="text-xs text-slate-500 mb-1">Netto-Verbesserung pro Monat</p>
                      <p class={`text-xl font-bold ${whatIfResult.netMonthly >= d.netMonthly ? 'text-green-600' : 'text-red-600'}`}>
                        {whatIfResult.netMonthly >= d.netMonthly ? '+' : ''}
                        {fmt(locale, whatIfResult.netMonthly - d.netMonthly)}
                        <span class="text-sm font-normal text-slate-500 ml-2">
                          (neuer Grenzsteuersatz: {fmtPct(whatIfResult.marginalTaxRate)})
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <p class="text-xs text-slate-400">
        Berechnung nach § 32a EStG 2026 (Steuerfortentwicklungsgesetz v. 23.12.2024), Sozialversicherungsrechengrößen 2026.
        Durchschnittlicher GKV-Zusatzbeitrag 2,9 %. Kirchensteuer auf Lohnsteuer.
        Individuelle Freibeträge, betriebliche Altersvorsorge und Sonderausgaben sind nicht berücksichtigt.
      </p>
    </div>
  );
}

function Row({
  label, value, locale, color = 'red',
}: {
  label: string; value: number; locale: string; color?: 'red' | 'orange' | 'slate';
}) {
  const colorCls = color === 'red' ? 'text-red-700' : color === 'orange' ? 'text-orange-700' : 'text-slate-600';
  const sign = value < 0 ? '−' : '';
  return (
    <div class={`flex justify-between px-5 py-1.5 ${colorCls}`}>
      <span class="pl-4">{label}</span>
      <span>{sign}{new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(Math.abs(value))}</span>
    </div>
  );
}
