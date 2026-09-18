import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Bell,
  CheckCheck,
  Clock3,
  FileText,
  GitBranch,
  Home,
  Search,
  Trash2,
} from "lucide-react-native";
import {
  router,
  type Href,
} from "expo-router";


import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationFilter,
  type NotificationItem,
} from "@/lib/notifications-api";

import {
  getToken,
} from "@/lib/session";

import {
  Colors,
} from "@/constants/colors";

function timeAgo(
  date: string,
) {
  const timestamp =
    new Date(date).getTime();

  if (
    Number.isNaN(
      timestamp,
    )
  ) {
    return "Unknown date";
  }

  const diff =
    Date.now() -
    timestamp;

  const minutes =
    Math.floor(
      diff / 60000,
    );

  if (
    minutes < 1
  ) {
    return "Just now";
  }

  if (
    minutes < 60
  ) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (
    hours < 24
  ) {
    return `${hours} hour${
      hours > 1
        ? "s"
        : ""
    } ago`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  if (
    days < 30
  ) {
    return `${days} day${
      days > 1
        ? "s"
        : ""
    } ago`;
  }

  return new Date(
    date,
  ).toLocaleDateString();
}

function getNotificationIcon(
  type: string,
) {
  if (
    type ===
    "PROPERTY_MATCH"
  ) {
    return Home;
  }

  if (
    type ===
    "MATCH"
  ) {
    return GitBranch;
  }

  if (
    type ===
    "STORY"
  ) {
    return FileText;
  }

  return Bell;
}

function getNotificationColors(
  type: string,
) {
  if (
    type ===
    "PROPERTY_MATCH"
  ) {
    return {
      bg: "#DCFCE7",
      text: "#15803D",
    };
  }

  if (
    type ===
    "MATCH"
  ) {
    return {
      bg: "#F3E8FF",
      text: "#7C3AED",
    };
  }

  if (
    type ===
    "STORY"
  ) {
    return {
      bg: "#FEF3C7",
      text: "#B45309",
    };
  }

  if (
    type ===
    "PROPERTY_REQUEST"
  ) {
    return {
      bg: "#DBEAFE",
      text: "#2563EB",
    };
  }

  return {
    bg: "#EEF3F8",
    text: Colors.navy,
  };
}

export default function NotificationsScreen() {
  const [
    notifications,
    setNotifications,
  ] =
    useState<
      NotificationItem[]
    >([]);

  const [
    filter,
    setFilter,
  ] =
    useState<
      NotificationFilter
    >("all");

  const [
    search,
    setSearch,
  ] =
    useState("");

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
    markingAll,
    setMarkingAll,
  ] =
    useState(false);

  const loadNotifications =
    useCallback(
      async (
        refresh = false,
      ) => {
        const token =
          await getToken();

        if (!token) {
          router.replace(
            "/login",
          );

          return;
        }

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

          const data =
            await getNotifications(
              token,
            );

          setNotifications(
            Array.isArray(
              data,
            )
              ? data
              : [],
          );
        } catch (
          error
        ) {
          Alert.alert(
            "Unable to load notifications",
            error instanceof Error
              ? error.message
              : "Please try again.",
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
    void loadNotifications();
  }, [
    loadNotifications,
  ]);

  const stats =
    useMemo(
      () => {
        const unread =
          notifications.filter(
            (
              item,
            ) =>
              !item.isRead,
          ).length;

        return {
          total:
            notifications.length,
          unread,
          read:
            notifications.length -
            unread,
        };
      },
      [
        notifications,
      ],
    );

  const filtered =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return notifications.filter(
          (
            notification,
          ) => {
            const matchesFilter =
              filter ===
                "all" ||
              (filter ===
                "read" &&
                notification.isRead) ||
              (filter ===
                "unread" &&
                !notification.isRead);

            if (
              !matchesFilter
            ) {
              return false;
            }

            if (
              !query
            ) {
              return true;
            }

            return [
              notification.title,
              notification.message,
              notification.type,
            ]
              .join(
                " ",
              )
              .toLowerCase()
              .includes(
                query,
              );
          },
        );
      },
      [
        notifications,
        filter,
        search,
      ],
    );

  async function handleOpen(
    item: NotificationItem,
  ) {
    const token =
      await getToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    try {
      if (
        !item.isRead
      ) {
        const updated =
          await markNotificationAsRead(
            token,
            item.id,
          );

        setNotifications(
          (
            current,
          ) =>
            current.map(
              (
                notification,
              ) =>
                notification.id ===
                item.id
                  ? {
                      ...notification,
                      ...updated,
                      isRead: true,
                    }
                  : notification,
            ),
        );
      }
    } catch {
      // Navigation can still continue.
    }

    if (
      item.type ===
        "PROPERTY_MATCH" &&
      item.propertyId
    ) {
      router.push({
        pathname:
          "/properties/[id]",
        params: {
          id:
            item.propertyId,
        },
      });

      return;
    }

    if (
      item.type ===
        "MATCH" ||
      item.type ===
        "PROPERTY_REQUEST"
    ) {
      router.push(
        "/(tabs)/requests",
      );

      return;
    }

    if (
      item.type ===
      "STORY"
    ) {
      router.push(
        "/stories" as Href,
      );

      return;
    }
  }

  async function handleMarkAll() {
    const token =
      await getToken();

    if (
      !token ||
      markingAll
    ) {
      return;
    }

    try {
      setMarkingAll(
        true,
      );

      await markAllNotificationsAsRead(
        token,
      );

      setNotifications(
        (
          current,
        ) =>
          current.map(
            (
              item,
            ) => ({
              ...item,
              isRead: true,
            }),
          ),
      );
    } catch (
      error
    ) {
      Alert.alert(
        "Update failed",
        error instanceof Error
          ? error.message
          : "Unable to mark all as read.",
      );
    } finally {
      setMarkingAll(
        false,
      );
    }
  }

  function confirmDelete(
    item: NotificationItem,
  ) {
    Alert.alert(
      "Delete notification?",
      "This action cannot be undone.",
      [
        {
          text:
            "Cancel",
          style:
            "cancel",
        },
        {
          text:
            "Delete",
          style:
            "destructive",
          onPress: () =>
            void handleDelete(
              item,
            ),
        },
      ],
    );
  }

  async function handleDelete(
    item: NotificationItem,
  ) {
    const token =
      await getToken();

    if (!token) {
      return;
    }

    try {
      await deleteNotification(
        token,
        item.id,
      );

      setNotifications(
        (
          current,
        ) =>
          current.filter(
            (
              notification,
            ) =>
              notification.id !==
              item.id,
          ),
      );
    } catch (
      error
    ) {
      Alert.alert(
        "Delete failed",
        error instanceof Error
          ? error.message
          : "Unable to delete notification.",
      );
    }
  }

  if (
    loading
  ) {
    return (
      <SafeAreaView
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="large"
          color={
            Colors.navy
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading notifications...
        </Text>
      </SafeAreaView>
    );
  }

  const filters: {
    label: string;
    value: NotificationFilter;
    count: number;
  }[] = [
    {
      label: "All",
      value: "all",
      count:
        stats.total,
    },
    {
      label: "Unread",
      value: "unread",
      count:
        stats.unread,
    },
    {
      label: "Read",
      value: "read",
      count:
        stats.read,
    },
  ];

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <FlatList
        data={
          filtered
        }
        keyExtractor={(
          item,
        ) =>
          item.id
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void loadNotifications(
                true,
              )
            }
            tintColor={
              Colors.navy
            }
          />
        }
        contentContainerStyle={
          styles.content
        }
        ListHeaderComponent={
          <View>
            <View
              style={
                styles.headerRow
              }
            >
              <View
                style={
                  styles.headerText
                }
              >
                <Text
                  style={
                    styles.eyebrow
                  }
                >
                  ACTIVITY
                </Text>

                <Text
                  style={
                    styles.title
                  }
                >
                  Notifications
                </Text>

                <Text
                  style={
                    styles.subtitle
                  }
                >
                  Follow important updates from your property journey.
                </Text>
              </View>

              <Pressable
                disabled={
                  stats.unread ===
                    0 ||
                  markingAll
                }
                onPress={() =>
                  void handleMarkAll()
                }
                style={[
                  styles.markAllButton,
                  (stats.unread ===
                    0 ||
                    markingAll) &&
                    styles.disabled,
                ]}
              >
                <CheckCheck
                  size={19}
                  color={
                    Colors.navy
                  }
                />
              </Pressable>
            </View>

            <View
              style={
                styles.statsRow
              }
            >
              <StatCard
                label="Total"
                value={
                  stats.total
                }
              />

              <StatCard
                label="Unread"
                value={
                  stats.unread
                }
              />

              <StatCard
                label="Read"
                value={
                  stats.read
                }
              />
            </View>

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
                placeholder="Search notifications..."
                placeholderTextColor="#98A2B3"
                style={
                  styles.searchInput
                }
              />
            </View>

            <FlatList
              horizontal
              data={
                filters
              }
              keyExtractor={(
                item,
              ) =>
                item.value
              }
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.filters
              }
              renderItem={({
                item,
              }) => {
                const active =
                  filter ===
                  item.value;

                return (
                  <Pressable
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
                      {item.label}{" "}
                      {item.count}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        }
        ListEmptyComponent={
          <View
            style={
              styles.empty
            }
          >
            <Bell
              size={34}
              color={
                Colors.navy
              }
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No notifications found
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              You are all caught up.
            </Text>
          </View>
        }
        renderItem={({
          item,
        }) => {
          const Icon =
            getNotificationIcon(
              item.type,
            );

          const colors =
            getNotificationColors(
              item.type,
            );

          return (
            <Pressable
              onPress={() =>
                void handleOpen(
                  item,
                )
              }
              style={[
                styles.notificationCard,
                !item.isRead &&
                  styles.notificationUnread,
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor:
                      colors.bg,
                  },
                ]}
              >
                <Icon
                  size={21}
                  color={
                    colors.text
                  }
                />
              </View>

              <View
                style={
                  styles.notificationContent
                }
              >
                <View
                  style={
                    styles.notificationTop
                  }
                >
                  <Text
                    numberOfLines={
                      2
                    }
                    style={
                      styles.notificationTitle
                    }
                  >
                    {
                      item.title
                    }
                  </Text>

                  {!item.isRead ? (
                    <View
                      style={
                        styles.newBadge
                      }
                    >
                      <Text
                        style={
                          styles.newBadgeText
                        }
                      >
                        New
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text
                  style={
                    styles.notificationMessage
                  }
                >
                  {
                    item.message
                  }
                </Text>

                <View
                  style={
                    styles.notificationBottom
                  }
                >
                  <View
                    style={
                      styles.timeRow
                    }
                  >
                    <Clock3
                      size={14}
                      color="#98A2B3"
                    />

                    <Text
                      style={
                        styles.timeText
                      }
                    >
                      {timeAgo(
                        item.createdAt,
                      )}
                    </Text>
                  </View>

                  <Pressable
                    hitSlop={
                      12
                    }
                    onPress={(
                      event,
                    ) => {
                      event.stopPropagation();

                      confirmDelete(
                        item,
                      );
                    }}
                  >
                    <Trash2
                      size={18}
                      color="#DC2626"
                    />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View
      style={
        styles.statCard
      }
    >
      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        Colors.background,
    },

    center: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        Colors.background,
    },

    loadingText: {
      marginTop: 12,
      color:
        Colors.textSecondary,
    },

    content: {
      paddingHorizontal:
        20,
      paddingTop: 22,
      paddingBottom: 42,
    },

    headerRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 14,
    },

    headerText: {
      flex: 1,
    },

    eyebrow: {
      color:
        Colors.gold,
      fontSize: 12,
      fontWeight:
        "800",
      letterSpacing:
        1.4,
    },

    title: {
      marginTop: 7,
      color:
        Colors.navyDark,
      fontSize: 36,
      fontWeight:
        "800",
      letterSpacing:
        -1,
    },

    subtitle: {
      marginTop: 8,
      color:
        Colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
    },

    markAllButton: {
      width: 48,
      height: 48,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.white,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    disabled: {
      opacity: 0.45,
    },

    statsRow: {
      marginTop: 20,
      flexDirection:
        "row",
      gap: 10,
    },

    statCard: {
      flex: 1,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 18,
      backgroundColor:
        Colors.white,
      paddingVertical: 16,
      alignItems:
        "center",
    },

    statValue: {
      color:
        Colors.navyDark,
      fontSize: 24,
      fontWeight:
        "800",
    },

    statLabel: {
      marginTop: 4,
      color:
        Colors.textSecondary,
      fontSize: 11,
      fontWeight:
        "700",
    },

    searchBox: {
      marginTop: 18,
      minHeight: 54,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 16,
      backgroundColor:
        Colors.white,
      paddingHorizontal: 15,
    },

    searchInput: {
      flex: 1,
      color:
        Colors.navyDark,
      fontSize: 14,
    },

    filters: {
      paddingTop: 13,
      paddingBottom: 12,
      gap: 8,
    },

    filter: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.white,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },

    filterActive: {
      borderColor:
        Colors.navy,
      backgroundColor:
        Colors.navy,
    },

    filterText: {
      color:
        Colors.textSecondary,
      fontSize: 12,
      fontWeight:
        "700",
    },

    filterTextActive: {
      color:
        Colors.white,
    },

    notificationCard: {
      marginBottom: 12,
      flexDirection:
        "row",
      gap: 13,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 20,
      backgroundColor:
        Colors.white,
      padding: 15,
    },

    notificationUnread: {
      backgroundColor:
        "#F8FBFF",
      borderColor:
        "#C7D7EA",
    },

    iconBox: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    notificationContent: {
      flex: 1,
    },

    notificationTop: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 8,
    },

    notificationTitle: {
      flex: 1,
      color:
        Colors.navyDark,
      fontSize: 15,
      fontWeight:
        "800",
    },

    newBadge: {
      borderRadius: 999,
      backgroundColor:
        Colors.navy,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },

    newBadgeText: {
      color:
        Colors.white,
      fontSize: 9,
      fontWeight:
        "800",
    },

    notificationMessage: {
      marginTop: 6,
      color:
        Colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
    },

    notificationBottom: {
      marginTop: 11,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    timeRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    timeText: {
      color:
        "#98A2B3",
      fontSize: 11,
    },

    empty: {
      marginTop: 30,
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 22,
      backgroundColor:
        Colors.white,
      padding: 28,
    },

    emptyTitle: {
      marginTop: 12,
      color:
        Colors.navyDark,
      fontSize: 18,
      fontWeight:
        "800",
    },

    emptyText: {
      marginTop: 5,
      color:
        Colors.textSecondary,
    },
  });
