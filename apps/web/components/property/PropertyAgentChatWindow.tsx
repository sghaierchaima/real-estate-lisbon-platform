"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    CheckCheck,
    Loader2,
    Maximize2,
    MessageCircle,
    Minimize2,
    Send,
    X,
    Home,
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

type PropertyAgentChatWindowProps = {
    roomId: string;
    propertyTitle: string;
    agentName: string;
    onClose: () => void;
};

function sortMessages(messages: ChatMessage[]) {
    return [...messages].sort(
        (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
    );
}

function formatTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getInitial(
    name?: string | null,
    email?: string | null
) {
    return (
        name?.trim().charAt(0).toUpperCase() ||
        email?.trim().charAt(0).toUpperCase() ||
        "U"
    );
}

/**
 * Creates the initial draft displayed to the buyer.
 *
 * IMPORTANT:
 * This function only prepares text.
 * It does NOT send a message.
 */
function createPropertyInterestDraft(
    propertyTitle: string,
    agentName: string
) {
    const safeAgentName =
        agentName?.trim() || "Property Agent";

    const safePropertyTitle =
        propertyTitle?.trim() || "this property";

    return [
        `Hi ${safeAgentName},`,
        "",
        `I'm interested in "${safePropertyTitle}".`,
        "",
        "Could you please let me know if this property is still available and provide me with more information?",
        "",
        "Thank you.",
    ].join("\n");
}

export default function PropertyAgentChatWindow({
    roomId,
    propertyTitle,
    agentName,
    onClose,
}: PropertyAgentChatWindowProps) {
    const toast = useToast();

    const user = getStoredUser<AuthUser>();

    const [room, setRoom] =
        useState<ChatRoom | null>(null);

    /*
     * Property Details specific behavior:
     *
     * The composer starts with a contextual draft.
     * Nothing is sent until the Buyer presses Send.
     */
    const [content, setContent] = useState(() =>
        createPropertyInterestDraft(
            propertyTitle,
            agentName
        )
    );

    const [loading, setLoading] =
        useState(true);

    const [sending, setSending] =
        useState(false);

    const [minimized, setMinimized] =
        useState(false);

    const [expanded, setExpanded] =
        useState(false);

    const [connectionStatus, setConnectionStatus] =
        useState<
            "connecting" | "connected" | "disconnected"
        >("connecting");

    const messagesEndRef =
        useRef<HTMLDivElement | null>(null);

    const inputRef =
        useRef<HTMLTextAreaElement | null>(null);

    /*
     * ============================================================
     * LOAD CHAT ROOM
     * ============================================================
     */

    const loadRoom = useCallback(
        async () => {
            const token = getToken();

            if (!token || !user || !roomId) {
                return;
            }

            try {
                setLoading(true);

                const data = await getChatRoom(
                    token,
                    roomId
                );

                setRoom({
                    ...data,
                    messages: sortMessages(
                        data.messages || []
                    ),
                });

                await markChatRoomAsRead(
                    token,
                    roomId
                );

                window.dispatchEvent(
                    new Event(
                        "chat-unread-count-changed"
                    )
                );
            } catch (error) {
                toast.error(
                    "Unable to load conversation",
                    error instanceof Error
                        ? error.message
                        : "Please try again later."
                );
            } finally {
                setLoading(false);
            }
        },
        [roomId, toast, user?.id]
    );

    useEffect(() => {
        void loadRoom();
    }, [loadRoom]);

    /*
     * ============================================================
     * SOCKET.IO
     * ============================================================
     */

    useEffect(() => {
        if (!roomId) {
            return;
        }

        function handleConnect() {
            setConnectionStatus("connected");

            socket.emit("joinRoom", {
                roomId,
            });
        }

        function handleDisconnect() {
            setConnectionStatus(
                "disconnected"
            );
        }

        function handleNewMessage(
            message: ChatMessage
        ) {
            if (
                message.chatRoomId !== roomId
            ) {
                return;
            }

            setRoom((current) => {
                if (!current) {
                    return current;
                }

                const exists =
                    current.messages.some(
                        (item) =>
                            item.id === message.id
                    );

                if (exists) {
                    return current;
                }

                return {
                    ...current,
                    updatedAt:
                        message.createdAt,
                    messages: sortMessages([
                        ...current.messages,
                        message,
                    ]),
                };
            });

            if (
                user &&
                message.senderId !== user.id
            ) {
                const token = getToken();

                if (token) {
                    void markChatRoomAsRead(
                        token,
                        roomId
                    );

                    window.dispatchEvent(
                        new Event(
                            "chat-unread-count-changed"
                        )
                    );
                }
            }
        }

        socket.on(
            "connect",
            handleConnect
        );

        socket.on(
            "disconnect",
            handleDisconnect
        );

        socket.on(
            "newMessage",
            handleNewMessage
        );

        if (!socket.connected) {
            setConnectionStatus(
                "connecting"
            );

            socket.connect();
        } else {
            handleConnect();
        }

        return () => {
            socket.off(
                "connect",
                handleConnect
            );

            socket.off(
                "disconnect",
                handleDisconnect
            );

            socket.off(
                "newMessage",
                handleNewMessage
            );
        };
    }, [roomId, user?.id]);

    /*
     * ============================================================
     * AUTO SCROLL
     * ============================================================
     */

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [room?.messages.length]);

    /*
     * ============================================================
     * AUTO FOCUS
     * ============================================================
     */

    useEffect(() => {
        if (!minimized) {
            inputRef.current?.focus();
        }
    }, [minimized, roomId]);

    /*
     * ============================================================
     * MESSAGES
     * ============================================================
     */

    const messages = useMemo(
        () =>
            sortMessages(
                room?.messages || []
            ),
        [room?.messages]
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
        agentName ||
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

    /*
     * ============================================================
     * SEND MESSAGE
     * ============================================================
     */

    async function handleSend() {
        const token = getToken();

        const cleanContent =
            content.trim();

        if (
            !token ||
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
                `Maximum ${MAX_MESSAGE_LENGTH} characters.`
            );

            return;
        }

        try {
            setSending(true);

            /*
             * This is the ONLY place where the draft
             * becomes a real persisted message.
             */
            const newMessage =
                await sendMessage(
                    token,
                    roomId,
                    cleanContent
                );

            setRoom((current) => {
                if (!current) {
                    return current;
                }

                const exists =
                    current.messages.some(
                        (message) =>
                            message.id ===
                            newMessage.id
                    );

                if (exists) {
                    return current;
                }

                return {
                    ...current,
                    updatedAt:
                        newMessage.createdAt,
                    messages: sortMessages([
                        ...current.messages,
                        newMessage,
                    ]),
                };
            });

            setContent("");
        } catch (error) {
            toast.error(
                "Message not sent",
                error instanceof Error
                    ? error.message
                    : "Please try again."
            );
        } finally {
            setSending(false);
        }
    }

    const windowClass = expanded
        ? "fixed inset-6 z-[100] flex flex-col overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-2xl"
        : "fixed bottom-5 right-5 z-[100] flex w-[420px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[24px] border border-[#E4E7EC] bg-white shadow-[0_24px_70px_rgba(15,35,64,0.22)]";

    return (
        <div className={windowClass}>
            {/* HEADER */}

            <header className="flex items-center gap-3 bg-[#1B365D] px-4 py-3 text-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 font-semibold">
                    {getInitial(
                        otherPersonName,
                        otherPersonEmail
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                        {otherPersonName}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-white/70">
                        <span
                            className={`h-2 w-2 rounded-full ${connectionStatus ===
                                "connected"
                                ? "bg-green-400"
                                : connectionStatus ===
                                    "connecting"
                                    ? "bg-yellow-400"
                                    : "bg-red-400"
                                }`}
                        />

                        {connectionStatus ===
                            "connected"
                            ? "Live"
                            : connectionStatus ===
                                "connecting"
                                ? "Connecting..."
                                : "Offline"}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setMinimized(
                            (value) => !value
                        )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
                    aria-label={
                        minimized
                            ? "Open chat"
                            : "Minimize chat"
                    }
                >
                    {minimized ? (
                        <MessageCircle size={18} />
                    ) : (
                        <Minimize2 size={18} />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setExpanded(
                            (value) => !value
                        )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
                    aria-label="Expand chat"
                >
                    <Maximize2 size={18} />
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
                    aria-label="Close chat"
                >
                    <X size={18} />
                </button>
            </header>

            {!minimized && (
                <>
                    {/* PROPERTY CONTEXT */}

                    <div className="border-b border-[#E4E7EC] bg-[#FFFCF3] px-4 py-3.5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C9A227]/10">
                                <Home className="h-4 w-4 text-[#A88416]" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#A88416]">
                                    Property enquiry
                                </p>

                                <p className="mt-1 truncate text-sm font-semibold text-[#0F2340]">
                                    {propertyTitle}
                                </p>

                                <p className="mt-0.5 text-xs text-[#667085]">
                                    Your conversation is linked to this listing
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* MESSAGES */}

                    <div
                        className={`overflow-y-auto bg-[#F8FAFC] px-4 py-4 ${expanded
                            ? "flex-1"
                            : "h-[300px]"
                            }`}
                    >
                        {loading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-7 w-7 animate-spin text-[#1B365D]" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B365D]/5">
                                    <MessageCircle className="h-5 w-5 text-[#1B365D]" />
                                </div>

                                <p className="mt-3 text-sm font-semibold text-[#0F2340]">
                                    Start a conversation
                                </p>

                                <p className="mt-1 max-w-[270px] text-xs leading-5 text-[#667085]">
                                    We prepared a message about this property.
                                    Review it below and send it when you're ready.
                                </p>
                            </div>

                        ) : (
                            <div className="space-y-3">
                                {messages.map(
                                    (message) => {
                                        const isMine =
                                            message.senderId ===
                                            user?.id;

                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex ${isMine
                                                    ? "justify-end"
                                                    : "justify-start"
                                                    }`}
                                            >
                                                <div
                                                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isMine
                                                        ? "rounded-br-md bg-[#1B365D] text-white"
                                                        : "rounded-bl-md border border-[#E4E7EC] bg-white text-[#0F2340]"
                                                        }`}
                                                >
                                                    <p className="whitespace-pre-wrap break-words leading-6">
                                                        {
                                                            message.content
                                                        }
                                                    </p>

                                                    <div
                                                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMine
                                                            ? "text-white/60"
                                                            : "text-[#98A2B3]"
                                                            }`}
                                                    >
                                                        {formatTime(
                                                            message.createdAt
                                                        )}

                                                        {isMine && (
                                                            <CheckCheck
                                                                size={12}
                                                                className={
                                                                    message.isRead ||
                                                                        message.status ===
                                                                        "READ"
                                                                        ? "text-sky-300"
                                                                        : ""
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}

                                <div
                                    ref={messagesEndRef}
                                />
                            </div>
                        )}
                    </div>

                    {/* COMPOSER */}

                    <footer className="border-t border-[#E4E7EC] bg-white p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[#344054]">
                                    {content.trim()
                                        ? "Suggested message"
                                        : "Message"}
                                </p>

                                {content.trim() && (
                                    <p className="mt-0.5 text-[11px] text-[#98A2B3]">
                                        Review or edit before sending
                                    </p>
                                )}
                            </div>

                            <span className="text-[11px] text-[#98A2B3]">
                                {content.length}/{MAX_MESSAGE_LENGTH}
                            </span>
                        </div>

                        <div className="rounded-2xl border border-[#D0D5DD] bg-white p-2 transition focus-within:border-[#1B365D] focus-within:ring-4 focus-within:ring-[#1B365D]/10">
                            <textarea
                                ref={inputRef}
                                value={content}
                                maxLength={MAX_MESSAGE_LENGTH}
                                rows={content.trim() ? 4 : 2}
                                onChange={(event) =>
                                    setContent(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key === "Enter" &&
                                        !event.shiftKey
                                    ) {
                                        event.preventDefault();
                                        void handleSend();
                                    }
                                }}
                                placeholder={`Message ${otherPersonName}...`}
                                className="max-h-32 min-h-[64px] w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-[#101828] outline-none placeholder:text-[#98A2B3]"
                            />

                            <div className="flex items-center justify-between border-t border-[#F2F4F7] px-1 pt-2">
                                <span className="text-[10px] text-[#98A2B3]">
                                    Shift + Enter for a new line
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleSend()
                                    }
                                    disabled={
                                        sending ||
                                        !content.trim()
                                    }
                                    className="flex h-9 items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-4 text-xs font-semibold text-white transition hover:bg-[#10284D] disabled:cursor-not-allowed disabled:bg-[#D0D5DD]"
                                >
                                    {sending ? (
                                        <>
                                            <Loader2
                                                size={15}
                                                className="animate-spin"
                                            />
                                            Sending
                                        </>
                                    ) : (
                                        <>
                                            Send
                                            <Send size={15} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </footer>
                </>
            )}
        </div>
    );
}