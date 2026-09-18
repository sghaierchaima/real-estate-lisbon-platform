import {
  ActivityIndicator,
  Alert,
  Image,
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

import { router } from "expo-router";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";

import { useState } from "react";

import {
  register,
} from "@/lib/auth-api";

import {
  saveToken,
  saveUser,
} from "@/lib/session";

import { Colors } from "@/constants/colors";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function RegisterScreen() {
  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);

  async function handleRegister() {
    if (loading) {
      return;
    }

    const cleanName =
      fullName.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanName) {
      Alert.alert(
        "Full name required",
        "Please enter your full name.",
      );

      return;
    }

    if (
      !cleanEmail ||
      !cleanEmail.includes("@")
    ) {
      Alert.alert(
        "Valid email required",
        "Please enter a valid email address.",
      );

      return;
    }

    if (!passwordValid) {
      Alert.alert(
        "Password requirements",
        "Your password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number.",
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      Alert.alert(
        "Passwords do not match",
        "Please make sure both passwords are identical.",
      );

      return;
    }

    try {
      setLoading(true);

      const result =
        await register({
          fullName: cleanName,
          email: cleanEmail,
          password,
        });

      await saveToken(
        result.accessToken,
      );

      await saveUser(
        result.user,
      );

      router.replace(
        "/(tabs)/home",
      );
    } catch (error) {
      Alert.alert(
        "Unable to create account",
        error instanceof Error
          ? error.message
          : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        "top",
        "bottom",
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* ============================= */}
          {/* TOP                           */}
          {/* ============================= */}

          <View style={styles.topBar}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,

                pressed &&
                  styles.pressed,
              ]}
              onPress={() =>
                router.back()
              }
            >
              <ArrowLeft
                size={21}
                color={
                  Colors.navyDark
                }
              />
            </Pressable>

            <View
              style={
                styles.secureBadge
              }
            >
              <ShieldCheck
                size={15}
                color={Colors.success}
              />

              <Text
                style={
                  styles.secureText
                }
              >
                Buyer account
              </Text>
            </View>
          </View>

          {/* ============================= */}
          {/* LOGO                          */}
          {/* ============================= */}

          <View style={styles.brand}>
            <Image
              source={require(
                "../assets/images/pfelogo.png",
              )}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text
              style={
                styles.brandCaption
              }
            >
              REAL ESTATE LISBON
            </Text>
          </View>

          {/* ============================= */}
          {/* INTRO                         */}
          {/* ============================= */}

          <View style={styles.intro}>
            <Text style={styles.title}>
              Start your journey.
            </Text>

            <Text
              style={styles.subtitle}
            >
              Create your buyer account
              to save properties, submit
              requests and connect with
              verified professionals.
            </Text>
          </View>

          {/* ============================= */}
          {/* FORM                          */}
          {/* ============================= */}

          <View style={styles.card}>
            <Text
              style={
                styles.cardTitle
              }
            >
              Create account
            </Text>

            <Text
              style={
                styles.cardDescription
              }
            >
              It only takes a minute to
              get started.
            </Text>

            {/* NAME */}

            <View style={styles.field}>
              <Text style={styles.label}>
                Full name
              </Text>

              <View
                style={
                  styles.inputWrapper
                }
              >
                <View
                  style={
                    styles.inputIcon
                  }
                >
                  <UserRound
                    size={19}
                    color={
                      Colors.navy
                    }
                  />
                </View>

                <TextInput
                  value={fullName}
                  onChangeText={
                    setFullName
                  }
                  placeholder="Your full name"
                  placeholderTextColor={
                    Colors.muted
                  }
                  style={styles.input}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* EMAIL */}

            <View style={styles.field}>
              <Text style={styles.label}>
                Email address
              </Text>

              <View
                style={
                  styles.inputWrapper
                }
              >
                <View
                  style={
                    styles.inputIcon
                  }
                >
                  <Mail
                    size={19}
                    color={
                      Colors.navy
                    }
                  />
                </View>

                <TextInput
                  value={email}
                  onChangeText={
                    setEmail
                  }
                  placeholder="you@example.com"
                  placeholderTextColor={
                    Colors.muted
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>
            </View>

            {/* PASSWORD */}

            <View style={styles.field}>
              <Text style={styles.label}>
                Password
              </Text>

              <View
                style={
                  styles.inputWrapper
                }
              >
                <View
                  style={
                    styles.inputIcon
                  }
                >
                  <LockKeyhole
                    size={19}
                    color={
                      Colors.navy
                    }
                  />
                </View>

                <TextInput
                  value={password}
                  onChangeText={
                    setPassword
                  }
                  secureTextEntry={
                    !showPassword
                  }
                  placeholder="Create a password"
                  placeholderTextColor={
                    Colors.muted
                  }
                  style={styles.input}
                />

                <Pressable
                  hitSlop={12}
                  onPress={() =>
                    setShowPassword(
                      (value) =>
                        !value,
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      size={20}
                      color={
                        Colors.muted
                      }
                    />
                  ) : (
                    <Eye
                      size={20}
                      color={
                        Colors.muted
                      }
                    />
                  )}
                </Pressable>
              </View>
            </View>

            {/* PASSWORD REQUIREMENTS */}

            <View
              style={
                styles.requirements
              }
            >
              <Requirement
                valid={
                  password.length >= 8
                }
                text="8+ characters"
              />

              <Requirement
                valid={
                  /[A-Z]/.test(
                    password,
                  )
                }
                text="Uppercase"
              />

              <Requirement
                valid={
                  /[a-z]/.test(
                    password,
                  )
                }
                text="Lowercase"
              />

              <Requirement
                valid={
                  /\d/.test(
                    password,
                  )
                }
                text="Number"
              />
            </View>

            {/* CONFIRM PASSWORD */}

            <View style={styles.field}>
              <Text style={styles.label}>
                Confirm password
              </Text>

              <View
                style={
                  styles.inputWrapper
                }
              >
                <View
                  style={
                    styles.inputIcon
                  }
                >
                  <ShieldCheck
                    size={19}
                    color={
                      Colors.navy
                    }
                  />
                </View>

                <TextInput
                  value={
                    confirmPassword
                  }
                  onChangeText={
                    setConfirmPassword
                  }
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  placeholder="Repeat your password"
                  placeholderTextColor={
                    Colors.muted
                  }
                  style={styles.input}
                  returnKeyType="done"
                  onSubmitEditing={
                    handleRegister
                  }
                />

                <Pressable
                  hitSlop={12}
                  onPress={() =>
                    setShowConfirmPassword(
                      (value) =>
                        !value,
                    )
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff
                      size={20}
                      color={
                        Colors.muted
                      }
                    />
                  ) : (
                    <Eye
                      size={20}
                      color={
                        Colors.muted
                      }
                    />
                  )}
                </Pressable>
              </View>

              {confirmPassword
                .length > 0 && (
                <Text
                  style={[
                    styles.matchText,

                    password ===
                    confirmPassword
                      ? styles.matchSuccess
                      : styles.matchError,
                  ]}
                >
                  {password ===
                  confirmPassword
                    ? "Passwords match"
                    : "Passwords do not match"}
                </Text>
              )}
            </View>

            {/* CREATE BUTTON */}

            <Pressable
              disabled={loading}
              onPress={
                handleRegister
              }
              style={({ pressed }) => [
                styles.primaryButton,

                pressed &&
                  !loading &&
                  styles.primaryButtonPressed,

                loading &&
                  styles.disabledButton,
              ]}
            >
              {loading ? (
                <>
                  <ActivityIndicator
                    color={
                      Colors.white
                    }
                    size="small"
                  />

                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Creating account...
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Create Account
                  </Text>

                  <View
                    style={
                      styles.buttonArrow
                    }
                  >
                    <ArrowRight
                      size={18}
                      color={
                        Colors.navy
                      }
                    />
                  </View>
                </>
              )}
            </Pressable>
          </View>

          {/* ============================= */}
          {/* GOOGLE AUTH                   */}
          {/* ============================= */}

          <View style={styles.oauthSection}>
  <View style={styles.dividerRow}>
    <View style={styles.dividerLine} />

    <Text style={styles.dividerText}>
      OR
    </Text>

    <View style={styles.dividerLine} />
  </View>

  <GoogleAuthButton disabled={loading} />
