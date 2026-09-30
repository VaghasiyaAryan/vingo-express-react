import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { upload } from "@vercel/blob/client";
import { AlertCircle, ImagePlus, Loader2, Save, X } from "lucide-react";
import TeamPortrait from "@/components/TeamPortrait.jsx";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

function PhotoField({ name, value, onChange, onUploadingChange }) {
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
      // never pass through the API.
      const blob = await upload(`team/${Date.now()}-${picked.name}`, picked, {
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
      <label className="field-label">Photo</label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="relative flex h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <TeamPortrait name={name || "?"} photo={preview} textSize="text-xl" iconSize="h-5 w-5" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-navy-600" />
            </div>
          )}
        </span>

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
            <label className="text-xs font-medium text-ink-500" htmlFor="photo">
              …or paste an image URL instead
            </label>
            <input
              id="photo"
              name="photo"
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setFileName(null);
                setObjectUrl(null);
              }}
              disabled={uploading}
              placeholder="https://… — leave blank to show initials instead"
              className="field mt-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-ink-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Turns a TeamMember row into the flat, all-strings shape the form edits. */
export function formStateFrom(member) {
  return {
    name: member?.name ?? "",
    role: member?.role ?? "",
    bio: member?.bio ?? "",
    photo: member?.photo ?? "",
    featured: member ? member.featured : false,
    active: member ? member.active : true,
  };
}

/** And back into the JSON body the API expects. */
export function payloadFrom(state) {
  return {
    name: state.name,
    role: state.role,
    bio: state.bio,
    photo: state.photo,
    featured: state.featured,
    active: state.active,
  };
}

export default function TeamForm({ initialState, error, pending, submitLabel, onSubmit }) {
  const [state, setState] = useState(initialState);
  const [photoUploading, setPhotoUploading] = useState(false);

  const set = (field) => (event) => setState((prev) => ({ ...prev, [field]: event.target.value }));
  const setValue = (field) => (value) => setState((prev) => ({ ...prev, [field]: value }));

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(state);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-6 pb-16">
      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="name">
            Full name *
          </label>
          <input id="name" value={state.name} onChange={set("name")} required className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="role">
            Role *
          </label>
          <input
            id="role"
            value={state.role}
            onChange={set("role")}
            required
            placeholder="e.g. Export Documentation Specialist"
            className="field"
          />
        </div>
      </div>

      <PhotoField name={state.name} value={state.photo} onChange={setValue("photo")} onUploadingChange={setPhotoUploading} />

      <div>
        <label className="field-label" htmlFor="bio">
          Bio * <span className="font-normal text-ink-500">(one or two lines on what they own day to day)</span>
        </label>
        <textarea id="bio" rows={4} value={state.bio} onChange={set("bio")} required className="field resize-y" />
      </div>

      <label className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
        <input
          type="checkbox"
          checked={state.featured}
          onChange={(e) => setState((prev) => ({ ...prev, featured: e.target.checked }))}
          className="h-4 w-4 rounded border-slate-300 text-navy-700 focus:ring-navy-200"
        />
        Featured — shown in the large leader card at the top of the Team page
      </label>

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
        <button type="submit" disabled={pending || photoUploading} className="btn-primary disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitLabel}
        </button>
        <Link to="/admin/team" className="btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
