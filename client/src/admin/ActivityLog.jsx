import { useMemo, useState } from "react";
import { Loader2, ScrollText } from "lucide-react";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { useSession } from "./RequireAuth.jsx";

const fetchActivity = (signal) => endpoints.admin.activity({ signal });

function when(value) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function outcome(status) {
  if (status >= 200 && status < 300) return { label: "Done", cls: "bg-emerald-50 text-emerald-700" };
  if (status === 401 || status === 403 || status === 429) return { label: "Refused", cls: "bg-red-50 text-red-700" };
  return { label: "Failed", cls: "bg-amber-50 text-amber-800" };
}

export default function ActivityLog() {
  useDocumentTitle("Activity");
  const { admin } = useSession();
  const isOwner = admin?.role === "OWNER";
  const { data, error, loading } = useApi(isOwner ? fetchActivity : () => Promise.resolve(null));
  const [filter, setFilter] = useState("all");

  const entries = useMemo(() => {
    const all = data?.entries ?? [];
    if (filter === "signins") return all.filter((e) => /sign/i.test(e.action));
    if (filter === "changes") return all.filter((e) => !/sign/i.test(e.action));
    if (filter === "refused") return all.filter((e) => e.status >= 400);
    return all;
  }, [data, filter]);

  if (!isOwner) {
    return (
      <div className="container-x py-10">
        <h1 className="font-display text-3xl font-bold text-ink-900">Activity</h1>
        <p className="mt-4 max-w-xl rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-ink-700">
          Only an Owner can view the activity log.
        </p>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold text-ink-900">Activity</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
        Every change made in this admin panel, and every sign-in — including failed ones — with who, when and from
        which IP address. Passwords are never recorded. Kept for one year; the latest 300 entries are shown.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["changes", "Changes"],
          ["signins", "Sign-ins"],
          ["refused", "Refused / failed"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === key ? "border-navy-700 bg-navy-700 text-white" : "border-slate-200 bg-white text-ink-700 hover:border-navy-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && !data && (
        <div className="flex min-h-[20vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading activity" />
        </div>
      )}

      {error && (
        <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error.message}</p>
      )}

      {data && entries.length === 0 && (
        <p className="mt-8 flex items-center gap-2 text-sm text-ink-500">
          <ScrollText className="h-4 w-4" /> Nothing recorded yet.
        </p>
      )}

      {entries.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Who</th>
                <th className="px-4 py-3 font-semibold">What</th>
                <th className="px-4 py-3 font-semibold">Result</th>
                <th className="px-4 py-3 font-semibold">IP address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => {
                const o = outcome(e.status);
                return (
                  <tr key={e.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-500">{when(e.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">{e.actor}</td>
                    <td className="px-4 py-3 text-ink-700">
                      {e.action}
                      {e.detail && <span className="text-ink-500"> — {e.detail}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${o.cls}`}>{o.label}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-500">{e.ip}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
