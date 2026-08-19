"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  MapPin,
  Phone,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import {
  useToast,
} from "@/components/ui/ToastProvider";

import type {
  AuthUser,
} from "@/lib/auth-api";

import {
  deleteLead,
  getLeads,
  type Lead,
  updateLead,
} from "@/lib/leads-api";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

const ITEMS_PER_PAGE = 3;

type LeadQualityFilter =
  | "ALL"
  | Lead["quality"];

type LeadStatusFilter =
  | "ALL"
  | Lead["status"];

function badge(type: string) {
  if (type === "HOT") {
    return "bg-[#FEE2E2] text-[#EF4444]";
  }

  if (type === "WARM") {
    return "bg-[#FEF3C7] text-[#EA580C]";
  }

  if (type === "COLD") {
    return "bg-[#DBEAFE] text-[#2563EB]";
  }

  if (type === "MATCHED") {
    return "bg-[#DCFCE7] text-[#16A34A]";
  }

  if (type === "CONTACTED") {
    return "bg-[#F3E8FF] text-[#9333EA]";
  }

  if (type === "NEW") {
    return "bg-[#DBEAFE] text-[#2563EB]";
  }

  if (type === "CLOSED") {
    return "bg-[#DCFCE7] text-[#16A34A]";
  }

  if (type === "LOST") {
    return "bg-[#F3F4F6] text-[#475467]";
  }

  return "bg-[#F3F4F6] text-[#475467]";
}

function initials(
  name?: string | null,
  email?: string | null,
) {
  return (
    name?.trim().charAt(0).toUpperCase() ||
    email?.trim().charAt(0).toUpperCase() ||
    "L"
  );
}

