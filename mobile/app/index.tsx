import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

import {
  Building2,
  ShieldCheck,
} from "lucide-react-native";

import {
  Colors,
} from "@/constants/colors";

export default function WelcomeScreen() {
  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require(
              "../assets/images/icon.png",
            )}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.badge}>
          <ShieldCheck
            size={18}
            color={Colors.gold}
          />

          <Text style={styles.badgeText}>
            Property buying in Portugal
          </Text>
        </View>

        <Text style={styles.title}>
          Find your property
          {"\n"}
          with confidence.
        </Text>

        <Text style={styles.description}>
          Explore verified properties,
          compare opportunities and connect
          with trusted professionals across
          Portugal.
        </Text>

        <View style={styles.heroIcon}>
          <Building2
            size={86}
            color={Colors.gold}
            strokeWidth={1.5}
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.push("/login")
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Sign In
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              router.push("/register")
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Create Account
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          Real Estate Lisbon
        </Text>
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
      paddingBottom: 24,
    },

    logoContainer: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor:
        Colors.white,
      alignItems: "center",
      justifyContent: "center",

      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 15,
      shadowOffset: {
        width: 0,
        height: 6,
      },
    },

    logo: {
      width: 56,
      height: 56,
    },

    badge: {
      marginTop: 38,
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 8,
      backgroundColor:
        Colors.white,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },

    badgeText: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.navy,
    },

    title: {
      marginTop: 24,
      fontSize: 42,
      lineHeight: 48,
      fontWeight: "800",
      letterSpacing: -1,
      color: Colors.navyDark,
    },

    description: {
      marginTop: 20,
      maxWidth: 340,
      fontSize: 17,
      lineHeight: 28,
      color:
        Colors.textSecondary,
    },

    heroIcon: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    actions: {
      gap: 12,
    },

    primaryButton: {
      height: 56,
      borderRadius: 18,
      backgroundColor:
        Colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },

    primaryButtonText: {
      color: Colors.white,
      fontSize: 17,
      fontWeight: "700",
    },

    secondaryButton: {
      height: 56,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.white,
      alignItems: "center",
      justifyContent: "center",
    },

    secondaryButtonText: {
      color: Colors.navy,
      fontSize: 17,
      fontWeight: "700",
    },

    footerText: {
      marginTop: 20,
      textAlign: "center",
      color: Colors.muted,
      fontSize: 12,
    },
  });