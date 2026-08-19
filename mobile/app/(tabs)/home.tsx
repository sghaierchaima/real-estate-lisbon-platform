import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useEffect, useState } from "react";

import { Colors } from "@/constants/colors";
import { getStoredUser } from "@/lib/session";
import type { AuthUser } from "@/types/auth";

export default function HomeScreen() {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      const storedUser =
        await getStoredUser<AuthUser>();

      setUser(storedUser);
    }

    void loadUser();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>
          REAL ESTATE LISBON
        </Text>

        <Text style={styles.title}>
          Welcome
          {user?.fullName
            ? `, ${user.fullName}`
            : ""}
          👋
        </Text>

        <Text style={styles.subtitle}>
          Your mobile property journey
          starts here.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            Account
          </Text>

          <Text style={styles.cardValue}>
            {user?.email ||
              "Loading..."}
          </Text>

          <Text style={styles.role}>
            {user?.role || ""}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        Colors.background,
    },

    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 30,
    },

    eyebrow: {
      color: Colors.gold,
      fontWeight: "800",
      fontSize: 12,
      letterSpacing: 1.4,
    },

    title: {
      marginTop: 12,
      fontSize: 34,
      lineHeight: 42,
      fontWeight: "800",
      color: Colors.navyDark,
    },

    subtitle: {
      marginTop: 10,
      fontSize: 17,
      lineHeight: 27,
      color:
        Colors.textSecondary,
    },

    card: {
      marginTop: 32,
      borderRadius: 22,
      padding: 20,
      backgroundColor:
        Colors.white,
      borderWidth: 1,
      borderColor:
        Colors.border,
    },

    cardLabel: {
      color:
        Colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },

    cardValue: {
      marginTop: 8,
      color: Colors.navyDark,
      fontSize: 17,
      fontWeight: "700",
    },

    role: {
      marginTop: 6,
      color: Colors.gold,
      fontSize: 13,
      fontWeight: "800",
    },
  });