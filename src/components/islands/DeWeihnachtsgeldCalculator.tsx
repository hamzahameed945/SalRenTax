import { useMemo, useState } from 'preact/hooks';
import { weihnachtsgeldEngine } from '../../calculators/salary/engines/de/weihnachtsgeld';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 }).format(value);

interface Props {
  initialBonus?: number;
  initialSalary?: number;
}

export default function DeWeihnachtsgeldCalculator({ initialBonus, initialSalary }: Props) {
  const [bonusBrutto, setBonusBrutto] = useState(String(initialBonus ?? 2000));
  const [jahresBrutto, setJahresBrutto] = useState(String(initialSalary ?? 50000));

  const result = useMemo(() => {
    const validation = weihnachtsgeldEngine.validate({
      bonusBrutto: Number(bonusBrutto),
      jahresBrutto: Number(jahresBrutto),
    });
    return validation.valid ? weihnachtsgeldEngine.calculate(validation.data) : null;
  }, [bonusBrutto, jahresBrutto]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="de-wn-bonus">
          Weihnachtsgeld brutto (€)
          <input
            id="de-wn-bonus"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            step="1"
            value={bonusBrutto}
            onInput={(e) => setBonusBrutto((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="de-wn-salary">
          Jahresbruttogehalt 2026 (€, ohne Weihnachtsgeld)
          <input
            id="de-wn-salary"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            step="1"
            value={jahresBrutto}
            onInput={(e) => setJahresBrutto((e.target as HTMLInputElement).value)}
          />
        </label>
        <p class="text-xs text-slate-500">
          Das Ergebnis ist eine <strong>Schätzung</strong> nach der Jahrestabellen-Differenzmethode
          (Einkommensteuertarif 2026, Steuerklasse I) inkl. Arbeitnehmer-Sozialversicherung
          (kinderlos, Ø Zusatzbeitrag). Ihre tatsächliche Lohnabrechnung ist maßgeblich.
        </p>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Weihnachtsgeld netto (Schätzung)</p>
        <p class="text-3xl font-bold text-accent">
          {result ? formatCurrency(result.nettoGeschaetzt) : '—'}
        </p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Weihnachtsgeld brutto</dt>
              <dd>{formatCurrency(result.bonusBrutto)}</dd>
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
