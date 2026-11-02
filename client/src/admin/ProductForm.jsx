import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ImagePlus, Loader2, Save, X } from "lucide-react";
import { productCategories } from "@shared/content.js";
import { endpoints } from "@/lib/api.js";

const FORM_OPTIONS = ["flakes", "slices", "dices", "granules", "powder", "blend"];
// Matches MAX_IMAGE_BYTES in server/src/routes/images.js.
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Photos are shrunk to at most this many pixels on their longest side. */
const MAX_PHOTO_SIDE = 1600;
/** Files already this small and this size are uploaded untouched. */
const OPTIMISE_ABOVE_BYTES = 1024 * 1024;

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

/**
 * Uploaded photos are served exactly as uploaded, so a 15 MB phone photo would
 * make every visitor download 15 MB. Before uploading, large photos are
 * resized in the browser to at most 1600px on the longest side and saved as
 * WebP — usually a few hundred KB, with no visible difference on the site.
 * Small photos, and any file the browser can't decode, go up unchanged.
 */
async function optimisePhoto(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // the browser can't decode it — upload the original
  }
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= OPTIMISE_ABOVE_BYTES) {
    bitmap.close?.();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  // Keep the original if the browser can't write WebP, or the result isn't smaller.
  if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}

function ImageField({ value, onChange, onUploadingChange }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [sizeNote, setSizeNote] = useState(null);
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
    setSizeNote(null);
    if (picked.size > MAX_UPLOAD_BYTES) {
      setUploadError(`Image is too large (${formatSize(picked.size)}) — please use a file under 15 MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const localPreview = URL.createObjectURL(picked);
    setObjectUrl(localPreview);
    setFileName(picked.name);
    setUploading(true);

    try {
      const upload = await optimisePhoto(picked);
      const { url } = await endpoints.admin.uploadImage(upload);
      onChange(url);
      setSizeNote(
        upload === picked
          ? `Uploaded as is (${formatSize(picked.size)}).`
          : `Optimised for the web: ${formatSize(picked.size)} → ${formatSize(upload.size)}.`
      );
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
    setSizeNote(null);
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
            {uploading && <span className="text-xs text-ink-500">Optimising and uploading…</span>}
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
          {!uploadError && sizeNote && <p className="text-xs text-emerald-700">{sizeNote}</p>}
          {!uploadError && !sizeNote && !uploading && (
            <p className="text-xs text-ink-500">JPEG, PNG, WebP or AVIF, up to 15 MB. Large photos are optimised automatically.</p>
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

/**
 * Turns a Product row into the flat, all-strings shape the form edits.
 * Illustration colours are not edited here: the server keeps a product's
 * existing colours on save and gives new products the defaults.
 */
export function formStateFrom(product) {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    category: product?.category ?? "",
    form: product?.form ?? "flakes",
    image: product?.image ?? "",
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
        <button type="submit" disabled={pending || imageUploading} className="btn-primary disabled:opacity-70">
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
