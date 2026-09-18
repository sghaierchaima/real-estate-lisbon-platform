import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Calculator,
  ChevronRight,
  FileText,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  Settings,
  X,
} from "lucide-react-native";

import {
  router,
  type Href,
} from "expo-router";

import {
  useEffect,
  useState,
} from "react";

import {
  Colors,
} from "@/constants/colors";

import type {
  AuthUser,
} from "@/types/auth";

import {
  getUnreadNotificationCount,
} from "@/lib/notifications-api";

import {
  getToken,
} from "@/lib/session";

/* ============================================================
   TYPES
============================================================ */

type Props = {
  visible: boolean;

  onClose: () => void;

  user: AuthUser | null;

  unreadMessages?: number;

  savedCount?: number;

  onLogout?: () => void;
};

type MenuItem = {
  label: string;

  icon:
    React.ComponentType<{
      size?: number;
      color?: string;
      strokeWidth?: number;
    }>;

  route: Href;

  badge?: number;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function AppMenu({
  visible,
  onClose,
  user,
  unreadMessages = 0,
  savedCount = 0,
  
  onLogout,
}: Props) {
  const [
    unreadNotifications,
    setUnreadNotifications,
  ] =
    useState(0);

  const [
    loadingNotifications,
    setLoadingNotifications,
  ] =
    useState(false);

  /* ============================================================
     LOAD UNREAD NOTIFICATIONS
  ============================================================ */

  useEffect(() => {
    async function loadUnreadNotifications() {
      if (
        !visible
      ) {
        return;
      }

      try {
        setLoadingNotifications(
          true,
        );

        const token =
          await getToken();

        if (!token) {
          setUnreadNotifications(
            0,
          );

          return;
        }

        const result =
          await getUnreadNotificationCount(
            token,
          );

        setUnreadNotifications(
          Number(
            result?.count ||
              0,
          ),
        );
      } catch {
        setUnreadNotifications(
          0,
        );
      } finally {
        setLoadingNotifications(
          false,
        );
      }
    }

    void loadUnreadNotifications();
  }, [
    visible,
  ]);

  /* ============================================================
     NAVIGATION
  ============================================================ */

  function goTo(
    route: Href,
  ) {
    onClose();

    setTimeout(() => {
      router.push(
        route,
      );
    }, 120);
  }

  function handleLogout() {
    onClose();

    setTimeout(() => {
      onLogout?.();
    }, 120);
  }

  /* ============================================================
     MENU DATA
  ============================================================ */

  const discoverItems: MenuItem[] = [
    {
      label: "Home",
      icon: Home,
      route:
        "/(tabs)/home" as Href,
    },

    {
      label: "Properties",
      icon: Building2,
      route:
        "/(tabs)/properties" as Href,
    },

    {
      label:
        "Saved Properties",
      icon: Heart,
      route:
        "/saved-properties" as Href,

      badge:
        savedCount > 0
          ? savedCount
          : undefined,
    },

    {
  label:
    "Find Professionals",

  icon:
    BriefcaseBusiness,

  route:
    "/find-professionals" as Href,
},

    {
      label:
        "Success Stories",
      icon:
        BookOpen,
      route:
        "/stories" as Href,
    },
  ];

  const journeyItems: MenuItem[] = [
    {
      label:
        "Buying Tools",
      icon:
        Calculator,
      route:
        "/tools" as Href,
    },

    {
      label:
        "My Requests",
      icon:
        FileText,
      route:
        "/(tabs)/requests" as Href,
    },

    {
      label:
        "Notifications",
      icon:
        Bell,
      route:
        "/notifications" as Href,

      badge:
        !loadingNotifications &&
        unreadNotifications > 0
          ? unreadNotifications
          : undefined,
    },

    {
      label:
        "Messages",
      icon:
        MessageCircle,
      route:
        "/(tabs)/messages" as Href,

      badge:
        unreadMessages > 0
          ? unreadMessages
          : undefined,
    },
  ];

  const accountItems: MenuItem[] = [
    {
      label:
        "Profile & Settings",
      icon:
        Settings,
      route:
        "/(tabs)/profile" as Href,
    },
  ];

  /* ============================================================
     USER DISPLAY
  ============================================================ */

  const initials =
    user?.fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (item) =>
          item[0]?.toUpperCase(),
      )
      .join("") ||
    user?.email
      ?.trim()
      .charAt(0)
      .toUpperCase() ||
    "U";

  /* ============================================================
     UI
  ============================================================ */

  return (
    <Modal
      visible={
        visible
      }
      transparent
      animationType="fade"
      onRequestClose={
        onClose
      }
      statusBarTranslucent
    >
      <View
        style={
          styles.overlay
        }
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          style={
            styles.backdrop
          }
          onPress={
            onClose
          }
        />

        <View
          style={
            styles.drawer
          }
        >
          {/* HEADER */}

          <View
            style={
              styles.topBar
            }
          >
            <View>
              <Text
                style={
                  styles.brandEyebrow
                }
              >
                REAL ESTATE
              </Text>

              <Text
                style={
                  styles.brandTitle
                }
              >
                Lisbon
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              onPress={
                onClose
              }
              style={({ pressed }) => [
                styles.closeButton,

                pressed &&
                  styles.pressed,
              ]}
            >
              <X
                size={21}
                color={
                  Colors.navyDark
                }
              />
            </Pressable>
          </View>

          {/* USER CARD */}

          <View
            style={
              styles.userCard
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
                {initials}
              </Text>
            </View>

            <View
              style={
                styles.userContent
              }
            >
              <Text
                style={
                  styles.userName
                }
                numberOfLines={
                  1
                }
              >
                {user?.fullName ||
                  "Buyer Account"}
              </Text>

              <Text
                style={
                  styles.userEmail
                }
                numberOfLines={
                  1
                }
              >
                {user?.email || ""}
              </Text>

              <View
                style={
                  styles.roleBadge
                }
              >
                <Text
                  style={
                    styles.roleText
                  }
                >
                  BUYER
                </Text>
              </View>
            </View>
          </View>

          {/* MENU */}

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.scrollContent
            }
          >
            <MenuSection
              title="Discover"
              items={
                discoverItems
              }
              onNavigate={
                goTo
              }
            />

            <MenuSection
              title="My Journey"
              items={
                journeyItems
              }
              onNavigate={
                goTo
              }
            />

            <MenuSection
              title="Account"
              items={
                accountItems
              }
              onNavigate={
                goTo
              }
            />

            {/* LOGOUT */}

            {onLogout ? (
              <Pressable
                onPress={
                  handleLogout
                }
                style={({ pressed }) => [
                  styles.logoutButton,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <View
                  style={
                    styles.logoutIcon
                  }
                >
                  <LogOut
                    size={18}
                    color="#DC2626"
                  />
                </View>

                <Text
                  style={
                    styles.logoutText
                  }
                >
                  Sign out
                </Text>
              </Pressable>
            ) : null}

            {/* FOOTER */}

            <View
              style={
                styles.menuFooter
              }
            >
              <Text
                style={
                  styles.menuFooterTitle
                }
              >
                Buyer mobile experience
              </Text>

              <Text
                style={
                  styles.menuFooterText
                }
              >
                Explore properties, use smart tools, manage requests and connect with verified professionals from one place.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================
   MENU SECTION
============================================================ */

function MenuSection({
  title,
  items,
  onNavigate,
}: {
  title: string;

  items:
    MenuItem[];

  onNavigate:
    (
      route: Href,
    ) => void;
}) {
  return (
    <View
      style={
        styles.section
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      {items.map(
        (item) => {
          const Icon =
            item.icon;

          return (
            <Pressable
              key={
                item.label
              }
              accessibilityRole="button"
              accessibilityLabel={
                item.label
              }
              onPress={() =>
                onNavigate(
                  item.route,
                )
              }
              style={({ pressed }) => [
                styles.menuItem,

                pressed &&
                  styles.menuItemPressed,
              ]}
            >
              <View
                style={
                  styles.menuIcon
                }
              >
                <Icon
                  size={19}
                  color={
                    Colors.navy
                  }
                  strokeWidth={
                    2.1
                  }
                />
              </View>

              <Text
                style={
                  styles.menuLabel
                }
              >
                {item.label}
              </Text>

              {item.badge ? (
                <View
                  style={
                    styles.badge
                  }
                >
                  <Text
                    style={
                      styles.badgeText
                    }
                  >
                    {item.badge >
                    99
                      ? "99+"
                      : item.badge}
                  </Text>
                </View>
              ) : null}

              <ChevronRight
                size={17}
                color="#98A2B3"
              />
            </Pressable>
          );
        },
      )}
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,

      flexDirection:
        "row",

      justifyContent:
        "flex-end",
    },

    backdrop: {
      position:
        "absolute",

      top: 0,

      right: 0,

      bottom: 0,

      left: 0,

      backgroundColor:
        "rgba(15, 35, 64, 0.46)",
    },

    drawer: {
      width:
        "86%",

      maxWidth:
        390,

      height:
        "100%",

      backgroundColor:
        "#FFFFFF",

      borderTopLeftRadius:
        30,

      borderBottomLeftRadius:
        30,

      paddingTop:
        54,

      paddingHorizontal:
        18,

      shadowColor:
        "#000000",

      shadowOpacity:
        0.16,

      shadowRadius:
        24,

      shadowOffset: {
        width: -4,
        height: 0,
      },

      elevation:
        12,
    },

    topBar: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      paddingHorizontal:
        4,
    },

    brandEyebrow: {
      color:
        Colors.gold,

      fontSize:
        10,

      fontWeight:
        "900",

      letterSpacing:
        1.5,
    },

    brandTitle: {
      marginTop:
        2,

      color:
        Colors.navyDark,

      fontSize:
        25,

      fontWeight:
        "900",

      letterSpacing:
        -0.5,
    },

    closeButton: {
      width:
        42,

      height:
        42,

      borderRadius:
        15,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#F2F4F7",
    },

    pressed: {
      opacity:
        0.76,
    },

    userCard: {
      marginTop:
        23,

      marginBottom:
        22,

      minHeight:
        88,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,

      borderWidth:
        1,

      borderColor:
        "#EAECF0",

      borderRadius:
        20,

      padding:
        14,

      backgroundColor:
        "#FAFBFC",
    },

    avatar: {
      width:
        52,

      height:
        52,

      borderRadius:
        17,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        Colors.navy,
    },

    avatarText: {
      color:
        "#FFFFFF",

      fontSize:
        16,

      fontWeight:
        "900",
    },

    userContent: {
      flex:
        1,
    },

    userName: {
      color:
        Colors.navyDark,

      fontSize:
        14,

      fontWeight:
        "900",
    },

    userEmail: {
      marginTop:
        3,

      color:
        Colors.textSecondary,

      fontSize:
        10,
    },

    roleBadge: {
      alignSelf:
        "flex-start",

      marginTop:
        7,

      borderRadius:
        999,

      backgroundColor:
        "#FFF8E1",

      paddingHorizontal:
        9,

      paddingVertical:
        4,
    },

    roleText: {
      color:
        Colors.gold,

      fontSize:
        9,

      fontWeight:
        "900",

      letterSpacing:
        0.6,
    },

    scrollContent: {
      paddingBottom:
        42,
    },

    section: {
      marginBottom:
        20,
    },

    sectionTitle: {
      marginBottom:
        8,

      paddingHorizontal:
        4,

      color:
        "#98A2B3",

      fontSize:
        9,

      fontWeight:
        "900",

      letterSpacing:
        1.25,

      textTransform:
        "uppercase",
    },

    menuItem: {
      minHeight:
        54,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        11,

      borderRadius:
        16,

      paddingHorizontal:
        10,
    },

    menuItemPressed: {
      backgroundColor:
        "#F4F6F8",
    },

    menuIcon: {
      width:
        36,

      height:
        36,

      borderRadius:
        12,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#F2F4F7",
    },

    menuLabel: {
      flex:
        1,

      color:
        Colors.navyDark,

      fontSize:
        13,

      fontWeight:
        "700",
    },

    badge: {
      minWidth:
        25,

      height:
        23,

      borderRadius:
        999,

      paddingHorizontal:
        7,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#FEF2F2",
    },

    badgeText: {
      color:
        "#DC2626",

      fontSize:
        9,

      fontWeight:
        "900",
    },

    logoutButton: {
      marginTop:
        2,

      minHeight:
        54,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        11,

      borderRadius:
        16,

      backgroundColor:
        "#FFF8F8",

      paddingHorizontal:
        10,
    },

    logoutIcon: {
      width:
        36,

      height:
        36,

      borderRadius:
        12,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#FEF2F2",
    },

    logoutText: {
      color:
        "#DC2626",

      fontSize:
        13,

      fontWeight:
        "800",
    },

    menuFooter: {
      marginTop:
        20,

      borderRadius:
        17,

      backgroundColor:
        "#F8FAFC",

      padding:
        14,
    },

    menuFooterTitle: {
      color:
        Colors.navyDark,

      fontSize:
        11,

      fontWeight:
        "800",
    },

    menuFooterText: {
      marginTop:
        4,

      color:
        Colors.textSecondary,

      fontSize:
        10,

      lineHeight:
        16,
    },
  });
