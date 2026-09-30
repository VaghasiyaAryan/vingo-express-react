import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Inbox, Sparkles, MessageSquareText, FileCheck2, CheckCircle2, Package, ArrowRight, Loader2 } from "lucide-react";
import TrendChart from "./TrendChart.jsx";
import StatusDonut from "./StatusDonut.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

const STATUS_CARDS = [
  { key: "NEW", label: "New", icon: Sparkles, color: "text-navy-700 bg-navy-50" },
  { key: "CONTACTED", label: "Contacted", icon: MessageSquareText, color: "text-orange-700 bg-orange-50" },
  { key: "QUOTED", label: "Quoted", icon: FileCheck2, color: "text-emerald-700 bg-emerald-50" },
  { key: "CLOSED", label: "Closed", icon: CheckCircle2, color: "text-slate-600 bg-slate-100" },
];

// Hex values (not Tailwind classes) since these feed SVG `stroke` attributes directly.
const STATUS_CHART_COLORS = {
  NEW: "#2e2c75",
  CONTACTED: "#f16629",
  QUOTED: "#059669",
  CLOSED: "#94a3b8",
};

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export default function Dashboard() {
  useDocumentTitle("Dashboard");

  const fetchStats = useCallback((signal) => endpoints.admin.stats({ signal }), []);
  const { data, error, loading } = useApi(fetchStats);

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-x py-10">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error.message}</p>
      </div>
    );
  }

  const { total, statusCounts, activeProducts, totalProducts, recent, trend } = data;

  const donutSegments = STATUS_CARDS.map((s) => ({
    label: s.label,
    value: statusCounts[s.key] || 0,
    color: STATUS_CHART_COLORS[s.key],
  }));

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold text-ink-900">Dashboard</h1>
      <p className="mt-2 text-sm text-ink-500">An overview of enquiries and your product catalogue.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-700 text-white">
            <Inbox className="h-5 w-5" />
          </span>
          <p className="mt-4 font-display text-2xl font-bold text-ink-900">{total}</p>
          <p className="mt-1 text-sm text-ink-500">Total enquiries</p>
        </div>

        {STATUS_CARDS.map((s) => (
          <div key={s.key} className="rounded-2xl border border-slate-200 bg-white p-5">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-2xl font-bold text-ink-900">{statusCounts[s.key] || 0}</p>
            <p className="mt-1 text-sm text-ink-500">{s.label} enquiries</p>
          </div>
        ))}

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Package className="h-5 w-5" />
          </span>
          <p className="mt-4 font-display text-2xl font-bold text-ink-900">
            {activeProducts}
            <span className="ml-1 text-base font-medium text-ink-500">/ {totalProducts}</span>
          </p>
          <p className="mt-1 text-sm text-ink-500">Active products</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <TrendChart data={trend} />
        <StatusDonut segments={donutSegments} />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-ink-900">Recent enquiries</h2>
        <Link
          to="/admin/enquiries"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:gap-2.5"
        >
          View all
          <ArrowRight className="h-4 w-4 transition-all" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-ink-500">No enquiries yet.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {recent.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{row.name}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {row.productInterest || "General enquiry"} · {formatDate(row.createdAt)}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.7rem] font-semibold text-ink-700">
                  {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