function formatDate(
  dateValue: string,
) {
  const date = new Date(
    dateValue,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString();
}

function formatDateTime(
  dateValue: string,
) {
  const date = new Date(
    dateValue,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "-";
  }

  return date.toLocaleString();
}

function getSmartMatchingLabel(
  lead: Lead,
) {
  if (
    lead.status ===
    "MATCHED"
  ) {
    return {
      label:
        "Auto Matched",

      className:
        "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
    };
  }

  if (
    lead.status ===
    "NEW"
  ) {
    return {
      label:
        "Smart Matching",

      className:
        "border-[#FDE68A] bg-[#FFFBEB] text-[#A16207]",
    };
  }

  if (
    lead.status ===
    "CONTACTED"
  ) {
    return {
      label:
        "Professional Engaged",

      className:
        "border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED]",
    };
  }

  if (
    lead.status ===
    "CLOSED"
  ) {
    return {
      label:
        "Completed",

      className:
        "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
    };
  }

  return {
    label:
      "Closed",

    className:
      "border-[#E4E7EC] bg-[#F9FAFB] text-[#667085]",
  };
}

export default function LeadsPage() {
  const router =
    useRouter();

  const toast =
    useToast();

  const user =
    getStoredUser<AuthUser>();

  const [
    leads,
    setLeads,
  ] =
    useState<
      Lead[]
    >([]);

  const [
    selectedLead,
    setSelectedLead,
  ] =
    useState<
      Lead | null
    >(null);

  const [
    leadToDelete,
    setLeadToDelete,
  ] =
    useState<
      Lead | null
    >(null);

  const [
    deletingLead,
    setDeletingLead,
  ] =
    useState(false);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    qualityFilter,
    setQualityFilter,
  ] =
    useState<
      LeadQualityFilter
    >("ALL");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      LeadStatusFilter
    >("ALL");

  const [
    showFilters,
    setShowFilters,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<
      string | null
    >(null);

  const [
    updatingId,
    setUpdatingId,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    async function loadLeads() {
      const token =
        getToken();

      if (
        !token ||
        !user
      ) {
        router.replace(
          "/login",
        );
        return;
      }

      if (
        user.role !==
        "ADMIN"
      ) {
        router.replace(
          "/access-denied",
        );
        return;
      }

      try {
        setLoading(
          true,
        );

        const data =
          await getLeads(
            token,
          );

        setLeads(
          data,
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load leads.";

        const normalizedMessage =
          message
            .toLowerCase();

        if (
          normalizedMessage.includes(
            "401",
          ) ||
          normalizedMessage.includes(
            "unauthorized",
          )
        ) {
          router.replace(
            "/login",
          );
          return;
        }

        if (
          normalizedMessage.includes(
            "403",
          ) ||
          normalizedMessage.includes(
            "forbidden",
          ) ||
          normalizedMessage.includes(
            "permission",
          )
        ) {
          router.replace(
            "/access-denied",
          );
          return;
        }

        toast.error(
          "Unable to load leads",
          message,
        );
      } finally {
        setLoading(
          false,
        );
      }
    }

    void loadLeads();
  }, [
    router,
    toast,
    user?.role,
  ]);

  useEffect(() => {
    setCurrentPage(
      1,
    );
  }, [
    search,
    qualityFilter,
    statusFilter,
  ]);

  const filteredLeads =
    useMemo(() => {
      const query =
        search
          .toLowerCase()
          .trim();

      return leads.filter(
        (lead) => {
          const matchesSearch =
            !query ||
            [
              lead.fullName,
              lead.email,
              lead.phone,
              lead.location,
              lead.source,
              lead.interest,
              lead.budget,
              lead.quality,
              lead.status,
            ]
              .filter(
                Boolean,
              )
              .join(" ")
              .toLowerCase()
              .includes(
                query,
              );

          const matchesQuality =
            qualityFilter ===
              "ALL" ||
            lead.quality ===
              qualityFilter;

          const matchesStatus =
            statusFilter ===
              "ALL" ||
            lead.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesQuality &&
            matchesStatus
          );
        },
      );
    }, [
      leads,
      search,
      qualityFilter,
      statusFilter,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredLeads.length /
          ITEMS_PER_PAGE,
      ),
    );

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages,
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedLeads =
    useMemo(() => {
      const startIndex =
        (currentPage -
          1) *
        ITEMS_PER_PAGE;

      return filteredLeads.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE,
      );
    }, [
      filteredLeads,
      currentPage,
    ]);

  const visiblePages =
    useMemo(() => {
      const pages:
        number[] = [];

      const startPage =
        Math.max(
          1,
          currentPage -
            2,
        );

      const endPage =
        Math.min(
          totalPages,
          currentPage +
            2,
        );

      for (
        let page =
          startPage;
        page <=
        endPage;
        page += 1
      ) {
        pages.push(
          page,
        );
      }

      return pages;
    }, [
      currentPage,
      totalPages,
    ]);

  const stats =
    useMemo(
      () => [
        {
          label:
            "Total Requests",

          value:
            leads.length,

          sub:
            "All buyer requests",
        },

        {
          label:
            "Hot Requests",

          value:
            leads.filter(
              (lead) =>
                lead.quality ===
                "HOT",
            ).length,

          sub:
            "High priority",
        },

        {
          label:
            "Auto Matched",

          value:
            leads.filter(
              (lead) =>
                lead.status ===
                "MATCHED",
            ).length,

          sub:
            "Matched automatically",
        },

        {
          label:
            "Smart Matching",

          value:
            leads.filter(
              (lead) =>
                lead.status ===
                "NEW",
            ).length,

          sub:
            "Waiting for compatible professionals",
        },
      ],
      [
        leads,
      ],
    );

  const firstVisibleLead =
    filteredLeads.length ===
    0
      ? 0
      : (currentPage -
            1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleLead =
    Math.min(
      currentPage *
        ITEMS_PER_PAGE,
      filteredLeads.length,
    );

  async function handleUpdateStatus(
    id: string,
    status:
      Lead["status"],
  ) {
    /*
     * IMPORTANT:
     *
     * MATCHED is controlled by the
     * automatic matching system.
     *
     * The Admin should only manage
     * lifecycle outcomes such as
     * CLOSED or LOST.
     */
    if (
      status ===
      "MATCHED"
    ) {
      toast.info(
        "Automatic status",
        "MATCHED is managed automatically by the smart matching system.",
      );
      return;
    }

    const token =
      getToken();

    if (
      !token
    ) {
      router.replace(
        "/login",
      );
      return;
    }

    setUpdatingId(
      id,
    );

    try {
      const updated =
        await updateLead(
          token,
          id,
          {
            status,
          },
        );

      setLeads(
        (
          currentLeads,
        ) =>
          currentLeads.map(
            (lead) =>
              lead.id ===
              id
                ? {
                    ...lead,
                    ...updated,
                  }
                : lead,
          ),
      );

      setSelectedLead(
        (
          currentSelectedLead,
        ) =>
          currentSelectedLead?.id ===
          id
            ? {
                ...currentSelectedLead,
                ...updated,
              }
            : currentSelectedLead,
      );

      toast.success(
        "Lead updated",
        "Lead status updated successfully.",
      );
    } catch (error) {
      toast.error(
        "Update failed",
        error instanceof Error
          ? error.message
          : "Unable to update lead.",
      );
    } finally {
      setUpdatingId(
        null,
      );
    }
  }

  function requestDeleteLead(
    lead: Lead,
  ) {
    setLeadToDelete(
      lead,
    );
  }

  async function confirmDeleteLead() {
    if (
      !leadToDelete ||
      deletingLead
    ) {
      return;
    }

    const token =
      getToken();

    if (
      !token
    ) {
      router.replace(
        "/login",
      );
      return;
    }

    setDeletingLead(
      true,
    );

    setDeletingId(
      leadToDelete.id,
    );

    try {
      await deleteLead(
        token,
        leadToDelete.id,
      );

      setLeads(
        (
          currentLeads,
        ) =>
          currentLeads.filter(
            (item) =>
              item.id !==
              leadToDelete.id,
          ),
      );

      setSelectedLead(
        (
          currentSelectedLead,
        ) =>
          currentSelectedLead?.id ===
          leadToDelete.id
            ? null
            : currentSelectedLead,
      );

      toast.success(
        "Lead deleted",
        "The lead was removed successfully.",
      );

      setLeadToDelete(
        null,
      );
    } catch (error) {
      toast.error(
        "Delete failed",
        error instanceof Error
          ? error.message
          : "Unable to delete lead.",
      );
    } finally {
      setDeletingLead(
        false,
      );

      setDeletingId(
        null,
      );
    }
  }

  function clearFilters() {
    setSearch("");
    setQualityFilter(
      "ALL",
    );
    setStatusFilter(
      "ALL",
    );
    setCurrentPage(
      1,
    );
  }

  const hasActiveFilters =
    search.trim() !==
      "" ||
    qualityFilter !==
      "ALL" ||
    statusFilter !==
      "ALL";

  if (
    loading
  ) {
    return (
      <LeadsPageSkeleton />
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[42px] font-semibold leading-none tracking-[-0.02em] text-[#0F2340] md:text-[52px]">
              Buyer Requests
            </h1>

            <p className="mt-3 max-w-[760px] text-[18px] leading-8 text-[#667085]">
              Monitor buyer requests and
              the automated smart-matching
              lifecycle.
            </p>
          </div>

          <div className="inline-flex max-w-[520px] items-start gap-4 rounded-[22px] border border-[#D7E3F0] bg-[#F4F8FC] p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1B365D] text-white">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p className="font-semibold text-[#0F2340]">
                Smart Matching Active
              </p>

              <p className="mt-1 text-sm leading-6 text-[#667085]">
                New buyer requests are
                scored and matched
                automatically with
                compatible verified
                professionals.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map(
            (item) => (
              <div
                key={
                  item.label
                }
                className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]"
              >
                <p className="text-[16px] text-[#667085]">
                  {
                    item.label
                  }
                </p>

                <p className="mt-10 text-[48px] font-semibold leading-none text-[#0F2340]">
                  {
                    item.value
                  }
                </p>

                <p className="mt-10 text-[15px] text-[#2E7D32]">
                  {
                    item.sub
                  }
                </p>
              </div>
            ),
          )}
        </div>

        <section className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
          <div className="border-b border-[#E4E7EC] p-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[770px]">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search requests by buyer, source, interest or location..."
                  aria-label="Search buyer requests"
                  className="h-14 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-14 pr-4 text-[17px] text-[#0F2340] outline-none placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="inline-flex h-14 items-center gap-2 rounded-2xl border border-[#D0D5DD] px-5 font-semibold text-[#667085] transition hover:bg-[#F8F9FA]"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setShowFilters(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                  className={`inline-flex h-14 items-center gap-3 rounded-2xl border px-6 text-[18px] font-medium transition ${
                    showFilters ||
                    hasActiveFilters
                      ? "border-[#1B365D] bg-[#EEF3F8] text-[#1B365D]"
                      : "border-[#D0D5DD] text-[#0F2340] hover:bg-[#F8F9FA]"
                  }`}
                >
                  <SlidersHorizontal className="h-5 w-5" />
                  Filters
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-5 grid gap-4 rounded-2xl bg-[#F8F9FA] p-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-[#344054]">
                    Quality
                  </label>

                  <select
                    value={
                      qualityFilter
                    }
                    onChange={(
                      event,
                    ) =>
                      setQualityFilter(
                        event.target
                          .value as LeadQualityFilter,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-[#0F2340] outline-none focus:border-[#1B365D]"
                  >
                    <option value="ALL">
                      All qualities
                    </option>

                    <option value="HOT">
                      HOT
                    </option>

                    <option value="WARM">
                      WARM
                    </option>

                    <option value="COLD">
                      COLD
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#344054]">
                    Status
                  </label>

                  <select
                    value={
                      statusFilter
                    }
                    onChange={(
                      event,
                    ) =>
                      setStatusFilter(
                        event.target
                          .value as LeadStatusFilter,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-[#0F2340] outline-none focus:border-[#1B365D]"
                  >
                    <option value="ALL">
                      All statuses
                    </option>

                    <option value="NEW">
                      NEW
                    </option>

                    <option value="MATCHED">
                      MATCHED
                    </option>

                    <option value="CONTACTED">
                      CONTACTED
                    </option>

                    <option value="CLOSED">
                      CLOSED
                    </option>

                    <option value="LOST">
                      LOST
                    </option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1380px]">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-[14px] font-semibold uppercase tracking-[0.04em] text-[#475467]">
                  <th className="px-7 py-5">
                    Buyer
                  </th>

                  <th className="px-7 py-5">
                    Source
                  </th>

                  <th className="px-7 py-5">
                    Interest
                  </th>

                  <th className="px-7 py-5">
                    Budget
                  </th>

                  <th className="px-7 py-5">
                    Quality
                  </th>

                  <th className="px-7 py-5">
                    Lifecycle
                  </th>

                  <th className="px-7 py-5">
                    Smart Matching
                  </th>

                  <th className="px-7 py-5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EAECF0]">
                {paginatedLeads.map(
                  (
                    lead,
                  ) => {
                    const smartState =
                      getSmartMatchingLabel(
                        lead,
                      );

                    return (
                      <tr
                        key={
                          lead.id
                        }
                        className="transition hover:bg-[#FAFBFC]"
                      >
                        <td className="px-7 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#475467_0%,#D4AF37_100%)] text-[18px] font-semibold text-white">
                              {initials(
                                lead.fullName,
                                lead.email,
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[230px] truncate text-[18px] font-semibold text-[#0F2340]">
                                {lead.fullName ||
                                  "Unnamed buyer"}
                              </p>

                              <p className="max-w-[230px] truncate text-[15px] text-[#667085]">
                                {lead.email ||
                                  "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-7 py-5">
                          <p className="max-w-[190px] text-[17px] text-[#0F2340]">
                            {lead.source ||
                              "-"}
                          </p>

                          <p className="mt-1 text-[14px] text-[#667085]">
                            {formatDate(
                              lead.createdAt,
                            )}
                          </p>
                        </td>

                        <td className="px-7 py-5">
                          <p className="max-w-[230px] text-[17px] text-[#0F2340]">
                            {lead.interest ||
                              "-"}
                          </p>

                          <p className="mt-1 max-w-[230px] truncate text-[14px] text-[#667085]">
                            {lead.location ||
                              "-"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-7 py-5 text-[17px] font-semibold text-[#0F2340]">
                          {lead.budget ||
                            "-"}
                        </td>

                        <td className="px-7 py-5">
                          <span
                            className={`inline-flex rounded-full px-4 py-1.5 text-[14px] font-semibold ${badge(
                              lead.quality,
                            )}`}
                          >
                            {
                              lead.quality
                            }
                          </span>
                        </td>

                        <td className="px-7 py-5">
                          <span
                            className={`inline-flex rounded-full px-4 py-1.5 text-[14px] font-semibold ${badge(
                              lead.status,
                            )}`}
                          >
                            {
                              lead.status
                            }
                          </span>
                        </td>

                        <td className="px-7 py-5">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${smartState.className}`}
                          >
                            <Sparkles className="h-4 w-4" />

                            {
                              smartState.label
                            }
                          </span>
                        </td>

                        <td className="px-7 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedLead(
                                  lead,
                                )
                              }
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4E7EC] text-[#0F2340] transition hover:bg-[#F8F9FA]"
                              title="View request details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>

                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}`}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4E7EC] text-[#0F2340] transition hover:bg-[#F8F9FA]"
                                title="Email buyer"
                              >
                                <Mail className="h-5 w-5" />
                              </a>
                            )}

                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4E7EC] text-[#0F2340] transition hover:bg-[#F8F9FA]"
                                title="Call buyer"
                              >
                                <Phone className="h-5 w-5" />
                              </a>
                            )}

                            <select
                              value={
                                lead.status
                              }
                              disabled={
                                updatingId ===
                                  lead.id ||
                                lead.status ===
                                  "MATCHED"
                              }
                              onChange={(
                                event,
                              ) =>
                                handleUpdateStatus(
                                  lead.id,
                                  event
                                    .target
                                    .value as Lead["status"],
                                )
                              }
                              className="h-10 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                              title={
                                lead.status ===
                                "MATCHED"
                                  ? "MATCHED is managed automatically"
                                  : "Update lifecycle status"
                              }
                            >
                              <option
                                value={
                                  lead.status
                                }
                              >
                                {
                                  lead.status
                                }
                              </option>

                              {lead.status !==
                                "MATCHED" && (
                                <>
                                  <option value="CLOSED">
                                    CLOSED
                                  </option>

                                  <option value="LOST">
                                    LOST
                                  </option>
                                </>
                              )}
                            </select>

                            <button
                              type="button"
                              onClick={() =>
                                requestDeleteLead(
                                  lead,
                                )
                              }
                              disabled={
                                deletingId ===
                                lead.id
                              }
                              className="h-10 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId ===
                              lead.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}

                {filteredLeads.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={
                        8
                      }
                      className="px-7 py-14 text-center"
                    >
                      <UserPlus className="mx-auto h-10 w-10 text-[#98A2B3]" />

                      <p className="mt-4 font-semibold text-[#344054]">
                        No buyer
                        requests found
                      </p>

                      <p className="mt-2 text-sm text-[#667085]">
                        Try another
                        search or
                        clear the
                        active filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredLeads.length >
            0 && (
            <div className="flex flex-col gap-4 border-t border-[#E4E7EC] px-7 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#667085]">
                Showing{" "}
                <span className="font-semibold text-[#0F2340]">
                  {
                    firstVisibleLead
                  }
                </span>{" "}
                to{" "}
                <span className="font-semibold text-[#0F2340]">
                  {
                    lastVisibleLead
                  }
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#0F2340]">
                  {
                    filteredLeads.length
                  }
                </span>{" "}
                requests
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={
                    currentPage ===
                    1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (
                        page,
                      ) =>
                        Math.max(
                          1,
                          page -
                            1,
                        ),
                    )
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                {visiblePages.map(
                  (
                    pageNumber,
                  ) => (
                    <button
                      key={
                        pageNumber
                      }
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          pageNumber,
                        )
                      }
                      className={`h-10 min-w-10 rounded-xl px-3 text-sm font-semibold transition ${
                        currentPage ===
                        pageNumber
                          ? "bg-[#1B365D] text-white"
                          : "border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8F9FA]"
                      }`}
                    >
                      {
                        pageNumber
                      }
                    </button>
                  ),
                )}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (
                        page,
                      ) =>
                        Math.min(
                          totalPages,
                          page +
                            1,
                        ),
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

        {selectedLead && (
          <LeadDetailsDrawer
            lead={
              selectedLead
            }
            deleting={
              deletingId ===
              selectedLead.id
            }
            onClose={() =>
              setSelectedLead(
                null,
              )
            }
            onDelete={() =>
              requestDeleteLead(
                selectedLead,
              )
            }
          />
        )}
      </div>

      {leadToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F2340]/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-lead-title"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
                event.currentTarget &&
              !deletingLead
            ) {
              setLeadToDelete(
                null,
              );
            }
          }}
        >
          <div className="relative w-full max-w-[480px] rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_24px_80px_rgba(15,35,64,0.30)]">
            <button
              type="button"
              disabled={
                deletingLead
              }
              onClick={() =>
                setLeadToDelete(
                  null,
                )
              }
              aria-label="Close delete confirmation"
              className="absolute right-5 top-5 rounded-full p-2 text-[#667085] transition hover:bg-[#F2F4F7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
              <Trash2 className="h-7 w-7" />
            </div>

            <h2
              id="delete-lead-title"
              className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-[#0F2340]"
            >
              Delete this
              request?
            </h2>

            <p className="mt-3 text-[15px] leading-7 text-[#667085]">
              You are about to
              permanently delete{" "}
              <span className="font-semibold text-[#0F2340]">
                {leadToDelete.fullName ||
                  leadToDelete.email ||
                  "this buyer request"}
              </span>
              .
            </p>

            <div className="mt-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4">
              <p className="text-sm font-medium text-[#B42318]">
                This action
                cannot be undone.
              </p>

              <p className="mt-2 text-sm leading-6 text-[#667085]">
                The request and
                its information
                will be permanently
                removed.
              </p>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={
                  deletingLead
                }
                onClick={() =>
                  setLeadToDelete(
                    null,
                  )
                }
                className="h-12 rounded-xl border border-[#D0D5DD] px-6 font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  deletingLead
                }
                onClick={() =>
                  void confirmDeleteLead()
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-6 font-semibold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-5 w-5" />

                {deletingLead
                  ? "Deleting..."
                  : "Delete request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LeadDetailsDrawer({
  lead,
  deleting,
  onClose,
  onDelete,
}: {
  lead: Lead;
  deleting: boolean;
  onClose:
    () => void;
  onDelete:
    () => void;
}) {
  const smartState =
    getSmartMatchingLabel(
      lead,
    );

  return (
    <div
      className="fixed inset-0 z-[80] flex justify-end bg-black/30 backdrop-blur-sm"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <aside className="h-full w-full max-w-[520px] overflow-y-auto bg-white p-8 shadow-[-20px_0_60px_rgba(15,35,64,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
              Buyer request
            </p>

            <h2 className="mt-2 text-3xl font-semibold text-[#0F2340]">
              {lead.fullName ||
                "Unnamed buyer"}
            </h2>

            <p className="mt-2 text-[#667085]">
              {lead.email ||
                "-"}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-full border border-[#E4E7EC] p-2 transition hover:bg-[#F8F9FA]"
            aria-label="Close request details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 rounded-[22px] border border-[#D7E3F0] bg-[#F4F8FC] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B365D] text-white">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p className="font-semibold text-[#0F2340]">
                Smart Matching
              </p>

              <span
                className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${smartState.className}`}
              >
                {
                  smartState.label
                }
              </span>

              <p className="mt-3 text-sm leading-6 text-[#667085]">
                {lead.status ===
                "MATCHED"
                  ? "Compatible verified professionals were selected automatically."
                  : lead.status ===
                      "NEW"
                    ? "The system is automatically looking for compatible verified professionals."
                    : "This request is progressing through its post-matching lifecycle."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#E4E7EC] bg-[#F8F9FA] p-5">
            <p className="text-sm text-[#667085]">
              Quality
            </p>

            <span
              className={`mt-3 inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${badge(
                lead.quality,
              )}`}
            >
              {
                lead.quality
              }
            </span>
          </div>

          <div className="rounded-2xl border border-[#E4E7EC] bg-[#F8F9FA] p-5">
            <p className="text-sm text-[#667085]">
              Status
            </p>

            <span
              className={`mt-3 inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${badge(
                lead.status,
              )}`}
            >
              {
                lead.status
              }
            </span>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <DrawerDetail
            icon={
              Mail
            }
            label="Email"
            value={
              lead.email ||
              "-"
            }
          />

          <DrawerDetail
            icon={
              Phone
            }
            label="Phone"
            value={
              lead.phone ||
              "-"
            }
          />

          <DrawerDetail
            icon={
              BriefcaseBusiness
            }
            label="Interest"
            value={
              lead.interest ||
              "-"
            }
          />

          <DrawerDetail
            icon={
              MapPin
            }
            label="Location"
            value={
              lead.location ||
              "-"
            }
          />

          <DrawerDetail
            icon={
              BriefcaseBusiness
            }
            label="Source"
            value={
              lead.source ||
              "-"
            }
          />

          <DrawerDetail
            icon={
              BriefcaseBusiness
            }
            label="Budget"
            value={
              lead.budget ||
              "-"
            }
          />

          <DrawerDetail
            icon={
              CalendarDays
            }
            label="Created at"
            value={formatDateTime(
              lead.createdAt,
            )}
          />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="flex h-12 items-center justify-center rounded-2xl bg-[#1B365D] font-semibold text-white transition hover:bg-[#10284D]"
            >
              Email Buyer
            </a>
          )}

          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="flex h-12 items-center justify-center rounded-2xl border border-[#D0D5DD] font-semibold text-[#1B365D] transition hover:bg-[#F8F9FA]"
            >
              Call Buyer
            </a>
          )}

          <button
            type="button"
            onClick={
              onDelete
            }
            disabled={
              deleting
            }
            className="flex h-12 items-center justify-center rounded-2xl border border-red-200 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
          >
            {deleting
              ? "Deleting..."
              : "Delete Request"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function DrawerDetail({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ElementType;

  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#E4E7EC] p-5">
      <Icon className="mt-1 h-5 w-5 shrink-0 text-[#1B365D]" />

      <div className="min-w-0">
        <p className="font-semibold text-[#0F2340]">
          {
            label
          }
        </p>

        <p className="mt-1 break-words text-[#667085]">
          {
            value
          }
        </p>
      </div>
    </div>
  );
}

function LeadsPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-12 w-80 animate-pulse rounded-xl bg-[#E9EDF3]" />

        <div className="h-6 w-96 animate-pulse rounded-xl bg-[#E9EDF3]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map(
          (
            _,
            index,
          ) => (
            <div
              key={
                index
              }
              className="h-56 animate-pulse rounded-[28px] bg-[#E9EDF3]"
            />
          ),
        )}
      </div>

      <div className="h-[600px] animate-pulse rounded-[28px] bg-[#E9EDF3]" />
    </div>
  );
}