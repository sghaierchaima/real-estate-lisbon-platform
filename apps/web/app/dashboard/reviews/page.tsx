"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MessageSquareText,
  Search,
  Star,
  X,
} from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";

import type { AuthUser } from "@/lib/auth-api";

import {
  approveReview,
  getAdminReviews,
  rejectReview,
  type AdminReview,
  type ReviewStatus,
} from "@/lib/reviews";

import {
  getSessionUser,
  getStoredUser,
  getToken,
} from "@/lib/session";

const ITEMS_PER_PAGE = 5;

type StatusFilter =
  | "ALL"
  | ReviewStatus;

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  return error instanceof Error &&
    error.message
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

function statusBadge(
  status: ReviewStatus,
) {
  switch (status) {
    case "PENDING":
      return "bg-[#FEF3C7] text-[#B45309]";

    case "APPROVED":
      return "bg-[#DCFCE7] text-[#15803D]";

    case "REJECTED":
      return "bg-[#FEE2E2] text-[#DC2626]";

    default:
      return "bg-[#F2F4F7] text-[#475467]";
  }
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const toast = useToast();

  const storedUser =
    getStoredUser<AuthUser>();

  const [reviews, setReviews] =
    useState<AdminReview[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [approvingId, setApprovingId] =
    useState<string | null>(null);

  const [rejectingId, setRejectingId] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      const token = getToken();
      const sessionUser =
        getSessionUser();

      if (!token || !sessionUser) {
        router.replace("/login");
        return;
      }

      if (
        sessionUser.role !== "ADMIN"
      ) {
        router.replace(
          "/access-denied",
        );
        return;
      }

      try {
        setLoading(true);

        const data =
          await getAdminReviews(token);

        if (!cancelled) {
          setReviews(
            Array.isArray(data)
              ? data
              : [],
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        toast.error(
          "Unable to load reviews",
          getErrorMessage(
            error,
            "An unexpected error occurred.",
          ),
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, [router, toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: reviews.length,

      pending: reviews.filter(
        (review) =>
          review.status ===
          "PENDING",
      ).length,

      approved: reviews.filter(
        (review) =>
          review.status ===
          "APPROVED",
      ).length,

      rejected: reviews.filter(
        (review) =>
          review.status ===
          "REJECTED",
      ).length,
    }),
    [reviews],
  );

  const filteredReviews =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return reviews.filter(
        (review) => {
          const matchesStatus =
            statusFilter === "ALL" ||
            review.status ===
              statusFilter;

          const text = [
            review.buyer.fullName,
            review.buyer.email,

            review.professional.user
              .fullName,

            review.professional.user
              .email,

            review.professional
              .companyName,

            review.professional
              .professionalType,

            review.comment,

            review.status,

            String(review.rating),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !query ||
            text.includes(query);

          return (
            matchesStatus &&
            matchesSearch
          );
        },
      );
    }, [
      reviews,
      search,
      statusFilter,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredReviews.length /
        ITEMS_PER_PAGE,
    ),
  );

  const paginatedReviews =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredReviews.slice(
        start,
        start + ITEMS_PER_PAGE,
      );
    }, [
      filteredReviews,
      currentPage,
    ]);

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  async function handleApprove(
    reviewId: string,
  ) {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (
      approvingId ||
      rejectingId
    ) {
      return;
    }

    setApprovingId(reviewId);

    try {
      const response =
        await approveReview(
          token,
          reviewId,
        );

      setReviews(
        (currentReviews) =>
          currentReviews.map(
            (review) =>
              review.id === reviewId
                ? {
                    ...review,
                    ...response.review,
                    status:
                      "APPROVED",
                  }
                : review,
          ),
      );

      toast.success(
        "Review approved",
        "The review is now publicly visible.",
      );
    } catch (error) {
      toast.error(
        "Approval failed",
        getErrorMessage(
          error,
          "Unable to approve this review.",
        ),
      );
    } finally {
      setApprovingId(null);
    }
  }

  async function handleReject(
    reviewId: string,
  ) {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (
      approvingId ||
      rejectingId
    ) {
      return;
    }

    setRejectingId(reviewId);

    try {
      const response =
        await rejectReview(
          token,
          reviewId,
        );

      setReviews(
        (currentReviews) =>
          currentReviews.map(
            (review) =>
              review.id === reviewId
                ? {
                    ...review,
                    ...response.review,
                    status:
                      "REJECTED",
                  }
                : review,
          ),
      );

      toast.success(
        "Review rejected",
        "The review will not be publicly visible.",
      );
    } catch (error) {
      toast.error(
        "Rejection failed",
        getErrorMessage(
          error,
          "Unable to reject this review.",
        ),
      );
    } finally {
      setRejectingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-14 w-96 animate-pulse rounded-xl bg-[#E9EDF3]" />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="h-52 animate-pulse rounded-[28px] bg-[#E9EDF3]"
            />
          ))}
        </div>

        <div className="h-[500px] animate-pulse rounded-[28px] bg-[#E9EDF3]" />
      </div>
    );
  }

  if (
    storedUser?.role !== "ADMIN"
  ) {
    return null;
  }

  const statCards = [
    {
      label: "Total Reviews",
      value: stats.total,
      icon: MessageSquareText,
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock3,
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: Check,
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: X,
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[42px] font-semibold leading-none tracking-[-0.02em] text-[#0F2340] sm:text-[52px]">
          Reviews Management
        </h1>

        <p className="mt-3 text-[18px] text-[#667085]">
          Review, approve or reject buyer feedback before publication.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <article
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
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
        <div className="border-b border-[#E4E7EC] p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-[600px]">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search by buyer, professional or comment..."
                className="h-14 w-full rounded-2xl border border-[#D0D5DD] pl-14 pr-4 text-[16px] text-[#0F2340] outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  "ALL",
                  "PENDING",
                  "APPROVED",
                  "REJECTED",
                ] as const
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      status,
                    )
                  }
                  className={`h-11 rounded-2xl px-5 text-sm font-semibold ${
                    statusFilter ===
                    status
                      ? "bg-[#1B365D] text-white"
                      : "border border-[#D0D5DD] bg-white text-[#1B365D]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#EAECF0]">
          {paginatedReviews.map(
            (review) => {
              const isApproving =
                approvingId ===
                review.id;

              const isRejecting =
                rejectingId ===
                review.id;

              return (
                <article
                  key={review.id}
                  className="p-7"
                >
                  <div className="grid gap-6 xl:grid-cols-[1fr_1fr_160px_1.4fr_150px_220px] xl:items-center">
                    <div>
                      <p className="text-sm text-[#667085]">
                        Buyer
                      </p>

                      <p className="mt-1 font-semibold text-[#0F2340]">
                        {review.buyer
                          .fullName ||
                          "Unnamed buyer"}
                      </p>

                      <p className="mt-1 text-sm text-[#667085]">
                        {review.buyer.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-[#667085]">
                        Professional
                      </p>

                      <p className="mt-1 font-semibold text-[#0F2340]">
                        {review.professional
                          .user.fullName ||
                          review
                            .professional
                            .companyName ||
                          "Unnamed professional"}
                      </p>

                      <p className="mt-1 text-sm text-[#667085]">
                        {review.professional.professionalType.replaceAll(
                          "_",
                          " ",
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-[#667085]">
                        Rating
                      </p>

                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map(
                          (value) => (
                            <Star
                              key={value}
                              className={`h-4 w-4 ${
                                value <=
                                review.rating
                                  ? "fill-[#D4AF37] text-[#D4AF37]"
                                  : "text-[#D0D5DD]"
                              }`}
                            />
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-[#667085]">
                        Comment
                      </p>

                      <p className="mt-1 line-clamp-3 text-[15px] leading-6 text-[#344054]">
                        {review.comment ||
                          "No comment provided."}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold ${statusBadge(
                          review.status,
                        )}`}
                      >
                        {review.status}
                      </span>

                      <p className="mt-2 text-sm text-[#667085]">
                        {formatDate(
                          review.createdAt,
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      {review.status ===
                      "PENDING" ? (
                        <>
                          <button
                            type="button"
                            disabled={
                              Boolean(
                                approvingId ||
                                  rejectingId,
                              )
                            }
                            onClick={() =>
                              void handleApprove(
                                review.id,
                              )
                            }
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#15803D] px-4 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {isApproving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}

                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={
                              Boolean(
                                approvingId ||
                                  rejectingId,
                              )
                            }
                            onClick={() =>
                              void handleReject(
                                review.id,
                              )
                            }
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#FCA5A5] px-4 text-sm font-semibold text-[#DC2626] disabled:opacity-50"
                          >
                            {isRejecting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}

                            Reject
                          </button>
                        </>
                      ) : (
                        <span
                          className={`rounded-xl px-4 py-3 text-sm font-semibold ${statusBadge(
                            review.status,
                          )}`}
                        >
                          {review.status ===
                          "APPROVED"
                            ? "Approved"
                            : "Rejected"}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            },
          )}

          {filteredReviews.length ===
            0 && (
            <div className="p-12 text-center">
              <MessageSquareText className="mx-auto h-10 w-10 text-[#98A2B3]" />

              <p className="mt-4 font-semibold text-[#344054]">
                No reviews found
              </p>

              <p className="mt-2 text-sm text-[#667085]">
                Try another search or status filter.
              </p>
            </div>
          )}
        </div>

        {filteredReviews.length >
          0 && (
          <div className="flex items-center justify-between border-t border-[#E4E7EC] px-7 py-5">
            <p className="text-sm text-[#667085]">
              Page {currentPage} of{" "}
              {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  currentPage === 1
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        1,
                        page - 1,
                      ),
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                disabled={
                  currentPage ===
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        totalPages,
                        page + 1,
                      ),
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold disabled:opacity-40"
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