import {
  ActivityIndicator,
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
  useEffect,
  useState,
} from "react";

import {
  Colors,
} from "@/constants/colors";

import {
  getMe,
} from "@/lib/auth-api";

import {
  clearSession,
  getToken,
  saveUser,
} from "@/lib/session";

export default function WelcomeScreen() {
  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const token =
          await getToken();

        // Aucun token sauvegardé :
        // l'utilisateur reste sur Welcome.
        if (!token) {
          return;
        }

        // IMPORTANT :
        // un token présent dans SecureStore
        // n'est pas forcément encore valide.
        //
        // On demande donc au backend de le vérifier.
        const user =
          await getMe(token);

        // L'application mobile actuelle
        // est réservée aux BUYER.
        if (
          user.role !== "BUYER"
        ) {
          await clearSession();
          return;
        }

        // Le backend accepte le token.
        // On actualise également l'utilisateur
        // sauvegardé localement.
        await saveUser(user);

        if (!mounted) {
          return;
        }

        router.replace(
          "/(tabs)/home",
        );
      } catch {
        // Token expiré / invalide /
        // utilisateur supprimé / 401...
        //
        // On ne garde surtout pas
        // une fausse session locale.
        await clearSession();
      } finally {
        if (mounted) {
          setCheckingSession(
            false,
          );
        }
      }
    }

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  // ------------------------------------------------------------
  // SESSION CHECK
  // ------------------------------------------------------------

  if (checkingSession) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <Image
            source={require(
              "../assets/images/icon.png",
            )}
            style={styles.loadingLogo}
            resizeMode="contain"
          />

          <ActivityIndicator
            size="small"
            color={Colors.navy}
            style={{
              marginTop: 20,
            }}
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Checking session...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ------------------------------------------------------------
  // WELCOME
  // ------------------------------------------------------------

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.container}>
        <View
          style={
            styles.logoContainer
          }
        >
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

          <Text
            style={styles.badgeText}
          >
            Property buying in Portugal
          </Text>
        </View>

        <Text style={styles.title}>
          Find your property
          {"\n"}
          with confidence.
        </Text>

        <Text
          style={styles.description}
        >
          Explore verified properties,
          compare opportunities and connect
          with trusted professionals across
          Portugal.
        </Text>

        <View
          style={styles.heroIcon}
        >
          <Building2
            size={86}
            color={Colors.gold}
            strokeWidth={1.5}
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            style={
              styles.primaryButton
            }
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
            style={
              styles.secondaryButton
            }
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

        <Text
          style={styles.footerText}
        >
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

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },

    loadingLogo: {
      width: 72,
      height: 72,
    },

    loadingText: {
      marginTop: 12,
      color:
        Colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
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