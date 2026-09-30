import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  Server,
  Database,
  Globe,
  FileText,
  Mail,
  MessageCircle,
  BarChart3,
  ImageUp,
} from "lucide-react";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

const POLL_MS = 1000;
const HISTORY_LEN = 30;

const TIER_TEXT = { green: "text-emerald-600", yellow: "text-yellow-600", orange: "text-orange-600", red: "text-red-600" };
const TIER_DOT = { green: "bg-emerald-500", yellow: "bg-yellow-500", orange: "bg-orange-500", red: "bg-red-500" };
const TIER_PILL = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  red: "border-red-200 bg-red-50 text-red-700",
};
const TIER_LABEL = { green: "Operational", yellow: "Degraded", orange: "Slow", red: "Down" };

function latencyTier(ms, ok) {
  if (!ok) return "red";
  if (ms == null) return "green";
  if (ms < 150) return "green";
  if (ms < 400) return "yellow";
  if (ms < 1000) return "orange";
  return "red";
}

function pushHistory(history, value) {
  const next = [...history, value];
  return next.length > HISTORY_LEN ? next.slice(next.length - HISTORY_LEN) : next;
}

function timeAgo(date) {
  if (!date) return "pinging…";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 2) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

/**
 * A real sparkline built from actual historical ping values — not a
 * decorative loop. Jagged, because real latency is jagged.
 */
