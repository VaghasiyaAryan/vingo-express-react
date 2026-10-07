import { useCallback } from "react";
import { Download, FileText, Link2, Loader2 } from "lucide-react";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function Catalog() {
  useDocumentTitle("Product Catalogue");

  const fetchSummary = useCallback((signal) => endpoints.admin.catalogSummary({ signal }), []);
  const { data, error, loading } = useApi(fetchSummary);

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold text-ink-900">Product Catalogue</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
        A branded PDF listing every active product, generated fresh from your current catalogue each time it&apos;s
        opened — edits in Products show up immediately, no re-upload needed. This link is already included in the
        WhatsApp and Email quick-reply templates on the Enquiries page, so buyers can download it themselves.
      </p>

      {loading && !data && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading catalogue summary" />
        </div>
      )}

      {error && (
        <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {data && (
        <div className="mt-8 flex flex-col gap-6 sm:flex-row">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <FileText className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-2xl font-bold text-ink-900">{data.activeCount}</p>
            <p className="mt-1 text-sm text-ink-500">Active products included in the catalogue</p>

            <ul className="mt-4 space-y-1.5 text-xs text-ink-500">
              {data.categories.map((c) => (
                <li key={c.slug} className="flex items-center justify-between">
                  <span>{c.title}</span>
                  <span className="font-semibold text-ink-700">{c.count}</span>
                </li>
              ))}
            </ul>

            <a href="/api/catalog" download className="btn-primary mt-6 w-full">
              <Download className="h-4 w-4" />
              Download Catalogue PDF
            </a>
          </div>

          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Link2 className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-lg font-bold text-ink-900">Shareable link</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Paste this anywhere — WhatsApp, email, your website — it always serves the current catalogue.
            </p>
            <p className="mt-4 break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-navy-700">
              {data.catalogUrl}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
