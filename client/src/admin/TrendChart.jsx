/** Simple hand-rolled bar chart — no charting library needed for one series. */
export default function TrendChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-display text-sm font-bold text-ink-900">Enquiries — last 30 days</h3>
      <div className="mt-6 flex h-32 items-end gap-[3px]">
        {data.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-navy-500 transition-colors group-hover:bg-orange-500"
              style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink-900 px-1.5 py-0.5 text-[0.6rem] text-white opacity-0 transition-opacity group-hover:opacity-100">
              {d.count} on {d.date.slice(5)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[0.65rem] text-ink-500">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
