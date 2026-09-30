import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { upload } from "@vercel/blob/client";
import { AlertCircle, ExternalLink, FileCheck2, ImagePlus, Loader2, Save, Upload, X } from "lucide-react";
import { productCategories } from "@shared/content.js";

const FORM_OPTIONS = ["flakes", "slices", "dices", "granules", "powder", "blend"];
const DEFAULT_COLORS = { base: "#f1f5f9", accent: "#cbd5e1", deep: "#94a3b8" };
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

function ImageField({ value, onChange, onUploadingChange }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);
  const initialUrl = useRef(value);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const preview = objectUrl || value || null;

  async function handleFile(e) {
    const picked = e.target.files?.[0] || null;
    if (!picked) return;

    setUploadError(null);
    if (picked.size > MAX_UPLOAD_BYTES) {
      setUploadError("Image is too large — please use a file under 12 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const localPreview = URL.createObjectURL(picked);
    setObjectUrl(localPreview);
    setFileName(picked.name);
    setUploading(true);

    try {
      // Uploads straight from the browser to Blob storage — the file bytes
      // never pass through the API, so a 10MB photo does not have to be
      // buffered and re-sent by the Express process.
      const blob = await upload(`products/${Date.now()}-${picked.name}`, picked, {
        access: "public",
        handleUploadUrl: "/api/admin/upload-token",
      });
      onChange(blob.url);
    } catch (err) {
      setUploadError(err.message || "Upload failed. Please try again.");
      setObjectUrl(null);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  function clearFile() {
    setObjectUrl(null);
    setFileName(null);
    onChange(initialUrl.current || "");
    setUploadError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="field-label">Product photo</label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="h-6 w-6 text-slate-300" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-navy-600" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <label className="btn-ghost cursor-pointer !py-2 text-sm">
              <ImagePlus className="h-4 w-4" />
              Browse…
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFile}
                disabled={uploading}
                className="sr-only"
              />
            </label>
            {uploading && <span className="text-xs text-ink-500">Uploading…</span>}
            {!uploading && fileName && (
              <>
                <span className="truncate text-xs text-ink-500">{fileName}</span>
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-ink-400 hover:text-ink-700"
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {uploadError && (
            <p className="flex items-center gap-1.5 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {uploadError}
            </p>
          )}

          <div>
            <label className="text-xs font-medium text-ink-500" htmlFor="image">
              …or paste an image URL instead
            </label>
            <input
              id="image"
              name="image"
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setFileName(null);
                setObjectUrl(null);
              }}
              disabled={uploading}
              placeholder="https://… — leave blank to use the generated illustration"
              className="field mt-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-ink-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** "https://.../coa/1699999999-white-onion-coa.pdf" -> "white-onion-coa.pdf" */
function fileNameFromUrl(url) {
  try {
    const last = decodeURIComponent(url.split("/").pop() || "");
    return last.replace(/^\d+-/, "") || "COA on file";
  } catch {
    return "COA on file";
  }
}

function CoaField({ value, onChange, onUploadingChange }) {
  const [fileName, setFileName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);
  const initialUrl = useRef(value);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  async function handleFile(e) {
    const picked = e.target.files?.[0] || null;
    if (!picked) return;

    setUploadError(null);
    if (picked.size > MAX_UPLOAD_BYTES) {
      setUploadError("File is too large — please use a file under 12 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFileName(picked.name);
    setUploading(true);

    try {
      const blob = await upload(`coa/${Date.now()}-${picked.name}`, picked, {
        access: "public",
        handleUploadUrl: "/api/admin/upload-token",
      });
      onChange(blob.url);
    } catch (err) {
      setUploadError(err.message || "Upload failed. Please try again.");
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  function clearFile() {
    setFileName(null);
    onChange(initialUrl.current || "");
    setUploadError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayName = fileName || (value ? fileNameFromUrl(value) : null);

  return (
    <div>
      <label className="field-label">
        Certificate of Analysis (COA) <span className="font-normal text-ink-500">(optional)</span>
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <FileCheck2 className={`h-5 w-5 shrink-0 ${value ? "text-navy-600" : "text-slate-300"}`} />
          <span className={`truncate text-sm ${value ? "text-ink-700" : "text-slate-400"}`}>
            {displayName || "No COA uploaded — buyers won't see a download button"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {value && !uploading && (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost !px-3 !py-2 text-sm"
              aria-label="View current COA"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <label className="btn-ghost cursor-pointer !px-3 !py-2 text-sm">
            <Upload className="h-4 w-4" />
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={handleFile}
              disabled={uploading}
              className="sr-only"
            />
          </label>
          {value && !uploading && (
            <button
              type="button"
              onClick={clearFile}
              className="text-ink-400 hover:text-red-600"
              aria-label="Remove COA"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {uploading && <p className="mt-1.5 text-xs text-ink-500">Uploading…</p>}
      {uploadError && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {uploadError}
        </p>
      )}
      <p className="mt-1.5 text-xs text-ink-500">PDF or image, up to 12 MB.</p>
    </div>
  );
}

function ColorField({ id, label, value, onChange }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label} colour
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} colour picker`}
          className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-slate-200"
        />
        <input id={id} name={id} value={value} onChange={(e) => onChange(e.target.value)} className="field" />
      </div>
    </div>
  );
}

/** Turns a Product row into the flat, all-strings shape the form edits. */
export function formStateFrom(product) {
  const colors = product?.colors || DEFAULT_COLORS;
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    category: product?.category ?? "",
    form: product?.form ?? "flakes",
    image: product?.image ?? "",
    coaUrl: product?.coaUrl ?? "",
    colorBase: colors.base ?? DEFAULT_COLORS.base,
    colorAccent: colors.accent ?? DEFAULT_COLORS.accent,
    colorDeep: colors.deep ?? DEFAULT_COLORS.deep,
    short: product?.short ?? "",
    description: product?.description ?? "",
    forms: product?.forms?.join(", ") ?? "",
    applications: product?.applications?.join(", ") ?? "",
    specs: product ? Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`).join("\n") : "",
    active: product ? product.active : true,
  };
}

/** And back into the JSON body the API expects. */
export function payloadFrom(state) {
  return {
    name: state.name,
    slug: state.slug,
    category: state.category,
    form: state.form,
    image: state.image,
    coaUrl: state.coaUrl,
    colors: { base: state.colorBase, accent: state.colorAccent, deep: state.colorDeep },
    short: state.short,
    description: state.description,
    forms: state.forms,
    applications: state.applications,
    specs: state.specs,
    active: state.active,
  };
}

export default function ProductForm({ initialState, error, pending, submitLabel, onSubmit }) {
  const [state, setState] = useState(initialState);
  const [imageUploading, setImageUploading] = useState(false);
  const [coaUploading, setCoaUploading] = useState(false);

  const set = (field) => (event) => setState((prev) => ({ ...prev, [field]: event.target.value }));
  const setValue = (field) => (value) => setState((prev) => ({ ...prev, [field]: value }));

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(state);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-3xl space-y-6 pb-16">
      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="name">
            Product name *
          </label>
          <input id="name" value={state.name} onChange={set("name")} required className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="slug">
            URL slug
          </label>
          <input
            id="slug"
            value={state.slug}
            onChange={set("slug")}
            placeholder="auto-generated from the name if left blank"
            className="field"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="category">
            Category *
          </label>
          <select id="category" value={state.category} onChange={set("category")} required className="field cursor-pointer">
            <option value="">Select a category</option>
            {productCategories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="form">
            Illustration style
          </label>
          <select id="form" value={state.form} onChange={set("form")} className="field cursor-pointer">
            {FORM_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ImageField value={state.image} onChange={setValue("image")} onUploadingChange={setImageUploading} />

      <CoaField value={state.coaUrl} onChange={setValue("coaUrl")} onUploadingChange={setCoaUploading} />

      <div className="grid gap-5 sm:grid-cols-3">
        <ColorField id="colorBase" label="Base" value={state.colorBase} onChange={setValue("colorBase")} />
        <ColorField id="colorAccent" label="Accent" value={state.colorAccent} onChange={setValue("colorAccent")} />
        <ColorField id="colorDeep" label="Deep" value={state.colorDeep} onChange={setValue("colorDeep")} />
      </div>

      <div>
        <label className="field-label" htmlFor="short">
          Short description * <span className="font-normal text-ink-500">(shown on the product card)</span>
        </label>
        <input id="short" value={state.short} onChange={set("short")} required className="field" />
      </div>

      <div>
        <label className="field-label" htmlFor="description">
          Full description *
        </label>
        <textarea
          id="description"
          rows={4}
          value={state.description}
          onChange={set("description")}
          required
          className="field resize-y"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="forms">
            Available forms <span className="font-normal text-ink-500">(comma-separated)</span>
          </label>
          <input
            id="forms"
            value={state.forms}
            onChange={set("forms")}
            placeholder="Kibbled, Chopped, Minced, Powder"
            className="field"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="applications">
            Applications <span className="font-normal text-ink-500">(comma-separated)</span>
          </label>
          <input
            id="applications"
            value={state.applications}
            onChange={set("applications")}
            placeholder="Seasoning blends, Soups & sauces"
            className="field"
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="specs">
          Specifications <span className="font-normal text-ink-500">(one &quot;Key: Value&quot; per line)</span>
        </label>
        <textarea
          id="specs"
          rows={4}
          value={state.specs}
          onChange={set("specs")}
          placeholder={"Moisture: Max 5%\nPacking: 20 kg / 25 kg\nShelf Life: 24 months"}
          className="field resize-y font-mono text-xs"
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
        <input
          type="checkbox"
          checked={state.active}
          onChange={(e) => setState((prev) => ({ ...prev, active: e.target.checked }))}
          className="h-4 w-4 rounded border-slate-300 text-navy-700 focus:ring-navy-200"
        />
        Visible on the public site
      </label>

      <div className="flex gap-3 border-t border-slate-100 pt-6">
        <button
          type="submit"
          disabled={pending || imageUploading || coaUploading}
          className="btn-primary disabled:opacity-70"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitLabel}
        </button>
        <Link to="/admin/products" className="btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
