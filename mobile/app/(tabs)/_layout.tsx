import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useEffect,
  useState,
} from "react";

import {
  Tabs,
  router,
} from "expo-router";

import {
  Building2,
  Home,
  MessageCircle,
  Search,
  User,
} from "lucide-react-native";

import {
  getMe,
} from "@/lib/auth-api";

import {
  clearSession,
  getToken,
  saveUser,
} from "@/lib/session";

import {
  Colors,
} from "@/constants/colors";

type GuardState =
  | "checking"
  | "authorized"
  | "redirecting"
  | "error";

export default function TabsLayout() {
  const [
    guardState,
    setGuardState,
  ] = useState<GuardState>(
    "checking",
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let mounted = true;

    async function verifyMobileAccess() {
      try {
        // ======================================================
        // 1. TOKEN REQUIRED
        // ======================================================

        const token =
          await getToken();

        if (!mounted) {
          return;
        }

        if (!token) {
          setGuardState(
            "redirecting",
          );

          router.replace(
            "/login",
          );

          return;
        }

        // ======================================================
        // 2. VERIFY SESSION WITH BACKEND
        // ======================================================

        /*
         * Never trust only the user stored
         * locally in SecureStore.
         *
         * GET /auth/me is the source of truth.
         */

        const user =
          await getMe(token);

        if (!mounted) {
          return;
        }

        // ======================================================
        // 3. STRICT BUYER POLICY
        // ======================================================

        if (
          user.role !==
          "BUYER"
        ) {
          await clearSession();

          if (!mounted) {
            return;
          }

          setGuardState(
            "redirecting",
          );

          router.replace(
            "/access-denied",
          );

          return;
        }

        // ======================================================
        // 4. REFRESH LOCAL USER
        // ======================================================

        await saveUser(user);

        if (!mounted) {
          return;
        }

        // ======================================================
        // 5. AUTHORIZED
        // ======================================================

        setGuardState(
          "authorized",
        );
      } catch (error) {
        if (!mounted) {
          return;
        }

        /*
         * Protected tabs must never be rendered
         * when session verification fails.
         */

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify your session.",
        );

        setGuardState(
          "error",
        );
      }
    }

    void verifyMobileAccess();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // SECURITY LOADING SCREEN
  // ============================================================

  /*
   * The Tabs component does NOT exist while
   * authentication is being verified.
   *
   * This prevents Home / Properties from
   * flashing briefly for unauthorized users.
   */

  if (
    guardState ===
      "checking" ||
    guardState ===
      "redirecting"
  ) {
    return (
      <View
        style={
          styles.guardContainer
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
            styles.guardText
          }
        >
          Verifying secure access...
        </Text>
      </View>
    );
  }

  // ============================================================
  // VERIFICATION ERROR
  // ============================================================

  if (
    guardState ===
    "error"
  ) {
    return (
      <View
        style={
          styles.guardContainer
        }
      >
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
            Unable to verify access
          </Text>

          <Text
            style={
              styles.errorText
            }
          >
            {errorMessage}
          </Text>
        </View>
      </View>
    );
  }

  // ============================================================
  // BUYER TABS
  // ============================================================

  /*
   * Reaching this return means:
   *
   * 1. A token exists.
   * 2. Backend accepted the token.
   * 3. /auth/me returned the user.
   * 4. user.role === BUYER.
   *
   * Only then are the protected tabs mounted.
   */

  return (
    <Tabs
      screenOptions={{
        headerShown:
          false,

        tabBarActiveTintColor:
          Colors.navy,

        tabBarInactiveTintColor:
          Colors.muted,

        tabBarStyle: {
          height: 72,

          paddingTop: 8,

          paddingBottom: 8,

          borderTopColor:
            Colors.border,

          backgroundColor:
            Colors.white,
        },

        tabBarLabelStyle: {
          fontSize: 11,

          fontWeight:
            "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Home
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="properties"
        options={{
          title:
            "Properties",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Building2
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          title:
            "Requests",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Search
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title:
            "Messages",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <MessageCircle
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title:
            "Profile",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <User
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    guardContainer: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        28,

      backgroundColor:
        "#F4F6F9",
    },

    guardText: {
      marginTop: 14,

      color:
        Colors.textSecondary,

      fontSize: 14,

      fontWeight:
        "600",

      textAlign:
        "center",
    },

    errorCard: {
      width: "100%",

      maxWidth: 420,

      padding: 24,

      borderRadius: 22,

      borderWidth: 1,

      borderColor:
        Colors.border,

      backgroundColor:
        Colors.white,
    },

    errorTitle: {
      color:
        Colors.navyDark,

      fontSize: 20,

      fontWeight:
        "800",

      textAlign:
        "center",
    },

    errorText: {
      marginTop: 8,

      color:
        Colors.textSecondary,

      fontSize: 14,

      lineHeight: 21,

      textAlign:
        "center",
    },
  });