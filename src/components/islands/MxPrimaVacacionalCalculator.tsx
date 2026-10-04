import { useMemo, useState } from 'preact/hooks';
import { mxPrimaVacacionalEngine } from '../../calculators/labor/engines/mxPrimaVacacional';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

interface Props {
  initialSalary?: number;
}

export default function MxPrimaVacacionalCalculator({ initialSalary }: Props) {
  const [sueldoMensual, setSueldoMensual] = useState(String(initialSalary ?? 20000));
  const [diasVacaciones, setDiasVacaciones] = useState('12');
  const [mesesTrabajados, setMesesTrabajados] = useState('12');

  const result = useMemo(() => {
    const validation = mxPrimaVacacionalEngine.validate({
      sueldoMensual: Number(sueldoMensual),
      diasVacaciones: Number(diasVacaciones),
      mesesTrabajados: Number(mesesTrabajados),
    });
    return validation.valid ? mxPrimaVacacionalEngine.calculate(validation.data) : null;
  }, [sueldoMensual, diasVacaciones, mesesTrabajados]);

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
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Prima vacacional neta estimada</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.primaNeta) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Prima bruta (25%)</dt>
              <dd>{formatCurrency(result.primaBruta)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Exento de ISR (15 UMAs)</dt>
              <dd>{formatCurrency(result.montoExento)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>ISR estimado</dt>
              <dd>{formatCurrency(result.isrEstimado)}</dd>
            </div>
          </dl>
        )}
        <p class="mt-4 text-xs text-slate-500">
          Estimación con tarifa ISR 2026. La prima mínima legal es 25% del salario vacacional (LFT Art. 80).
        </p>
      </div>
    </div>
  );
}
