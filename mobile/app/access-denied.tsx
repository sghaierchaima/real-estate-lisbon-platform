import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  ArrowLeft,
  Home,
  ShieldX,
} from "lucide-react-native";

import {
  router,
} from "expo-router";

import {
  Colors,
} from "@/constants/colors";

export default function AccessDeniedScreen() {
  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <View
        style={
          styles.container
        }
      >
        <View
          style={
            styles.card
          }
        >
          <View
            style={
              styles.iconCircle
            }
          >
            <ShieldX
              size={42}
              color="#DC2626"
              strokeWidth={2}
            />
          </View>

          <Text
            style={
              styles.eyebrow
            }
          >
            ACCESS DENIED
          </Text>

          <Text
            style={
              styles.title
            }
          >
            You do not have permission to view this page.
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            This section is restricted. Your account does not have the required permission.
          </Text>

          <Pressable
            onPress={() =>
              router.replace(
                "/(tabs)/home",
              )
            }
            style={
              styles.primaryButton
            }
          >
            <Home
              size={19}
              color={
                Colors.white
              }
            />

            <Text
              style={
                styles.primaryButtonText
              }
            >
              Go to Home
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.back()
            }
            style={
              styles.secondaryButton
            }
          >
            <ArrowLeft
              size={19}
              color={
                Colors.navy
              }
            />

            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Go back
            </Text>
          </Pressable>
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
      justifyContent:
        "center",
      paddingHorizontal:
        22,
    },

    card: {
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 30,
      backgroundColor:
        Colors.white,
      paddingHorizontal: 24,
      paddingVertical: 32,
      alignItems:
        "center",
      shadowColor:
        "#0F2340",
      shadowOpacity:
        0.07,
      shadowRadius: 20,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      elevation: 4,
    },

    iconCircle: {
      width: 82,
      height: 82,
      borderRadius: 41,
      backgroundColor:
        "#FEF2F2",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    eyebrow: {
      marginTop: 24,
      color:
        "#DC2626",
      fontSize: 12,
      fontWeight:
        "900",
      letterSpacing: 1.8,
    },

    title: {
      marginTop: 12,
      color:
        Colors.navyDark,
      fontSize: 28,
      lineHeight: 35,
      fontWeight:
        "800",
      textAlign:
        "center",
    },

    subtitle: {
      marginTop: 14,
      color:
        Colors.textSecondary,
      fontSize: 15,
      lineHeight: 24,
      textAlign:
        "center",
    },

    primaryButton: {
      marginTop: 28,
      width: "100%",
      minHeight: 54,
      borderRadius: 16,
      backgroundColor:
        Colors.navy,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 9,
    },

    primaryButtonText: {
      color:
        Colors.white,
      fontSize: 14,
      fontWeight:
        "800",
    },

    secondaryButton: {
      marginTop: 10,
      width: "100%",
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        Colors.border,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 9,
    },

    secondaryButtonText: {
      color:
        Colors.navy,
      fontSize: 14,
      fontWeight:
        "800",
    },
  });
