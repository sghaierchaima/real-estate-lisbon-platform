import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import AppMenu from "@/components/AppMenu";
import { useAppMenu } from "@/hooks/useAppMenu";



import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  CheckCheck,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Search,
} from "lucide-react-native";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  router,
} from "expo-router";

import {
  getChatRooms,
  type ChatRoom,
} from "@/lib/chat-api";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import type {
  AuthUser,
} from "@/types/auth";

// ============================================================
// CONSTANTS
// ============================================================

const NAVY = "#0F2340";
const PRIMARY = "#1B365D";
const GOLD = "#C9A227";

const MUTED = "#667085";
const BORDER = "#E4E7EC";
const BACKGROUND = "#F8F9FA";
const WHITE = "#FFFFFF";

const ITEMS_PER_PAGE = 3;

type ConversationFilter =
  | "ALL"
  | "UNREAD"
  | "READ"
  | "EMPTY";

// ============================================================
// HELPERS
// ============================================================

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
    "C"
  );
}

function timeAgo(
  date?: string | null,
) {
  if (!date) {
    return "No activity yet";
  }

  const timestamp =
    new Date(date).getTime();

  if (
    Number.isNaN(
      timestamp,
    )
  ) {
    return "Unknown date";
  }

  const difference =
    Date.now() -
    timestamp;

  const minutes =
    Math.floor(
      difference /
      60000,
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `${hours} hour${hours > 1
      ? "s"
      : ""
      } ago`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  if (days < 30) {
    return `${days} day${days > 1
      ? "s"
      : ""
      } ago`;
  }

  return new Date(
    date,
  ).toLocaleDateString();
}

function getLastMessage(
  room: ChatRoom,
) {
  if (
    !room.messages?.length
  ) {
    return null;
  }

  return [
    ...room.messages,
  ].sort(
    (
      first,
      second,
    ) =>
      new Date(
        second.createdAt,
      ).getTime() -
      new Date(
        first.createdAt,
      ).getTime(),
  )[0];
}

function getUnreadCount(
  room: ChatRoom,
  currentUserId?: string,
) {
  if (
    !currentUserId
  ) {
    return 0;
  }

  return (
    room.messages || []
  ).filter(
    (message) =>
      !message.isRead &&
      message.senderId !==
      currentUserId,
  ).length;
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  value,
  title,
  icon,
}: {
  value: number;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <View
      style={
        styles.statCard
      }
    >
      <View
        style={
          styles.statIcon
        }
      >
        {icon}
      </View>

      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.statTitle
        }
      >
        {title}
      </Text>
    </View>
  );
}

// ============================================================
// SCREEN
// ============================================================

