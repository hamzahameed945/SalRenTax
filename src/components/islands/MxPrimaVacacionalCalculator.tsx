import { useMemo, useState } from 'preact/hooks';
import { mxPrimaVacacionalEngine } from '../../calculators/labor/engines/mxPrimaVacacional';
import PayBreakdownChart from './PayBreakdownChart';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

interface Props {
  initialSalary?: number;
}

export default function MxPrimaVacacionalCalculator({ initialSalary }: Props) {
  const [sueldoMensual, setSueldoMensual] = useState(String(initialSalary ?? 20000));
  const [diasVacaciones, setDiasVacaciones] = useState('12');
  const [mesesTrabajados, setMesesTrabajados] = useState('12');
  const [submitted, setSubmitted] = useState({
    sueldoMensual,
    diasVacaciones,
    mesesTrabajados,
  });

  const result = useMemo(() => {
    const validation = mxPrimaVacacionalEngine.validate({
      sueldoMensual: Number(submitted.sueldoMensual),
      diasVacaciones: Number(submitted.diasVacaciones),
      mesesTrabajados: Number(submitted.mesesTrabajados),
    });
    return validation.valid ? mxPrimaVacacionalEngine.calculate(validation.data) : null;
  }, [submitted]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="mx-pv-sueldo">
          Sueldo mensual bruto (MXN)
          <input
            id="mx-pv-sueldo"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={sueldoMensual}
            onInput={(e) => setSueldoMensual((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="mx-pv-dias">
          Días de vacaciones (mínimo legal: 12)
          <input
            id="mx-pv-dias"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            max="365"
            value={diasVacaciones}
            onInput={(e) => setDiasVacaciones((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="mx-pv-meses">
          Meses trabajados en 2026 (1–12)
          <input
            id="mx-pv-meses"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            max="12"
            value={mesesTrabajados}
            onInput={(e) => setMesesTrabajados((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
            onClick={() => setSubmitted({ sueldoMensual, diasVacaciones, mesesTrabajados })}
          >
            Calcular
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setSueldoMensual(String(initialSalary ?? 20000));
              setDiasVacaciones('12');
              setMesesTrabajados('12');
              setSubmitted({ sueldoMensual: String(initialSalary ?? 20000), diasVacaciones: '12', mesesTrabajados: '12' });
            }}
          >
            Restablecer
          </button>
        </div>
      </div>
      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Prima vacacional neta</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.primaNeta) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Salario diario</dt>
              <dd>{formatCurrency(result.salarioDiario)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Prima bruta</dt>
              <dd>{formatCurrency(result.primaBruta)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Monto exento de ISR</dt>
              <dd>{formatCurrency(result.montoExento)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Base gravada</dt>
              <dd>{formatCurrency(result.baseGravada)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>ISR estimado</dt>
              <dd>{formatCurrency(result.isrEstimado)}</dd>
            </div>
          </dl>
        )}
        {result && (
          <PayBreakdownChart
            title="Desglose de la prima bruta"
            segments={[
              { label: 'Prima neta', value: result.primaNeta },
              { label: 'ISR estimado', value: result.isrEstimado },
            ]}
            format={(value) => formatCurrency(value)}
          />
        )}
        <p class="mt-4 text-xs text-slate-500">
          La prima vacacional es el 25% del salario correspondiente a los días de vacaciones (LFT Art. 80). Hasta 15 UMAs diarias están exentas de ISR (LISR Art. 93 frac. XIV).
        </p>
      </div>
    </div>
  );
}
