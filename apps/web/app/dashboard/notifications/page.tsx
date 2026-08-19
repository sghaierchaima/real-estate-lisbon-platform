"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Bell,
  CheckCheck,
  Clock3,
  FileText,
  GitBranch,
  Home,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationFilter,
  type NotificationItem,
} from "@/lib/notifications-api";
import { getToken } from "@/lib/session";
import { useToast } from "@/components/ui/ToastProvider";
const ITEMS_PER_PAGE = 3;
function getNotificationIcon(
  type: string,
) {
  if (
    type === "PROPERTY_MATCH"
  ) {
    return Home;
  }

  if (type === "MATCH") {
    return GitBranch;
  }

  if (type === "LEAD") {
    return Home;
  }

  if (type === "STORY") {
    return FileText;
  }

  return Bell;
}

function getTypeBadgeStyle(
  type: string,
) {
  if (
    type === "PROPERTY_MATCH"
  ) {
    return "bg-[#DCFCE7] text-[#15803D]";
  }

  if (type === "MATCH") {
    return "bg-[#EDE9FE] text-[#7C3AED]";
  }

  if (type === "LEAD") {
    return "bg-[#DBEAFE] text-[#2563EB]";
  }

  if (type === "STORY") {
    return "bg-[#FEF3C7] text-[#B45309]";
  }

  return "bg-[#F3F4F6] text-[#475467]";
}

function getIconStyle(
  type: string,
) {
  if (
    type === "PROPERTY_MATCH"
  ) {
    return "bg-[#DCFCE7] text-[#15803D]";
  }

  if (type === "MATCH") {
    return "bg-[#F3E8FF] text-[#7C3AED]";
  }

  if (type === "LEAD") {
    return "bg-[#DBEAFE] text-[#2563EB]";
  }

  if (type === "STORY") {
    return "bg-[#FEF3C7] text-[#B45309]";
  }

  return "bg-[#EEF3F8] text-[#1B365D]";
}

function timeAgo(date: string) {
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

export default function NotificationsPage() {
  const router = useRouter();
  const toast = useToast();

  const [
    notifications,
    setNotifications,
  ] = useState<NotificationItem[]>([]);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<NotificationFilter>("all");
    const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] =
    useState(true);

  const [readingId, setReadingId] =
    useState<string | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [
    notificationToDelete,
    setNotificationToDelete,
  ] = useState<NotificationItem | null>(
    null,
  );

  const [
    deletingNotification,
    setDeletingNotification,
  ] = useState(false);

  const [
    markingAllAsRead,
    setMarkingAllAsRead,
  ] = useState(false);

  async function loadNotifications() {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);

      /*
       * Nous chargeons toutes les notifications.
       * Les filtres seront appliqués côté frontend,
       * afin de garder des statistiques exactes.
       */
      const data =
        await getNotifications(token);

      setNotifications(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load notifications.";

      const normalizedMessage =
        message.toLowerCase();

      if (
        normalizedMessage.includes("403") ||
        normalizedMessage.includes(
          "forbidden",
        ) ||
        normalizedMessage.includes(
          "permission",
        )
      ) {
        router.replace("/access-denied");
        return;
      }

      if (
        normalizedMessage.includes("401") ||
        normalizedMessage.includes(
          "unauthorized",
        )
      ) {
        router.replace("/login");
        return;
      }

      toast.error(
        "Unable to load notifications",
        message,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function handleMarkAsRead(
    id: string,
  ) {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (readingId) {
      return;
    }

    try {
      setReadingId(id);

      const updated =
        await markNotificationAsRead(
          token,
          id,
        );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) =>
              notification.id === id
                ? {
                    ...notification,
                    ...updated,
                    isRead: true,
                  }
                : notification,
          ),
      );
    } catch (error) {
      toast.error(
        "Update failed",
        error instanceof Error
          ? error.message
          : "Unable to mark notification as read.",
      );
    } finally {
      setReadingId(null);
    }
  }

  async function handleMarkAllAsRead() {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (markingAllAsRead) {
      return;
    }

    try {
      setMarkingAllAsRead(true);

      const result =
        await markAllNotificationsAsRead(
          token,
        );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) => ({
              ...notification,
              isRead: true,
            }),
          ),
      );

      toast.success(
        "Notifications updated",
        result.updatedCount > 0
          ? `${result.updatedCount} notification(s) marked as read.`
          : "There were no unread notifications.",
      );
    } catch (error) {
      toast.error(
        "Update failed",
        error instanceof Error
          ? error.message
          : "Unable to mark all notifications as read.",
      );
    } finally {
      setMarkingAllAsRead(false);
    }
  }

  function requestDeleteNotification(
    notification: NotificationItem,
  ) {
    setNotificationToDelete(
      notification,
    );
  }

  async function confirmDeleteNotification() {
    if (
      !notificationToDelete ||
      deletingNotification
    ) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setDeletingNotification(true);
      setDeletingId(
        notificationToDelete.id,
      );

      await deleteNotification(
        token,
        notificationToDelete.id,
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.filter(
            (item) =>
              item.id !==
              notificationToDelete.id,
          ),
      );

      toast.success(
        "Notification deleted",
        "The notification was removed.",
      );

      setNotificationToDelete(null);
    } catch (error) {
      toast.error(
        "Delete failed",
        error instanceof Error
          ? error.message
          : "Unable to delete notification.",
      );
    } finally {
      setDeletingNotification(false);
      setDeletingId(null);
    }
  }

  const stats = useMemo(() => {
    const unread =
      notifications.filter(
        (notification) =>
          !notification.isRead,
      ).length;

    return {
      total: notifications.length,
      unread,
      read:
        notifications.length - unread,
    };
  }, [notifications]);

  const filteredNotifications =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return notifications.filter(
        (notification) => {
          const matchesFilter =
            filter === "all" ||
            (filter === "read" &&
              notification.isRead) ||
            (filter === "unread" &&
              !notification.isRead);

          if (!matchesFilter) {
            return false;
          }

          if (!query) {
            return true;
          }

          return (
            notification.title
              .toLowerCase()
              .includes(query) ||
            notification.message
              .toLowerCase()
              .includes(query) ||
            notification.type
              .toLowerCase()
              .includes(query)
          );
        },
      );
    }, [
      notifications,
      search,
      filter,
    ]);
  const totalPages = Math.max(
  1,
  Math.ceil(
    filteredNotifications.length /
      ITEMS_PER_PAGE,
  ),
);

