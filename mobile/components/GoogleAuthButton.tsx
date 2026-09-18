import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useEffect,
  useState,
} from "react";

import { router } from "expo-router";

import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import {
  googleLogin,
} from "@/lib/auth-api";

import {
  clearSession,
  saveToken,
  saveUser,
} from "@/lib/session";

import {
  Colors,
} from "@/constants/colors";

type Props = {
  disabled?: boolean;
};

const WEB_CLIENT_ID =
  process.env
    .EXPO_PUBLIC_GOOGLE_CLIENT_ID;

const IOS_CLIENT_ID =
  process.env
    .EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export default function GoogleAuthButton({
  disabled = false,
}: Props) {
  const [
    loading,
    setLoading,
  ] = useState(false);

  // ============================================================
  // GOOGLE CONFIGURATION
  // ============================================================

  useEffect(() => {
    if (!WEB_CLIENT_ID) {
      return;
    }

    GoogleSignin.configure({
      webClientId:
        WEB_CLIENT_ID,

      /*
       * Required only on iOS.
       *
       * Android does not need iosClientId.
       * Keeping it in an environment variable
       * avoids hard-coding platform configuration
       * inside the component.
       */
      iosClientId:
        IOS_CLIENT_ID,

      offlineAccess:
        false,
    });
  }, []);

  // ============================================================
  // GOOGLE LOGIN
  // ============================================================

  async function handleGoogleLogin() {
    if (
      disabled ||
      loading
    ) {
      return;
    }

    if (!WEB_CLIENT_ID) {
      Alert.alert(
        "Google Sign-In configuration",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID is missing.",
      );

      return;
    }

    try {
      setLoading(true);

      /*
       * Remove any previous local session before
       * authenticating another account.
       *
       * This prevents an old BUYER, ADMIN or
       * PROFESSIONAL session from remaining active.
       */
      await clearSession();

      // ========================================================
      // GOOGLE PLAY SERVICES
      // ========================================================

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog:
          true,
      });

      // ========================================================
      // GOOGLE ACCOUNT SELECTION
      // ========================================================

      const response =
        await GoogleSignin.signIn();

      if (
        response.type !==
        "success"
      ) {
        return;
      }

      // ========================================================
      // GOOGLE ID TOKEN
      // ========================================================

      const idToken =
        response.data.idToken;

      if (!idToken) {
        throw new Error(
          "Google did not return an ID token.",
        );
      }

      // ========================================================
      // BACKEND AUTHENTICATION
      // ========================================================

      const result =
        await googleLogin(
          idToken,
        );

      // ========================================================
      // MOBILE ROLE SECURITY
      // ========================================================

      /*
       * IMPORTANT:
       *
       * The mobile application is strictly
       * reserved for BUYER accounts.
       *
       * ADMIN and PROFESSIONAL accounts may be
       * valid accounts on the backend/web
       * application, but they must NEVER receive
       * a mobile session.
       */

      if (
        result.user.role !==
        "BUYER"
      ) {
        await clearSession();

        /*
         * Also disconnect the Google account
         * selected in the native Google SDK.
         *
         * This makes it possible to choose
         * another Google account on the next
         * authentication attempt.
         */
        try {
          await GoogleSignin.signOut();
        } catch {
          // Local application session has already
          // been cleared. Google SDK sign-out
          // failure must not restore access.
        }

        Alert.alert(
          "Buyer application",
          "The mobile application is available only for buyer accounts.",
        );

        return;
      }

      // ========================================================
      // SAVE BUYER SESSION
      // ========================================================

      /*
       * Persist authentication ONLY after the
       * backend user has been confirmed as BUYER.
       */

      await saveToken(
        result.accessToken,
      );

      await saveUser(
        result.user,
      );

      // ========================================================
      // NAVIGATION
      // ========================================================

      router.replace(
        "/(tabs)/home",
      );
    } catch (error) {
      /*
       * Never keep a partial or stale local
       * session after an authentication error.
       */

      await clearSession();

      // ========================================================
      // GOOGLE-SPECIFIC ERRORS
      // ========================================================

      if (
        isErrorWithCode(
          error,
        )
      ) {
        switch (
          error.code
        ) {
          case statusCodes.SIGN_IN_CANCELLED:
            return;

          case statusCodes.IN_PROGRESS:
            Alert.alert(
              "Google Sign-In",
              "A Google sign-in is already in progress.",
            );

            return;

          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert(
              "Google Play Services",
              "Google Play Services are unavailable or outdated on this device.",
            );

            return;
        }
      }

      // ========================================================
      // GENERIC ERROR
      // ========================================================

      Alert.alert(
        "Unable to sign in with Google",
        error instanceof Error
          ? error.message
          : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // AVAILABILITY
  // ============================================================

  const unavailable =
    !WEB_CLIENT_ID;

  // ============================================================
  // UI
  // ============================================================

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{
        disabled:
          disabled ||
          loading ||
          unavailable,

        busy: loading,
      }}
      disabled={
        disabled ||
        loading ||
        unavailable
      }
      onPress={
        handleGoogleLogin
      }
      style={({ pressed }) => [
        styles.button,

        pressed &&
          !loading &&
          !disabled &&
          !unavailable &&
          styles.pressed,

        (
          disabled ||
          loading ||
          unavailable
        ) &&
          styles.disabled,
      ]}
    >
      {loading ? (
        <>
          <ActivityIndicator
            size="small"
            color={
              Colors.navyDark
            }
          />

          <Text
            style={
              styles.buttonText
            }
          >
            Connecting to Google...
          </Text>
        </>
      ) : (
        <>
          <View
            style={
              styles.googleIcon
            }
          >
            <Text
              style={
                styles.googleLetter
              }
            >
              G
            </Text>
          </View>

          <Text
            style={
              styles.buttonText
            }
          >
            Continue with Google
          </Text>
        </>
      )}
    </Pressable>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    button: {
      minHeight: 58,

      borderWidth: 1,

      borderColor:
        "#D0D5DD",

      backgroundColor:
        "#FFFFFF",

      borderRadius: 18,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 12,

      paddingHorizontal: 20,

      shadowColor:
        "#0F2340",

      shadowOpacity:
        0.035,

      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 1,
    },

    googleIcon: {
      width: 30,

      height: 30,

      borderRadius: 15,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#FFFFFF",
    },

    googleLetter: {
      fontSize: 22,

      lineHeight: 25,

      fontWeight:
        "800",

      color:
        "#4285F4",
    },

    buttonText: {
      color:
        Colors.navyDark,

      fontSize: 16,

      fontWeight:
        "700",
    },

    pressed: {
      opacity: 0.82,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    disabled: {
      opacity: 0.55,
    },
  });