export default function MessagesScreen() {
  const {
    menuVisible,
    menuUser,
    savedCount,
    unreadMessages,
    openMenu,
    closeMenu,
  } = useAppMenu();

  const [
    currentUser,
    setCurrentUser,
  ] =
    useState<AuthUser | null>(
      null,
    );

  const [
    rooms,
    setRooms,
  ] =
    useState<ChatRoom[]>(
      [],
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<ConversationFilter>(
      "ALL",
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  // ============================================================
  // LOAD
  // ============================================================
  const loadRooms =
    useCallback(
      async (
        refresh = false,
      ) => {
        try {
          if (refresh) {
            setRefreshing(
              true,
            );
          } else {
            setLoading(
              true,
            );
          }

          setError("");

          const user =
            await getStoredUser<AuthUser>();

          const token =
            await getToken();

          setCurrentUser(
            user,
          );

          if (
            !token ||
            !user
          ) {
            router.replace(
              "/login",
            );
            return;
          }

          if (
            user.role !==
            "BUYER" &&
            user.role !==
            "PROFESSIONAL"
          ) {
            setRooms(
              [],
            );

            setError(
              "Messaging is available only to buyers and professionals.",
            );

            return;
          }

          const data =
            await getChatRooms(
              token,
            );

          setRooms(
            Array.isArray(
              data,
            )
              ? data
              : [],
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load conversations.",
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [],
    );
useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  // ============================================================
  // ROOM SUMMARY
  // ============================================================

  const roomSummaries =
    useMemo(() => {
      return rooms.map(
        (room) => {
          const lastMessage =
            getLastMessage(
              room,
            );

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
              ? room.match
                .lead
                ?.fullName ||
              room.match
                .buyer
                ?.fullName ||
              room.match
                .buyer
                ?.email ||
              "Buyer"
              : room.match
                .professional
                .user
                .fullName ||
              room.match
                .professional
                .companyName ||
              room.match
                .professional
                .user
                .email ||
              "Professional";

          const displayEmail =
            isProfessional
              ? room.match
                .lead
                ?.email ||
              room.match
                .buyer
                ?.email ||
              null
              : room.match
                .professional
                .user
                .email;

          const location =
            room.match
              .lead
              ?.location ||
            "Portugal";

          const budget =
            room.match
              .lead
              ?.budget ||
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
        },
      );
    }, [
      rooms,
      currentUser?.id,
      currentUser?.role,
    ]);

  // ============================================================
  // STATS
  // ============================================================

  const stats =
    useMemo(() => {
      const unread =
        roomSummaries.filter(
          (item) =>
            item.unreadCount >
            0,
        ).length;

      const read =
        roomSummaries.filter(
          (item) =>
            Boolean(
              item.lastMessage,
            ) &&
            item.unreadCount ===
            0,
        ).length;

      const empty =
        roomSummaries.filter(
          (item) =>
            !item.lastMessage,
        ).length;

      return {
        total:
          roomSummaries.length,

        unread,

        read,

        empty,
      };
    }, [
      roomSummaries,
    ]);

  // ============================================================
  // FILTER
  // ============================================================

  const filteredRooms =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return roomSummaries.filter(
        (item) => {
          const matchesFilter =
            filter ===
            "ALL" ||
            (filter ===
              "UNREAD" &&
              item.unreadCount >
              0) ||
            (filter ===
              "READ" &&
              Boolean(
                item.lastMessage,
              ) &&
              item.unreadCount ===
              0) ||
            (filter ===
              "EMPTY" &&
              !item.lastMessage);

          if (
            !matchesFilter
          ) {
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
            item.lastMessage
              ?.content,
            item.room.match
              .professional
              .companyName,
          ]
            .filter(
              Boolean,
            )
            .join(" ")
            .toLowerCase()
            .includes(
              query,
            );
        },
      );
    }, [
      roomSummaries,
      search,
      filter,
    ]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRooms.length / ITEMS_PER_PAGE),
  );

  const paginatedRooms = useMemo(() => {
    const startIndex =
      (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredRooms.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [filteredRooms, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={styles.safeArea}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={PRIMARY}
          />
          <Text style={styles.loading}>
            Loading conversations...
          </Text>
        </View>


        <AppMenu
          visible={menuVisible}
          onClose={closeMenu}
          user={menuUser ?? currentUser}
          savedCount={savedCount}
          unreadMessages={unreadMessages}
        />
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
      ]}
      style={
        styles.safeArea
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void loadRooms(
                true,
              )
            }
            tintColor={
              PRIMARY
            }
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        <AppHeader
          eyebrow="COMMUNICATION"
          title="Messages"
          subtitle="Stay connected with matched professionals and manage your conversations."
          onMenuPress={openMenu}
        />

        {/* STATS */}

        {!error && (
          <View
            style={
              styles.stats
            }
          >
            <StatCard
              value={
                stats.total
              }
              title="Conversations"
              icon={
                <MessageCircle
                  size={
                    21
                  }
                  color={
                    PRIMARY
                  }
                />
              }
            />

            <StatCard
              value={
                stats.unread
              }
              title="Unread"
              icon={
                <Mail
                  size={
                    21
                  }
                  color="#DC2626"
                />
              }
            />

            <StatCard
              value={
                stats.read
              }
              title="Read"
              icon={
                <CheckCheck
                  size={
                    21
                  }
                  color="#15803D"
                />
              }
            />

            <StatCard
              value={
                stats.empty
              }
              title="No Messages"
              icon={
                <Clock3
                  size={
                    21
                  }
                  color="#D97706"
                />
              }
            />
          </View>
        )}

        {/* ERROR */}

        {error ? (
          <View
            style={
              styles.errorCard
            }
          >
            <Text
              style={
                styles.errorTitle
              }
            >
              Unable to load messages
            </Text>

            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>
          </View>
        ) : (
          <>
            {/* SEARCH */}

            <View
              style={
                styles.searchBox
              }
            >
              <Search
                size={19}
                color="#98A2B3"
              />

              <TextInput
                value={
                  search
                }
                onChangeText={
                  setSearch
                }
                placeholder="Search conversations..."
                placeholderTextColor="#98A2B3"
                style={
                  styles.searchInput
                }
              />
            </View>

            {/* FILTERS */}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.filters
              }
            >
              {[
                {
                  label: "All",
                  value:
                    "ALL" as const,
                  count:
                    stats.total,
                },
                {
                  label:
                    "Unread",
                  value:
                    "UNREAD" as const,
                  count:
                    stats.unread,
                },
                {
                  label:
                    "Read",
                  value:
                    "READ" as const,
                  count:
                    stats.read,
                },
                {
                  label:
                    "No messages",
                  value:
                    "EMPTY" as const,
                  count:
                    stats.empty,
                },
              ].map(
                (item) => {
                  const active =
                    item.value ===
                    filter;

                  return (
                    <Pressable
                      key={
                        item.value
                      }
                      onPress={() =>
                        setFilter(
                          item.value,
                        )
                      }
                      style={[
                        styles.filter,
                        active &&
                        styles.filterActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          active &&
                          styles.filterTextActive,
                        ]}
                      >
                        {
                          item.label
                        }{" "}
                        {
                          item.count
                        }
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </ScrollView>

            {/* ROOMS */}

            {filteredRooms.length ===
              0 ? (
              <View
                style={
                  styles.empty
                }
              >
                <View
                  style={
                    styles.emptyIcon
                  }
                >
                  <MessageCircle
                    size={
                      30
                    }
                    color={
                      PRIMARY
                    }
                  />
                </View>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  {rooms.length ===
                    0
                    ? "No conversations yet"
                    : "No conversations found"}
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  {rooms.length ===
                    0
                    ? "A conversation will appear when a professional contacts a buyer."
                    : "Try another search or filter."}
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.roomList
                }
              >
                {paginatedRooms.map(
                  (item) => (
                    <Pressable
                      key={
                        item.room.id
                      }
                      onPress={() =>
                        router.push({
                          pathname: "/messages/[id]",
                          params: {
                            id: item.room.id,
                          },
                        })
                      }
                      style={({ pressed }) => [
                        styles.roomCard,

                        item.unreadCount >
                        0 &&
                        styles.roomUnread,

                        pressed && {
                          opacity:
                            0.82,
                        },
                      ]}
                    >
                      <View
                        style={
                          styles.avatarWrapper
                        }
                      >
                        <View
                          style={
                            styles.avatar
                          }
                        >
                          <Text
                            style={
                              styles.avatarText
                            }
                          >
                            {getInitial(
                              item.displayName,
                              item.displayEmail,
                            )}
                          </Text>
                        </View>

                        {item.unreadCount >
                          0 && (
                            <View
                              style={
                                styles.unreadBadge
                              }
                            >
                              <Text
                                style={
                                  styles.unreadBadgeText
                                }
                              >
                                {item.unreadCount >
                                  9
                                  ? "9+"
                                  : item.unreadCount}
                              </Text>
                            </View>
                          )}
                      </View>

                      <View
                        style={
                          styles.roomBody
                        }
                      >
                        <View
                          style={
                            styles.roomTop
                          }
                        >
                          <Text
                            numberOfLines={
                              1
                            }
                            style={
                              styles.roomName
                            }
                          >
                            {
                              item.displayName
                            }
                          </Text>

                          <Text
                            style={
                              styles.time
                            }
                          >
                            {timeAgo(
                              item
                                .lastMessage
                                ?.createdAt ||
                              item
                                .room
                                .updatedAt,
                            )}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.metaRow
                          }
                        >
                          <MapPin
                            size={
                              14
                            }
                            color={
                              MUTED
                            }
                          />

                          <Text
                            numberOfLines={
                              1
                            }
                            style={
                              styles.meta
                            }
                          >
                            {
                              item.location
                            }
                          </Text>

                          <Text
                            style={
                              styles.dot
                            }
                          >
                            •
                          </Text>

                          <Text
                            numberOfLines={
                              1
                            }
                            style={
                              styles.meta
                            }
                          >
                            {
                              item.budget
                            }
                          </Text>
                        </View>

                        <Text
                          numberOfLines={
                            2
                          }
                          style={[
                            styles.preview,

                            item.unreadCount >
                            0 &&
                            styles.previewUnread,
                          ]}
                        >
                          {item
                            .lastMessage
                            ?.content ||
                            "No messages yet. Open the conversation to send the first message."}
                        </Text>
                      </View>
                    </Pressable>
                  ),
                )}
              </View>
            )}

            {filteredRooms.length > ITEMS_PER_PAGE && (
              <View style={styles.pagination}>
                <Pressable
                  disabled={currentPage === 1}
                  onPress={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1),
                    )
                  }
                  style={[
                    styles.pageButton,
                    currentPage === 1 &&
                      styles.pageButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageButtonText,
                      currentPage === 1 &&
                        styles.pageButtonTextDisabled,
                    ]}
                  >
                    Previous
                  </Text>
                </Pressable>

                <View style={styles.pageIndicator}>
                  <Text style={styles.pageIndicatorText}>
                    {currentPage} / {totalPages}
                  </Text>
                </View>

                <Pressable
                  disabled={currentPage === totalPages}
                  onPress={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1),
                    )
                  }
                  style={[
                    styles.pageButton,
                    currentPage === totalPages &&
                      styles.pageButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageButtonText,
                      currentPage === totalPages &&
                        styles.pageButtonTextDisabled,
                    ]}
                  >
                    Next
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        <View
          style={{
            height: 30,
          }}
        />
      </ScrollView>


      <AppMenu
        visible={menuVisible}
        onClose={closeMenu}
        user={menuUser ?? currentUser}
        savedCount={savedCount}
        unreadMessages={unreadMessages}
      />
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
        BACKGROUND,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 20,
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        BACKGROUND,
    },

    loading: {
      marginTop: 12,
      color: MUTED,
      fontSize: 14,
    },

    eyebrow: {
      color: GOLD,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1.4,
    },

    title: {
      marginTop: 7,
      color: NAVY,
      fontSize: 36,
      lineHeight: 41,
      fontWeight: "800",
      letterSpacing: -1,
    },

    subtitle: {
      marginTop: 9,
      color: MUTED,
      fontSize: 15,
      lineHeight: 23,
    },

    stats: {
      marginTop: 24,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 11,
    },

    statCard: {
      width: "48%",
      minHeight: 132,
      borderWidth: 1,
      borderColor:
        BORDER,
      borderRadius: 21,
      backgroundColor:
        WHITE,
      padding: 16,
    },

    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "#F8FAFC",
    },

    statValue: {
      marginTop: 16,
      color: NAVY,
      fontSize: 27,
      fontWeight: "800",
    },

    statTitle: {
      marginTop: 2,
      color: MUTED,
      fontSize: 12,
      fontWeight: "600",
    },

    searchBox: {
      marginTop: 20,
      height: 55,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      borderRadius: 17,
      backgroundColor:
        WHITE,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    searchInput: {
      flex: 1,
      color: NAVY,
      fontSize: 14,
    },

    filters: {
      paddingTop: 14,
      paddingBottom: 4,
      gap: 8,
    },

    filter: {
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      backgroundColor:
        WHITE,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },

    filterActive: {
      borderColor:
        PRIMARY,
      backgroundColor:
        PRIMARY,
    },

    filterText: {
      color: "#344054",
      fontSize: 12,
      fontWeight: "700",
    },

    filterTextActive: {
      color: WHITE,
    },

    roomList: {
      marginTop: 13,
      gap: 12,
    },

    roomCard: {
      flexDirection: "row",
      gap: 13,
      padding: 16,
      borderRadius: 21,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        WHITE,
    },

    roomUnread: {
      backgroundColor:
        "#F8FBFF",
      borderColor:
        "#C9D8E7",
    },

    avatarWrapper: {
      position: "relative",
    },

    avatar: {
      width: 51,
      height: 51,
      borderRadius: 26,
      backgroundColor:
        PRIMARY,
      alignItems: "center",
      justifyContent: "center",
    },

    avatarText: {
      color: WHITE,
      fontSize: 19,
      fontWeight: "800",
    },

    unreadBadge: {
      position: "absolute",
      right: -5,
      top: -5,
      minWidth: 21,
      height: 21,
      borderRadius: 11,
      backgroundColor:
        "#EF4444",
      borderWidth: 2,
      borderColor:
        WHITE,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },

    unreadBadgeText: {
      color: WHITE,
      fontSize: 9,
      fontWeight: "900",
    },

    roomBody: {
      flex: 1,
      minWidth: 0,
    },

    roomTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 8,
    },

    roomName: {
      flex: 1,
      color: NAVY,
      fontSize: 16,
      fontWeight: "800",
    },

    time: {
      color: "#98A2B3",
      fontSize: 10,
    },

    metaRow: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    meta: {
      maxWidth: 110,
      color: MUTED,
      fontSize: 11,
    },

    dot: {
      color: "#98A2B3",
      fontSize: 10,
    },

    preview: {
      marginTop: 9,
      color: MUTED,
      fontSize: 13,
      lineHeight: 19,
    },

    previewUnread: {
      color: "#344054",
      fontWeight: "700",
    },

    empty: {
      marginTop: 18,
      borderWidth: 1,
      borderColor:
        BORDER,
      borderRadius: 23,
      backgroundColor:
        WHITE,
      padding: 34,
      alignItems: "center",
    },

    emptyIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor:
        "#EEF3F8",
      alignItems: "center",
      justifyContent: "center",
    },

    emptyTitle: {
      marginTop: 16,
      color: NAVY,
      fontSize: 19,
      fontWeight: "800",
    },

    emptyText: {
      marginTop: 7,
      color: MUTED,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
    },

    pagination: {
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },

    pageButton: {
      minWidth: 94,
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: PRIMARY,
      alignItems: "center",
      justifyContent: "center",
    },

    pageButtonDisabled: {
      backgroundColor: "#EAECF0",
    },

    pageButtonText: {
      color: WHITE,
      fontSize: 12,
      fontWeight: "800",
    },

    pageButtonTextDisabled: {
      color: "#98A2B3",
    },

    pageIndicator: {
      minHeight: 44,
      paddingHorizontal: 15,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: WHITE,
      alignItems: "center",
      justifyContent: "center",
    },

    pageIndicatorText: {
      color: NAVY,
      fontSize: 12,
      fontWeight: "800",
    },

    errorCard: {
      marginTop: 20,
      borderWidth: 1,
      borderColor:
        "#FECACA",
      borderRadius: 19,
      backgroundColor:
        "#FEF2F2",
      padding: 17,
    },

    errorTitle: {
      color: "#B42318",
      fontWeight: "800",
      fontSize: 15,
    },

    errorText: {
      marginTop: 5,
      color: "#B42318",
      lineHeight: 19,
      fontSize: 13,
    },
  });