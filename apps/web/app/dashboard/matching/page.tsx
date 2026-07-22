"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GitBranch,
  Mail,
  Search,
  ShieldX,
  Star,
  Target,
  UserCheck,
  X,
} from "lucide-react";

import type { AuthUser } from "@/lib/auth-api";
import {
  approveMatch,
  getAdminMatches,
  type MatchItem,
  type MatchStatus,
  rejectMatch,
} from "@/lib/matching-api";
import { getStoredUser, getToken } from "@/lib/session";
import { useToast } from "@/components/ui/ToastProvider";

const ITEMS_PER_PAGE = 3;

type StatusFilter = "ALL" | MatchStatus;
type ProcessingAction = "approve" | "reject" | null;

function statusBadge(status: MatchStatus) {
  if (status === "ACTIVE") {
    return "bg-[#DCFCE7] text-[#16A34A]";
  }

  if (status === "CONTACTED") {
    return "bg-[#DBEAFE] text-[#2563EB]";
  }

  if (status === "PENDING") {
    return "bg-[#FEF3C7] text-[#EA580C]";
  }

  if (status === "COMPLETED") {
    return "bg-[#EDE9FE] text-[#7C3AED]";
  }

  if (status === "CANCELLED") {
    return "bg-[#FEE2E2] text-[#EF4444]";
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
    "M"
  );
}

function formatProfessionalType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
}

