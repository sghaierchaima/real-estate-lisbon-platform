"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ContactMessage,
  deleteContactMessage,
  getAdminContactMessages,
  markContactMessageAsRead,
  markContactMessageAsUnread,
} from "@/lib/contact";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type MessageFilter =
  | "ALL"
  | "UNREAD"
  | "READ";


/*
 * ============================================================
 * AUTH
 * ============================================================
 *
 * IMPORTANT:
 * Change this function only if your project stores the JWT
 * under another key or uses an AuthContext.
 */

function getAdminToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken")
  );
}


/*
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function AdminContactPage() {
  const [messages, setMessages] =
    useState<ContactMessage[]>([]);

  const [selectedMessage, setSelectedMessage] =
    useState<ContactMessage | null>(null);

  const [filter, setFilter] =
    useState<MessageFilter>("ALL");

  const [search, setSearch] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [messageToDelete, setMessageToDelete] =
    useState<ContactMessage | null>(null);


  /*
   * ==========================================================
   * LOAD MESSAGES
   * ==========================================================
   */

  const loadMessages =
    useCallback(
      async (
        refresh = false,
      ) => {
        const token =
          getAdminToken();

        if (!token) {
          setError(
            "Your admin session could not be found. Please sign in again.",
          );

          setIsLoading(false);
          setIsRefreshing(false);

          return;
        }

        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setError("");

        try {
          const data =
            await getAdminContactMessages(
              token,
            );

          setMessages(data);

          /*
           * If a message is already open,
           * keep its information synchronized.
           */
          setSelectedMessage(
            (current) => {
              if (!current) {
                return null;
              }

              return (
                data.find(
                  (item) =>
                    item.id ===
                    current.id,
                ) || null
              );
            },
          );
        } catch (error) {
          console.error(
            "Unable to load contact messages:",
            error,
          );

          setError(
            "Unable to load contact messages. Please try again.",
          );
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      },
      [],
    );


  /*
   * Initial load.
   */

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);


  /*
   * ==========================================================
   * COUNTERS
   * ==========================================================
   */

  const totalCount =
    messages.length;

  const unreadCount =
    useMemo(
      () =>
        messages.filter(
          (message) =>
            !message.isRead,
        ).length,
      [messages],
    );

  const readCount =
    totalCount - unreadCount;


  /*
   * ==========================================================
   * SEARCH + FILTER
   * ==========================================================
   */

  const filteredMessages =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return messages.filter(
        (message) => {
          /*
           * Status filter.
           */
          if (
            filter === "UNREAD" &&
            message.isRead
          ) {
            return false;
          }

          if (
            filter === "READ" &&
            !message.isRead
          ) {
            return false;
          }

          /*
           * Search filter.
           */
          if (!query) {
            return true;
          }

          return [
            message.name,
            message.email,
            message.subject,
            message.message,
          ].some((value) =>
            value
              .toLowerCase()
              .includes(query),
          );
        },
      );
    }, [
      messages,
      filter,
      search,
    ]);


  /*
   * ==========================================================
   * OPEN MESSAGE
   * ==========================================================
   */

  async function openMessage(
    message: ContactMessage,
  ) {
    /*
     * Open immediately for a responsive UI.
     */
    setSelectedMessage(message);

    /*
     * Already read:
     * no API call required.
     */
    if (message.isRead) {
      return;
    }

    const token =
      getAdminToken();

    if (!token) {
      setError(
        "Your admin session could not be found.",
      );

      return;
    }

    setActionId(message.id);

    try {
      const updated =
        await markContactMessageAsRead(
          token,
          message.id,
        );

      /*
       * Update local list.
       */
      setMessages(
        (current) =>
          current.map((item) =>
            item.id ===
            updated.id
              ? updated
              : item,
          ),
      );

      /*
       * Update open message.
       */
      setSelectedMessage(
        updated,
      );
    } catch (error) {
      console.error(
        "Unable to mark message as read:",
        error,
      );

      /*
       * Keep the message open even
       * if the status update fails.
       */
    } finally {
      setActionId(null);
    }
  }


  /*
   * ==========================================================
   * MARK AS UNREAD
   * ==========================================================
   */

  async function handleMarkUnread(
    message: ContactMessage,
  ) {
    const token =
      getAdminToken();

    if (!token) {
      setError(
        "Your admin session could not be found.",
      );

      return;
    }

    setActionId(message.id);

    try {
      const updated =
        await markContactMessageAsUnread(
          token,
          message.id,
        );

      setMessages(
        (current) =>
          current.map((item) =>
            item.id ===
            updated.id
              ? updated
              : item,
          ),
      );

      setSelectedMessage(
        updated,
      );
    } catch (error) {
      console.error(
        "Unable to mark message as unread:",
        error,
      );

      setError(
        "Unable to update this message.",
      );
    } finally {
      setActionId(null);
    }
  }


  /*
   * ==========================================================
   * MARK AS READ
   * ==========================================================
   */

  async function handleMarkRead(
    message: ContactMessage,
  ) {
    const token =
      getAdminToken();

    if (!token) {
      setError(
        "Your admin session could not be found.",
      );

      return;
    }

    setActionId(message.id);

    try {
      const updated =
        await markContactMessageAsRead(
          token,
          message.id,
        );

      setMessages(
        (current) =>
          current.map((item) =>
            item.id ===
            updated.id
              ? updated
              : item,
          ),
      );

      setSelectedMessage(
        updated,
      );
    } catch (error) {
      console.error(
        "Unable to mark message as read:",
        error,
      );

      setError(
        "Unable to update this message.",
      );
    } finally {
      setActionId(null);
    }
  }


  /*
   * ==========================================================
   * DELETE
   * ==========================================================
   */

  async function confirmDelete() {
    if (!messageToDelete) {
      return;
    }

    const token =
      getAdminToken();

    if (!token) {
      setError(
        "Your admin session could not be found.",
      );

      return;
    }

    const id =
      messageToDelete.id;

    setActionId(id);

    try {
      await deleteContactMessage(
        token,
        id,
      );

      setMessages(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id,
          ),
      );

      if (
        selectedMessage?.id === id
      ) {
        setSelectedMessage(null);
      }

      setMessageToDelete(null);
    } catch (error) {
      console.error(
        "Unable to delete contact message:",
        error,
      );

      setError(
        "Unable to delete this message. Please try again.",
      );
    } finally {
      setActionId(null);
    }
  }


  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="min-h-full bg-[#F6F8FB]">
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9">
        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9EEF5] text-[#1B365D]">
                <Mail size={16} />
              </div>

              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8390A0]">
                Support
              </span>
            </div>

            <h1 className="text-[28px] font-bold tracking-[-0.025em] text-[#0F2340] sm:text-[31px]">
              Contact Messages
            </h1>

            <p className="mt-2 text-[13px] leading-6 text-[#748190]">
              Review and manage enquiries submitted through the public contact form.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadMessages(true)
            }
            disabled={isRefreshing}
            className="
              inline-flex h-11
              items-center justify-center
              gap-2 rounded-xl
              border border-[#DCE2E9]
              bg-white px-4
              text-[12px] font-semibold
              text-[#334B68]
              shadow-sm transition
              hover:border-[#CBD3DD]
              hover:bg-[#F9FAFC]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <RefreshCw
              size={15}
              className={
                isRefreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* ===================================================
            STATS
        ==================================================== */}

        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total messages"
            value={totalCount}
            icon={
              <Inbox size={19} />
            }
          />

          <StatCard
            title="Unread"
            value={unreadCount}
            icon={
              <Mail size={19} />
            }
            highlighted={
              unreadCount > 0
            }
          />

          <StatCard
            title="Read"
            value={readCount}
            icon={
              <MailOpen size={19} />
            }
          />
        </div>

        {/* ===================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3.5 text-[12px] font-medium text-red-700">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={17}
                className="mt-[1px] shrink-0"
              />

              <span>
                {error}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="shrink-0"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ===================================================
            CONTENT CARD
        ==================================================== */}

        <div className="overflow-hidden rounded-[22px] border border-[#E1E6EC] bg-white shadow-[0_12px_40px_rgba(15,35,64,0.05)]">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-[#EDF0F3] p-5 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative w-full lg:max-w-[420px]">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#98A3AF]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search name, email, subject or message..."
                className="
                  h-11 w-full
                  rounded-xl
                  border border-[#DDE3E9]
                  bg-[#FAFBFC]
                  pl-11 pr-4
                  text-[12px]
                  text-[#243B5A]
                  outline-none
                  transition
                  placeholder:text-[#9AA5B1]
                  focus:border-[#1B365D]
                  focus:bg-white
                  focus:ring-4
                  focus:ring-[#1B365D]/[0.05]
                "
              />
            </div>

            {/* Filters */}
            <div className="flex rounded-xl bg-[#F3F5F8] p-1">
              <FilterButton
                active={
                  filter === "ALL"
                }
                onClick={() =>
                  setFilter("ALL")
                }
              >
                All
              </FilterButton>

              <FilterButton
                active={
                  filter ===
                  "UNREAD"
                }
                onClick={() =>
                  setFilter(
                    "UNREAD",
                  )
                }
              >
                Unread
              </FilterButton>

              <FilterButton
                active={
                  filter === "READ"
                }
                onClick={() =>
                  setFilter("READ")
                }
              >
                Read
              </FilterButton>
            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================== */}

          {isLoading ? (
            <LoadingState />
          ) : filteredMessages.length ===
            0 ? (
            <EmptyState
              hasMessages={
                messages.length > 0
              }
              onReset={() => {
                setSearch("");
                setFilter("ALL");
              }}
            />
          ) : (
            /*
             * ===============================================
             * MESSAGE LIST
             * ===============================================
             */
            <div>
              {filteredMessages.map(
                (message) => (
                  <MessageRow
                    key={message.id}
                    message={message}
                    busy={
                      actionId ===
                      message.id
                    }
                    onOpen={() =>
                      void openMessage(
                        message,
                      )
                    }
                  />
                ),
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        {!isLoading &&
          messages.length > 0 && (
            <p className="mt-4 text-right text-[11px] text-[#8B97A5]">
              Showing{" "}
              {
                filteredMessages.length
              }{" "}
              of {messages.length}{" "}
              messages
            </p>
          )}
      </div>

      {/* =====================================================
          MESSAGE DETAIL DRAWER
      ====================================================== */}

      {selectedMessage && (
        <MessageDrawer
          message={selectedMessage}
          busy={
            actionId ===
            selectedMessage.id
          }
          onClose={() =>
            setSelectedMessage(null)
          }
          onMarkRead={() =>
            void handleMarkRead(
              selectedMessage,
            )
          }
          onMarkUnread={() =>
            void handleMarkUnread(
              selectedMessage,
            )
          }
          onDelete={() =>
            setMessageToDelete(
              selectedMessage,
            )
          }
        />
      )}

      {/* =====================================================
          DELETE CONFIRMATION
      ====================================================== */}

      {messageToDelete && (
        <DeleteDialog
          message={
            messageToDelete
          }
          busy={
            actionId ===
            messageToDelete.id
          }
          onCancel={() => {
            if (!actionId) {
              setMessageToDelete(
                null,
              );
            }
          }}
          onConfirm={() =>
            void confirmDelete()
          }
        />
      )}
    </div>
  );
}


/*
 * ============================================================
 * STAT CARD
 * ============================================================
 */

function StatCard({
  title,
  value,
  icon,
  highlighted = false,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`
        rounded-[18px]
        border
        bg-white
        p-5
        shadow-[0_8px_30px_rgba(15,35,64,0.04)]

        ${
          highlighted
            ? "border-[#D7C06A]/50"
            : "border-[#E2E7ED]"
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B97A5]">
            {title}
          </p>

          <p className="mt-2 text-[27px] font-bold tracking-[-0.03em] text-[#0F2340]">
            {value}
          </p>
        </div>

        <div
          className={`
            flex h-10 w-10
            items-center
            justify-center
            rounded-xl

            ${
              highlighted
                ? "bg-[#FBF7E8] text-[#A88614]"
                : "bg-[#F1F4F8] text-[#1B365D]"
            }
          `}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}


/*
 * ============================================================
 * FILTER BUTTON
 * ============================================================
 */

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-lg
        px-4 py-2
        text-[11px]
        font-semibold
        transition

        ${
          active
            ? "bg-white text-[#0F2340] shadow-sm"
            : "text-[#7A8795] hover:text-[#1B365D]"
        }
      `}
    >
      {children}
    </button>
  );
}


/*
 * ============================================================
 * MESSAGE ROW
 * ============================================================
 */

function MessageRow({
  message,
  busy,
  onOpen,
}: {
  message: ContactMessage;
  busy: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={busy}
      className={`
        group
        relative
        grid w-full
        gap-3
        border-b border-[#EDF0F3]
        px-5 py-5
        text-left
        transition
        last:border-b-0
        hover:bg-[#FAFBFD]
        sm:grid-cols-[minmax(170px,0.8fr)_minmax(180px,1fr)_minmax(260px,1.6fr)_auto]
        sm:items-center

        ${
          !message.isRead
            ? "bg-[#FBFCFF]"
            : "bg-white"
        }
      `}
    >
      {!message.isRead && (
        <span className="absolute left-0 top-0 h-full w-[3px] bg-[#C9A227]" />
      )}

      {/* Sender */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {!message.isRead && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#C9A227]" />
          )}

          <div className="min-w-0">
            <p
              className={`
                truncate
                text-[13px]
                text-[#172A45]

                ${
                  !message.isRead
                    ? "font-bold"
                    : "font-semibold"
                }
              `}
            >
              {message.name}
            </p>

            <p className="mt-1 truncate text-[11px] text-[#8B97A5]">
              {message.email}
            </p>
          </div>
        </div>
      </div>

      {/* Subject */}
      <div className="min-w-0">
        <span className="inline-flex max-w-full rounded-lg bg-[#F2F5F8] px-2.5 py-1.5 text-[10px] font-semibold text-[#53657A]">
          <span className="truncate">
            {message.subject}
          </span>
        </span>
      </div>

      {/* Preview */}
      <div className="min-w-0">
        <p className="truncate text-[12px] text-[#667585]">
          {message.message}
        </p>

        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#98A3AF]">
          <Clock3 size={11} />

          {formatDate(
            message.createdAt,
          )}
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        {busy ? (
          <Loader2
            size={16}
            className="animate-spin text-[#1B365D]"
          />
        ) : (
          <span className="text-[11px] font-semibold text-[#1B365D] opacity-70 transition group-hover:opacity-100">
            View →
          </span>
        )}
      </div>
    </button>
  );
}


/*
 * ============================================================
 * MESSAGE DRAWER
 * ============================================================
 */

function MessageDrawer({
  message,
  busy,
  onClose,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: {
  message: ContactMessage;
  busy: boolean;
  onClose: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close message"
        onClick={onClose}
        className="absolute inset-0 bg-[#071426]/40 backdrop-blur-[2px]"
      />

      {/* Drawer */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col bg-white shadow-[-20px_0_60px_rgba(15,35,64,0.16)]">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E9EDF2] px-6 py-5 sm:px-7">
          <div>
            <div className="flex items-center gap-2">
              {message.isRead ? (
                <MailOpen
                  size={16}
                  className="text-[#748190]"
                />
              ) : (
                <Mail
                  size={16}
                  className="text-[#C9A227]"
                />
              )}

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A96A4]">
                Contact message
              </span>
            </div>

            <h2 className="mt-2 text-[20px] font-bold text-[#0F2340]">
              {message.subject}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E0E5EB] text-[#677687] transition hover:bg-[#F5F7F9]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-7">
          {/* Sender */}
          <div className="rounded-[17px] border border-[#E5E9EE] bg-[#F8FAFC] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8EDF4] text-[#1B365D]">
                <UserRound size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#172A45]">
                  {message.name}
                </p>

                <a
                  href={`mailto:${message.email}`}
                  className="mt-1 block break-all text-[12px] font-medium text-[#41658D] hover:underline"
                >
                  {message.email}
                </a>

                <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[#8E9AA7]">
                  <Clock3 size={11} />

                  Received{" "}
                  {formatFullDate(
                    message.createdAt,
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Subject */}
          <DetailSection
            title="Subject"
          >
            <p className="text-[13px] font-semibold text-[#263D5A]">
              {message.subject}
            </p>
          </DetailSection>

          {/* Message */}
          <DetailSection
            title="Message"
          >
            <div className="whitespace-pre-wrap break-words text-[13px] leading-7 text-[#536477]">
              {message.message}
            </div>
          </DetailSection>

          {/* Status */}
          <DetailSection
            title="Status"
          >
            {message.isRead ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 size={12} />

                Read
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBF7E8] px-3 py-1.5 text-[10px] font-bold text-[#9A7911]">
                <Mail size={12} />

                Unread
              </span>
            )}
          </DetailSection>
        </div>

        {/* Footer actions */}
        <div className="border-t border-[#E9EDF2] bg-[#FAFBFC] px-6 py-5 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={14} />

              Delete
            </button>

            {message.isRead ? (
              <button
                type="button"
                onClick={onMarkUnread}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#0F2340] disabled:opacity-50"
              >
                {busy ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Mail size={14} />
                )}

                Mark as unread
              </button>
            ) : (
              <button
                type="button"
                onClick={onMarkRead}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#0F2340] disabled:opacity-50"
              >
                {busy ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Check size={14} />
                )}

                Mark as read
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}


/*
 * ============================================================
 * DETAIL SECTION
 * ============================================================
 */

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#EEF1F4] py-6 last:border-0">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#909BA8]">
        {title}
      </p>

      {children}
    </div>
  );
}


/*
 * ============================================================
 * DELETE DIALOG
 * ============================================================
 */

function DeleteDialog({
  message,
  busy,
  onCancel,
  onConfirm,
}: {
  message: ContactMessage;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#071426]/50 px-5 backdrop-blur-[2px]">
      <div className="w-full max-w-[430px] rounded-[22px] border border-white/20 bg-white p-6 shadow-[0_30px_80px_rgba(15,35,64,0.25)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Trash2 size={19} />
        </div>

        <h3 className="mt-5 text-[19px] font-bold text-[#0F2340]">
          Delete contact message?
        </h3>

        <p className="mt-2 text-[12px] leading-6 text-[#748190]">
          The message from{" "}
          <strong className="font-semibold text-[#354B65]">
            {message.name}
          </strong>{" "}
          will be permanently deleted. This action cannot be undone.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-[#DDE3E9] bg-white px-4 py-2.5 text-[11px] font-semibold text-[#526579] transition hover:bg-[#F6F8FA] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Trash2 size={14} />
            )}

            Delete message
          </button>
        </div>
      </div>
    </div>
  );
}


/*
 * ============================================================
 * LOADING
 * ============================================================
 */

function LoadingState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <Loader2
        size={28}
        className="animate-spin text-[#1B365D]"
      />

      <p className="mt-4 text-[13px] font-semibold text-[#40556F]">
        Loading contact messages...
      </p>

      <p className="mt-1 text-[11px] text-[#8D99A6]">
        Retrieving the latest support enquiries.
      </p>
    </div>
  );
}


/*
 * ============================================================
 * EMPTY
 * ============================================================
 */

function EmptyState({
  hasMessages,
  onReset,
}: {
  hasMessages: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F4F8] text-[#1B365D]">
        <Inbox size={24} />
      </div>

      <h3 className="mt-5 text-[17px] font-bold text-[#0F2340]">
        {hasMessages
          ? "No messages found"
          : "No contact messages yet"}
      </h3>

      <p className="mt-2 max-w-[380px] text-[12px] leading-6 text-[#7A8795]">
        {hasMessages
          ? "No contact messages match your current search or filter."
          : "Messages submitted through the public contact form will appear here."}
      </p>

      {hasMessages && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 rounded-xl border border-[#DCE2E9] bg-white px-4 py-2.5 text-[11px] font-semibold text-[#1B365D] transition hover:bg-[#F7F9FB]"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}


/*
 * ============================================================
 * DATE HELPERS
 * ============================================================
 */

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}


function formatFullDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "at an unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}