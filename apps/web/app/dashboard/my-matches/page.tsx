"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  UserCheck,
  X,
} from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";
import type { AuthUser } from "@/lib/auth-api";
import {
  getMyBuyerMatches,
  getMyProfessionalMatches,
  markMatchCompleted,
  markMatchContacted,
  type MatchItem,
  type MatchStatus,
} from "@/lib/matching-api";
import {
  getSessionUser,
  getStoredUser,
  getToken,
} from "@/lib/session";
import {  createReview,} from "@/lib/reviews";

const ITEMS_PER_PAGE = 3;

type StatusFilter = "ALL" | MatchStatus;

function statusBadge(status: MatchStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-[#DCFCE7] text-[#16A34A]";

    case "CONTACTED":
      return "bg-[#DBEAFE] text-[#2563EB]";

    case "PENDING":
      return "bg-[#FEF3C7] text-[#EA580C]";

    case "COMPLETED":
      return "bg-[#EDE9FE] text-[#7C3AED]";

    case "CANCELLED":
      return "bg-[#FEE2E2] text-[#EF4444]";

    default:
      return "bg-[#F3F4F6] text-[#475467]";
  }
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

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
}

export default function MyMatchesPage() {
  const router = useRouter();
  const toast = useToast();

  const storedUser = getStoredUser<AuthUser>();

  const isProfessional =
    storedUser?.role === "PROFESSIONAL";

  const isBuyer =
    storedUser?.role === "BUYER";

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

  const [contactingId, setContactingId] =
    useState<string | null>(null);

  const [matchToComplete, setMatchToComplete] =
    useState<MatchItem | null>(null);

  const [completingId, setCompletingId] =
      useState<string | null>(null);
  const [matchToReview, setMatchToReview] =
  useState<MatchItem | null>(null);

const [rating, setRating] =
  useState(0);

const [comment, setComment] =
  useState("");

const [submittingReview, setSubmittingReview] =
  useState(false);


  

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      const token = getToken();
      const sessionUser = getSessionUser();

      if (!token || !sessionUser) {
        if (!cancelled) {
          router.replace("/login");
        }

        return;
      }

      try {
        setLoading(true);

        let data: MatchItem[];

        if (sessionUser.role === "BUYER") {
          data =
            await getMyBuyerMatches(token);
        } else if (
          sessionUser.role === "PROFESSIONAL"
        ) {
          data =
            await getMyProfessionalMatches(
              token,
            );
        } else {
          if (!cancelled) {
            router.replace(
              "/access-denied",
            );
          }

          return;
        }

        if (!cancelled) {
          setMatches(
            Array.isArray(data) ? data : [],
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = getErrorMessage(
          error,
          "Unable to load matches.",
        );

        const normalizedMessage =
          message.toLowerCase();

        if (
          normalizedMessage.includes("401") ||
          normalizedMessage.includes(
            "unauthorized",
          )
        ) {
          router.replace("/login");
          return;
        }

        if (
          normalizedMessage.includes("403") ||
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
          "Unable to load matches",
          message,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMatches();

    return () => {
      cancelled = true;
    };
  }, [router, toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filteredMatches = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return matches.filter((match) => {
      const professionalName =
        match.professional.user.fullName;

      const professionalEmail =
        match.professional.user.email;

      const matchesSearch =
        !query ||
        [
          match.lead?.fullName,
          match.lead?.email,
          match.lead?.phone,
          match.lead?.interest,
          match.lead?.location,
          match.lead?.budget,
          match.professional.companyName,
          match.professional.professionalType,
          professionalName,
          professionalEmail,
          match.status,
          String(match.score),
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

  const stats = useMemo(
    () => [
      {
        label: "Total Matches",
        value: matches.length,
        sub: isProfessional
          ? "Assigned to your profile"
          : "Matched with your requests",
      },
      {
        label: "Pending",
        value: matches.filter(
          (match) =>
            match.status === "PENDING",
        ).length,
        sub: "Waiting admin approval",
      },
      {
        label: isProfessional
          ? "Contacted"
          : "Active",
        value: matches.filter((match) =>
          isProfessional
            ? match.status === "CONTACTED"
            : match.status === "ACTIVE",
        ).length,
        sub: isProfessional
          ? "Buyer follow-ups started"
          : "Ready for professional contact",
      },
      {
        label: "Average Score",
        value:
          matches.length > 0
            ? `${Math.round(
                matches.reduce(
                  (sum, match) =>
                    sum + match.score,
                  0,
                ) / matches.length,
              )}%`
            : "0%",
        sub: "Matching quality",
      },
    ],
    [isProfessional, matches],
  );

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

  async function handleMarkContacted(
    id: string,
  ) {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (contactingId || completingId) {
      return;
    }

    setContactingId(id);

    try {
      const updated =
        await markMatchContacted(
          token,
          id,
        );

      setMatches((currentMatches) =>
        currentMatches.map((match) =>
          match.id === id
            ? {
                ...match,
                ...updated,
              }
            : match,
        ),
      );

      toast.success(
        "Buyer contacted",
        "This match has been moved to CONTACTED.",
      );
    } catch (error) {
      toast.error(
        "Action failed",
        getErrorMessage(
          error,
          "Unable to update match.",
        ),
      );
    } finally {
      setContactingId(null);
    }
  }

  function handleMarkCompleted(
    match: MatchItem,
  ) {
    if (contactingId || completingId) {
      return;
    }

    setMatchToComplete(match);
  }

  function handleOpenReview(
  match: MatchItem,
) {
  if (
    !isBuyer ||
    match.status !== "COMPLETED" ||
    match.review
  ) {
    return;
  }

  setMatchToReview(match);
  setRating(0);
  setComment("");
}
  function handleCloseReview() {
  if (submittingReview) {
    return;
  }

  setMatchToReview(null);
  setRating(0);
  setComment("");
}

  async function confirmMarkCompleted() {
    if (!matchToComplete) {
      return;
    }

    const token = getToken();

    if (!token) {
      setMatchToComplete(null);
      router.replace("/login");
      return;
    }

    if (contactingId || completingId) {
      return;
    }

    const matchId = matchToComplete.id;

    setCompletingId(matchId);

    try {
      const updated =
        await markMatchCompleted(
          token,
          matchId,
        );

      setMatches((currentMatches) =>
        currentMatches.map((match) =>
          match.id === matchId
            ? {
                ...match,
                ...updated,
                status: "COMPLETED",
              }
            : match,
        ),
      );

      setMatchToComplete(null);

      toast.success(
        "Match completed",
        "This buyer match has been marked as completed.",
      );
    } catch (error) {
      toast.error(
        "Action failed",
        getErrorMessage(
          error,
          "Unable to complete match.",
        ),
      );
    } finally {
      setCompletingId(null);
    }
  }

  async function handleSubmitReview() {
  if (!matchToReview) {
    return;
  }

  if (rating < 1 || rating > 5) {
    toast.error(
      "Rating required",
      "Please select a rating between 1 and 5 stars.",
    );
    return;
  }

  const token = getToken();

  if (!token) {
    setMatchToReview(null);
    router.replace("/login");
    return;
  }

  if (submittingReview) {
    return;
  }

  setSubmittingReview(true);

  try {
    const response = await createReview(
      token,
      {
        matchId: matchToReview.id,
        rating,
        comment:
          comment.trim() || undefined,
      },
    );

    setMatches((currentMatches) =>
      currentMatches.map((match) =>
        match.id === matchToReview.id
          ? {
              ...match,
              review: response.review,
            }
          : match,
      ),
    );

    toast.success(
  "Review submitted",
  "Your review is waiting for administrator approval.",
);

    setMatchToReview(null);
    setRating(0);
    setComment("");
  } catch (error) {
    toast.error(
      "Unable to submit review",
      getErrorMessage(
        error,
        "Please try again.",
      ),
    );
  } finally {
    setSubmittingReview(false);
  }
}

  if (loading) {
    return <MyMatchesSkeleton />;
  }

  if (!isProfessional && !isBuyer) {
    return null;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[42px] font-semibold leading-none tracking-[-0.02em] text-[#0F2340] sm:text-[52px]">
          My Matches
        </h1>

        <p className="mt-3 text-[18px] text-[#667085]">
          {isProfessional
            ? "Review buyer leads matched with your professional profile."
            : "Review professionals matched with your buyer requests."}
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article
            key={item.label}
            className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF3F8] text-[#1B365D]">
              <UserCheck className="h-6 w-6" />
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
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
        <div className="border-b border-[#E4E7EC] p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-[650px]">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder={
                  isProfessional
                    ? "Search by buyer, email, interest or location..."
                    : "Search by professional, company, type or status..."
                }
                aria-label="Search my matches"
                className="h-14 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-14 pr-4 text-[17px] text-[#0F2340] outline-none transition placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
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
              const isContacting =
                contactingId === match.id;

              const isCompleting =
                completingId === match.id;

              const actionInProgress =
                Boolean(
                  contactingId ||
                    completingId,
                );

              const displayName =
                isProfessional
                  ? match.lead?.fullName ||
                    "Unnamed buyer"
                  : match.professional.user
                      .fullName ||
                    match.professional
                      .companyName ||
                    "Unnamed professional";

              const displayEmail =
                isProfessional
                  ? match.lead?.email
                  : match.professional.user
                      .email;

              return (
                <article
                  key={match.id}
                  className="p-7 transition hover:bg-[#FAFBFC]"
                >
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-start gap-5 xl:w-[38%]">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#475467_0%,#D4AF37_100%)] text-[20px] font-semibold text-white">
                        {initials(
                          displayName,
                          displayEmail,
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[19px] font-semibold text-[#0F2340]">
                          {displayName}
                        </p>

                        <p className="mt-1 break-all text-[15px] text-[#667085]">
                          {isProfessional &&
                          match.status ===
                            "PENDING"
                            ? "Contact details available after approval"
                            : displayEmail || "-"}
                        </p>

                        {isProfessional ? (
                          <div className="mt-4 grid gap-2 text-[15px] text-[#667085]">
                            <InfoLine
                              icon={
                                BriefcaseBusiness
                              }
                              value={
                                match.lead
                                  ?.interest ||
                                "-"
                              }
                            />

                            <InfoLine
                              icon={MapPin}
                              value={
                                match.lead
                                  ?.location ||
                                "-"
                              }
                            />

                            <InfoLine
                              icon={
                                CalendarDays
                              }
                              value={formatDate(
                                match.createdAt,
                              )}
                            />
                          </div>
                        ) : (
                          <div className="mt-4 grid gap-2 text-[15px] text-[#667085]">
                            <InfoLine
                              icon={
                                BriefcaseBusiness
                              }
                              value={match.professional.professionalType.replaceAll(
                                "_",
                                " ",
                              )}
                            />

                            <InfoLine
                              icon={MapPin}
                              value={
                                match.professional
                                  .companyName ||
                                "Independent professional"
                              }
                            />

                            <InfoLine
                              icon={
                                CalendarDays
                              }
                              value={formatDate(
                                match.createdAt,
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#F8FAFC] p-5 xl:min-w-[260px]">
                      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#667085]">
                        Match Score
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF7E2] px-4 py-2 text-sm font-semibold text-[#B78103]">
                          <Star className="h-4 w-4 fill-current" />
                          {match.score}%
                        </span>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${statusBadge(
                            match.status,
                          )}`}
                        >
                          {match.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 xl:items-end">
  {isProfessional ? (
    <ProfessionalActions
      match={match}
      isContacting={
        isContacting
      }
      isCompleting={
        isCompleting
      }
      actionInProgress={
        actionInProgress
      }
      onContact={() =>
        void handleMarkContacted(
          match.id,
        )
      }
      onComplete={() =>
        handleMarkCompleted(
          match,
        )
      }
    />
  ) : (
    <BuyerMatchActions
      match={match}
      onReview={() =>
        handleOpenReview(match)
      }
    />
  )}
</div>
                  </div>
                </article>
              );
            },
          )}

          {filteredMatches.length === 0 && (
            <div className="p-12 text-center">
              <UserCheck className="mx-auto h-10 w-10 text-[#98A2B3]" />

              <p className="mt-4 font-semibold text-[#344054]">
                {matches.length === 0
                  ? "No matches assigned yet"
                  : "No matches found"}
              </p>

              <p className="mt-2 text-sm text-[#667085]">
                {matches.length === 0
                  ? "Your matches will appear here when they become available."
                  : "Try another search or status filter."}
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
                  currentPage ===
                  totalPages
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

      {matchToComplete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-match-title"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !completingId
            ) {
              setMatchToComplete(null);
            }
          }}
        >
          <div className="w-full max-w-[500px] overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_24px_80px_rgba(15,35,64,0.28)]">
            <div className="flex items-start justify-between gap-5 border-b border-[#EAECF0] px-7 py-6">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F3FF] text-[#7C3AED]">
                  <UserCheck className="h-6 w-6" />
                </div>

                <h2
                  id="complete-match-title"
                  className="mt-5 text-[24px] font-semibold tracking-[-0.01em] text-[#0F2340]"
                >
                  Complete this match?
                </h2>

                <p className="mt-2 text-[15px] leading-6 text-[#667085]">
                  This action will mark the buyer match as
                  completed. The status will be updated
                  immediately.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close confirmation modal"
                disabled={Boolean(completingId)}
                onClick={() =>
                  setMatchToComplete(null)
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#667085] transition hover:bg-[#F2F4F7] hover:text-[#0F2340] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-7 py-5">
              <div className="rounded-2xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
                <p className="text-sm font-medium text-[#667085]">
                  Match
                </p>

                <p className="mt-1 text-[17px] font-semibold text-[#0F2340]">
                  {matchToComplete.lead?.fullName ||
                    "Unnamed buyer"}
                </p>

                {matchToComplete.lead?.interest && (
                  <p className="mt-1 text-sm text-[#667085]">
                    {
                      matchToComplete.lead
                        .interest
                    }
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#EAECF0] px-7 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={Boolean(completingId)}
                onClick={() =>
                  setMatchToComplete(null)
                }
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={Boolean(completingId)}
                onClick={() =>
                  void confirmMarkCompleted()
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {completingId && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {completingId
                  ? "Completing..."
                  : "Complete Match"}
              </button>
            </div>
          </div>
        </div>
      )}

      {matchToReview && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-[2px]"
    role="dialog"
    aria-modal="true"
    aria-labelledby="review-modal-title"
    onMouseDown={(event) => {
      if (
        event.target === event.currentTarget &&
        !submittingReview
      ) {
        handleCloseReview();
      }
    }}
  >
    <div className="w-full max-w-[560px] overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_24px_80px_rgba(15,35,64,0.28)]">
      <div className="flex items-start justify-between gap-5 border-b border-[#EAECF0] px-7 py-6">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF7E2] text-[#B78103]">
            <Star className="h-6 w-6 fill-current" />
          </div>

          <h2
            id="review-modal-title"
            className="mt-5 text-[24px] font-semibold tracking-[-0.01em] text-[#0F2340]"
          >
            Rate your experience
          </h2>

          <p className="mt-2 text-[15px] leading-6 text-[#667085]">
            Share your experience with{" "}
            <span className="font-semibold text-[#0F2340]">
              {matchToReview.professional.user
                .fullName ||
                matchToReview.professional
                  .companyName ||
                "this professional"}
            </span>
            .
          </p>
        </div>

        <button
          type="button"
          aria-label="Close review modal"
          disabled={submittingReview}
          onClick={handleCloseReview}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#667085] transition hover:bg-[#F2F4F7] hover:text-[#0F2340] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6 px-7 py-6">
        <div>
          <p className="text-[15px] font-semibold text-[#0F2340]">
            Your rating
          </p>

          <div className="mt-4 flex gap-3">
            {[1, 2, 3, 4, 5].map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  disabled={submittingReview}
                  onClick={() =>
                    setRating(value)
                  }
                  aria-label={`Rate ${value} out of 5`}
                  className="rounded-xl p-1 transition hover:scale-110 disabled:cursor-not-allowed"
                >
                  <Star
                    className={`h-9 w-9 transition ${
                      value <= rating
                        ? "fill-[#D4AF37] text-[#D4AF37]"
                        : "text-[#D0D5DD]"
                    }`}
                  />
                </button>
              ),
            )}
          </div>

          <p className="mt-3 text-sm text-[#667085]">
            {rating === 0
              ? "Select between 1 and 5 stars."
              : `${rating} out of 5 stars`}
          </p>
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="text-[15px] font-semibold text-[#0F2340]"
          >
            Comment{" "}
            <span className="font-normal text-[#98A2B3]">
              (optional)
            </span>
          </label>

          <textarea
            id="review-comment"
            value={comment}
            disabled={submittingReview}
            maxLength={1000}
            rows={5}
            onChange={(event) =>
              setComment(event.target.value)
            }
            placeholder="Tell us about your experience with this professional..."
            className="mt-3 w-full resize-none rounded-2xl border border-[#D0D5DD] bg-white px-4 py-3 text-[15px] leading-6 text-[#0F2340] outline-none transition placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10 disabled:bg-[#F8F9FA]"
          />

          <p className="mt-2 text-right text-xs text-[#98A2B3]">
            {comment.length}/1000
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-[#EAECF0] px-7 py-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={submittingReview}
          onClick={handleCloseReview}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={
            submittingReview ||
            rating < 1
          }
          onClick={() =>
            void handleSubmitReview()
          }
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-sm font-semibold text-white transition hover:bg-[#B89222] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submittingReview ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Star className="h-4 w-4 fill-current" />
          )}

          {submittingReview
            ? "Submitting..."
            : "Submit Review"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

function InfoLine({
  icon: Icon,
  value,
}: {
  icon: React.ElementType;
  value: string;
}) {
  return (
    <p className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-[#1B365D]" />
      <span>{value}</span>
    </p>
  );
}

function ProfessionalActions({
  match,
  isContacting,
  isCompleting,
  actionInProgress,
  onContact,
  onComplete,
}: {
  match: MatchItem;
  isContacting: boolean;
  isCompleting: boolean;
  actionInProgress: boolean;
  onContact: () => void;
  onComplete: () => void;
}) {
  if (match.status === "ACTIVE") {
    return (
      <div className="flex flex-wrap gap-3 xl:justify-end">
        {match.lead?.email && (
          <a
            href={`mailto:${match.lead.email}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1B365D] px-4 text-sm font-semibold text-white transition hover:bg-[#142A49]"
          >
            <Mail className="h-4 w-4" />
            Email Buyer
          </a>
        )}

        {match.lead?.phone && (
          <a
            href={`tel:${match.lead.phone}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#1B365D] transition hover:bg-[#F8FAFC]"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
        )}

        <button
          type="button"
          onClick={onContact}
          disabled={actionInProgress}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#1B365D] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isContacting && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}

          {isContacting
            ? "Updating..."
            : "Mark Contacted"}
        </button>
      </div>
    );
  }

  if (match.status === "CONTACTED") {
    return (
      <button
        type="button"
        onClick={onComplete}
        disabled={actionInProgress}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#7C3AED] px-4 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCompleting && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {isCompleting
          ? "Completing..."
          : "Complete Match"}
      </button>
    );
  }

  const messages: Record<
    MatchStatus,
    string
  > = {
    PENDING:
      "Waiting for admin approval before contact.",
    ACTIVE: "",
    CONTACTED: "",
    COMPLETED:
      "This match has been completed.",
    CANCELLED:
      "This match has been cancelled.",
  };

  return (
    <p
      className={`rounded-2xl border px-4 py-3 text-sm ${
        match.status === "CANCELLED"
          ? "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
          : match.status === "COMPLETED"
            ? "border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED]"
            : "border-[#E4E7EC] bg-[#F8F9FA] text-[#667085]"
      }`}
    >
      {messages[match.status]}
    </p>
  );
}

function BuyerMatchActions({
  match,
  onReview,
}: {
  match: MatchItem;
  onReview: () => void;
}) {
  const messages: Record<
    MatchStatus,
    string
  > = {
    PENDING:
      "Waiting for administrator approval.",

    ACTIVE:
      "Your matched professional will contact you soon.",

    CONTACTED:
      "Your professional has contacted you. Check Messages.",

    COMPLETED:
      "This match has been completed.",

    CANCELLED:
      "This match has been cancelled.",
  };

  /*
   * Match terminé mais aucun avis envoyé.
   */
  if (
    match.status === "COMPLETED" &&
    !match.review
  ) {
    return (
      <div className="flex flex-col gap-3 xl:items-end">
        <p className="rounded-2xl border border-[#DDD6FE] bg-[#F5F3FF] px-4 py-3 text-sm text-[#7C3AED]">
          This match has been completed.
        </p>

        <button
          type="button"
          onClick={onReview}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-sm font-semibold text-white transition hover:bg-[#B89222]"
        >
          <Star className="h-4 w-4" />
          Leave Review
        </button>
      </div>
    );
  }

  /*
   * Avis envoyé, mais pas encore modéré.
   */
  if (
    match.status === "COMPLETED" &&
    match.review?.status === "PENDING"
  ) {
    return (
      <div className="flex flex-col gap-3 xl:items-end">
        <p className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm font-semibold text-[#B45309]">
          Review submitted
        </p>

        <p className="text-sm text-[#667085]">
          Pending administrator approval.
        </p>
      </div>
    );
  }

  /*
   * Avis approuvé par l’administrateur.
   */
  if (
    match.status === "COMPLETED" &&
    match.review?.status === "APPROVED"
  ) {
    return (
      <div className="flex flex-col gap-3 xl:items-end">
        <p className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-semibold text-[#15803D]">
          Review approved
        </p>

        <div
          className="inline-flex items-center gap-1"
          aria-label={`${match.review.rating} out of 5 stars`}
        >
          {[1, 2, 3, 4, 5].map(
            (value) => (
              <Star
                key={value}
                className={`h-4 w-4 ${
                  value <=
                  match.review!.rating
                    ? "fill-[#D4AF37] text-[#D4AF37]"
                    : "text-[#D0D5DD]"
                }`}
              />
            ),
          )}
        </div>
      </div>
    );
  }

  /*
   * Avis rejeté par l’administrateur.
   */
  if (
    match.status === "COMPLETED" &&
    match.review?.status === "REJECTED"
  ) {
    return (
      <div className="flex flex-col gap-3 xl:items-end">
        <p className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#DC2626]">
          Review rejected
        </p>

        <p className="text-sm text-[#667085]">
          This review is not publicly visible.
        </p>
      </div>
    );
  }

  /*
   * Autres statuts du match.
   */
  return (
    <p
      className={`rounded-2xl border px-4 py-3 text-sm ${
        match.status === "CANCELLED"
          ? "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
          : match.status === "ACTIVE"
            ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
            : match.status === "CONTACTED"
              ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
              : "border-[#E4E7EC] bg-[#F8F9FA] text-[#667085]"
      }`}
    >
      {messages[match.status]}
    </p>
  );
}

function MyMatchesSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-12 w-72 animate-pulse rounded-xl bg-[#E9EDF3]" />
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

      <div className="h-[600px] animate-pulse rounded-[28px] bg-[#E9EDF3]" />
    </div>
  );
}