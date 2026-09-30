import { useCallback, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { AlertCircle, Download, FileText, Link2, Loader2, Trash2, UploadCloud } from "lucide-react";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { useToast } from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function CatalogFileCard({ file, loading, onUploaded, onDeleted }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const inputRef = useRef(null);
  const showToast = useToast();

  async function handleFile(e) {
    const picked = e.target.files?.[0] || null;
    if (!picked) return;

    setUploadError(null);
    if (picked.type !== "application/pdf") {
      setUploadError("Please choose a PDF file.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (picked.size > MAX_UPLOAD_BYTES) {
      setUploadError("File is too large — please use a PDF under 25 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      // Straight from the browser to Blob storage, same as product photos —
      // a multi-megabyte PDF never has to pass through the API process.
      const blob = await upload(`catalogue/${Date.now()}-${picked.name}`, picked, {
        access: "public",
        handleUploadUrl: "/api/admin/catalog-file/upload-token",
      });
      const saved = await endpoints.admin.saveCatalogFile({
        url: blob.url,
        filename: picked.name,
        sizeBytes: picked.size,
      });
      onUploaded(saved.file);
      showToast("Catalogue uploaded.");
    } catch (err) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete() {
    setDeletePending(true);
    try {
      await endpoints.admin.deleteCatalogFile();
      setConfirmOpen(false);
      onDeleted();
      showToast("Catalogue deleted — the auto-generated PDF is now served instead.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeletePending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex min-h-[10rem] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-navy-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <UploadCloud className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-lg font-bold text-ink-900">Your catalogue PDF</p>

      {file ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Buyers who use the shareable link or the download button get this file — not the auto-generated one.
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <FileText className="h-5 w-5 shrink-0 text-navy-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">{file.filename}</p>
              <p className="text-xs text-ink-500">
                {formatBytes(file.sizeBytes)} · uploaded {formatDate(file.uploadedAt)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 !justify-center">
              <Download className="h-4 w-4" />
              View
            </a>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
              aria-label="Delete catalogue"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <label className="btn-ghost mt-3 w-full cursor-pointer !justify-center text-sm">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Replace with a new PDF
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFile}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Upload your own branded PDF and it replaces the auto-generated one everywhere — the shareable link, the
            download button, and the WhatsApp/email quick replies.
          </p>

          <label className="btn-primary mt-4 w-full cursor-pointer !justify-center">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload catalogue PDF"}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFile}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        </>
      )}

      {uploadError && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {uploadError}
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        danger
        title="Delete this catalogue?"
        description="The shareable link and download button will fall back to the auto-generated PDF."
        confirmLabel="Delete"
        pending={deletePending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export default function Catalog() {
  useDocumentTitle("Product Catalogue");

  const fetchSummary = useCallback((signal) => endpoints.admin.catalogSummary({ signal }), []);
  const { data, error, loading } = useApi(fetchSummary);

  const fetchFile = useCallback((signal) => endpoints.admin.catalogFile({ signal }), []);
  const { data: fileData, loading: fileLoading, mutate: mutateFile } = useApi(fetchFile);

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold text-ink-900">Product Catalogue</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
        Upload your own branded catalogue PDF below, or leave it blank to auto-generate one from your active
        products — either way, the same link stays live for WhatsApp and Email quick replies on the Enquiries page.
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
          <CatalogFileCard
            file={fileData?.file}
            loading={fileLoading}
            onUploaded={(file) => mutateFile({ file })}
            onDeleted={() => mutateFile({ file: null })}
          />

          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <FileText className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-2xl font-bold text-ink-900">{data.activeCount}</p>
            <p className="mt-1 text-sm text-ink-500">Active products included in the auto-generated catalogue</p>

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