</View>

          {/* ============================= */}
          {/* LOGIN                         */}
          {/* ============================= */}

          <View style={styles.loginRow}>
            <Text
              style={styles.loginText}
            >
              Already have an account?
            </Text>

            <Pressable
              onPress={() =>
                router.replace(
                  "/login",
                )
              }
            >
              <Text
                style={styles.loginLink}
              >
                Sign in
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            By creating an account, you
            join a trusted property
            platform for Portugal buyers.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Requirement({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <View
      style={styles.requirement}
    >
      <View
        style={[
          styles.requirementIcon,

          valid &&
            styles.requirementIconValid,
        ]}
      >
        <Check
          size={11}
          color={
            valid
              ? "#FFFFFF"
              : Colors.muted
          }
        />
      </View>

      <Text
        style={[
          styles.requirementText,

          valid &&
            styles.requirementTextValid,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#F4F6F9",
    },

    keyboard: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 22,
      paddingTop: 10,
      paddingBottom: 34,
    },

    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    backButton: {
      width: 46,
      height: 46,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.white,
      alignItems: "center",
      justifyContent: "center",
    },

    pressed: {
      opacity: 0.7,
    },

    secureBadge: {
      height: 38,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor:
        "#ECFDF3",

      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    secureText: {
      color: "#217A42",
      fontSize: 12,
      fontWeight: "700",
    },

    brand: {
      alignItems: "center",
      marginTop: 18,
    },

    logo: {
      width: 180,
      height: 90,
    },

    brandCaption: {
      marginTop: 2,
      color: Colors.gold,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.8,
    },

    intro: {
      marginTop: 22,
    },

    title: {
      color: Colors.navyDark,
      fontSize: 36,
      lineHeight: 43,
      fontWeight: "800",
      letterSpacing: -0.9,
    },

    subtitle: {
      marginTop: 10,
      color:
        Colors.textSecondary,
      fontSize: 15,
      lineHeight: 24,
    },

    card: {
      marginTop: 25,
      padding: 20,
      borderRadius: 26,
      backgroundColor:
        Colors.white,
      borderWidth: 1,
      borderColor:
        "#EAECF0",

      shadowColor: "#0F2340",
      shadowOpacity: 0.06,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 8,
      },

      elevation: 3,
    },

    cardTitle: {
      color: Colors.navyDark,
      fontSize: 21,
      fontWeight: "800",
    },

    cardDescription: {
      marginTop: 5,
      marginBottom: 22,
      color:
        Colors.textSecondary,
      fontSize: 13,
    },

    field: {
      marginBottom: 18,
    },

    label: {
      marginBottom: 8,
      color: Colors.navyDark,
      fontSize: 13,
      fontWeight: "700",
    },

    inputWrapper: {
      height: 58,
      borderWidth: 1,
      borderColor:
        "#D9DEE7",
      borderRadius: 17,
      backgroundColor:
        "#FAFBFC",
      paddingHorizontal: 13,

      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },

    inputIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor:
        "#EEF2F7",
      alignItems: "center",
      justifyContent: "center",
    },

    input: {
      flex: 1,
      height: "100%",
      color: Colors.text,
      fontSize: 15,
    },

    requirements: {
      marginTop: -7,
      marginBottom: 19,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    requirement: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,

      paddingHorizontal: 8,
      paddingVertical: 5,

      borderRadius: 999,
      backgroundColor:
        "#F4F6F9",
    },

    requirementIcon: {
      width: 17,
      height: 17,
      borderRadius: 999,
      backgroundColor:
        "#E4E7EC",
      alignItems: "center",
      justifyContent: "center",
    },

    requirementIconValid: {
      backgroundColor:
        Colors.success,
    },

    requirementText: {
      color: Colors.muted,
      fontSize: 10,
      fontWeight: "600",
    },

    requirementTextValid: {
      color: Colors.success,
    },

    matchText: {
      marginTop: 7,
      fontSize: 11,
      fontWeight: "700",
    },

    matchSuccess: {
      color: Colors.success,
    },

    matchError: {
      color: Colors.error,
    },

    primaryButton: {
      height: 60,
      marginTop: 2,
      borderRadius: 18,
      backgroundColor:
        Colors.navy,

      paddingLeft: 22,
      paddingRight: 8,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    primaryButtonPressed: {
      backgroundColor:
        Colors.navyDark,
    },

    disabledButton: {
      opacity: 0.65,
    },

    primaryButtonText: {
      flex: 1,
      color: Colors.white,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "800",
    },

    buttonArrow: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        Colors.gold,
      alignItems: "center",
      justifyContent: "center",
    },

    /*
     * GOOGLE AUTH
     */

    oauthSection: {
      marginTop: 24,
      gap: 18,
    },

    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },

    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor:
        "#E4E7EC",
    },

    dividerText: {
      color: "#98A2B3",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.2,
    },

    loginRow: {
      marginTop: 22,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
    },

    loginText: {
      color:
        Colors.textSecondary,
      fontSize: 13,
    },

    loginLink: {
      color: Colors.navy,
      fontSize: 13,
      fontWeight: "800",
    },

    footer: {
      marginTop: 20,
      paddingHorizontal: 20,
      textAlign: "center",
      color: Colors.muted,
      fontSize: 11,
      lineHeight: 17,
    },
  });