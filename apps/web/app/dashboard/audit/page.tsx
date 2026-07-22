"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/ToastProvider";
import { getAuditLogs, type AuditLogItem } from "@/lib/audit-api";
import { getToken } from "@/lib/session";

const ITEMS_PER_PAGE = 10;

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString();
}

function actionBadge(action: string) {
  const normalizedAction = action.toUpperCase();

  if (
    normalizedAction.includes("APPROVED") ||
    normalizedAction.includes("COMPLETED")
  ) {
    return "bg-green-50 text-green-700";
  }

  if (
    normalizedAction.includes("REJECTED") ||
    normalizedAction.includes("DELETED") ||
    normalizedAction.includes("CANCELLED")
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    normalizedAction.includes("CONTACTED") ||
    normalizedAction.includes("UPDATED")
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    normalizedAction.includes("CREATED") ||
    normalizedAction.includes("SUBMITTED") ||
    normalizedAction.includes("GENERATED")
  ) {
    return "bg-purple-50 text-purple-700";
  }

  return "bg-gray-100 text-gray-700";
}

export default function AuditPage() {
  const router = useRouter();
  const toast = useToast();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadLogs() {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);

        const data = await getAuditLogs(token);
        setLogs(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load audit logs.";

        const normalizedMessage = message.toLowerCase();

        if (
          normalizedMessage.includes("forbidden") ||
          normalizedMessage.includes("permission") ||
          normalizedMessage.includes("403")
        ) {
          router.replace("/access-denied");
          return;
        }

        if (
          normalizedMessage.includes("unauthorized") ||
          normalizedMessage.includes("401")
        ) {
          router.replace("/login");
          return;
        }

        toast.error("Unable to load audit logs", message);
      } finally {
        setLoading(false);
      }
    }

    void loadLogs();
  }, [router, toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return logs;
    }

    return logs.filter((log) =>
      [
        log.action,
        log.entity,
        log.entityId,
        log.description,
        log.userRole,
        log.userId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [logs, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / ITEMS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, currentPage]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (
      let pageNumber = startPage;
      pageNumber <= endPage;
      pageNumber += 1
    ) {
      pages.push(pageNumber);
    }

    return pages;
  }, [currentPage, totalPages]);

  const adminActions = useMemo(
    () =>
      logs.filter(
        (log) => log.userRole === "ADMIN",
      ).length,
    [logs],
  );

  const rejectedActions = useMemo(
    () =>
      logs.filter((log) =>
        log.action
          .toUpperCase()
          .includes("REJECTED"),
      ).length,
    [logs],
  );

  const firstVisibleItem =
    filteredLogs.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const lastVisibleItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredLogs.length,
  );

  if (loading) {
    return (
      <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-10 text-center text-[#667085]">
        Loading audit logs...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[52px] font-semibold leading-none tracking-[-0.02em] text-[#0F2340]">
          Audit Logs
        </h1>

        <p className="mt-3 text-[18px] text-[#667085]">
          Track sensitive platform actions for security and traceability.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF3F8] text-[#1B365D]">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <p className="mt-8 text-[44px] font-semibold leading-none text-[#0F2340]">
            {logs.length}
          </p>

          <p className="mt-3 text-[17px] text-[#344054]">
            Total events
          </p>

          <p className="mt-2 text-sm text-[#667085]">
            All recorded audit actions
          </p>
        </div>

        <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCFCE7] text-green-600">
            <Activity className="h-6 w-6" />
          </div>

          <p className="mt-8 text-[44px] font-semibold leading-none text-[#0F2340]">
            {adminActions}
          </p>

          <p className="mt-3 text-[17px] text-[#344054]">
            Admin actions
          </p>

          <p className="mt-2 text-sm text-[#667085]">
            Actions performed by administrators
          </p>
        </div>

        <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF7E2] text-orange-500">
            <Clock3 className="h-6 w-6" />
          </div>

          <p className="mt-8 text-[44px] font-semibold leading-none text-[#0F2340]">
            {rejectedActions}
          </p>

          <p className="mt-3 text-[17px] text-[#344054]">
            Rejected actions
          </p>

          <p className="mt-2 text-sm text-[#667085]">
            Rejected moderation and matching actions
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
        <div className="border-b border-[#E4E7EC] p-7">
          <div className="relative w-full xl:max-w-[760px]">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by action, entity, role or description..."
              aria-label="Search audit logs"
              className="h-14 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-14 pr-4 text-[17px] text-[#0F2340] outline-none placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="border-b border-[#EAECF0] bg-[#F8F9FA]">
              <tr>
                <th className="px-7 py-4 text-sm font-semibold text-[#667085]">
                  Action
                </th>

                <th className="px-7 py-4 text-sm font-semibold text-[#667085]">
                  Entity
                </th>

                <th className="px-7 py-4 text-sm font-semibold text-[#667085]">
                  Description
                </th>

                <th className="px-7 py-4 text-sm font-semibold text-[#667085]">
                  Role
                </th>

                <th className="px-7 py-4 text-sm font-semibold text-[#667085]">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAECF0]">
              {paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  className="transition hover:bg-[#FAFBFC]"
                >
                  <td className="px-7 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${actionBadge(
                        log.action,
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="px-7 py-5 text-sm text-[#0F2340]">
                    <p className="font-semibold">
                      {log.entity || "-"}
                    </p>

                    <p className="mt-1 max-w-[180px] break-all text-xs text-[#98A2B3]">
                      {log.entityId || "-"}
                    </p>
                  </td>

                  <td className="max-w-[440px] px-7 py-5 text-sm leading-6 text-[#667085]">
                    {log.description || "-"}
                  </td>

                  <td className="px-7 py-5 text-sm font-semibold text-[#1B365D]">
                    {log.userRole || "-"}
                  </td>

                  <td className="whitespace-nowrap px-7 py-5 text-sm text-[#667085]">
                    {formatDate(log.createdAt)}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-7 py-12 text-center text-[#667085]"
                  >
                    <ShieldCheck className="mx-auto h-10 w-10 text-[#98A2B3]" />

                    <p className="mt-4 font-semibold text-[#344054]">
                      No audit logs found
                    </p>

                    <p className="mt-2 text-sm">
                      No event matches your current search.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredLogs.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-[#E4E7EC] px-7 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#667085]">
              Showing{" "}
              <span className="font-semibold text-[#0F2340]">
                {firstVisibleItem}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-[#0F2340]">
                {lastVisibleItem}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#0F2340]">
                {filteredLogs.length}
              </span>{" "}
              events
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(1, page - 1),
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() =>
                    setCurrentPage(pageNumber)
                  }
                  className={`h-10 min-w-10 rounded-xl px-3 text-sm font-semibold transition ${
                    currentPage === pageNumber
                      ? "bg-[#1B365D] text-white"
                      : "border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8F9FA]"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1),
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}