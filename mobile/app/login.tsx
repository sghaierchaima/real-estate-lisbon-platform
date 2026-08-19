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
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react-native";

import { useState } from "react";

import { login } from "@/lib/auth-api";

import {
  saveToken,
  saveUser,
} from "@/lib/session";

import { Colors } from "@/constants/colors";

export default function LoginScreen() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  async function handleLogin() {
    if (loading) {
      return;
    }

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert(
        "Email required",
        "Please enter your email address.",
      );

      return;
    }

    if (!cleanEmail.includes("@")) {
      Alert.alert(
        "Invalid email",
        "Please enter a valid email address.",
      );

      return;
    }

    if (!password) {
      Alert.alert(
        "Password required",
        "Please enter your password.",
      );

      return;
    }

    try {
      setLoading(true);

      const result = await login({
        email: cleanEmail,
        password,
      });

      await saveToken(
        result.accessToken,
      );

      await saveUser(result.user);

      router.replace(
        "/(tabs)/home",
      );
    } catch (error) {
      Alert.alert(
        "Unable to sign in",
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* NAVIGATION */}

          <View style={styles.topBar}>
            <Pressable
              onPress={() =>
                router.back()
              }
              style={({ pressed }) => [
                styles.backButton,
                pressed &&
                  styles.pressed,
              ]}
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
                Secure access
              </Text>
            </View>
          </View>

          {/* BRAND */}

          <View style={styles.brand}>
            <View
              style={
                styles.logoContainer
              }
            >
              <Image
                source={require(
                  "../assets/images/pfelogo.png",
                )}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text
              style={
                styles.brandCaption
              }
            >
              YOUR PORTUGAL PROPERTY
              JOURNEY
            </Text>
          </View>

          {/* INTRODUCTION */}

          <View style={styles.intro}>
            <Text style={styles.title}>
              Welcome back.
            </Text>

            <Text
              style={styles.subtitle}
            >
              Sign in to access your
              properties, requests,
              matches and conversations.
            </Text>
          </View>

          {/* FORM CARD */}

          <View style={styles.card}>
            <View
              style={
                styles.cardHeader
              }
            >
              <Text
                style={
                  styles.cardTitle
                }
              >
                Sign in
              </Text>

              <Text
                style={
                  styles.cardDescription
                }
              >
                Enter your account
                details below.
              </Text>
            </View>

            {/* EMAIL */}

            <View style={styles.field}>
              <Text
                style={styles.label}
              >
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
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  placeholderTextColor={
                    Colors.muted
                  }
                  style={styles.input}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* PASSWORD */}

            <View style={styles.field}>
              <View
                style={
                  styles.labelRow
                }
              >
                <Text
                  style={styles.label}
                >
                  Password
                </Text>

                <Text
                  style={
                    styles.passwordHint
                  }
                >
                  Protected
                </Text>
              </View>

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
                  placeholder="Enter your password"
                  placeholderTextColor={
                    Colors.muted
                  }
                  style={styles.input}
                  returnKeyType="done"
                  onSubmitEditing={
                    handleLogin
                  }
                />

                <Pressable
                  hitSlop={12}
                  onPress={() =>
                    setShowPassword(
                      (current) =>
                        !current,
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

            {/* LOGIN */}

            <Pressable
              disabled={loading}
              onPress={handleLogin}
              style={({
                pressed,
              }) => [
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
                    size="small"
                    color={
                      Colors.white
                    }
                  />

                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Signing in...
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Sign In
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

          {/* REGISTER */}

          <View
            style={
              styles.registerCard
            }
          >
            <View style={{ flex: 1 }}>
              <Text
                style={
                  styles.registerTitle
                }
              >
                New to Real Estate
                Lisbon?
              </Text>

              <Text
                style={
                  styles.registerDescription
                }
              >
                Create your buyer account
                and start your property
                journey.
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push(
                  "/register",
                )
              }
              style={({ pressed }) => [
                styles.createButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.createButtonText
                }
              >
                Create
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            Secure access • Trusted
            property platform
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
      paddingBottom: 30,
    },

    topBar: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    backButton: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        Colors.white,
      borderWidth: 1,
      borderColor:
        Colors.border,
    },

    secureBadge: {
      height: 38,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor:
        "#ECFDF3",
    },

    secureText: {
      color: "#217A42",
      fontSize: 12,
      fontWeight: "700",
    },

    pressed: {
      opacity: 0.7,
    },

    brand: {
      alignItems: "center",
      marginTop: 22,
    },

    logoContainer: {
      width: 190,
      height: 100,
      alignItems: "center",
      justifyContent: "center",
    },

    logo: {
      width: "100%",
      height: "100%",
    },

    brandCaption: {
      marginTop: 4,
      color: Colors.gold,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.7,
      textAlign: "center",
    },

    intro: {
      marginTop: 24,
    },

    title: {
      color: Colors.navyDark,
      fontSize: 38,
      lineHeight: 44,
      fontWeight: "800",
      letterSpacing: -1,
    },

    subtitle: {
      marginTop: 10,
      maxWidth: 350,
      color:
        Colors.textSecondary,
      fontSize: 16,
      lineHeight: 25,
    },

    card: {
      marginTop: 28,
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

    cardHeader: {
      marginBottom: 22,
    },

    cardTitle: {
      color: Colors.navyDark,
      fontSize: 21,
      fontWeight: "800",
    },

    cardDescription: {
      marginTop: 5,
      color:
        Colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },

    field: {
      marginBottom: 19,
    },

    labelRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    label: {
      marginBottom: 8,
      color: Colors.navyDark,
      fontSize: 13,
      fontWeight: "700",
    },

    passwordHint: {
      marginBottom: 8,
      color: Colors.success,
      fontSize: 11,
      fontWeight: "700",
    },

    inputWrapper: {
      height: 58,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      borderRadius: 17,
      borderWidth: 1,
      borderColor:
        "#D9DEE7",
      backgroundColor:
        "#FAFBFC",
      paddingHorizontal: 13,
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

    primaryButton: {
      height: 60,
      marginTop: 3,
      paddingLeft: 22,
      paddingRight: 8,
      borderRadius: 18,
      backgroundColor:
        Colors.navy,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 10,
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

    registerCard: {
      marginTop: 18,
      padding: 18,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        "#F8FAFC",
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },

    registerTitle: {
      color: Colors.navyDark,
      fontSize: 14,
      fontWeight: "800",
    },

    registerDescription: {
      marginTop: 4,
      color:
        Colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },

    createButton: {
      height: 42,
      minWidth: 76,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 13,
      backgroundColor:
        "#E9EEF5",
    },

    createButtonText: {
      color: Colors.navy,
      fontSize: 13,
      fontWeight: "800",
    },

    footer: {
      marginTop: 24,
      textAlign: "center",
      color: Colors.muted,
      fontSize: 11,
      fontWeight: "500",
    },
  });