const paginatedNotifications =
  filteredNotifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const filters: {
    label: string;
    value: NotificationFilter;
    count: number;
  }[] = [
    {
      label: "All",
      value: "all",
      count: stats.total,
    },
    {
      label: "Unread",
      value: "unread",
      count: stats.unread,
    },
    {
      label: "Read",
      value: "read",
      count: stats.read,
    },
  ];

  if (loading) {
    return (
      <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-10 text-center text-[#667085]">
        Loading notifications...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[48px] font-semibold leading-none tracking-[-0.03em] text-[#0F2340]">
            Notifications
          </h1>

          <p className="mt-3 text-[18px] text-[#667085]">
            Follow important updates from
            your real estate workflow.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleMarkAllAsRead
          }
          disabled={
            stats.unread === 0 ||
            markingAllAsRead
          }
          className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#1B365D] px-7 text-[17px] font-semibold text-white transition hover:bg-[#0F2340] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck className="h-5 w-5" />

          {markingAllAsRead
            ? "Updating..."
            : "Mark all as read"}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF3F8] text-[#1B365D]">
            <Bell className="h-6 w-6" />
          </div>

          <p className="mt-8 text-[44px] font-semibold leading-none text-[#0F2340]">
            {stats.total}
          </p>

          <p className="mt-3 text-[17px] text-[#344054]">
            Total Notifications
          </p>

          <p className="mt-2 text-sm text-[#667085]">
            All workflow updates
          </p>
        </div>

        <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEE2E2] text-[#DC2626]">
            <Bell className="h-6 w-6" />
          </div>

          <p className="mt-8 text-[44px] font-semibold leading-none text-[#0F2340]">
            {stats.unread}
          </p>

          <p className="mt-3 text-[17px] text-[#344054]">
            Unread
          </p>

          <p className="mt-2 text-sm text-[#667085]">
            Require your attention
          </p>
        </div>

        <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#15803D]">
            <CheckCheck className="h-6 w-6" />
          </div>

          <p className="mt-8 text-[44px] font-semibold leading-none text-[#0F2340]">
            {stats.read}
          </p>

          <p className="mt-3 text-[17px] text-[#344054]">
            Read
          </p>

          <p className="mt-2 text-sm text-[#667085]">
            Already reviewed
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
        <div className="border-b border-[#E4E7EC] p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-[650px]">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />

              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search notifications..."
                aria-label="Search notifications"
                className="h-14 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-14 pr-4 text-[16px] text-[#0F2340] outline-none placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {filters.map(
                (filterItem) => (
                  <button
                    key={
                      filterItem.value
                    }
                    type="button"
                    onClick={() => {
                      setFilter(filterItem.value);
                      setCurrentPage(1);
                    }}
                    className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                      filter ===
                      filterItem.value
                        ? "border-[#1B365D] bg-[#1B365D] text-white"
                        : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8F9FA]"
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

        {filteredNotifications.length ===
        0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-[#98A2B3]" />

            <h2 className="mt-4 text-xl font-semibold text-[#0F2340]">
              No notifications found
            </h2>

            <p className="mt-2 text-[#667085]">
              No notification matches your
              selected filter or search.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EAECF0]">
            {paginatedNotifications.map(
              (notification) => {
                const Icon =
                  getNotificationIcon(
                    notification.type,
                  );

                const isReading =
                  readingId ===
                  notification.id;

                const isDeleting =
                  deletingId ===
                  notification.id;

                return (
                  <article
                    key={notification.id}
                    className={`p-6 transition ${
                      notification.isRead
                        ? "bg-white"
                        : "bg-[#F8FBFF]"
                    }`}
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex min-w-0 gap-5">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${getIconStyle(
                            notification.type,
                          )}`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-[20px] font-semibold text-[#0F2340]">
                              {
                                notification.title
                              }
                            </h2>

                            <span
                              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold ${getTypeBadgeStyle(
                                notification.type,
                              )}`}
                            >
                              {
                                notification.type
                              }
                            </span>

                            {!notification.isRead && (
                              <span className="rounded-full bg-[#1B365D] px-3 py-1 text-[12px] font-semibold text-white">
                                New
                              </span>
                            )}
                          </div>

                          <p className="mt-3 max-w-[850px] break-words text-[16px] leading-7 text-[#667085]">
                            {
                              notification.message
                            }
                          </p>

                          <p className="mt-4 flex items-center gap-2 text-[14px] text-[#98A2B3]">
                            <Clock3 className="h-4 w-4" />

                            {timeAgo(
                              notification.createdAt,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-3">
                        {notification.type ===
    "PROPERTY_MATCH" &&
    notification.propertyId && (
      <Link
        href={`/properties/${notification.propertyId}`}
        onClick={() => {
          if (
            !notification.isRead
          ) {
            void handleMarkAsRead(
              notification.id,
            );
          }
        }}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1B365D] px-5 text-sm font-semibold text-white transition hover:bg-[#0F2340]"
      >
        View Property
      </Link>
    )}
                        {!notification.isRead && (
                          
                          <button
                            type="button"
                            disabled={
                              isReading ||
                              isDeleting
                            }
                            onClick={() =>
                              handleMarkAsRead(
                                notification.id,
                              )
                            }
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#1B365D] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isReading
                              ? "Updating..."
                              : "Mark as read"}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={
                            isDeleting ||
                            isReading
                          }
                          onClick={() =>
                            requestDeleteNotification(
                              notification,
                            )
                          }
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#FCA5A5] px-4 text-sm font-semibold text-[#DC2626] transition hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />

                          {isDeleting
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
          
        )}
        <div className="flex items-center justify-between border-t border-[#EAECF0] px-6 py-5">
  <p className="text-sm text-[#667085]">
    Showing{" "}
    {filteredNotifications.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1}
    {" "}to{" "}
    {Math.min(
      currentPage *
        ITEMS_PER_PAGE,
      filteredNotifications.length,
    )}{" "}
    of {filteredNotifications.length} notifications
  </p>

  <div className="flex items-center gap-2">
    <button
      disabled={currentPage === 1}
      onClick={() =>
        setCurrentPage((p) =>
          Math.max(1, p - 1),
        )
      }
      className="rounded-xl border border-[#D0D5DD] px-4 py-2 text-sm disabled:opacity-40"
    >
      Previous
    </button>

    {Array.from(
      { length: totalPages },
      (_, i) => (
        <button
          key={i}
          onClick={() =>
            setCurrentPage(i + 1)
          }
          className={`h-10 w-10 rounded-xl text-sm font-semibold ${
            currentPage === i + 1
              ? "bg-[#1B365D] text-white"
              : "border border-[#D0D5DD]"
          }`}
        >
          {i + 1}
        </button>
      ),
    )}

    <button
      disabled={
        currentPage === totalPages
      }
      onClick={() =>
        setCurrentPage((p) =>
          Math.min(totalPages, p + 1),
        )
      }
      className="rounded-xl border border-[#D0D5DD] px-4 py-2 text-sm disabled:opacity-40"
    >
      Next
    </button>
  </div>
</div>
        
      </div>
      </div>

      {notificationToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F2340]/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-notification-title"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !deletingNotification
            ) {
              setNotificationToDelete(
                null,
              );
            }
          }}
        >
          <div className="relative w-full max-w-[480px] rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_24px_80px_rgba(15,35,64,0.30)]">
            <button
              type="button"
              disabled={
                deletingNotification
              }
              onClick={() =>
                setNotificationToDelete(
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
              id="delete-notification-title"
              className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-[#0F2340]"
            >
              Delete this notification?
            </h2>

            <p className="mt-3 text-[15px] leading-7 text-[#667085]">
              You are about to permanently
              delete{" "}
              <span className="font-semibold text-[#0F2340]">
                “{notificationToDelete.title}”
              </span>
              .
            </p>

            <div className="mt-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4">
              <p className="text-sm font-medium text-[#B42318]">
                This action cannot be undone.
              </p>

              <p className="mt-2 text-sm leading-6 text-[#667085]">
                The notification will be
                permanently removed from your
                notification list.
              </p>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={
                  deletingNotification
                }
                onClick={() =>
                  setNotificationToDelete(
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
                  deletingNotification
                }
                onClick={() =>
                  void confirmDeleteNotification()
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-6 font-semibold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-5 w-5" />

                {deletingNotification
                  ? "Deleting..."
                  : "Delete notification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}