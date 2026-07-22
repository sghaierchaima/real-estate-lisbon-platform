"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import type { AuthUser } from "@/lib/auth-api";
import {
  deleteStory,
  getStories,
  type Story,
  type StoryStatus,
  updateStoryStatus,
} from "@/lib/stories-api";
import {
  getStoredUser,
  getToken,
} from "@/lib/session";
import { useToast } from "@/components/ui/ToastProvider";
import { getAssetUrl } from "@/lib/api";

const ITEMS_PER_PAGE = 3;

type StoryFilter =
  | "ALL"
  | StoryStatus;

type ProcessingAction =
  | "approve"
  | "reject"
  | "delete"
  | null;

function statusStyle(status: StoryStatus) {
  switch (status) {
    case "APPROVED":
      return {
        badge:
          "border-green-200 bg-green-50 text-green-700",
        icon: CheckCircle2,
        label: "Approved",
      };

    case "REJECTED":
      return {
        badge:
          "border-red-200 bg-red-50 text-red-700",
        icon: XCircle,
        label: "Rejected",
      };

    case "PENDING":
    default:
      return {
        badge:
          "border-yellow-200 bg-yellow-50 text-yellow-700",
        icon: Clock3,
        label: "Pending",
      };
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
}

function calculateReadingTime(
  content?: string | null,
) {
  const words =
    content
      ?.trim()
      .split(/\s+/)
      .filter(Boolean).length || 0;

  return Math.max(1, Math.ceil(words / 200));
}

export default function StoriesManagementPage() {
  const router = useRouter();
  const toast = useToast();

  const user = getStoredUser<AuthUser>();

  const [stories, setStories] =
    useState<Story[]>([]);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<StoryFilter>("ALL");

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

  const [
    storyToReject,
    setStoryToReject,
  ] = useState<Story | null>(null);

  const [
    storyToDelete,
    setStoryToDelete,
  ] = useState<Story | null>(null);

  const [
    confirmingAction,
    setConfirmingAction,
  ] = useState(false);

  async function loadStories() {
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

      const data = await getStories(token);

      setStories(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load stories.";

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
        "Unable to load stories",
        message,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStories();
  }, [router, user?.role]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const filteredStories = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return stories.filter((story) => {
      const matchesSearch =
        !query ||
        [
          story.title,
          story.excerpt,
          story.content,
          story.author,
          story.location,
          story.status,
          story.user?.fullName,
          story.user?.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "ALL" ||
        story.status === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [stories, search, filter]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStories.length /
        ITEMS_PER_PAGE,
    ),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedStories = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredStories.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [
    filteredStories,
    currentPage,
  ]);

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

  const totals = useMemo(
    () => ({
      all: stories.length,

      pending: stories.filter(
        (story) =>
          story.status === "PENDING",
      ).length,

      approved: stories.filter(
        (story) =>
          story.status === "APPROVED",
      ).length,

      rejected: stories.filter(
        (story) =>
          story.status === "REJECTED",
      ).length,
    }),
    [stories],
  );

  const firstVisibleStory =
    filteredStories.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleStory = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredStories.length,
  );

  async function handleModeration(
    story: Story,
    status: "APPROVED" | "REJECTED",
  ) {
    if (story.status !== "PENDING") {
      toast.warning(
        "Action unavailable",
        "Only pending stories can be moderated.",
      );

      return;
    }

    if (status === "REJECTED") {
      setStoryToReject(story);
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setProcessingId(story.id);

    setProcessingAction(
      status === "APPROVED"
        ? "approve"
        : "reject",
    );

    try {
      const updated =
        await updateStoryStatus(
          token,
          story.id,
          status,
        );

      setStories((currentStories) =>
        currentStories.map((item) =>
          item.id === story.id
            ? {
                ...item,
                ...updated,
                status,
              }
            : item,
        ),
      );

      if (status === "APPROVED") {
        toast.success(
          "Story approved",
          "The story is now published publicly.",
        );
      } else {
        toast.success(
          "Story rejected",
          "The story has been rejected.",
        );
      }
    } catch (error) {
      toast.error(
        status === "APPROVED"
          ? "Approval failed"
          : "Rejection failed",
        error instanceof Error
          ? error.message
          : "Unable to moderate story.",
      );
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  }

  async function confirmRejectStory() {
    if (!storyToReject || confirmingAction) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setConfirmingAction(true);
    setProcessingId(storyToReject.id);
    setProcessingAction("reject");

    try {
      const updated = await updateStoryStatus(
        token,
        storyToReject.id,
        "REJECTED",
      );

      setStories((currentStories) =>
        currentStories.map((item) =>
          item.id === storyToReject.id
            ? { ...item, ...updated, status: "REJECTED" }
            : item,
        ),
      );

      toast.success(
        "Story rejected",
        "The story has been rejected.",
      );
      setStoryToReject(null);
    } catch (error) {
      toast.error(
        "Rejection failed",
        error instanceof Error
          ? error.message
          : "Unable to moderate story.",
      );
    } finally {
      setConfirmingAction(false);
      setProcessingId(null);
      setProcessingAction(null);
    }
  }

  function handleDelete(
    story: Story,
  ) {
    setStoryToDelete(story);
  }

  async function confirmDeleteStory() {
    if (!storyToDelete || confirmingAction) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setConfirmingAction(true);
    setProcessingId(storyToDelete.id);
    setProcessingAction("delete");

    try {
      await deleteStory(token, storyToDelete.id);

      setStories((currentStories) =>
        currentStories.filter(
          (item) => item.id !== storyToDelete.id,
        ),
      );

      toast.success(
        "Story deleted",
        "The story has been removed successfully.",
      );
      setStoryToDelete(null);
    } catch (error) {
      toast.error(
        "Delete failed",
        error instanceof Error
          ? error.message
          : "Unable to delete story.",
      );
    } finally {
      setConfirmingAction(false);
      setProcessingId(null);
      setProcessingAction(null);
    }
  }

  function changePage(page: number) {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (loading) {
    return <StoriesPageSkeleton />;
  }

  return (
    <>
      <div className="space-y-8">
      <header>
        <h1 className="text-[42px] font-semibold leading-none tracking-[-0.03em] text-[#0F2340] md:text-[52px]">
          Stories Management
        </h1>

        <p className="mt-3 text-[18px] text-[#667085]">
          Review, approve, reject and
          manage buyer success stories.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total Stories"
          value={totals.all}
          description="All submitted stories"
          iconClass="bg-[#EEF3F8] text-[#1B365D]"
        />

        <StatCard
          icon={Clock3}
          label="Pending"
          value={totals.pending}
          description="Waiting for review"
          iconClass="bg-yellow-50 text-yellow-600"
        />

        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={totals.approved}
          description="Published publicly"
          iconClass="bg-green-50 text-green-600"
        />

        <StatCard
          icon={XCircle}
          label="Rejected"
          value={totals.rejected}
          description="Not approved for publication"
          iconClass="bg-red-50 text-red-600"
        />
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
        <div className="border-b border-[#E4E7EC] p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-[650px]">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search by title, buyer, location or content..."
                aria-label="Search stories"
                className="h-14 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-14 pr-4 text-[17px] text-[#0F2340] outline-none placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={filter === "ALL"}
                onClick={() =>
                  setFilter("ALL")
                }
                label="All"
                count={totals.all}
              />

              <FilterButton
                active={
                  filter === "PENDING"
                }
                onClick={() =>
                  setFilter("PENDING")
                }
                label="Pending"
                count={totals.pending}
              />

              <FilterButton
                active={
                  filter === "APPROVED"
                }
                onClick={() =>
                  setFilter("APPROVED")
                }
                label="Approved"
                count={totals.approved}
              />

              <FilterButton
                active={
                  filter === "REJECTED"
                }
                onClick={() =>
                  setFilter("REJECTED")
                }
                label="Rejected"
                count={totals.rejected}
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#EAECF0]">
          {paginatedStories.map(
            (story) => {
              const status =
                statusStyle(story.status);

              const StatusIcon =
                status.icon;

              const isProcessing =
                processingId === story.id;

              return (
                <article
                  key={story.id}
                  className="p-6 transition hover:bg-[#FAFBFC]"
                >
                  <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
                    <div className="relative h-[180px] overflow-hidden rounded-2xl bg-[#F2F4F7] lg:h-[220px]">
                      <img
                        src={getAssetUrl(
                          story.imageUrl,
                          "/images/prop1.png",
                        )}
                        alt={story.title}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror =
                            null;

                          event.currentTarget.src =
                            "/images/prop1.png";
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-[21px] font-semibold text-[#0F2340]">
                            {story.title}
                          </h2>

                          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#667085]">
                            <span className="inline-flex items-center gap-2">
                              <UserRound className="h-4 w-4" />

                              {story.author ||
                                story.user
                                  ?.fullName ||
                                "Anonymous buyer"}
                            </span>

                            <span className="inline-flex items-center gap-2">
                              <MapPin className="h-4 w-4" />

                              {story.location ||
                                "Portugal"}
                            </span>

                            <span className="inline-flex items-center gap-2">
                              <CalendarDays className="h-4 w-4" />

                              {formatDate(
                                story.createdAt,
                              )}
                            </span>

                            <span className="inline-flex items-center gap-2">
                              <Clock3 className="h-4 w-4" />

                              {calculateReadingTime(
                                story.content,
                              )}{" "}
                              min read
                            </span>

                            <span className="inline-flex items-center gap-2 font-medium text-[#1B365D]">
                              <ShieldCheck className="h-4 w-4" />
                              Verified buyer
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-[#F8F9FA] p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#667085]">
                          Short summary
                        </p>

                        <p className="mt-2 leading-7 text-[#475467]">
                          {story.excerpt ||
                            "No short summary provided."}
                        </p>
                      </div>

                      <details className="group mt-4 rounded-2xl border border-[#E4E7EC] bg-white">
                        <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-[#1B365D]">
                          <span className="inline-flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
                            Read full story
                          </span>
                        </summary>

                        <div className="border-t border-[#E4E7EC] px-5 py-5">
                          <p className="whitespace-pre-line leading-8 text-[#475467]">
                            {story.content ||
                              "No full content provided."}
                          </p>
                        </div>
                      </details>
                    </div>

                    <div className="flex min-w-[150px] flex-col gap-3 lg:items-end">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.badge}`}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                      </span>

                      <div className="mt-2 flex flex-wrap gap-2 lg:flex-col">
                        {story.status ===
                          "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                void handleModeration(
                                  story,
                                  "APPROVED",
                                )
                              }
                              disabled={
                                isProcessing
                              }
                              className="inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-4 text-sm font-semibold text-white transition hover:bg-[#10284D] disabled:cursor-not-allowed disabled:opacity-50"
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
                                void handleModeration(
                                  story,
                                  "REJECTED",
                                )
                              }
                              disabled={
                                isProcessing
                              }
                              className="inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />

                              {isProcessing &&
                              processingAction ===
                                "reject"
                                ? "Rejecting..."
                                : "Reject"}
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              story,
                            )
                          }
                          disabled={
                            isProcessing
                          }
                          className="inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />

                          {isProcessing &&
                          processingAction ===
                            "delete"
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            },
          )}

          {filteredStories.length === 0 && (
            <div className="px-6 py-20 text-center">
              <FileText className="mx-auto h-14 w-14 text-[#98A2B3]" />

              <h2 className="mt-5 text-2xl font-semibold text-[#0F2340]">
                No stories found
              </h2>

              <p className="mt-2 text-[#667085]">
                Try another search or
                status filter.
              </p>
            </div>
          )}
        </div>

        {filteredStories.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-[#E4E7EC] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#667085]">
              Showing{" "}
              <span className="font-semibold text-[#0F2340]">
                {firstVisibleStory}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-[#0F2340]">
                {lastVisibleStory}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#0F2340]">
                {filteredStories.length}
              </span>{" "}
              stories
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={
                  currentPage === 1
                }
                onClick={() =>
                  changePage(
                    Math.max(
                      1,
                      currentPage - 1,
                    ),
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
                      changePage(
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
                  changePage(
                    Math.min(
                      totalPages,
                      currentPage + 1,
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

      {storyToReject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F2340]/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-story-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !confirmingAction) {
              setStoryToReject(null);
            }
          }}
        >
          <div className="relative w-full max-w-[500px] rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_24px_80px_rgba(15,35,64,0.30)]">
            <button
              type="button"
              disabled={confirmingAction}
              onClick={() => setStoryToReject(null)}
              aria-label="Close rejection confirmation"
              className="absolute right-5 top-5 rounded-full p-2 text-[#667085] transition hover:bg-[#F2F4F7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
              <XCircle className="h-7 w-7" />
            </div>

            <h2 id="reject-story-title" className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-[#0F2340]">
              Reject this story?
            </h2>

            <p className="mt-3 text-[15px] leading-7 text-[#667085]">
              You are about to reject <span className="font-semibold text-[#0F2340]">“{storyToReject.title}”</span>.
            </p>

            <div className="mt-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4">
              <p className="text-sm font-medium text-[#B42318]">Once rejected:</p>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                The story will not be published publicly and its status will be changed to rejected.
              </p>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={confirmingAction} onClick={() => setStoryToReject(null)} className="h-12 rounded-xl border border-[#D0D5DD] px-6 font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-50">
                Cancel
              </button>
              <button type="button" disabled={confirmingAction} onClick={() => void confirmRejectStory()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-6 font-semibold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60">
                <XCircle className="h-5 w-5" />
                {confirmingAction ? "Rejecting..." : "Reject story"}
              </button>
            </div>
          </div>
        </div>
      )}

      {storyToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F2340]/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-story-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !confirmingAction) {
              setStoryToDelete(null);
            }
          }}
        >
          <div className="relative w-full max-w-[500px] rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_24px_80px_rgba(15,35,64,0.30)]">
            <button type="button" disabled={confirmingAction} onClick={() => setStoryToDelete(null)} aria-label="Close delete confirmation" className="absolute right-5 top-5 rounded-full p-2 text-[#667085] transition hover:bg-[#F2F4F7] disabled:cursor-not-allowed disabled:opacity-50">
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
              <Trash2 className="h-7 w-7" />
            </div>

            <h2 id="delete-story-title" className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-[#0F2340]">
              Delete this story?
            </h2>

            <p className="mt-3 text-[15px] leading-7 text-[#667085]">
              You are about to permanently delete <span className="font-semibold text-[#0F2340]">“{storyToDelete.title}”</span>.
            </p>

            <div className="mt-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4">
              <p className="text-sm font-medium text-[#B42318]">This action cannot be undone.</p>
              <p className="mt-2 text-sm leading-6 text-[#667085]">The story and its information will be permanently removed.</p>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={confirmingAction} onClick={() => setStoryToDelete(null)} className="h-12 rounded-xl border border-[#D0D5DD] px-6 font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-50">
                Cancel
              </button>
              <button type="button" disabled={confirmingAction} onClick={() => void confirmDeleteStory()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-6 font-semibold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60">
                <Trash2 className="h-5 w-5" />
                {confirmingAction ? "Deleting..." : "Delete story"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  description: string;
  iconClass: string;
}) {
  return (
    <article className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
      >
        <Icon className="h-6 w-6" />
      </div>

      <p className="mt-8 text-[44px] font-semibold leading-none text-[#0F2340]">
        {value}
      </p>

      <p className="mt-3 text-[17px] font-medium text-[#344054]">
        {label}
      </p>

      <p className="mt-2 text-sm text-[#667085]">
        {description}
      </p>
    </article>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
        active
          ? "bg-[#1B365D] text-white"
          : "border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8F9FA]"
      }`}
    >
      {label}

      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          active
            ? "bg-white/20 text-white"
            : "bg-[#F2F4F7] text-[#667085]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function StoriesPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-12 w-96 animate-pulse rounded-xl bg-[#E9EDF3]" />

        <div className="h-6 w-[520px] max-w-full animate-pulse rounded-xl bg-[#E9EDF3]" />
      </div>

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

      <div className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white">
        <div className="h-24 animate-pulse border-b border-[#E4E7EC] bg-[#F8F9FA]" />

        {Array.from({
          length: 3,
        }).map((_, index) => (
          <div
            key={index}
            className="grid gap-6 border-b border-[#E4E7EC] p-6 lg:grid-cols-[220px_1fr_150px]"
          >
            <div className="h-[220px] animate-pulse rounded-2xl bg-[#E9EDF3]" />

            <div className="space-y-4">
              <div className="h-7 w-2/3 animate-pulse rounded-lg bg-[#E9EDF3]" />

              <div className="h-5 w-1/2 animate-pulse rounded-lg bg-[#E9EDF3]" />

              <div className="h-28 animate-pulse rounded-2xl bg-[#E9EDF3]" />
            </div>

            <div className="space-y-3">
              <div className="h-9 animate-pulse rounded-xl bg-[#E9EDF3]" />

              <div className="h-11 animate-pulse rounded-xl bg-[#E9EDF3]" />

              <div className="h-11 animate-pulse rounded-xl bg-[#E9EDF3]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}