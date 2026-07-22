"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Search,
  UserRound,
} from "lucide-react";

import {
  getChatRooms,
  type ChatRoom,
} from "@/lib/chat-api";
import {
  getStoredUser,
  getToken,
} from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { useToast } from "@/components/ui/ToastProvider";

const ITEMS_PER_PAGE = 3;

type ConversationFilter =
  | "ALL"
  | "UNREAD"
  | "READ"
  | "EMPTY";

function getInitial(
  name?: string | null,
  email?: string | null,
) {
  return (
    name?.trim().charAt(0).toUpperCase() ||
    email?.trim().charAt(0).toUpperCase() ||
    "C"
  );
}

function formatProfessionalType(
  value?: string | null,
) {
  if (!value) {
    return "Professional";
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function timeAgo(date?: string | null) {
  if (!date) {
    return "No activity yet";
  }

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) {
    return "Unknown date";
  }

  const difference =
    Date.now() - timestamp;

  const minutes = Math.floor(
    difference / 60000,
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours} hour${
      hours > 1 ? "s" : ""
    } ago`;
  }

  const days = Math.floor(
    hours / 24,
  );

  if (days < 30) {
    return `${days} day${
      days > 1 ? "s" : ""
    } ago`;
  }

  return new Date(date).toLocaleDateString();
}

function getLastMessage(room: ChatRoom) {
  if (!room.messages?.length) {
    return null;
  }

  return [...room.messages].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  )[0];
}

function getUnreadCount(
  room: ChatRoom,
  currentUserId?: string,
) {
  if (!currentUserId) {
    return 0;
  }

  return room.messages.filter(
    (message) =>
      !message.isRead &&
      message.senderId !== currentUserId,
  ).length;
}

export default function MessagesPage() {
  const router = useRouter();
  const toast = useToast();

  const currentUser =
    getStoredUser<AuthUser>();

  const [rooms, setRooms] =
    useState<ChatRoom[]>([]);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<ConversationFilter>("ALL");

  const [loading, setLoading] =
    useState(true);

  const [currentPage, setCurrentPage] =
    useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadRooms() {
      const token = getToken();

      if (!token || !currentUser) {
        router.replace("/login");
        return;
      }

      if (
        currentUser.role !== "BUYER" &&
        currentUser.role !== "PROFESSIONAL"
      ) {
        router.replace("/access-denied");
        return;
      }

      try {
        setLoading(true);

        const data =
          await getChatRooms(token);

        if (!cancelled) {
          setRooms(
            Array.isArray(data)
              ? data
              : [],
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load conversations.";

        const normalized =
          message.toLowerCase();

        if (
          normalized.includes("401") ||
          normalized.includes(
            "unauthorized",
          )
        ) {
          router.replace("/login");
          return;
        }

        if (
          normalized.includes("403") ||
          normalized.includes(
            "forbidden",
          ) ||
          normalized.includes(
            "permission",
          )
        ) {
          router.replace(
            "/access-denied",
          );
          return;
        }

        toast.error(
          "Unable to load messages",
          message,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRooms();

    return () => {
      cancelled = true;
    };
  }, [
    router,
    toast,
    currentUser?.role,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const roomSummaries = useMemo(() => {
    return rooms.map((room) => {
      const lastMessage =
        getLastMessage(room);

      const unreadCount =
        getUnreadCount(
          room,
          currentUser?.id,
        );

      const isProfessional =
        currentUser?.role ===
        "PROFESSIONAL";

      const displayName =
        isProfessional
          ? room.match.lead?.fullName ||
            room.match.buyer?.fullName ||
            room.match.buyer?.email ||
            "Buyer"
          : room.match.professional.user
              .fullName ||
            room.match.professional
              .companyName ||
            room.match.professional.user
              .email ||
            "Professional";

      const displayEmail =
        isProfessional
          ? room.match.lead?.email ||
            room.match.buyer?.email ||
            null
          : room.match.professional.user
              .email;

      const location =
        room.match.lead?.location ||
        "Portugal";

      const budget =
        room.match.lead?.budget ||
        "Budget not specified";

      return {
        room,
        lastMessage,
        unreadCount,
        displayName,
        displayEmail,
        location,
        budget,
      };
    });
  }, [
    rooms,
    currentUser?.id,
    currentUser?.role,
  ]);

  const stats = useMemo(() => {
    const unreadConversations =
      roomSummaries.filter(
        (item) =>
          item.unreadCount > 0,
      ).length;

    const readConversations =
      roomSummaries.filter(
        (item) =>
          item.lastMessage &&
          item.unreadCount === 0,
      ).length;

    const emptyConversations =
      roomSummaries.filter(
        (item) =>
          !item.lastMessage,
      ).length;

    return {
      total: roomSummaries.length,
      unread: unreadConversations,
      read: readConversations,
      empty: emptyConversations,
    };
  }, [roomSummaries]);

  const filteredRooms = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return roomSummaries.filter(
      (item) => {
        const matchesFilter =
          filter === "ALL" ||
          (filter === "UNREAD" &&
            item.unreadCount > 0) ||
          (filter === "READ" &&
            Boolean(item.lastMessage) &&
            item.unreadCount === 0) ||
          (filter === "EMPTY" &&
            !item.lastMessage);

        if (!matchesFilter) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          item.displayName,
          item.displayEmail,
          item.location,
          item.budget,
          item.lastMessage?.content,
          item.room.match.professional
            .companyName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      },
    );
  }, [
    roomSummaries,
    search,
    filter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRooms.length /
        ITEMS_PER_PAGE,
    ),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRooms = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredRooms.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE,
    );
  }, [
    filteredRooms,
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

  const firstVisibleRoom =
    filteredRooms.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleRoom = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredRooms.length,
  );

  const filters: {
    label: string;
    value: ConversationFilter;
    count: number;
  }[] = [
    {
      label: "All",
      value: "ALL",
      count: stats.total,
    },
    {
      label: "Unread",
      value: "UNREAD",
      count: stats.unread,
    },
    {
      label: "Read",
      value: "READ",
      count: stats.read,
    },
    {
      label: "No messages",
      value: "EMPTY",
      count: stats.empty,
    },
  ];

  function changePage(
    pageNumber: number,
  ) {
    setCurrentPage(pageNumber);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (loading) {
    return <MessagesPageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[42px] font-semibold leading-none tracking-[-0.03em] text-[#0F2340] md:text-[52px]">
          Messages
        </h1>

        <p className="mt-3 text-[18px] text-[#667085]">
          Conversations created after a
          professional contacts a buyer.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MessageStatCard
          icon={MessageCircle}
          value={stats.total}
          title="Conversations"
          description="All chat rooms"
          iconClass="bg-[#EEF3F8] text-[#1B365D]"
        />

        <MessageStatCard
          icon={Mail}
          value={stats.unread}
          title="Unread"
          description="Require your attention"
          iconClass="bg-red-50 text-red-600"
        />

        <MessageStatCard
          icon={CheckCheck}
          value={stats.read}
          title="Read"
          description="Already reviewed"
          iconClass="bg-green-50 text-green-600"
        />

        <MessageStatCard
          icon={Clock3}
          value={stats.empty}
          title="No Messages"
          description="Waiting for first message"
          iconClass="bg-yellow-50 text-yellow-600"
        />
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
        <div className="border-b border-[#E4E7EC] p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-[620px]">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search by buyer, professional, location or message..."
                aria-label="Search conversations"
                className="h-14 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-14 pr-4 text-[16px] text-[#0F2340] outline-none placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map(
                (filterItem) => (
                  <button
                    key={
                      filterItem.value
                    }
                    type="button"
                    onClick={() =>
                      setFilter(
                        filterItem.value,
                      )
                    }
                    className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                      filter ===
                      filterItem.value
                        ? "bg-[#1B365D] text-white"
                        : "border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8F9FA]"
                    }`}
                  >
                    {filterItem.label}

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        filter ===
                        filterItem.value
                          ? "bg-white/20 text-white"
                          : "bg-[#F2F4F7] text-[#667085]"
                      }`}
                    >
                      {filterItem.count}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#EAECF0]">
          {paginatedRooms.map(
            (item) => {
              const {
                room,
                lastMessage,
                unreadCount,
                displayName,
                displayEmail,
                location,
                budget,
              } = item;

              return (
                <Link
                  key={room.id}
                  href={`/dashboard/messages/${room.id}`}
                  className={`group block p-6 transition hover:bg-[#F8FAFC] ${
                    unreadCount > 0
                      ? "bg-[#F8FBFF]"
                      : "bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 gap-5">
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#475467,#C9A227)] text-xl font-semibold text-white">
                        {getInitial(
                          displayName,
                          displayEmail,
                        )}

                        {unreadCount > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[11px] font-bold text-white">
                            {unreadCount > 9
                              ? "9+"
                              : unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="truncate text-[20px] font-semibold text-[#0F2340]">
                            {displayName}
                          </h2>

                          {unreadCount > 0 ? (
                            <span className="rounded-full bg-[#1B365D] px-3 py-1 text-xs font-semibold text-white">
                              Unread
                            </span>
                          ) : lastMessage ? (
                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                              Read
                            </span>
                          ) : (
                            <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                              New conversation
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#667085]">
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#1B365D]" />
                            {location}
                          </span>

                          <span>
                            {budget}
                          </span>

                          {displayEmail && (
                            <span className="inline-flex items-center gap-2">
                              <Mail className="h-4 w-4 text-[#1B365D]" />
                              {displayEmail}
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-4 line-clamp-2 max-w-[800px] text-[15px] leading-7 ${
                            unreadCount > 0
                              ? "font-medium text-[#344054]"
                              : "text-[#667085]"
                          }`}
                        >
                          {lastMessage?.content ||
                            "No messages yet. Open the conversation to send the first message."}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-3 xl:items-end">
                      <p className="inline-flex items-center gap-2 text-sm text-[#98A2B3]">
                        <Clock3 className="h-4 w-4" />

                        {timeAgo(
                          lastMessage?.createdAt ||
                            room.updatedAt ||
                            room.createdAt,
                        )}
                      </p>

                      <span className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#1B365D] transition group-hover:border-[#1B365D] group-hover:bg-[#1B365D] group-hover:text-white">
                        Open conversation
                      </span>
                    </div>
                  </div>
                </Link>
              );
            },
          )}

          {filteredRooms.length === 0 && (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF3F8]">
                <MessageCircle className="h-8 w-8 text-[#1B365D]" />
              </div>

              <h2 className="mt-5 text-2xl font-semibold text-[#0F2340]">
                {rooms.length === 0
                  ? "No conversations yet"
                  : "No conversations found"}
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-[#667085]">
                {rooms.length === 0
                  ? "A conversation will appear when a professional contacts a buyer."
                  : "Try another search or conversation filter."}
              </p>
            </div>
          )}
        </div>

        {filteredRooms.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-[#E4E7EC] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#667085]">
              Showing{" "}
              <span className="font-semibold text-[#0F2340]">
                {firstVisibleRoom}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-[#0F2340]">
                {lastVisibleRoom}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#0F2340]">
                {filteredRooms.length}
              </span>{" "}
              conversations
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
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
  );
}

function MessageStatCard({
  icon: Icon,
  value,
  title,
  description,
  iconClass,
}: {
  icon: React.ElementType;
  value: number;
  title: string;
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
        {title}
      </p>

      <p className="mt-2 text-sm text-[#667085]">
        {description}
      </p>
    </article>
  );
}

function MessagesPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-12 w-72 animate-pulse rounded-xl bg-[#E9EDF3]" />

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
            className="flex gap-5 border-b border-[#E4E7EC] p-6"
          >
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-[#E9EDF3]" />

            <div className="flex-1 space-y-4">
              <div className="h-6 w-48 animate-pulse rounded-lg bg-[#E9EDF3]" />
              <div className="h-5 w-72 max-w-full animate-pulse rounded-lg bg-[#E9EDF3]" />
              <div className="h-12 animate-pulse rounded-xl bg-[#E9EDF3]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}