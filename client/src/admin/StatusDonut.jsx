const RADIUS = 54;
const STROKE = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** SVG donut chart via stroke-dasharray segments — no charting library needed for one ring. */
export default function StatusDonut({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-display text-sm font-bold text-ink-900">Status breakdown</h3>
      <div className="mt-5 flex items-center gap-6">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90 shrink-0">
          <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
          {total > 0 &&
            segments.map((s) => {
              if (s.value === 0) return null;
              const length = (s.value / total) * CIRCUMFERENCE;
              const el = (
                <circle
                  key={s.label}
                  cx="70"
                  cy="70"
                  r={RADIUS}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return el;
            })}
        </svg>
        <ul className="flex-1 space-y-2 text-sm">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-ink-700">{s.label}</span>
              <span className="ml-auto font-semibold text-ink-900">{s.value}</span>
            </li>
          ))}
        </ul>
      </div>
      {total === 0 && <p className="mt-4 text-xs text-ink-500">No enquiries yet.</p>}
    </div>
  );
}
