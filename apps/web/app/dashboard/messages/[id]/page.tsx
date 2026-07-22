"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  ArrowLeft,
  CheckCheck,
  Clock3,
  Loader2,
  MapPin,
  MessageCircle,
  Send,
  WalletCards,
} from "lucide-react";

import type { AuthUser } from "@/lib/auth-api";
import {
  getChatRoom,
  markChatRoomAsRead,
  sendMessage,
  type ChatMessage,
  type ChatRoom,
} from "@/lib/chat-api";
import {
  getStoredUser,
  getToken,
} from "@/lib/session";
import { socket } from "@/lib/socket";
import { useToast } from "@/components/ui/ToastProvider";

const MAX_MESSAGE_LENGTH = 1000;

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const sameDay = (
    first: Date,
    second: Date,
  ) =>
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate();

  if (sameDay(date, today)) {
    return "Today";
  }

  if (sameDay(date, yesterday)) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year:
      date.getFullYear() !==
      today.getFullYear()
        ? "numeric"
        : undefined,
  });
}

function getInitial(
  name?: string | null,
  email?: string | null,
) {
  return (
    name?.trim().charAt(0).toUpperCase() ||
    email?.trim().charAt(0).toUpperCase() ||
    "U"
  );
}

function sortMessages(
  messages: ChatMessage[],
) {
  return [...messages].sort(
    (first, second) =>
      new Date(
        first.createdAt,
      ).getTime() -
      new Date(
        second.createdAt,
      ).getTime(),
  );
}

