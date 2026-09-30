import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, Search, Download, Check, Trash2, Loader2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppButton.jsx";
import { company } from "@shared/content.js";
import { endpoints } from "@/lib/api.js";
import { useToast } from "./Toast.jsx";
import { ReplyIconButton, ReplyPillButton } from "./ReplyDialog.jsx";

const STATUSES = ["NEW", "CONTACTED", "QUOTED", "CLOSED"];

const STATUS_STYLES = {
  NEW: "border-navy-200 bg-navy-50 text-navy-700",
  CONTACTED: "border-orange-200 bg-orange-50 text-orange-700",
  QUOTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-500",
};

const DATE_RANGES = {
  all: () => true,
  "7d": (date) => Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000,
  "30d": (date) => Date.now() - date.getTime() <= 30 * 24 * 60 * 60 * 1000,
  "90d": (date) => Date.now() - date.getTime() <= 90 * 24 * 60 * 60 * 1000,
};

function statusLabel(status) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

/** `createdAt` arrives from the API as an ISO string, not a Date. */
function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

/** WhatsApp deep-link to a client's own number, prefilled with a reply starter + catalogue link. */
function waLinkFor(row) {
  const digits = row.phone.replace(/\D/g, "");
  const message = `Hello ${row.name}, this is VinGo International following up on your enquiry${
    row.productInterest ? ` for ${row.productInterest}` : ""
  }.\n\nYou can browse our full product catalogue here: ${company.websiteUrl}/api/catalog`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function toCsvValue(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function downloadCsv(rows) {
  const headers = [
    "Received",
    "Name",
    "Email",
    "Phone",
    "Company",
    "Country",
    "Interest",
    "Quantity",
    "Status",
    "Message",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        formatDate(row.createdAt),
        row.name,
        row.email,
        row.phone,
        row.company || "",
        row.country || "",
        row.productInterest || "",
        row.quantity || "",
        statusLabel(row.status),
        row.message,
      ]
        .map(toCsvValue)
        .join(",")
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vingo-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusSelect({ row, onChanged }) {
  const [pending, setPending] = useState(false);
  const showToast = useToast();

  async function handleChange(event) {
    const status = event.target.value;
    setPending(true);
    try {
      await endpoints.admin.setInquiryStatus(row.id, status);
      onChanged(row.id, status);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <select
      value={row.status}
      disabled={pending}
      onChange={handleChange}
      aria-label={`Status for enquiry from ${row.name}`}
      className={`cursor-pointer rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-navy-200 ${
        STATUS_STYLES[row.status] || STATUS_STYLES.NEW
      } ${pending ? "opacity-60" : ""}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {statusLabel(s)}
        </option>
      ))}
    </select>
  );
}

function DeleteButton({ row, onDeleted }) {
  const [pending, setPending] = useState(false);
  const showToast = useToast();

  async function handleClick() {
    if (!confirm(`Delete the enquiry from ${row.name}? This can't be undone.`)) return;
    setPending(true);
    try {
      await endpoints.admin.deleteInquiry(row.id);
      onDeleted(row.id);
      showToast(`Enquiry from ${row.name} deleted.`);
    } catch (err) {
      showToast(err.message, "error");
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      aria-label={`Delete enquiry from ${row.name}`}
      title="Delete"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}

/** Export button with the site's hover-lift/glass language, plus a brief success flash on click. */
function ExportCsvButton({ rows }) {
  const [justExported, setJustExported] = useState(false);
  const timeoutRef = useRef(null);

  function handleClick() {
    downloadCsv(rows);
    setJustExported(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setJustExported(false), 1800);
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={rows.length === 0}
      whileTap={{ scale: 0.96 }}
      className="group btn-ghost !px-4 !py-3 text-sm hover:-translate-y-0.5 hover:shadow-glass disabled:pointer-events-none disabled:opacity-50"
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {justExported ? (
            <motion.span
              key="check"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center justify-center text-emerald-600"
            >
              <Check className="h-4 w-4" />
            </motion.span>
          ) : (
            <motion.span
              key="download"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:translate-y-0.5"
            >
              <Download className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {justExported ? "Exported" : "Export CSV"}
    </motion.button>
  );
}

export default function InquiriesBoard({ inquiries, onStatusChanged, onDeleted }) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [interest, setInterest] = useState("all");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("all");

  const countries = useMemo(
    () => Array.from(new Set(inquiries.map((r) => r.country).filter(Boolean))).sort(),
    [inquiries]
  );
  const interests = useMemo(
    () => Array.from(new Set(inquiries.map((r) => r.productInterest).filter(Boolean))).sort(),
    [inquiries]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inquiries.filter((row) => {
      if (q) {
        const haystack = `${row.name} ${row.email} ${row.company || ""} ${row.message}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (country !== "all" && row.country !== country) return false;
      if (interest !== "all" && row.productInterest !== interest) return false;
      if (status !== "all" && row.status !== status) return false;
      if (!DATE_RANGES[range](new Date(row.createdAt))) return false;
      return true;
    });
  }, [inquiries, search, country, interest, status, range]);

  return (
    <>
      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company, message…"
            className="field pl-9"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field cursor-pointer sm:!w-40">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="field cursor-pointer sm:!w-44">
          <option value="all">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="field cursor-pointer sm:!w-48"
        >
          <option value="all">All interests</option>
          {interests.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="field cursor-pointer sm:!w-40">
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
        <ExportCsvButton rows={filtered} />
      </div>

      <p className="mt-4 text-xs text-ink-500">
        Showing {filtered.length} of {inquiries.length} {inquiries.length === 1 ? "enquiry" : "enquiries"}.
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="font-display text-lg font-bold text-ink-900">No matching enquiries</p>
          <p className="mt-1 text-sm text-ink-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Received</th>
                    <th className="px-5 py-3.5 font-semibold">Contact</th>
                    <th className="px-5 py-3.5 font-semibold">Company / Country</th>
                    <th className="px-5 py-3.5 font-semibold">Interest</th>
                    <th className="px-5 py-3.5 font-semibold">Requirement</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row) => (
                    <tr key={row.id} className="align-top transition-colors hover:bg-navy-50/40">
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-ink-500">{formatDate(row.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className="block font-semibold text-ink-900">{row.name}</span>
                        <a href={`mailto:${row.email}`} className="mt-1 block text-xs text-navy-700 hover:underline">
                          {row.email}
                        </a>
                        <a href={`tel:${row.phone}`} className="block text-xs text-ink-500 hover:underline">
                          {row.phone}
                        </a>
                        <div className="mt-2 flex gap-1.5">
                          <a
                            href={waLinkFor(row)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Contact ${row.name} on WhatsApp`}
                            title="Contact on WhatsApp"
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#25D366]/30 bg-[#25D366]/10 text-[#128C4A] transition-colors hover:bg-[#25D366]/20"
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                          </a>
                          <ReplyIconButton row={row} />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-500">
                        <span className="block text-ink-700">{row.company || "—"}</span>
                        <span className="block">{row.country || "—"}</span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span className="block text-ink-700">{row.productInterest || "—"}</span>
                        <span className="block text-ink-500">{row.quantity || "—"}</span>
                      </td>
                      <td className="max-w-md px-5 py-4 text-xs leading-relaxed text-ink-700">{row.message}</td>
                      <td className="px-5 py-4">
                        <StatusSelect row={row} onChanged={onStatusChanged} />
                      </td>
                      <td className="px-5 py-4">
                        <DeleteButton row={row} onDeleted={onDeleted} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="mt-4 space-y-4 lg:hidden">
            {filtered.map((row) => (
              <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-base font-bold text-ink-900">{row.name}</h2>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[0.65rem] text-ink-500">{formatDate(row.createdAt)}</span>
                    <DeleteButton row={row} onDeleted={onDeleted} />
                  </div>
                </div>

                <div className="mt-2">
                  <StatusSelect row={row} onChanged={onStatusChanged} />
                </div>

                <div className="mt-3 flex flex-col gap-1.5 text-xs">
                  <a href={`mailto:${row.email}`} className="flex items-center gap-2 text-navy-700">
                    <Mail className="h-3.5 w-3.5" /> {row.email}
                  </a>
                  <a href={`tel:${row.phone}`} className="flex items-center gap-2 text-ink-500">
                    <Phone className="h-3.5 w-3.5" /> {row.phone}
                  </a>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={waLinkFor(row)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#128C4A] transition-colors hover:bg-[#25D366]/20"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                    Contact
                  </a>
                  <ReplyPillButton row={row} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                  <div>
                    <dt className="text-ink-500">Company</dt>
                    <dd className="mt-0.5 font-medium text-ink-900">{row.company || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">Country</dt>
                    <dd className="mt-0.5 font-medium text-ink-900">{row.country || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">Interest</dt>
                    <dd className="mt-0.5 font-medium text-ink-900">{row.productInterest || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">Quantity</dt>
                    <dd className="mt-0.5 font-medium text-ink-900">{row.quantity || "—"}</dd>
                  </div>
                </dl>

                <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-relaxed text-ink-700">{row.message}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
