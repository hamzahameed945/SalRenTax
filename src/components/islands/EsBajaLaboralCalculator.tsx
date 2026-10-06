import { useMemo, useState } from 'preact/hooks';
import { esBajaLaboralEngine } from '../../calculators/labor/engines/esBajaLaboral';

const fmt = (v: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);

export default function EsBajaLaboralCalculator() {
  const [base, setBase] = useState('2400');
  const [dias, setDias] = useState('30');

  const diasBaja = parseInt(dias, 10) || 0;

  const result = useMemo(() => {
    const v = esBajaLaboralEngine.validate({
      baseCotizacionMensual: parseFloat(base) || 0,
      diasBaja,
    });
    if (!v.valid) return null;
    return esBajaLaboralEngine.calculate(v.data, {} as never, 2026);
  }, [base, diasBaja]);

  return (
    <div class="space-y-6">

      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Datos de la baja</h2>
        <div class="grid gap-4 sm:grid-cols-2">

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Base de cotización del mes anterior (€)
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input
                type="number" min="0" step="100"
                class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none"
                value={base}
                onInput={e => setBase((e.target as HTMLInputElement).value)}
              />
            </div>
            <p class="mt-1 text-xs text-slate-400">
              Se divide entre 30 para obtener la base reguladora diaria.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Días de baja médica</label>
            <input
              type="number" min="1" max="365" step="1"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none"
              value={dias}
              onInput={e => setDias((e.target as HTMLInputElement).value)}
            />
            <p class="mt-1 text-xs text-slate-400">
              Los 3 primeros días no generan prestación (periodo de carencia).
            </p>
          </div>

        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      {result && (
        <div class="space-y-4" role="region" aria-live="polite">

          {/* Hero */}
          <div class="rounded-xl bg-gradient-to-br from-yellow-600 to-red-700 p-6 text-white">
            <p class="text-sm font-medium text-yellow-100">Prestación total estimada</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(result.totalPrestacion)}</p>
            <p class="mt-2 text-sm text-yellow-100">
              {diasBaja} día(s) de baja · base reguladora {fmt(result.baseReguladoraDiaria)}/día
            </p>
          </div>

          {/* Breakdown */}
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Desglose por tramos</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">

              {/* Carencia */}
              <div class="flex justify-between px-5 py-3 text-slate-500">
                <span>Días 1–3: periodo de carencia ({result.desglose.diasCarencia} días)</span>
                <span class="font-medium">{fmt(0)}</span>
              </div>

              {/* Tramo 60% */}
              {result.desglose.tramo60.dias > 0 && (
                <div class="px-5 py-3 space-y-1 bg-amber-50">
                  <div class="flex justify-between text-amber-800">
                    <span class="font-medium">Días 4–20: 60% de la base reguladora ({result.desglose.tramo60.dias} días)</span>
                    <span class="font-medium">{fmt(result.desglose.tramo60.importe)}</span>
                  </div>
                  <div class="flex justify-between text-amber-700 text-xs pl-4">
                    <span>Paga la empresa — días 4–15 ({result.desglose.tramo60.diasEmpresa} días)</span>
                    <span>{fmt(result.desglose.tramo60.importeEmpresa)}</span>
                  </div>
                  <div class="flex justify-between text-amber-700 text-xs pl-4">
                    <span>Paga la Mutua/INSS — días 16–20 ({result.desglose.tramo60.diasInss} días)</span>
                    <span>{fmt(result.desglose.tramo60.importeInss)}</span>
                  </div>
                </div>
              )}

              {/* Tramo 75% */}
              {result.desglose.tramo75.dias > 0 && (
                <div class="flex justify-between px-5 py-3 text-emerald-800 bg-emerald-50">
                  <span>Desde el día 21: 75% de la base reguladora ({result.desglose.tramo75.dias} días) — paga la Mutua/INSS</span>
                  <span class="font-medium">{fmt(result.desglose.tramo75.importe)}</span>
                </div>
              )}

              {/* Total */}
              <div class="flex justify-between px-5 py-4 bg-gradient-to-r from-yellow-700 to-red-700 text-white font-bold text-base">
                <span>Total prestación</span>
                <span>{fmt(result.totalPrestacion)}</span>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <strong>Nota:</strong> estimación para incapacidad temporal por <strong>contingencias comunes</strong>
            (enfermedad común o accidente no laboral). Los convenios colectivos pueden complementar la
            prestación hasta el 100% del salario — consulta tu convenio. Los accidentes de trabajo y las
            enfermedades profesionales tienen reglas distintas (75% desde el día siguiente al de la baja).
          </div>
        </div>
      )}

      <p class="text-xs text-slate-400">
        LGSS Arts. 128 y ss. (incapacidad temporal por contingencias comunes).
        Estimación orientativa 2026 — los casos reales pueden variar por convenio colectivo, mejoras
        pactadas o situaciones especiales. Consulta con un asesor laboral.
      </p>
    </div>
  );
}
