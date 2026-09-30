import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import TeamForm, { formStateFrom, payloadFrom } from "./TeamForm.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

/** Both halves of team editing — /admin/team/new and .../:id/edit. */
export default function TeamEditor({ mode }) {
  const isEdit = mode === "edit";
  const { id } = useParams();
  const navigate = useNavigate();

  useDocumentTitle(isEdit ? "Edit Team Member" : "Add Team Member");

  const fetchMember = useCallback((signal) => endpoints.admin.teamMember(id, { signal }), [id]);
  // The create form has nothing to load, so the fetch is skipped entirely.
  const { data, error: loadError, loading } = useApi(isEdit ? fetchMember : async () => null, [isEdit, id]);

  const [saveError, setSaveError] = useState(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(state) {
    setPending(true);
    setSaveError(null);
    try {
      const payload = payloadFrom(state);
      if (isEdit) {
        await endpoints.admin.updateTeamMember(id, payload);
        navigate("/admin/team", { state: { toast: "updated" } });
      } else {
        await endpoints.admin.createTeamMember(payload);
        navigate("/admin/team", { state: { toast: "created" } });
      }
    } catch (err) {
      setSaveError(err.message);
      setPending(false);
    }
  }

  if (isEdit && loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading team member" />
      </div>
    );
  }

  if (isEdit && loadError) {
    return (
      <div className="container-x py-10">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {loadError.message}
        </p>
      </div>
    );
  }

  const member = data?.member;

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold text-ink-900">{isEdit ? "Edit Team Member" : "Add Team Member"}</h1>
      <p className="mt-2 text-sm text-ink-500">
        {isEdit
          ? member?.name
          : "New team members are visible on the public site immediately unless you uncheck “Visible.”"}
      </p>

      <TeamForm
        initialState={formStateFrom(member)}
        error={saveError}
        pending={pending}
        submitLabel={isEdit ? "Save Changes" : "Create Team Member"}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