function Sparkline({ points, tier }) {
  const w = 84;
  const h = 26;
  if (points.length < 2) return <svg width={w} height={h} />;

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = h - 3 - ((p - min) / range) * (h - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const [lastX, lastY] = coords[coords.length - 1].split(",");

  return (
    <svg width={w} height={h} className={TIER_TEXT[tier]}>
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2.2" fill="currentColor" />
    </svg>
  );
}

const SERVICES = [
  { key: "apiServer", icon: Server, title: "API Server", desc: "Express on Node.js" },
  { key: "database", icon: Database, title: "Database", desc: "Postgres via Prisma" },
  { key: "inquiry", icon: Globe, title: "Enquiry Form", desc: "POST /api/inquiry" },
  { key: "catalog", icon: FileText, title: "Catalogue PDF", desc: "GET /api/catalog" },
  { key: "email", icon: Mail, title: "Email Notifications", desc: "Resend API" },
  { key: "uploads", icon: ImageUp, title: "Product Photo Uploads", desc: "Vercel Blob" },
  { key: "whatsapp", icon: MessageCircle, title: "WhatsApp Click-to-Chat", desc: "wa.me deep links" },
  { key: "analytics", icon: BarChart3, title: "Analytics", desc: "Client-side event tracking" },
];

const ENDPOINT_ROWS = [
  { key: "apiServer", method: "GET", path: "/api/admin/health", label: "Health check round trip" },
  { key: "database", method: "SQL", path: "SELECT 1", label: "Database query" },
  { key: "catalog", method: "HEAD", path: "/api/catalog", label: "Catalogue PDF" },
  { key: "inquiry", method: "HEAD", path: "/api/inquiry", label: "Enquiry form" },
];

const PINGABLE = new Set(ENDPOINT_ROWS.map((row) => row.key));

const EMPTY_HISTORY = { apiServer: [], database: [], catalog: [], inquiry: [] };
const EMPTY_STATUS = {
  apiServer: { ok: true, code: null },
  database: { ok: true, code: null },
  catalog: { ok: true, code: null },
  inquiry: { ok: true, code: null },
};

/** HEAD probe that measures the round trip and never throws. */
async function probe(path) {
  const start = performance.now();
  try {
    const res = await fetch(path, { method: "HEAD", cache: "no-store" });
    return { ok: res.ok, code: res.status, ms: Math.round(performance.now() - start) };
  } catch {
    return { ok: false, code: 0, ms: 0 };
  }
}

export default function System() {
  useDocumentTitle("System");

  const fetchConfig = useCallback((signal) => endpoints.admin.config({ signal }), []);
  const { data: config } = useApi(fetchConfig);

  const [history, setHistory] = useState(EMPTY_HISTORY);
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [lastPing, setLastPing] = useState(null);
  const [pinging, setPinging] = useState(false);
  const [, forceTick] = useState(0);

  const runPing = useCallback(async () => {
    setPinging(true);

    const healthStart = performance.now();
    try {
      const data = await endpoints.admin.health();
      const roundTrip = Math.round(performance.now() - healthStart);
      setStatus((s) => ({
        ...s,
        apiServer: { ok: true, code: 200 },
        database: { ok: data.db?.ok ?? false, code: 200 },
      }));
      setHistory((h) => ({
        ...h,
        apiServer: pushHistory(h.apiServer, roundTrip),
        database: pushHistory(h.database, data.db?.latencyMs ?? 0),
      }));
    } catch (err) {
      const code = err?.status ?? 0;
      setStatus((s) => ({ ...s, apiServer: { ok: false, code }, database: { ok: false, code } }));
      setHistory((h) => ({ ...h, apiServer: pushHistory(h.apiServer, 0), database: pushHistory(h.database, 0) }));
    }

    for (const [key, path] of [
      ["catalog", "/api/catalog"],
      ["inquiry", "/api/inquiry"],
    ]) {
      const result = await probe(path);
      setStatus((s) => ({ ...s, [key]: { ok: result.ok, code: result.code } }));
      setHistory((h) => ({ ...h, [key]: pushHistory(h[key], result.ms) }));
    }

    setLastPing(new Date());
    setPinging(false);
  }, []);

  useEffect(() => {
    runPing();
    const pollTimer = setInterval(runPing, POLL_MS);
    // Re-renders once a second purely so the "last ping Xs ago" label ticks.
    const clockTimer = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => {
      clearInterval(pollTimer);
      clearInterval(clockTimer);
    };
  }, [runPing]);

  function statsFor(key) {
    const points = history[key] || [];
    const ok = status[key]?.ok ?? true;
    const now = points.length ? points[points.length - 1] : null;
    const tier = latencyTier(now, ok);
    const avg = points.length ? Math.round(points.reduce((a, b) => a + b, 0) / points.length) : null;
    const min = points.length ? Math.min(...points) : null;
    const max = points.length ? Math.max(...points) : null;
    return { points, ok, now, tier, avg, min, max, code: status[key]?.code };
  }

  /** Non-pingable rows are configuration facts, not measurements. */
  function configuredService(key) {
    if (key === "email") {
      return config?.emailConfigured
        ? { tier: "green", label: "Configured" }
        : { tier: "yellow", label: "Not configured" };
    }
    if (key === "uploads") {
      return config?.uploadsConfigured
        ? { tier: "green", label: "Configured" }
        : { tier: "yellow", label: "Not configured" };
    }
    return { tier: "green", label: "Active" };
  }

  const pingableTiers = [...PINGABLE].map((k) => statsFor(k).tier);
  const overallTier = pingableTiers.includes("red")
    ? "red"
    : pingableTiers.some((t) => t === "orange" || t === "yellow")
      ? "yellow"
      : "green";
  const overallLabel =
    overallTier === "green"
      ? "All systems operational"
      : overallTier === "red"
        ? "Some services are down"
        : "Degraded performance";

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">System</h1>
          <p className="mt-2 text-sm text-ink-500">Health, status and live metrics — pinged every second.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs text-ink-500">
            <span className={`h-2 w-2 rounded-full ${TIER_DOT[overallTier]}`} />
            {overallLabel}
          </span>
          <button
            type="button"
            onClick={runPing}
            disabled={pinging}
            className="btn-ghost !px-3.5 !py-2 text-xs disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${pinging ? "animate-spin" : ""}`} />
            {pinging ? "Pinging…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Service Health */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-sm font-bold text-ink-900">Service Health</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {SERVICES.map((svc) => {
            const isPingable = PINGABLE.has(svc.key);
            const { tier, label } = isPingable
              ? { tier: statsFor(svc.key).tier, label: TIER_LABEL[statsFor(svc.key).tier] }
              : configuredService(svc.key);

            return (
              <div key={svc.key} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <svc.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{svc.title}</p>
                    <p className="truncate text-xs text-ink-500">{svc.desc}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TIER_PILL[tier]}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${TIER_DOT[tier]}`} />
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* API Endpoint Latency */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm font-bold text-ink-900">API Endpoint Latency</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
          <span className="text-xs text-ink-500">
            last ping {lastPing ? lastPing.toLocaleTimeString("en-IN") : "—"} · {timeAgo(lastPing)}
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr className="text-[0.65rem] uppercase tracking-wide text-ink-500">
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-2 py-3 font-semibold">Endpoint</th>
                <th className="px-2 py-3 font-semibold">Status</th>
                <th className="px-2 py-3 font-semibold">Now</th>
                <th className="px-2 py-3 font-semibold">History</th>
                <th className="px-2 py-3 text-right font-semibold">Avg</th>
                <th className="px-2 py-3 text-right font-semibold">Min</th>
                <th className="px-5 py-3 text-right font-semibold">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ENDPOINT_ROWS.map((row) => {
                const s = statsFor(row.key);
                return (
                  <tr key={row.key} className="align-middle">
                    <td className="px-5 py-3.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.65rem] text-ink-700">
                        {row.method}
                      </span>
                    </td>
                    <td className="px-2 py-3.5">
                      <p className="font-mono text-xs text-ink-900">{row.path}</p>
                      <p className="text-[0.65rem] text-ink-500">{row.label}</p>
                    </td>
                    <td className="px-2 py-3.5">
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold ${
                          s.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {s.code || (s.ok ? 200 : "ERR")}
                      </span>
                    </td>
                    <td className={`px-2 py-3.5 font-mono text-sm font-bold tabular-nums ${TIER_TEXT[s.tier]}`}>
                      {s.now != null ? `${s.now}ms` : "—"}
                    </td>
                    <td className="px-2 py-3.5">
                      <Sparkline points={s.points} tier={s.tier} />
                    </td>
                    <td className="px-2 py-3.5 text-right font-mono text-xs tabular-nums text-ink-500">
                      {s.avg != null ? s.avg : "—"}
                    </td>
                    <td className="px-2 py-3.5 text-right font-mono text-xs tabular-nums text-emerald-600">
                      {s.min != null ? s.min : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs tabular-nums text-red-600">
                      {s.max != null ? s.max : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards — an 8-column table does not fit a phone screen, so each
            endpoint gets its own stacked card instead (the same pattern
            InquiriesBoard.jsx uses for enquiries). */}
        <div className="divide-y divide-slate-100 lg:hidden">
          {ENDPOINT_ROWS.map((row) => {
            const s = statsFor(row.key);
            return (
              <div key={row.key} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.65rem] text-ink-700">
                      {row.method}
                    </span>
                    <span className="truncate font-mono text-xs text-ink-900">{row.path}</span>
                  </div>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold ${
                      s.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {s.code || (s.ok ? 200 : "ERR")}
                  </span>
                </div>
                <p className="mt-1 text-[0.65rem] text-ink-500">{row.label}</p>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className={`font-mono text-lg font-bold tabular-nums ${TIER_TEXT[s.tier]}`}>
                    {s.now != null ? `${s.now}ms` : "—"}
                  </span>
                  <Sparkline points={s.points} tier={s.tier} />
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-center text-xs">
                  <div>
                    <dt className="text-ink-500">Avg</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-ink-900">{s.avg != null ? s.avg : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">Min</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-emerald-600">{s.min != null ? s.min : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">Max</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-red-600">{s.max != null ? s.max : "—"}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