export default function ChatRoomPage() {
  const params =
    useParams<{ id: string }>();

  const router = useRouter();
  const toast = useToast();

  const roomId = params.id;
  const user = getStoredUser<AuthUser>();

  const [room, setRoom] =
    useState<ChatRoom | null>(null);

  const [content, setContent] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [connectionStatus, setConnectionStatus] =
    useState<
      "connecting" | "connected" | "disconnected"
    >("connecting");

  const messagesContainerRef =
    useRef<HTMLDivElement | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const inputRef =
    useRef<HTMLTextAreaElement | null>(null);

  const markRoomAsRead = useCallback(
    async () => {
      const token = getToken();

      if (!token || !roomId) {
        return;
      }

      try {
        await markChatRoomAsRead(
          token,
          roomId,
        );
        window.dispatchEvent(
  new Event(
    "chat-unread-count-changed",
  ),
);

        setRoom((currentRoom) => {
          if (!currentRoom || !user) {
            return currentRoom;
          }

          return {
            ...currentRoom,
            messages:
              currentRoom.messages.map(
                (message) =>
                  message.senderId !==
                    user.id &&
                  !message.isRead
                    ? {
                        ...message,
                        isRead: true,
                        status: "READ",
                        readAt:
                          new Date().toISOString(),
                      }
                    : message,
              ),
          };
        });
      } catch {
        // Le chargement de la conversation ne doit
        // pas échouer uniquement à cause du marquage lu.
      }
    },
    [roomId, user?.id],
  );

  const loadRoom = useCallback(
    async () => {
      const token = getToken();

      if (!token || !user) {
        router.replace("/login");
        return;
      }

      if (
        user.role !== "BUYER" &&
        user.role !== "PROFESSIONAL"
      ) {
        router.replace(
          "/access-denied",
        );
        return;
      }

      if (!roomId) {
        router.replace(
          "/dashboard/messages",
        );
        return;
      }

      try {
        setLoading(true);

        const data = await getChatRoom(
  token,
  roomId,
);

setRoom({
  ...data,
  messages: sortMessages(
    data.messages || [],
  ),
});

await markChatRoomAsRead(
  token,
  roomId,
);

window.dispatchEvent(
  new Event("chat-unread-count-changed"),
);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load conversation.";

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

        if (
          normalized.includes("404") ||
          normalized.includes(
            "not found",
          )
        ) {
          toast.error(
            "Conversation not found",
            "This conversation does not exist or is no longer available.",
          );

          router.replace(
            "/dashboard/messages",
          );

          return;
        }

        toast.error(
          "Unable to load conversation",
          message,
        );
      } finally {
        setLoading(false);
      }
    },
    [
      roomId,
      router,
      toast,
      user?.id,
      user?.role,
    ],
  );

  useEffect(() => {
    void loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    function handleConnect() {
      setConnectionStatus(
        "connected",
      );

      socket.emit("joinRoom", {
        roomId,
      });
    }

    function handleDisconnect() {
      setConnectionStatus(
        "disconnected",
      );
    }

    function handleNewMessage(
      message: ChatMessage,
    ) {
      if (
        message.chatRoomId !== roomId
      ) {
        return;
      }

      setRoom((currentRoom) => {
        if (!currentRoom) {
          return currentRoom;
        }

        const alreadyExists =
          currentRoom.messages.some(
            (item) =>
              item.id === message.id,
          );

        if (alreadyExists) {
          return currentRoom;
        }

        return {
          ...currentRoom,
          updatedAt:
            message.createdAt,
          messages: sortMessages([
            ...currentRoom.messages,
            message,
          ]),
        };
      });

      if (
        user &&
        message.senderId !== user.id
      ) {
        void markRoomAsRead();
      }
    }

    socket.on(
      "connect",
      handleConnect,
    );

    socket.on(
      "disconnect",
      handleDisconnect,
    );

    socket.on(
      "newMessage",
      handleNewMessage,
    );

    if (!socket.connected) {
      setConnectionStatus(
        "connecting",
      );

      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off(
        "connect",
        handleConnect,
      );

      socket.off(
        "disconnect",
        handleDisconnect,
      );

      socket.off(
        "newMessage",
        handleNewMessage,
      );

      /*
       * On ne déconnecte pas forcément le socket global,
       * car il peut être partagé par d'autres composants.
       * Les listeners de cette page sont toutefois supprimés.
       */
    };
  }, [
    roomId,
    user?.id,
    markRoomAsRead,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [room?.messages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [roomId]);

  const messages = useMemo(
    () =>
      sortMessages(
        room?.messages || [],
      ),
    [room?.messages],
  );

  const buyerName =
    room?.match.lead?.fullName ||
    room?.match.buyer?.fullName ||
    "Buyer";

  const buyerEmail =
    room?.match.lead?.email ||
    room?.match.buyer?.email ||
    null;

  const professionalName =
    room?.match.professional.user
      .fullName ||
    room?.match.professional
      .companyName ||
    "Professional";

  const professionalEmail =
    room?.match.professional.user
      .email || null;

  const otherPersonName =
    user?.role === "BUYER"
      ? professionalName
      : buyerName;

  const otherPersonEmail =
    user?.role === "BUYER"
      ? professionalEmail
      : buyerEmail;

  const groupedMessages =
    useMemo(() => {
      return messages.map(
        (message, index) => {
          const previousMessage =
            index > 0
              ? messages[index - 1]
              : null;

          const currentDay =
            new Date(
              message.createdAt,
            ).toDateString();

          const previousDay =
            previousMessage
              ? new Date(
                  previousMessage.createdAt,
                ).toDateString()
              : null;

          return {
            message,
            showDay:
              currentDay !==
              previousDay,
          };
        },
      );
    }, [messages]);

  async function handleSend() {
    const token = getToken();
    const cleanContent =
      content.trim();

    if (
      !token ||
      !roomId ||
      !cleanContent ||
      sending
    ) {
      return;
    }

    if (
      cleanContent.length >
      MAX_MESSAGE_LENGTH
    ) {
      toast.warning(
        "Message too long",
        `Your message must contain no more than ${MAX_MESSAGE_LENGTH} characters.`,
      );

      return;
    }

    setSending(true);

    try {
      const newMessage =
        await sendMessage(
          token,
          roomId,
          cleanContent,
        );

      /*
       * Ajout immédiat dans l'interface.
       * Le listener Socket ignore ensuite le doublon grâce à l'ID.
       */
      setRoom((currentRoom) => {
        if (!currentRoom) {
          return currentRoom;
        }

        const alreadyExists =
          currentRoom.messages.some(
            (message) =>
              message.id ===
              newMessage.id,
          );

        if (alreadyExists) {
          return currentRoom;
        }

        return {
          ...currentRoom,
          updatedAt:
            newMessage.createdAt,
          messages: sortMessages([
            ...currentRoom.messages,
            newMessage,
          ]),
        };
      });

      setContent("");

      window.requestAnimationFrame(
        () => {
          inputRef.current?.focus();
        },
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to send message.";

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

      toast.error(
        "Message not sent",
        message,
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <ChatRoomSkeleton />;
  }

  if (!room) {
    return (
      <div className="rounded-[28px] border border-[#E4E7EC] bg-white px-6 py-16 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-[#98A2B3]" />

        <h1 className="mt-5 text-2xl font-semibold text-[#0F2340]">
          Conversation not found
        </h1>

        <p className="mt-2 text-[#667085]">
          This conversation is not
          available.
        </p>

        <Link
          href="/dashboard/messages"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#1B365D] px-5 font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to messages
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-116px)] min-h-[620px] flex-col overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_8px_30px_rgba(15,35,64,0.06)]">
      {/* Header */}
      <header className="shrink-0 border-b border-[#EAECF0] bg-white px-5 py-5 md:px-7">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/messages"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D0D5DD] text-[#1B365D] transition hover:bg-[#F8F9FA]"
            aria-label="Back to messages"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#475467,#C9A227)] text-xl font-semibold text-white">
            {getInitial(
              otherPersonName,
              otherPersonEmail,
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-xl font-semibold text-[#0F2340] md:text-2xl">
                {otherPersonName}
              </h1>

              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  connectionStatus ===
                  "connected"
                    ? "bg-green-50 text-green-700"
                    : connectionStatus ===
                        "connecting"
                      ? "bg-yellow-50 text-yellow-700"
                      : "bg-red-50 text-red-700"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    connectionStatus ===
                    "connected"
                      ? "bg-green-500"
                      : connectionStatus ===
                          "connecting"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                />

                {connectionStatus ===
                "connected"
                  ? "Live"
                  : connectionStatus ===
                      "connecting"
                    ? "Connecting"
                    : "Offline"}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#667085]">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />

                {room.match.lead
                  ?.location ||
                  "Portugal"}
              </span>

              <span className="inline-flex items-center gap-2">
                <WalletCards className="h-4 w-4" />

                {room.match.lead
                  ?.budget ||
                  "Budget not specified"}
              </span>

              <span>
                {messages.length}{" "}
                {messages.length === 1
                  ? "message"
                  : "messages"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-6 md:px-7"
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF3F8] text-[#1B365D]">
              <MessageCircle className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-[#0F2340]">
              Start the conversation
            </h2>

            <p className="mt-2 max-w-md text-[#667085]">
              Send your first message to{" "}
              {otherPersonName}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMessages.map(
              ({
                message,
                showDay,
              }) => {
                const isMine =
                  message.senderId ===
                  user?.id;

                const senderName =
                  isMine
                    ? user?.fullName ||
                      user?.email ||
                      "You"
                    : otherPersonName;

                const senderEmail =
                  isMine
                    ? user?.email
                    : otherPersonEmail;

                return (
                  <div
                    key={message.id}
                  >
                    {showDay && (
                      <div className="my-6 flex items-center gap-4">
                        <div className="h-px flex-1 bg-[#E4E7EC]" />

                        <span className="rounded-full border border-[#E4E7EC] bg-white px-4 py-1.5 text-xs font-semibold text-[#667085]">
                          {formatDayLabel(
                            message.createdAt,
                          )}
                        </span>

                        <div className="h-px flex-1 bg-[#E4E7EC]" />
                      </div>
                    )}

                    <div
                      className={`flex items-end gap-3 ${
                        isMine
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {!isMine && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1B365D] text-sm font-semibold text-white">
                          {getInitial(
                            senderName,
                            senderEmail,
                          )}
                        </div>
                      )}

                      <div
                        className={`max-w-[82%] md:max-w-[68%] ${
                          isMine
                            ? "items-end"
                            : "items-start"
                        } flex flex-col`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm md:px-5 ${
                            isMine
                              ? "rounded-br-md bg-[#1B365D] text-white"
                              : "rounded-bl-md border border-[#E4E7EC] bg-white text-[#0F2340]"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-[15px] leading-7">
                            {
                              message.content
                            }
                          </p>

                          <div
                            className={`mt-2 flex items-center justify-end gap-2 text-[11px] ${
                              isMine
                                ? "text-white/70"
                                : "text-[#98A2B3]"
                            }`}
                          >
                            <Clock3 className="h-3 w-3" />

                            <span>
                              {formatMessageTime(
                                message.createdAt,
                              )}
                            </span>

                            {isMine && (
                              <span className="inline-flex items-center gap-1">
                                <CheckCheck
                                  className={`h-3.5 w-3.5 ${
                                    message.status ===
                                      "READ" ||
                                    message.isRead
                                      ? "text-[#8DD4FF]"
                                      : "text-white/60"
                                  }`}
                                />

                                {message.status ===
                                  "READ" ||
                                message.isRead
                                  ? "Seen"
                                  : "Sent"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isMine && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C9A227] text-sm font-semibold text-white">
                          {getInitial(
                            senderName,
                            senderEmail,
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              },
            )}

            <div
              ref={messagesEndRef}
              className="h-1"
            />
          </div>
        )}
      </div>

      {/* Composer */}
      <footer className="shrink-0 border-t border-[#EAECF0] bg-white p-4 md:p-5">
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <textarea
              ref={inputRef}
              value={content}
              rows={1}
              maxLength={
                MAX_MESSAGE_LENGTH
              }
              onChange={(event) =>
                setContent(
                  event.target.value,
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                    "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={`Write a message to ${otherPersonName}...`}
              className="max-h-36 min-h-14 w-full resize-none rounded-2xl border border-[#D0D5DD] bg-white px-5 py-4 text-[15px] text-[#0F2340] outline-none placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
            />

            <div className="mt-2 flex items-center justify-between px-1">
              <p className="text-xs text-[#98A2B3]">
                Enter to send · Shift +
                Enter for a new line
              </p>

              <p
                className={`text-xs ${
                  content.length >
                  MAX_MESSAGE_LENGTH *
                    0.9
                    ? "text-orange-600"
                    : "text-[#98A2B3]"
                }`}
              >
                {content.length}/
                {MAX_MESSAGE_LENGTH}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void handleSend()
            }
            disabled={
              sending ||
              !content.trim() ||
              content.trim().length >
                MAX_MESSAGE_LENGTH
            }
            className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#1B365D] px-5 font-semibold text-white transition hover:bg-[#10284D] disabled:cursor-not-allowed disabled:opacity-50 md:px-6"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}

            <span className="hidden sm:inline">
              {sending
                ? "Sending..."
                : "Send"}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
}

function ChatRoomSkeleton() {
  return (
    <div className="flex h-[calc(100vh-116px)] min-h-[620px] flex-col overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white">
      <div className="flex items-center gap-4 border-b border-[#EAECF0] p-6">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-[#E9EDF3]" />
        <div className="h-13 w-13 animate-pulse rounded-full bg-[#E9EDF3]" />

        <div className="flex-1 space-y-3">
          <div className="h-7 w-52 animate-pulse rounded-lg bg-[#E9EDF3]" />
          <div className="h-5 w-80 max-w-full animate-pulse rounded-lg bg-[#E9EDF3]" />
        </div>
      </div>

      <div className="flex-1 space-y-5 bg-[#F8FAFC] p-6">
        <div className="flex justify-start">
          <div className="h-20 w-64 animate-pulse rounded-2xl bg-[#E9EDF3]" />
        </div>

        <div className="flex justify-end">
          <div className="h-24 w-72 animate-pulse rounded-2xl bg-[#D9E2EC]" />
        </div>

        <div className="flex justify-start">
          <div className="h-16 w-56 animate-pulse rounded-2xl bg-[#E9EDF3]" />
        </div>
      </div>

      <div className="flex gap-3 border-t border-[#EAECF0] p-5">
        <div className="h-14 flex-1 animate-pulse rounded-2xl bg-[#E9EDF3]" />
        <div className="h-14 w-28 animate-pulse rounded-2xl bg-[#D9E2EC]" />
      </div>
    </div>
  );
}