export default function MatchingPage() {
  const router = useRouter();
  const toast = useToast();

  const user = getStoredUser<AuthUser>();

  const [matches, setMatches] =
    useState<MatchItem[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [loading, setLoading] =
    useState(true);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [
    processingAction,
    setProcessingAction,
  ] = useState<ProcessingAction>(null);

  const [matchToReject, setMatchToReject] =
    useState<MatchItem | null>(null);

  const [rejectingMatch, setRejectingMatch] =
    useState(false);

  useEffect(() => {
    async function loadMatches() {
      const token = getToken();

      if (!token || !user) {
        router.replace("/login");
        return;
      }

      if (user.role !== "ADMIN") {
        router.replace("/access-denied");
        return;
      }

      try {
        setLoading(true);

        const data =
          await getAdminMatches(token);

        setMatches(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load matches.";

        const normalized =
          message.toLowerCase();

        if (
          normalized.includes("401") ||
          normalized.includes("unauthorized")
        ) {
          router.replace("/login");
          return;
        }

        if (
          normalized.includes("403") ||
          normalized.includes("forbidden") ||
          normalized.includes("permission")
        ) {
          router.replace("/access-denied");
          return;
        }

        toast.error(
          "Unable to load matches",
          message,
        );
      } finally {
        setLoading(false);
      }
    }

    void loadMatches();
  }, [router, toast, user?.role]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filteredMatches = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return matches.filter((match) => {
      const matchesSearch =
        !query ||
        [
          match.id,
          match.status,
          match.lead?.fullName,
          match.lead?.email,
          match.lead?.phone,
          match.lead?.interest,
          match.lead?.location,
          match.lead?.budget,
          match.professional.user.fullName,
          match.professional.user.email,
          match.professional.companyName,
          match.professional.professionalType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        match.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [matches, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredMatches.length /
        ITEMS_PER_PAGE,
    ),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedMatches = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredMatches.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [filteredMatches, currentPage]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];

    const startPage = Math.max(
      1,
      currentPage - 2,
    );

    const endPage = Math.min(
      totalPages,
      currentPage + 2,
    );

    for (
      let page = startPage;
      page <= endPage;
      page += 1
    ) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const averageScore =
      matches.length === 0
        ? 0
        : Math.round(
            matches.reduce(
              (total, match) =>
                total + match.score,
              0,
            ) / matches.length,
          );

    return [
      {
        label: "Total Matches",
        value: matches.length,
        icon: GitBranch,
        sub: "All generated matches",
      },
      {
        label: "Pending",
        value: matches.filter(
          (match) =>
            match.status === "PENDING",
        ).length,
        icon: Clock3,
        sub: "Awaiting approval",
      },
      {
        label: "Active",
        value: matches.filter(
          (match) =>
            match.status === "ACTIVE",
        ).length,
        icon: UserCheck,
        sub: "Approved matches",
      },
      {
        label: "Average Score",
        value: `${averageScore}%`,
        icon: Target,
        sub: "Matching quality",
      },
    ];
  }, [matches]);

  const firstVisibleMatch =
    filteredMatches.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleMatch = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredMatches.length,
  );

  async function handleApprove(
    match: MatchItem,
  ) {
    if (match.status !== "PENDING") {
      toast.warning(
        "Action unavailable",
        "Only pending matches can be approved.",
      );
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setProcessingId(match.id);
    setProcessingAction("approve");

    try {
      const updated = await approveMatch(
        token,
        match.id,
      );

      setMatches((currentMatches) =>
        currentMatches.map((item) =>
          item.id === match.id
            ? {
                ...item,
                ...updated,
              }
            : item,
        ),
      );

      toast.success(
        "Match approved",
        "The match is now active.",
      );
    } catch (error) {
      toast.error(
        "Approval failed",
        error instanceof Error
          ? error.message
          : "Unable to approve match.",
      );
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  }

  function requestRejectMatch(
    match: MatchItem,
  ) {
    if (match.status !== "PENDING") {
      toast.warning(
        "Action unavailable",
        "Only pending matches can be rejected.",
      );
      return;
    }

    setMatchToReject(match);
  }

  async function confirmRejectMatch() {
    if (
      !matchToReject ||
      rejectingMatch
    ) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setRejectingMatch(true);
    setProcessingId(matchToReject.id);
    setProcessingAction("reject");

    try {
      const updated = await rejectMatch(
        token,
        matchToReject.id,
      );

      setMatches((currentMatches) =>
        currentMatches.map((item) =>
          item.id === matchToReject.id
            ? {
                ...item,
                ...updated,
              }
            : item,
        ),
      );

      toast.success(
        "Match rejected",
        "The match was cancelled.",
      );

      setMatchToReject(null);
    } catch (error) {
      toast.error(
        "Rejection failed",
        error instanceof Error
          ? error.message
          : "Unable to reject match.",
      );
    } finally {
      setRejectingMatch(false);
      setProcessingId(null);
      setProcessingAction(null);
    }
  }

  if (loading) {
    return <MatchingPageSkeleton />;
  }

  return (
    <>
      <div className="space-y-8">
      <div>
        <h1 className="text-[42px] font-semibold leading-none tracking-[-0.02em] text-[#0F2340] md:text-[52px]">
          Matching System
        </h1>

        <p className="mt-3 text-[18px] text-[#667085]">
          Review and approve
          buyer-professional matches.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF3F8] text-[#1B365D]">
                <Icon className="h-6 w-6" />
              </div>

              <p className="mt-10 text-[48px] font-semibold leading-none text-[#0F2340]">
                {item.value}
              </p>

              <p className="mt-3 text-[18px] text-[#344054]">
                {item.label}
              </p>

              <p className="mt-3 text-[15px] text-[#667085]">
                {item.sub}
              </p>
            </div>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
        <div className="border-b border-[#E4E7EC] p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-[690px]">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by buyer, professional, company or type..."
                aria-label="Search matches"
                className="h-14 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-14 pr-4 text-[17px] text-[#0F2340] outline-none placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  "ALL",
                  "PENDING",
                  "ACTIVE",
                  "CONTACTED",
                  "COMPLETED",
                  "CANCELLED",
                ] as const
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setStatusFilter(status)
                  }
                  className={`h-11 rounded-2xl px-5 text-sm font-semibold transition ${
                    statusFilter === status
                      ? "bg-[#1B365D] text-white"
                      : "border border-[#D0D5DD] bg-white text-[#1B365D] hover:bg-[#F8F9FA]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#EAECF0]">
          {paginatedMatches.map(
            (match) => {
              const isProcessing =
                processingId === match.id;

              const canModerate =
                match.status === "PENDING";

              return (
                <article
                  key={match.id}
                  className="p-7 transition hover:bg-[#FAFBFC]"
                >
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-start gap-5 xl:w-[34%]">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#475467_0%,#D4AF37_100%)] text-[20px] font-semibold text-white">
                        {initials(
                          match.lead?.fullName,
                          match.lead?.email,
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[19px] font-semibold text-[#0F2340]">
                          {match.lead?.fullName ||
                            "Unnamed lead"}
                        </p>

                        <p className="mt-1 truncate text-[15px] text-[#667085]">
                          {match.lead?.email || "-"}
                        </p>

                        <p className="mt-4 text-[16px] text-[#344054]">
                          Interest:{" "}
                          {match.lead?.interest ||
                            "-"}
                        </p>

                        <p className="mt-1 text-[15px] leading-6 text-[#667085]">
                          Budget:{" "}
                          {match.lead?.budget ||
                            "-"}
                          {" • "}
                          Location:{" "}
                          {match.lead?.location ||
                            "-"}
                        </p>

                        <p className="mt-2 text-xs text-[#98A2B3]">
                          Generated{" "}
                          {formatDate(
                            match.createdAt,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 rounded-2xl bg-[#F8FAFC] p-5 xl:w-[31%]">
                      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#667085]">
                        Recommended Professional
                      </p>

                      <p className="text-[18px] font-semibold text-[#0F2340]">
                        {match.professional.user
                          .fullName ||
                          "Unnamed professional"}
                      </p>

                      <p className="text-[15px] text-[#667085]">
                        {formatProfessionalType(
                          match.professional
                            .professionalType,
                        )}
                      </p>

                      <p className="text-[15px] text-[#667085]">
                        {match.professional
                          .companyName ||
                          "Independent professional"}
                      </p>

                      <p className="text-sm text-[#667085]">
                        Rating:{" "}
                        {Number(
                          match.professional.rating ||
                            0,
                        ).toFixed(1)}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-4 xl:w-[35%] xl:items-end">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF7E2] px-4 py-2 text-sm font-semibold text-[#B78103]">
                          <Star className="h-4 w-4 fill-current" />
                          {match.score}%
                        </div>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${statusBadge(
                            match.status,
                          )}`}
                        >
                          {match.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 xl:justify-end">
                        {match.professional.user
                          .email && (
                          <a
                            href={`mailto:${match.professional.user.email}`}
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#1B365D] transition hover:bg-[#F8F9FA]"
                          >
                            <Mail className="h-4 w-4" />
                            Email Pro
                          </a>
                        )}

                        {canModerate ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleApprove(
                                  match,
                                )
                              }
                              disabled={
                                isProcessing
                              }
                              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1B365D] px-4 text-sm font-semibold text-white transition hover:bg-[#10284D] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />

                              {isProcessing &&
                              processingAction ===
                                "approve"
                                ? "Approving..."
                                : "Approve"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                requestRejectMatch(
                                  match,
                                )
                              }
                              disabled={
                                isProcessing
                              }
                              className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <ShieldX className="h-4 w-4" />

                              {isProcessing &&
                              processingAction ===
                                "reject"
                                ? "Rejecting..."
                                : "Reject"}
                            </button>
                          </>
                        ) : (
                          <span className="inline-flex h-11 items-center rounded-xl bg-[#F2F4F7] px-4 text-sm font-semibold text-[#667085]">
                            Moderation completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            },
          )}

          {filteredMatches.length === 0 && (
            <div className="p-14 text-center">
              <GitBranch className="mx-auto h-11 w-11 text-[#98A2B3]" />

              <p className="mt-4 font-semibold text-[#344054]">
                No matches found
              </p>

              <p className="mt-2 text-sm text-[#667085]">
                Try another search or status
                filter.
              </p>
            </div>
          )}
        </div>

        {filteredMatches.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-[#E4E7EC] px-7 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#667085]">
              Showing{" "}
              <span className="font-semibold text-[#0F2340]">
                {firstVisibleMatch}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-[#0F2340]">
                {lastVisibleMatch}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#0F2340]">
                {filteredMatches.length}
              </span>{" "}
              matches
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

              {visiblePages.map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
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
                    {pageNumber}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(
                      totalPages,
                      page + 1,
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
      </div>

      {matchToReject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F2340]/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-match-title"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !rejectingMatch
            ) {
              setMatchToReject(null);
            }
          }}
        >
          <div className="relative w-full max-w-[500px] rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_24px_80px_rgba(15,35,64,0.30)]">
            <button
              type="button"
              disabled={rejectingMatch}
              onClick={() =>
                setMatchToReject(null)
              }
              aria-label="Close rejection confirmation"
              className="absolute right-5 top-5 rounded-full p-2 text-[#667085] transition hover:bg-[#F2F4F7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
              <ShieldX className="h-7 w-7" />
            </div>

            <h2
              id="reject-match-title"
              className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-[#0F2340]"
            >
              Reject this match?
            </h2>

            <p className="mt-3 text-[15px] leading-7 text-[#667085]">
              You are about to reject the match
              between{" "}
              <span className="font-semibold text-[#0F2340]">
                {matchToReject.lead
                  ?.fullName ||
                  "this buyer"}
              </span>{" "}
              and{" "}
              <span className="font-semibold text-[#0F2340]">
                {matchToReject.professional
                  .user.fullName ||
                  matchToReject.professional
                    .companyName ||
                  "this professional"}
              </span>
              .
            </p>

            <div className="mt-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4">
              <p className="text-sm font-medium text-[#B42318]">
                Once rejected:
              </p>

              <p className="mt-2 text-sm leading-6 text-[#667085]">
                The match will be cancelled and
                will no longer be available for
                approval.
              </p>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={rejectingMatch}
                onClick={() =>
                  setMatchToReject(null)
                }
                className="h-12 rounded-xl border border-[#D0D5DD] px-6 font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={rejectingMatch}
                onClick={() =>
                  void confirmRejectMatch()
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-6 font-semibold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldX className="h-5 w-5" />

                {rejectingMatch
                  ? "Rejecting..."
                  : "Reject match"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MatchingPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-12 w-80 animate-pulse rounded-xl bg-[#E9EDF3]" />
        <div className="h-6 w-96 animate-pulse rounded-xl bg-[#E9EDF3]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="h-60 animate-pulse rounded-[28px] bg-[#E9EDF3]"
            />
          ),
        )}
      </div>

      <div className="h-[650px] animate-pulse rounded-[28px] bg-[#E9EDF3]" />
    </div>
  );
}