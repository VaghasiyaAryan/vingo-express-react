import { useCallback } from "react";
import { Inbox, Loader2 } from "lucide-react";
import InquiriesBoard from "./InquiriesBoard.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function Enquiries() {
  useDocumentTitle("Enquiries");

  const fetchInquiries = useCallback((signal) => endpoints.admin.inquiries({ signal }), []);
  const { data, error, loading, mutate } = useApi(fetchInquiries);
  const inquiries = data?.inquiries ?? [];

  // Status changes and deletes are patched into the cached list rather than
  // refetching the whole board — the server has already confirmed the write
  // by the time these run.
  const handleStatusChanged = useCallback(
    (id, status) => {
      mutate((current) => ({
        ...current,
        inquiries: current.inquiries.map((row) => (row.id === id ? { ...row, status } : row)),
      }));
    },
    [mutate]
  );

  const handleDeleted = useCallback(
    (id) => {
      mutate((current) => ({ ...current, inquiries: current.inquiries.filter((row) => row.id !== id) }));
    },
    [mutate]
  );

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Website Enquiries</h1>
          <p className="mt-2 text-sm text-ink-500">
            {loading && !data
              ? "Loading…"
              : `${inquiries.length} ${inquiries.length === 1 ? "enquiry" : "enquiries"} received.`}
          </p>
        </div>
      </div>

      {loading && !data && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading enquiries" />
        </div>
      )}

      {error && (
        <p className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {data && inquiries.length === 0 && (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <Inbox className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 font-display text-lg font-bold text-ink-900">No enquiries yet</p>
          <p className="mt-1 text-sm text-ink-500">Submissions from the website enquiry form will appear here.</p>
        </div>
      )}

      {inquiries.length > 0 && (
        <InquiriesBoard
          inquiries={inquiries}
          onStatusChanged={handleStatusChanged}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
