import { useCallback, useRef, useState } from "react";
import { Download, FileText, FileUp, Link2, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { useToast } from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
const formatDate = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

/** True when the file's first bytes are a PDF header — checked before uploading, and again on the server. */
async function isPdf(file) {
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const text = String.fromCharCode(...head);
  return text.includes("%PDF-");
}

export default function Catalog() {
  useDocumentTitle("Product Catalogue");
  const showToast = useToast();

  const fetchSummary = useCallback((signal) => endpoints.admin.catalogSummary({ signal }), []);
  const { data, error, loading, mutate } = useApi(fetchSummary);

  const inputRef = useRef(null);
  const [busy, setBusy] = useState(null); // "upload" | "remove" | null
  const [confirmRemove, setConfirmRemove] = useState(false);
  // Changes after every upload/removal so the download link never shows a cached copy.
  const [version, setVersion] = useState(() => Date.now());

  const uploaded = data?.uploaded ?? null;
  const maxBytes = data?.maxUploadBytes ?? 15 * 1024 * 1024;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again later
    if (!file) return;

    if (file.size > maxBytes) {
      showToast(`That PDF is ${formatSize(file.size)} — the limit is ${formatSize(maxBytes)}.`, "error");
      return;
    }
    if (!(await isPdf(file))) {
      showToast("That file isn't a PDF. Please choose a PDF catalogue.", "error");
      return;
    }

    setBusy("upload");
    try {
      const result = await endpoints.admin.uploadCatalog(file);
      mutate((prev) => ({ ...prev, uploaded: result.uploaded }));
      setVersion(Date.now());
      showToast(uploaded ? "New catalogue uploaded — the old one has been deleted." : "Catalogue uploaded — the link now serves your PDF.");
    } catch (err) {
      showToast(err.message || "Upload failed. Please try again.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove() {
    setBusy("remove");
    try {
      await endpoints.admin.removeCatalog();
      mutate((prev) => ({ ...prev, uploaded: null }));
      setVersion(Date.now());
      setConfirmRemove(false);
      showToast("Uploaded catalogue removed — the link now serves the auto-generated catalogue.");
    } catch (err) {
      showToast(err.message || "Could not remove the catalogue. Please try again.", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold text-ink-900">Product Catalogue</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
        The catalogue buyers download from your link. By default it is a PDF generated automatically from your active
        products. You can upload your own PDF instead — the link stays the same, so links already sent to buyers always
        open the current catalogue.
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
        <div className="mt-8 flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                <FileText className="h-5 w-5" />
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  uploaded ? "bg-orange-50 text-orange-700" : "bg-navy-50 text-navy-700"
                }`}
              >
                {uploaded ? "Your uploaded PDF" : "Auto-generated"}
              </span>
            </div>

            {uploaded ? (
              <>
                <p className="mt-4 break-all font-display text-lg font-bold text-ink-900">{uploaded.fileName}</p>
                <p className="mt-1 text-sm text-ink-500">
                  {formatSize(uploaded.sizeBytes)} · uploaded {formatDate(uploaded.uploadedAt)}
                  {uploaded.uploadedBy ? ` by ${uploaded.uploadedBy}` : ""}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ink-500">
                  This PDF is what buyers download. Product changes in the admin panel don&apos;t change it — upload a
                  new version when your range changes, or remove it to go back to the automatic catalogue.
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 font-display text-2xl font-bold text-ink-900">{data.activeCount}</p>
                <p className="mt-1 text-sm text-ink-500">Active products included, generated fresh on every download</p>
                <ul className="mt-4 space-y-1.5 text-xs text-ink-500">
                  {data.categories.map((c) => (
                    <li key={c.slug} className="flex items-center justify-between">
                      <span>{c.title}</span>
                      <span className="font-semibold text-ink-700">{c.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <a href={`/api/catalog?v=${version}`} download className="btn-primary mt-6 w-full">
              <Download className="h-4 w-4" />
              Download current catalogue
            </a>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-sm font-semibold text-ink-900">{uploaded ? "Replace or remove" : "Use your own catalogue"}</p>
              <p className="mt-1 text-xs text-ink-500">PDF only, up to {formatSize(maxBytes)}.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFile}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy !== null}
                  className="btn-ghost flex-1 !py-2.5 text-sm disabled:opacity-60"
                >
                  {busy === "upload" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : uploaded ? (
                    <RefreshCw className="h-4 w-4" />
                  ) : (
                    <FileUp className="h-4 w-4" />
                  )}
                  {busy === "upload" ? "Uploading…" : uploaded ? "Upload new catalogue" : "Upload catalogue PDF"}
                </button>
                {uploaded && (
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    disabled={busy !== null}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove uploaded catalogue
                  </button>
                )}
              </div>
              {uploaded && (
                <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-500">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy-400" />
                  Removing it switches the link back to the automatic catalogue of your active products.
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 lg:max-w-md">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Link2 className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-lg font-bold text-ink-900">Shareable link</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Paste this anywhere — WhatsApp, email, your website. It always serves the current catalogue, whether
              uploaded or automatic. It is also included in the quick replies on the Enquiries page.
            </p>
            <p className="mt-4 break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-navy-700">
              {data.catalogUrl}
            </p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmRemove}
        title="Remove the uploaded catalogue?"
        description={`"${uploaded?.fileName ?? ""}" will be deleted. The catalogue link will serve the automatic catalogue of your active products instead. You can upload a PDF again at any time.`}
        confirmLabel="Remove"
        danger
        pending={busy === "remove"}
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}
