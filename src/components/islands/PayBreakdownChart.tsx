export type PayBreakdownSegment = {
  label: string;
  value: number;
  color: string;
};

export default function PayBreakdownChart({
  segments,
  format,
  title,
}: {
  segments: PayBreakdownSegment[];
  format: (value: number) => string;
  title: string;
}) {
  const visible = segments.filter((segment) => segment.value > 0);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);
  if (visible.length === 0 || total <= 0) return null;

  let offset = 25;
  const slices = visible.map((segment) => {
    const percent = (segment.value / total) * 100;
    const slice = { ...segment, percent, offset };
    offset -= percent;
    return slice;
  });

  return (
    <div class="mt-6">
      <p class="text-sm font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <div class="mt-3 flex flex-col items-center gap-4 sm:flex-row">
        <svg
          viewBox="0 0 42 42"
          class="h-36 w-36 shrink-0"
          role="img"
          aria-label={title}
        >
          <circle cx="21" cy="21" r="15.915" fill="none" stroke="#e2e8f0" stroke-width="6" />
          {slices.map((slice) => (
            <circle
              key={slice.label}
              cx="21"
              cy="21"
              r="15.915"
              fill="none"
              stroke={slice.color}
              stroke-width="6"
              stroke-dasharray={`${slice.percent} ${100 - slice.percent}`}
              stroke-dashoffset={slice.offset}
            />
          ))}
        </svg>
        <ul class="w-full space-y-2 text-sm text-slate-700">
          {slices.map((slice) => (
            <li key={slice.label} class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-2">
                <span
                  class="inline-block h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.label}
              </span>
              <span class="font-medium">
                {format(slice.value)} ({slice.percent.toFixed(1)}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div class="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-200">
        {slices.map((slice) => (
          <span
            key={slice.label}
            style={{ width: `${slice.percent}%`, backgroundColor: slice.color }}
            title={`${slice.label}: ${slice.percent.toFixed(1)}%`}
          />
        ))}
      </div>
    </div>
  );
}
