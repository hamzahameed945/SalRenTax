import { useMemo, useState } from 'preact/hooks';
import { coPrimaServiciosEngine } from '../../calculators/labor/engines/coPrimaServicios';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

interface Props {
  initialSalary?: number;
}

export default function CoPrimaServiciosCalculator({ initialSalary }: Props) {
  const [salarioMensual, setSalarioMensual] = useState(String(initialSalary ?? 3000000));
  const [diasTrabajados, setDiasTrabajados] = useState('180');
  const [submitted, setSubmitted] = useState({
    salarioMensual,
    diasTrabajados,
  });

  const result = useMemo(() => {
    const validation = coPrimaServiciosEngine.validate({
      salarioMensual: Number(submitted.salarioMensual),
      diasTrabajados: Number(submitted.diasTrabajados),
    });
    return validation.valid ? coPrimaServiciosEngine.calculate(validation.data) : null;
  }, [submitted]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="co-ps-salario">
          Salario mensual (COP)
          <input
            id="co-ps-salario"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={salarioMensual}
            onInput={(e) => setSalarioMensual((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="co-ps-dias">
          Días trabajados julio–diciembre (1–180)
          <input
            id="co-ps-dias"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            max="180"
            value={diasTrabajados}
            onInput={(e) => setDiasTrabajados((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
            onClick={() => setSubmitted({ salarioMensual, diasTrabajados })}
          >
            Calcular
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setSalarioMensual(String(initialSalary ?? 3000000));
              setDiasTrabajados('180');
              setSubmitted({ salarioMensual: String(initialSalary ?? 3000000), diasTrabajados: '180' });
            }}
          >
            Restablecer
          </button>
        </div>
      </div>
      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Prima de servicios — cuota de diciembre</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.primaBruta) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Salario mensual</dt>
              <dd>{formatCurrency(result.salarioMensual)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Cuota completa (50%)</dt>
              <dd>{formatCurrency(result.cuotaCompleta)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Días trabajados</dt>
              <dd>{result.diasTrabajados} de 180</dd>
            </div>
          </dl>
        )}
        <p class="mt-4 text-xs text-slate-500">
          Estimación bruta según el Código Sustantivo del Trabajo, artículo 306. La cuota de diciembre debe pagarse a más tardar el 20 de diciembre y no está sujeta a la misma tributación que el salario ordinario.
        </p>
      </div>
    </div>
  );
}
