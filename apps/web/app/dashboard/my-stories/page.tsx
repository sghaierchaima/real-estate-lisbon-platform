"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Plus,
  Search,
  XCircle,
} from "lucide-react";

import {
  getMyStories,
  type Story,
} from "@/lib/stories-api";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import type { AuthUser } from "@/lib/auth-api";

import {
  getAssetUrl,
} from "@/lib/api";

import {
  useToast,
} from "@/components/ui/ToastProvider";

/* ============================================================
   TYPES
============================================================ */

type StoryFilter =
  | "ALL"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

/* ============================================================
   HELPERS
============================================================ */

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
}

function getStatusConfig(
  status: Story["status"],
) {
  switch (status) {
    case "APPROVED":
      return {
        label: "Published",
        description:
          "Your story has been approved and is visible publicly.",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };

    case "REJECTED":
      return {
        label: "Not published",
        description:
          "Your story was not approved for public publication.",
        className:
          "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
      };

    default:
      return {
        label: "Pending review",
        description:
          "Your story has been submitted and is waiting for admin review.",
        className:
          "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock3,
      };
  }
}

/* ============================================================
   PAGE
============================================================ */

export default function MyStoriesPage() {
  const router = useRouter();
  const toast = useToast();

  const [stories, setStories] =
    useState<Story[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<StoryFilter>("ALL");

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    async function loadStories() {
      const user =
        getStoredUser<AuthUser>();

      if (!user) {
        router.replace("/login");
        return;
      }

      if (
        user.role !== "BUYER"
      ) {
        router.replace(
          "/access-denied",
        );
        return;
      }

      const token =
        getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const data =
          await getMyStories(
            token,
          );

        setStories(data);
      } catch (error) {
        toast.error(
          "Unable to load stories",
          error instanceof Error
            ? error.message
            : "Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStories();
  }, [router, toast]);

  /* ==========================================================
     COUNTERS
  ========================================================== */

  const totalCount =
    stories.length;

  const pendingCount =
    stories.filter(
      (story) =>
        story.status ===
        "PENDING",
    ).length;

  const approvedCount =
    stories.filter(
      (story) =>
        story.status ===
        "APPROVED",
    ).length;

  const rejectedCount =
    stories.filter(
      (story) =>
        story.status ===
        "REJECTED",
    ).length;

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredStories =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return stories.filter(
        (story) => {
          const matchesFilter =
            filter === "ALL" ||
            story.status ===
              filter;

          const searchable =
            [
              story.title,
              story.excerpt,
              story.content,
              story.author,
              story.location,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !query ||
            searchable.includes(
              query,
            );

          return (
            matchesFilter &&
            matchesSearch
          );
        },
      );
    }, [
      stories,
      filter,
      search,
    ]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="text-[#667085]">
        Loading your stories...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <h1 className="text-[42px] font-semibold tracking-[-0.03em] text-[#0F2340] md:text-[48px]">
            My Stories
          </h1>

          <p className="mt-2 text-[17px] text-[#667085]">
            Track the success stories you have submitted.
          </p>
        </div>

        <Link
          href="/stories/submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-5 font-semibold text-white transition hover:bg-[#B8941F]"
        >
          <Plus size={18} />

          Share a New Story
        </Link>

      </div>

      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          icon={
            <FileText
              size={24}
            />
          }
          value={totalCount}
          label="Total Stories"
          subtitle="All your submissions"
        />

        <StatCard
          icon={
            <Clock3
              size={24}
            />
          }
          value={pendingCount}
          label="Pending"
          subtitle="Waiting for admin review"
        />

        <StatCard
          icon={
            <CheckCircle2
              size={24}
            />
          }
          value={approvedCount}
          label="Approved"
          subtitle="Published publicly"
        />

        <StatCard
          icon={
            <XCircle
              size={24}
            />
          }
          value={rejectedCount}
          label="Rejected"
          subtitle="Not published"
        />

      </div>

      {/* ======================================================
          SEARCH + FILTERS
      ====================================================== */}

      <section className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b border-[#EAECF0] p-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full max-w-[620px]">

            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search your stories..."
              className="h-14 w-full rounded-2xl border border-[#D0D5DD] pl-14 pr-5 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
            />

          </div>

          <div className="flex flex-wrap gap-2">

            {(
              [
                "ALL",
                "PENDING",
                "APPROVED",
                "REJECTED",
              ] as StoryFilter[]
            ).map((item) => {

              const count =
                item === "ALL"
                  ? totalCount
                  : item ===
                      "PENDING"
                  ? pendingCount
                  : item ===
                      "APPROVED"
                  ? approvedCount
                  : rejectedCount;

              const active =
                filter === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setFilter(item)
                  }
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "border-[#1B365D] bg-[#1B365D] text-white"
                      : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]"
                  }`}
                >
                  {item === "ALL"
                    ? "All"
                    : item
                        .charAt(0)
                        .toUpperCase() +
                      item
                        .slice(1)
                        .toLowerCase()}

                  <span
                    className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[#F2F4F7] text-[#667085]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

          </div>

        </div>

        {/* ====================================================
            EMPTY STATE
        ==================================================== */}

        {filteredStories.length ===
        0 ? (
          <div className="px-6 py-16 text-center">

            <FileText className="mx-auto h-12 w-12 text-[#98A2B3]" />

            <h2 className="mt-4 text-[22px] font-semibold text-[#0F2340]">
              No stories found
            </h2>

            <p className="mt-2 text-[#667085]">
              {stories.length === 0
                ? "You have not submitted a story yet."
                : "Try another search or status filter."}
            </p>

            {stories.length ===
              0 && (
              <Link
                href="/stories/submit"
                className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-[#1B365D] px-6 font-semibold text-white hover:bg-[#0F2340]"
              >
                Share Your First Story
              </Link>
            )}

          </div>
        ) : (
          /* ==================================================
             STORIES LIST
          ================================================== */

          <div className="divide-y divide-[#EAECF0]">

            {filteredStories.map(
              (story) => {

                const config =
                  getStatusConfig(
                    story.status,
                  );

                const StatusIcon =
                  config.icon;

                return (
                  <article
                    key={story.id}
                    className="p-6 transition hover:bg-[#FCFCFD]"
                  >

                    <div className="grid gap-6 lg:grid-cols-[190px_1fr]">

                      {/* IMAGE */}

                      <div className="overflow-hidden rounded-2xl bg-[#F2F4F7]">

                        <div className="aspect-[4/3]">

                          {story.imageUrl ? (
                            <img
                              src={getAssetUrl(
                                story.imageUrl,
                                "/images/prop1.png",
                              )}
                              alt={
                                story.title
                              }
                              className="h-full w-full object-cover"
                              onError={(
                                event,
                              ) => {
                                event.currentTarget.onerror =
                                  null;

                                event.currentTarget.src =
                                  "/images/prop1.png";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,#F8F9FA,#EEF2F6)] text-[#98A2B3]">

                              <FileText
                                size={34}
                              />

                              <span className="text-xs font-medium">
                                No story image
                              </span>

                            </div>
                          )}

                        </div>

                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0">

                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                          <div>

                            <h2 className="text-[22px] font-semibold text-[#0F2340]">
                              {story.title}
                            </h2>

                            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#667085]">

                              {story.location && (
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin
                                    size={15}
                                  />

                                  {
                                    story.location
                                  }
                                </span>
                              )}

                              <span>
                                {formatDate(
                                  story.createdAt,
                                )}
                              </span>

                            </div>

                          </div>

                          <span
                            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${config.className}`}
                          >
                            <StatusIcon
                              size={15}
                            />

                            {config.label}
                          </span>

                        </div>

                        {/* EXCERPT */}

                        {story.excerpt && (
                          <div className="mt-5 rounded-2xl bg-[#F9FAFB] p-5">

                            <p className="text-xs font-semibold uppercase tracking-[0.09em] text-[#667085]">
                              Short Summary
                            </p>

                            <p className="mt-2 leading-7 text-[#475467]">
                              {story.excerpt}
                            </p>

                          </div>
                        )}

                        {/* STATUS MESSAGE */}

                        <div className="mt-5 rounded-2xl border border-[#EAECF0] p-4">

                          <p className="font-semibold text-[#0F2340]">
                            {config.label}
                          </p>

                          <p className="mt-1 text-sm leading-6 text-[#667085]">
                            {config.description}
                          </p>

                        </div>

                        {/* ACTIONS */}

                        <div className="mt-5 flex flex-wrap gap-3">

                          {story.status ===
                            "APPROVED" && (
                            <Link
                              href={`/stories/${story.id}`}
                              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1B365D] px-5 text-sm font-semibold text-white transition hover:bg-[#0F2340]"
                            >
                              View Public Story
                            </Link>
                          )}

                        </div>

                      </div>

                    </div>

                  </article>
                );
              },
            )}

          </div>
        )}

      </section>

    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  value,
  label,
  subtitle,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#E4E7EC] bg-white p-6 shadow-sm">

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F6FA] text-[#1B365D]">
        {icon}
      </div>

      <p className="mt-6 text-[40px] font-semibold tracking-[-0.03em] text-[#0F2340]">
        {value}
      </p>

      <p className="mt-1 text-[17px] font-medium text-[#0F2340]">
        {label}
      </p>

      <p className="mt-2 text-sm text-[#667085]">
        {subtitle}
      </p>

    </div>
  );
}