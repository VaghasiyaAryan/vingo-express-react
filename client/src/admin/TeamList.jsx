import { useCallback, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, Pencil, Loader2, Star } from "lucide-react";
import TeamPortrait from "@/components/TeamPortrait.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { useToast } from "./Toast.jsx";
import TeamActions from "./TeamActions.jsx";

const TOAST_MESSAGES = {
  created: "Team member created.",
  updated: "Team member changes saved.",
};

export default function TeamList() {
  useDocumentTitle("Team");

  const fetchTeam = useCallback((signal) => endpoints.admin.team({ signal }), []);
  const { data, error, loading, mutate } = useApi(fetchTeam);
  const team = data?.team ?? [];

  // The editor redirects here with router state after a save. Show the toast
  // once, then clear the state so a refresh or a back-navigation does not
  // replay it.
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const toastCode = location.state?.toast;
  const shownFor = useRef(null);

  useEffect(() => {
    if (!toastCode || shownFor.current === toastCode) return;
    shownFor.current = toastCode;
    showToast(TOAST_MESSAGES[toastCode] || "Done.");
    navigate(location.pathname, { replace: true, state: null });
  }, [toastCode, showToast, navigate, location.pathname]);

  const handleToggled = useCallback(
    (id, active) => {
      mutate((current) => ({ ...current, team: current.team.map((m) => (m.id === id ? { ...m, active } : m)) }));
    },
    [mutate]
  );

  const handleDeleted = useCallback(
    (id) => {
      mutate((current) => ({ ...current, team: current.team.filter((m) => m.id !== id) }));
    },
    [mutate]
  );

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Team</h1>
          <p className="mt-2 text-sm text-ink-500">
            {loading && !data
              ? "Loading…"
              : `${team.length} ${team.length === 1 ? "member" : "members"} · ${
                  team.filter((m) => m.active).length
                } visible on the public site.`}
          </p>
        </div>
        <Link to="/admin/team/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Team Member
        </Link>
      </div>

      {loading && !data && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading team" />
        </div>
      )}

      {error && (
        <p className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {data && team.length === 0 && (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <p className="font-display text-lg font-bold text-ink-900">No team members yet</p>
          <p className="mt-1 text-sm text-ink-500">Add your first team member to get started.</p>
        </div>
      )}

      {team.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Name</th>
                  <th className="px-5 py-3.5 font-semibold">Role</th>
                  <th className="px-5 py-3.5 font-semibold">Visibility</th>
                  <th className="px-5 py-3.5 font-semibold" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.map((member) => (
                  <tr key={member.id} className="align-middle transition-colors hover:bg-navy-50/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                          <TeamPortrait name={member.name} photo={member.photo} textSize="text-xs" iconSize="h-4 w-4" />
                        </span>
                        <div>
                          <p className="flex items-center gap-1.5 font-semibold text-ink-900">
                            {member.name}
                            {member.featured && (
                              <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" aria-label="Featured" />
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-700">{member.role}</td>
                    <td className="px-5 py-3">
                      <TeamActions member={member} onToggled={handleToggled} onDeleted={handleDeleted} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/admin/team/${member.id}/edit`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:gap-2.5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
