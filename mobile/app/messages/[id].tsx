import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  ArrowLeft,
  CheckCheck,
  Clock3,
  MapPin,
  MessageCircle,
  Send,
  WalletCards,
} from "lucide-react-native";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  AuthUser,
} from "@/types/auth";

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

import {
  socket,
} from "@/lib/socket";

// ============================================================
// CONSTANTS
// ============================================================

const MAX_MESSAGE_LENGTH = 1000;

const NAVY = "#0F2340";
const PRIMARY = "#1B365D";
const GOLD = "#C9A227";

const MUTED = "#667085";
const BORDER = "#E4E7EC";
const BACKGROUND = "#F8FAFC";
const WHITE = "#FFFFFF";

// ============================================================
// HELPERS
// ============================================================

function formatMessageTime(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function formatDayLabel(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const today =
    new Date();

  const yesterday =
    new Date();

  yesterday.setDate(
    today.getDate() - 1,
  );

  function sameDay(
    first: Date,
    second: Date,
  ) {
    return (
      first.getFullYear() ===
        second.getFullYear() &&
      first.getMonth() ===
        second.getMonth() &&
      first.getDate() ===
        second.getDate()
    );
  }

  if (
    sameDay(
      date,
      today,
    )
  ) {
    return "Today";
  }

  if (
    sameDay(
      date,
      yesterday,
    )
  ) {
    return "Yesterday";
  }

  return date.toLocaleDateString(
    [],
    {
      day: "2-digit",
      month: "short",
      year:
        date.getFullYear() !==
        today.getFullYear()
          ? "numeric"
          : undefined,
    },
  );
}

function getInitial(
  name?: string | null,
  email?: string | null,
) {
  return (
    name
      ?.trim()
      .charAt(0)
      .toUpperCase() ||
    email
      ?.trim()
      .charAt(0)
      .toUpperCase() ||
    "U"
  );
}

function sortMessages(
  messages: ChatMessage[],
) {
  return [
    ...messages,
  ].sort(
    (
      first,
      second,
    ) =>
      new Date(
        first.createdAt,
      ).getTime() -
      new Date(
        second.createdAt,
      ).getTime(),
  );
}

// ============================================================
// SCREEN
// ============================================================

export default function ChatRoomScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const roomId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const scrollViewRef =
    useRef<ScrollView | null>(
      null,
    );

  const [
    user,
    setUser,
  ] =
    useState<AuthUser | null>(
      null,
    );

  const [
    room,
    setRoom,
  ] =
    useState<ChatRoom | null>(
      null,
    );

  const [
    content,
    setContent,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    connectionStatus,
    setConnectionStatus,
  ] =
    useState<
      | "connecting"
      | "connected"
      | "disconnected"
    >("connecting");

  // ============================================================
  // MARK AS READ
  // ============================================================

  const markRoomAsRead =
    useCallback(
      async () => {
        if (!roomId) {
          return;
        }

        const token =
          await getToken();

        if (!token) {
          return;
        }

        try {
          await markChatRoomAsRead(
            token,
            roomId,
          );

          setRoom(
            (
              currentRoom,
            ) => {
              if (
                !currentRoom ||
                !user
              ) {
                return currentRoom;
              }

              return {
                ...currentRoom,

                messages:
                  currentRoom.messages.map(
                    (
                      message,
                    ) =>
                      message.senderId !==
                        user.id &&
                      !message.isRead
                        ? {
                            ...message,

                            isRead:
                              true,

                            status:
                              "READ",

                            readAt:
                              new Date().toISOString(),
                          }
                        : message,
                  ),
              };
            },
          );
        } catch {
          // Reading the conversation
          // should not fail only because
          // read status could not be updated.
        }
      },
      [
        roomId,
        user,
      ],
    );

  // ============================================================
  // LOAD ROOM
  // ============================================================

  const loadRoom =
    useCallback(
      async () => {
        try {
          setLoading(
            true,
          );

          setError("");

          const storedUser =
            await getStoredUser<AuthUser>();

          const token =
            await getToken();

          setUser(
            storedUser,
          );

          if (
            !token ||
            !storedUser
          ) {
            router.replace(
              "/login",
            );

            return;
          }

          if (
            storedUser.role !==
              "BUYER" &&
            storedUser.role !==
              "PROFESSIONAL"
          ) {
            setError(
              "Messaging is available only to buyers and professionals.",
            );

            return;
          }

          if (!roomId) {
            router.replace(
              "/(tabs)/messages",
            );

            return;
          }

          const data =
            await getChatRoom(
              token,
              roomId,
            );

          setRoom({
            ...data,

            messages:
              sortMessages(
                data.messages ||
                  [],
              ),
          });

          try {
            await markChatRoomAsRead(
              token,
              roomId,
            );
          } catch {
            // Not critical
          }
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load conversation.";

          setError(
            message,
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        roomId,
      ],
    );

  useEffect(() => {
    void loadRoom();
  }, [loadRoom]);

  // ============================================================
  // SOCKET
  // ============================================================

  useEffect(() => {
    if (!roomId) {
      return;
    }

    function handleConnect() {
      setConnectionStatus(
        "connected",
      );

      socket.emit(
        "joinRoom",
        {
          roomId,
        },
      );
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
        message.chatRoomId !==
        roomId
      ) {
        return;
      }

      setRoom(
        (
          currentRoom,
        ) => {
          if (
            !currentRoom
          ) {
            return currentRoom;
          }

          const alreadyExists =
            currentRoom.messages.some(
              (
                currentMessage,
              ) =>
                currentMessage.id ===
                message.id,
            );

          if (
            alreadyExists
          ) {
            return currentRoom;
          }

          return {
            ...currentRoom,

            updatedAt:
              message.createdAt,

            messages:
              sortMessages([
                ...currentRoom.messages,
                message,
              ]),
          };
        },
      );

      if (
        user &&
        message.senderId !==
          user.id
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

    if (
      !socket.connected
    ) {
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
    };
  }, [
    roomId,
    user,
    markRoomAsRead,
  ]);

  // ============================================================
  // MESSAGES
  // ============================================================

  const messages =
    useMemo(
      () =>
        sortMessages(
          room?.messages ||
            [],
        ),
      [
        room?.messages,
      ],
    );

  const buyerName =
    room?.match.lead
      ?.fullName ||
    room?.match.buyer
      ?.fullName ||
    room?.match.buyer
      ?.email ||
    "Buyer";

  const buyerEmail =
    room?.match.lead
      ?.email ||
    room?.match.buyer
      ?.email ||
    null;

  const professionalName =
    room?.match
      .professional
      .user
      .fullName ||
    room?.match
      .professional
      .companyName ||
    room?.match
      .professional
      .user
      .email ||
    "Professional";

  const professionalEmail =
    room?.match
      .professional
      .user
      .email ||
    null;

  const otherPersonName =
    user?.role ===
    "BUYER"
      ? professionalName
      : buyerName;

  const otherPersonEmail =
    user?.role ===
    "BUYER"
      ? professionalEmail
      : buyerEmail;

  const groupedMessages =
    useMemo(() => {
      return messages.map(
        (
          message,
          index,
        ) => {
          const previousMessage =
            index > 0
              ? messages[
                  index - 1
                ]
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
    }, [
      messages,
    ]);

  // ============================================================
  // AUTO SCROLL
  // ============================================================

  useEffect(() => {
    const timeout =
      setTimeout(
        () => {
          scrollViewRef.current?.scrollToEnd({
            animated: true,
          });
        },
        100,
      );

    return () =>
      clearTimeout(
        timeout,
      );
  }, [
    messages.length,
  ]);

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  async function handleSend() {
    const cleanContent =
      content.trim();

    if (
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
      Alert.alert(
        "Message too long",
        `Your message must contain no more than ${MAX_MESSAGE_LENGTH} characters.`,
      );

      return;
    }

    const token =
      await getToken();

    if (!token) {
      Alert.alert(
        "Session expired",
        "Please sign in again.",
      );

      router.replace(
        "/login",
      );

      return;
    }

    try {
      setSending(
        true,
      );

      const newMessage =
        await sendMessage(
          token,
          roomId,
          cleanContent,
        );

      setRoom(
        (
          currentRoom,
        ) => {
          if (
            !currentRoom
          ) {
            return currentRoom;
          }

          const alreadyExists =
            currentRoom.messages.some(
              (
                message,
              ) =>
                message.id ===
                newMessage.id,
            );

          if (
            alreadyExists
          ) {
            return currentRoom;
          }

          return {
            ...currentRoom,

            updatedAt:
              newMessage.createdAt,

            messages:
              sortMessages([
                ...currentRoom.messages,
                newMessage,
              ]),
          };
        },
      );

      setContent("");

      setTimeout(
        () => {
          scrollViewRef.current?.scrollToEnd({
            animated: true,
          });
        },
        100,
      );
    } catch (err) {
      Alert.alert(
        "Message not sent",

        err instanceof Error
          ? err.message
          : "Unable to send message.",
      );
    } finally {
      setSending(
        false,
      );
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="large"
          color={
            PRIMARY
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading conversation...
        </Text>
      </SafeAreaView>
    );
  }

  // ============================================================
  // ERROR / NOT FOUND
  // ============================================================

  if (
    error ||
    !room
  ) {
    return (
      <SafeAreaView
        style={
          styles.center
        }
      >
        <View
          style={
            styles.errorIcon
          }
        >
          <MessageCircle
            size={30}
            color={
              PRIMARY
            }
          />
        </View>

        <Text
          style={
            styles.errorTitle
          }
        >
          Conversation unavailable
        </Text>

        <Text
          style={
            styles.errorDescription
          }
        >
          {error ||
            "This conversation is not available."}
        </Text>

        <Pressable
          onPress={() =>
            router.replace(
              "/(tabs)/messages",
            )
          }
          style={
            styles.backButtonLarge
          }
        >
          <ArrowLeft
            size={17}
            color={
              WHITE
            }
          />

          <Text
            style={
              styles.backButtonLargeText
            }
          >
            Back to messages
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <SafeAreaView
      edges={[
        "top",
        "bottom",
      ]}
      style={
        styles.safeArea
      }
    >
      <KeyboardAvoidingView
        style={
          styles.keyboardView
        }
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : undefined
        }
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View
          style={
            styles.header
          }
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            style={({ pressed }) => [
              styles.backButton,

              pressed && {
                opacity: 0.65,
              },
            ]}
          >
            <ArrowLeft
              size={21}
              color={
                PRIMARY
              }
            />
          </Pressable>

          <View
            style={
              styles.headerAvatar
            }
          >
            <Text
              style={
                styles.headerAvatarText
              }
            >
              {getInitial(
                otherPersonName,
                otherPersonEmail,
              )}
            </Text>
          </View>

          <View
            style={
              styles.headerContent
            }
          >
            <View
              style={
                styles.nameRow
              }
            >
              <Text
                numberOfLines={
                  1
                }
                style={
                  styles.personName
                }
              >
                {
                  otherPersonName
                }
              </Text>

              <View
                style={[
                  styles.connectionBadge,

                  connectionStatus ===
                    "connected"
                    ? styles.connectionConnected
                    : connectionStatus ===
                        "connecting"
                      ? styles.connectionConnecting
                      : styles.connectionDisconnected,
                ]}
              >
                <View
                  style={[
                    styles.connectionDot,

                    connectionStatus ===
                      "connected"
                      ? styles.dotConnected
                      : connectionStatus ===
                          "connecting"
                        ? styles.dotConnecting
                        : styles.dotDisconnected,
                  ]}
                />

                <Text
                  style={[
                    styles.connectionText,

                    connectionStatus ===
                      "connected"
                      ? styles.connectionTextConnected
                      : connectionStatus ===
                          "connecting"
                        ? styles.connectionTextConnecting
                        : styles.connectionTextDisconnected,
                  ]}
                >
                  {connectionStatus ===
                  "connected"
                    ? "Live"
                    : connectionStatus ===
                        "connecting"
                      ? "Connecting"
                      : "Offline"}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.headerMeta
              }
            >
              <View
                style={
                  styles.headerMetaItem
                }
              >
                <MapPin
                  size={13}
                  color={
                    MUTED
                  }
                />

                <Text
                  numberOfLines={
                    1
                  }
                  style={
                    styles.headerMetaText
                  }
                >
                  {room.match
                    .lead
                    ?.location ||
                    "Portugal"}
                </Text>
              </View>

              <View
                style={
                  styles.headerMetaItem
                }
              >
                <WalletCards
                  size={13}
                  color={
                    MUTED
                  }
                />

                <Text
                  numberOfLines={
                    1
                  }
                  style={
                    styles.headerMetaText
                  }
                >
                  {room.match
                    .lead
                    ?.budget ||
                    "Budget not specified"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================================================= */}
        {/* MESSAGES */}
        {/* ================================================= */}

        <ScrollView
          ref={
            scrollViewRef
          }
          style={
            styles.messagesContainer
          }
          contentContainerStyle={
            messages.length ===
            0
              ? styles.emptyMessagesContent
              : styles.messagesContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({
              animated: false,
            });
          }}
        >
          {messages.length ===
          0 ? (
            <View
              style={
                styles.emptyMessages
              }
            >
              <View
                style={
                  styles.emptyMessagesIcon
                }
              >
                <MessageCircle
                  size={31}
                  color={
                    PRIMARY
                  }
                />
              </View>

              <Text
                style={
                  styles.emptyMessagesTitle
                }
              >
                Start the conversation
              </Text>

              <Text
                style={
                  styles.emptyMessagesDescription
                }
              >
                Send your first
                message to{" "}
                {
                  otherPersonName
                }.
              </Text>
            </View>
          ) : (
            groupedMessages.map(
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
                  <View
                    key={
                      message.id
                    }
                  >
                    {showDay && (
                      <View
                        style={
                          styles.dayDivider
                        }
                      >
                        <View
                          style={
                            styles.dayLine
                          }
                        />

                        <View
                          style={
                            styles.dayBadge
                          }
                        >
                          <Text
                            style={
                              styles.dayText
                            }
                          >
                            {formatDayLabel(
                              message.createdAt,
                            )}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.dayLine
                          }
                        />
                      </View>
                    )}

                    <View
                      style={[
                        styles.messageRow,

                        isMine
                          ? styles.messageRowMine
                          : styles.messageRowOther,
                      ]}
                    >
                      {!isMine && (
                        <View
                          style={
                            styles.smallAvatarOther
                          }
                        >
                          <Text
                            style={
                              styles.smallAvatarText
                            }
                          >
                            {getInitial(
                              senderName,
                              senderEmail,
                            )}
                          </Text>
                        </View>
                      )}

                      <View
                        style={
                          styles.messageWrapper
                        }
                      >
                        <View
                          style={[
                            styles.messageBubble,

                            isMine
                              ? styles.messageMine
                              : styles.messageOther,
                          ]}
                        >
                          <Text
                            style={[
                              styles.messageContent,

                              isMine
                                ? styles.messageContentMine
                                : styles.messageContentOther,
                            ]}
                          >
                            {
                              message.content
                            }
                          </Text>

                          <View
                            style={
                              styles.messageFooter
                            }
                          >
                            <Clock3
                              size={11}
                              color={
                                isMine
                                  ? "rgba(255,255,255,0.65)"
                                  : "#98A2B3"
                              }
                            />

                            <Text
                              style={[
                                styles.messageTime,

                                isMine
                                  ? styles.messageTimeMine
                                  : styles.messageTimeOther,
                              ]}
                            >
                              {formatMessageTime(
                                message.createdAt,
                              )}
                            </Text>

                            {isMine && (
                              <View
                                style={
                                  styles.readStatus
                                }
                              >
                                <CheckCheck
                                  size={
                                    13
                                  }
                                  color={
                                    message.status ===
                                      "READ" ||
                                    message.isRead
                                      ? "#8DD4FF"
                                      : "rgba(255,255,255,0.60)"
                                  }
                                />

                                <Text
                                  style={[
                                    styles.readText,

                                    (message.status ===
                                      "READ" ||
                                      message.isRead) &&
                                      styles.readTextSeen,
                                  ]}
                                >
                                  {message.status ===
                                    "READ" ||
                                  message.isRead
                                    ? "Seen"
                                    : "Sent"}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      {isMine && (
                        <View
                          style={
                            styles.smallAvatarMine
                          }
                        >
                          <Text
                            style={
                              styles.smallAvatarText
                            }
                          >
                            {getInitial(
                              senderName,
                              senderEmail,
                            )}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              },
            )
          )}
        </ScrollView>

        {/* ================================================= */}
        {/* COMPOSER */}
        {/* ================================================= */}

        <View
          style={
            styles.composer
          }
        >
          <View
            style={
              styles.inputWrapper
            }
          >
            <TextInput
              value={
                content
              }
              onChangeText={
                setContent
              }
              placeholder={`Write a message to ${otherPersonName}...`}
              placeholderTextColor="#98A2B3"
              multiline
              maxLength={
                MAX_MESSAGE_LENGTH
              }
              style={
                styles.input
              }
            />

            <Text
              style={[
                styles.characterCount,

                content.length >
                  MAX_MESSAGE_LENGTH *
                    0.9 && {
                  color:
                    "#D97706",
                },
              ]}
            >
              {content.length}/
              {
                MAX_MESSAGE_LENGTH
              }
            </Text>
          </View>

          <Pressable
            disabled={
              sending ||
              !content.trim()
            }
            onPress={() =>
              void handleSend()
            }
            style={({
              pressed,
            }) => [
              styles.sendButton,

              (sending ||
                !content.trim()) &&
                styles.sendButtonDisabled,

              pressed &&
                !sending && {
                  opacity:
                    0.82,
                },
            ]}
          >
            {sending ? (
              <ActivityIndicator
                size="small"
                color={
                  WHITE
                }
              />
            ) : (
              <Send
                size={21}
                color={
                  WHITE
                }
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        WHITE,
    },

    keyboardView: {
      flex: 1,
    },

    center: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        BACKGROUND,
      paddingHorizontal: 24,
    },

    loadingText: {
      marginTop: 13,
      color: MUTED,
      fontSize: 14,
    },

    header: {
      minHeight: 88,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      borderBottomWidth: 1,
      borderBottomColor:
        "#EAECF0",
      backgroundColor:
        WHITE,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        WHITE,
    },

    headerAvatar: {
      width: 47,
      height: 47,
      borderRadius: 24,
      backgroundColor:
        PRIMARY,
      alignItems: "center",
      justifyContent: "center",
    },

    headerAvatarText: {
      color: WHITE,
      fontSize: 18,
      fontWeight: "800",
    },

    headerContent: {
      flex: 1,
      minWidth: 0,
    },

    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    personName: {
      flexShrink: 1,
      color: NAVY,
      fontSize: 17,
      fontWeight: "800",
    },

    connectionBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    connectionConnected: {
      backgroundColor:
        "#ECFDF3",
    },

    connectionConnecting: {
      backgroundColor:
        "#FFFBEB",
    },

    connectionDisconnected: {
      backgroundColor:
        "#FEF2F2",
    },

    connectionDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    dotConnected: {
      backgroundColor:
        "#22C55E",
    },

    dotConnecting: {
      backgroundColor:
        "#F59E0B",
    },

    dotDisconnected: {
      backgroundColor:
        "#EF4444",
    },

    connectionText: {
      fontSize: 9,
      fontWeight: "800",
    },

    connectionTextConnected: {
      color: "#15803D",
    },

    connectionTextConnecting: {
      color: "#B45309",
    },

    connectionTextDisconnected: {
      color: "#B42318",
    },

    headerMeta: {
      marginTop: 5,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 9,
    },

    headerMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      maxWidth: 140,
    },

    headerMetaText: {
      flexShrink: 1,
      color: MUTED,
      fontSize: 10,
    },

    messagesContainer: {
      flex: 1,
      backgroundColor:
        BACKGROUND,
    },

    messagesContent: {
      paddingHorizontal: 14,
      paddingVertical: 20,
      paddingBottom: 28,
    },

    emptyMessagesContent: {
      flexGrow: 1,
      justifyContent:
        "center",
      paddingHorizontal: 24,
    },

    emptyMessages: {
      alignItems: "center",
    },

    emptyMessagesIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor:
        "#EEF3F8",
      alignItems: "center",
      justifyContent: "center",
    },

    emptyMessagesTitle: {
      marginTop: 16,
      color: NAVY,
      fontSize: 19,
      fontWeight: "800",
    },

    emptyMessagesDescription: {
      marginTop: 7,
      color: MUTED,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
    },

    dayDivider: {
      marginVertical: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    dayLine: {
      flex: 1,
      height: 1,
      backgroundColor:
        BORDER,
    },

    dayBadge: {
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        WHITE,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },

    dayText: {
      color: MUTED,
      fontSize: 10,
      fontWeight: "700",
    },

    messageRow: {
      marginBottom: 13,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
    },

    messageRowMine: {
      justifyContent:
        "flex-end",
    },

    messageRowOther: {
      justifyContent:
        "flex-start",
    },

    messageWrapper: {
      maxWidth: "76%",
    },

    messageBubble: {
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },

    messageMine: {
      borderBottomRightRadius: 5,
      backgroundColor:
        PRIMARY,
    },

    messageOther: {
      borderBottomLeftRadius: 5,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        WHITE,
    },

    messageContent: {
      fontSize: 14,
      lineHeight: 21,
    },

    messageContentMine: {
      color: WHITE,
    },

    messageContentOther: {
      color: NAVY,
    },

    messageFooter: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "flex-end",
      gap: 4,
    },

    messageTime: {
      fontSize: 9,
    },

    messageTimeMine: {
      color:
        "rgba(255,255,255,0.65)",
    },

    messageTimeOther: {
      color: "#98A2B3",
    },

    readStatus: {
      marginLeft: 3,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },

    readText: {
      color:
        "rgba(255,255,255,0.60)",
      fontSize: 9,
    },

    readTextSeen: {
      color: "#8DD4FF",
    },

    smallAvatarOther: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        PRIMARY,
      alignItems: "center",
      justifyContent: "center",
    },

    smallAvatarMine: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        GOLD,
      alignItems: "center",
      justifyContent: "center",
    },

    smallAvatarText: {
      color: WHITE,
      fontSize: 11,
      fontWeight: "800",
    },

    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      borderTopWidth: 1,
      borderTopColor:
        "#EAECF0",
      backgroundColor:
        WHITE,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },

    inputWrapper: {
      flex: 1,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      borderRadius: 17,
      backgroundColor:
        WHITE,
      paddingHorizontal: 14,
      paddingTop: 9,
      paddingBottom: 6,
    },

    input: {
      minHeight: 38,
      maxHeight: 110,
      color: NAVY,
      fontSize: 14,
      lineHeight: 20,
      padding: 0,
      textAlignVertical:
        "top",
    },

    characterCount: {
      marginTop: 4,
      alignSelf: "flex-end",
      color: "#98A2B3",
      fontSize: 9,
    },

    sendButton: {
      width: 52,
      height: 52,
      borderRadius: 17,
      backgroundColor:
        PRIMARY,
      alignItems: "center",
      justifyContent: "center",
    },

    sendButtonDisabled: {
      opacity: 0.45,
    },

    errorIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor:
        "#EEF3F8",
      alignItems: "center",
      justifyContent: "center",
    },

    errorTitle: {
      marginTop: 17,
      color: NAVY,
      fontSize: 20,
      fontWeight: "800",
      textAlign: "center",
    },

    errorDescription: {
      marginTop: 8,
      color: MUTED,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
    },

    backButtonLarge: {
      marginTop: 20,
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 15,
      backgroundColor:
        PRIMARY,
      paddingHorizontal: 20,
    },

    backButtonLargeText: {
      color: WHITE,
      fontSize: 14,
      fontWeight: "800",
    },
  });