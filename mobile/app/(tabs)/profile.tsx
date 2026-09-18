import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  clearSession,
  getToken,
} from "@/lib/session";
import {
  SafeAreaView,
} from "react-native-safe-area-context";

import * as ImagePicker from "expo-image-picker";

import {
  Bell,
  Camera,
  Eye,
  EyeOff,
  ImagePlus,
  LockKeyhole,
  LogOut,
  Menu,
  Save,
  Shield,
  User,
} from "lucide-react-native";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  router,
} from "expo-router";

import AppMenu from "@/components/AppMenu";

import {
  changePassword,
  getMe,
  updateMe,
  updateNotificationPreferences,
  uploadAvatar,
  type SettingsUser,
} from "@/lib/settings-api";

import {
  getAssetUrl,
} from "@/lib/api";



import {
  getSavedPropertiesCount,
} from "@/lib/saved-properties-api";

import {
  getUnreadChatCount,
} from "@/lib/chat-api";

import {
  Colors,
} from "@/constants/colors";

// ============================================================
// TYPES
// ============================================================

type TabKey =
  | "personal"
  | "notifications"
  | "security";

// ============================================================
// HELPERS
// ============================================================

function getInitials(
  name?: string | null,
  email?: string | null,
) {
  const cleanName =
    name?.trim();

  if (cleanName) {
    const parts =
      cleanName
        .split(/\s+/)
        .filter(Boolean);

    if (
      parts.length >= 2
    ) {
      return `${parts[0][0]}${parts[1][0]}`
        .toUpperCase();
    }

    return cleanName
      .charAt(0)
      .toUpperCase();
  }

  return (
    email
      ?.trim()
      .charAt(0)
      .toUpperCase() ||
    "U"
  );
}

// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  value,
  onChangeText,
  editable = true,
  placeholder,
}: {
  label: string;

  value: string;

  onChangeText?: (
    value: string,
  ) => void;

  editable?: boolean;

  placeholder?: string;
}) {
  return (
    <View
      style={
        styles.field
      }
    >
      <Text
        style={
          styles.fieldLabel
        }
      >
        {label}
      </Text>

      <TextInput
        value={
          value
        }
        onChangeText={
          onChangeText
        }
        editable={
          editable
        }
        placeholder={
          placeholder
        }
        placeholderTextColor="#98A2B3"
        style={[
          styles.input,

          !editable &&
          styles.inputDisabled,
        ]}
      />
    </View>
  );
}

// ============================================================
// PASSWORD FIELD
// ============================================================

function PasswordField({
  label,
  value,
  onChangeText,
}: {
  label: string;

  value: string;

  onChangeText: (
    value: string,
  ) => void;
}) {
  const [
    visible,
    setVisible,
  ] =
    useState(false);

  return (
    <View
      style={
        styles.field
      }
    >
      <Text
        style={
          styles.fieldLabel
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.passwordWrapper
        }
      >
        <TextInput
          value={
            value
          }
          onChangeText={
            onChangeText
          }
          secureTextEntry={
            !visible
          }
          autoCapitalize="none"
          autoCorrect={
            false
          }
          style={
            styles.passwordInput
          }
        />

        <Pressable
          onPress={() =>
            setVisible(
              (previous) =>
                !previous,
            )
          }
          style={
            styles.eyeButton
          }
        >
          {visible ? (
            <EyeOff
              size={19}
              color={
                Colors.textSecondary
              }
            />
          ) : (
            <Eye
              size={19}
              color={
                Colors.textSecondary
              }
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================
// TOGGLE
// ============================================================

function ToggleRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;

  description: string;

  value: boolean;

  onChange: (
    value: boolean,
  ) => void;
}) {
  return (
    <View
      style={
        styles.toggleRow
      }
    >
      <View
        style={
          styles.toggleContent
        }
      >
        <Text
          style={
            styles.toggleTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.toggleDescription
          }
        >
          {description}
        </Text>
      </View>

      <Switch
        value={
          value
        }
        onValueChange={
          onChange
        }
        trackColor={{
          false:
            "#D0D5DD",

          true:
            Colors.navy,
        }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

// ============================================================
// SCREEN
// ============================================================

export default function ProfileScreen() {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<TabKey>(
      "personal",
    );

  const [
    user,
    setUser,
  ] =
    useState<SettingsUser | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  const [
    uploadingAvatar,
    setUploadingAvatar,
  ] =
    useState(false);

  const [
    menuVisible,
    setMenuVisible,
  ] =
    useState(false);

  const [
    savedCount,
    setSavedCount,
  ] =
    useState(0);

  const [
    unreadMessages,
    setUnreadMessages,
  ] =
    useState(0);

  // ============================================================
  // PERSONAL
  // ============================================================

  const [
    fullName,
    setFullName,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    country,
    setCountry,
  ] =
    useState("");

  const [
    city,
    setCity,
  ] =
    useState("");

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const [
    emailNotifications,
    setEmailNotifications,
  ] =
    useState(true);

  const [
    matchNotifications,
    setMatchNotifications,
  ] =
    useState(true);

  const [
    propertyAlertNotifications,
    setPropertyAlertNotifications,
  ] =
    useState(true);

  // ============================================================
  // SECURITY
  // ============================================================

  const [
    currentPassword,
    setCurrentPassword,
  ] =
    useState("");

  const [
    newPassword,
    setNewPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  // ============================================================
  // AVATAR URL
  // ============================================================

  const avatarUrl =
    useMemo(
      () =>
        getAssetUrl(
          user?.avatarUrl,
        ),
      [
        user?.avatarUrl,
      ],
    );

  // ============================================================
  // MENU COUNTERS
  // ============================================================

  const loadMenuCounters =
    useCallback(
      async () => {
        try {
          const token =
            await getToken();

          if (!token) {
            setSavedCount(0);

            setUnreadMessages(0);

            return;
          }

          const [
            savedResult,
            unreadResult,
          ] =
            await Promise.allSettled([
              getSavedPropertiesCount(
                token,
              ),

              getUnreadChatCount(
                token,
              ),
            ]);

          if (
            savedResult.status ===
            "fulfilled"
          ) {
            setSavedCount(
              savedResult.value.count ??
              0,
            );
          } else {
            setSavedCount(0);
          }

          if (
            unreadResult.status ===
            "fulfilled"
          ) {
            setUnreadMessages(
              unreadResult.value.count ??
              0,
            );
          } else {
            setUnreadMessages(0);
          }
        } catch {
          setSavedCount(0);

          setUnreadMessages(0);
        }
      },
      [],
    );

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  const loadProfile =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const token =
            await getToken();

          if (!token) {
            router.replace(
              "/login",
            );

            return;
          }

          const data =
            await getMe(
              token,
            );

          // Mobile application = BUYER experience
          if (
            data.role !==
            "BUYER"
          ) {
            Alert.alert(
              "Buyer application",
              "The mobile application is currently available for buyer accounts.",
              [
                {
                  text:
                    "OK",

                  onPress: () =>
                    router.replace(
                      "/login",
                    ),
                },
              ],
            );

            return;
          }

          setUser(
            data,
          );

          setFullName(
            data.fullName ||
            "",
          );

          setPhone(
            data.phone ||
            "",
          );

          setCountry(
            data.country ||
            "",
          );

          setCity(
            data.city ||
            "",
          );

          setEmailNotifications(
            data.emailNotifications ??
            true,
          );

          setMatchNotifications(
            data.matchNotifications ??
            true,
          );

          setPropertyAlertNotifications(
            data.propertyAlertNotifications ??
            true,
          );
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Please try again.";

          const unauthorized =
            message
              .toLowerCase()
              .includes(
                "unauthorized",
              );

          if (unauthorized) {
            await clearSession();

            router.replace(
              "/login",
            );

            return;
          }

          Alert.alert(
            "Unable to load profile",
            message,
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadProfile();

    void loadMenuCounters();
  }, [
    loadProfile,
    loadMenuCounters,
  ]);

  useEffect(() => {
    if (menuVisible) {
      void loadMenuCounters();
    }
  }, [
    menuVisible,
    loadMenuCounters,
  ]);

  // ============================================================
  // UPLOAD IMAGE
  // ============================================================

  async function uploadSelectedImage(
    asset:
      ImagePicker.ImagePickerAsset,
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
      setUploadingAvatar(
        true,
      );

      const extension =
        asset.uri
          .split(".")
          .pop()
          ?.split("?")[0]
          ?.toLowerCase();

      const safeExtension =
        extension === "png" ||
          extension === "webp" ||
          extension === "jpeg" ||
          extension === "jpg"
          ? extension
          : "jpg";

      let mimeType =
        asset.mimeType ||
        "image/jpeg";

      if (
        safeExtension ===
        "png"
      ) {
        mimeType =
          "image/png";
      }

      if (
        safeExtension ===
        "webp"
      ) {
        mimeType =
          "image/webp";
      }

      const updated =
        await uploadAvatar(
          token,
          {
            uri:
              asset.uri,

            name:
              asset.fileName ||
              `avatar-${Date.now()}.${safeExtension}`,

            type:
              mimeType,
          },
        );

      setUser(
        (previous) =>
          previous
            ? {
              ...previous,
              ...updated,
            }
            : updated,
      );

      Alert.alert(
        "Photo updated",
        "Your profile picture was updated successfully.",
      );
    } catch (error) {
      Alert.alert(
        "Upload failed",

        error instanceof Error
          ? error.message
          : "Unable to upload your profile picture.",
      );
    } finally {
      setUploadingAvatar(
        false,
      );
    }
  }

  // ============================================================
  // PHOTO LIBRARY
  // ============================================================

  async function choosePhoto() {
    try {
      const permission =
        await ImagePicker
          .requestMediaLibraryPermissionsAsync();

      if (
        !permission.granted
      ) {
        Alert.alert(
          "Photos permission required",
          "Please allow access to your photos.",
        );

        return;
      }

      const result =
        await ImagePicker
          .launchImageLibraryAsync({
            mediaTypes: [
              "images",
            ],

            allowsEditing:
              true,

            aspect:
              [1, 1],

            quality:
              0.85,
          });

      if (
        result.canceled ||
        !result.assets?.[0]
      ) {
        return;
      }

      await uploadSelectedImage(
        result.assets[0],
      );
    } catch (error) {
      Alert.alert(
        "Photos unavailable",

        error instanceof Error
          ? error.message
          : "Unable to open your photo library.",
      );
    }
  }

  // ============================================================
  // CAMERA
  // ============================================================

  async function takePhoto() {
    try {
      const permission =
        await ImagePicker
          .requestCameraPermissionsAsync();

      if (
        !permission.granted
      ) {
        Alert.alert(
          "Camera permission required",
          "Please allow camera access.",
        );

        return;
      }

      const result =
        await ImagePicker
          .launchCameraAsync({
            mediaTypes: [
              "images",
            ],

            allowsEditing:
              true,

            aspect:
              [1, 1],

            quality:
              0.85,
          });

      if (
        result.canceled ||
        !result.assets?.[0]
      ) {
        return;
      }

      await uploadSelectedImage(
        result.assets[0],
      );
    } catch (error) {
      Alert.alert(
        "Camera unavailable",

        error instanceof Error
          ? error.message
          : "Unable to open camera.",
      );
    }
  }

  // ============================================================
  // PHOTO OPTIONS
  // ============================================================

  function openPhotoOptions() {
    if (
      uploadingAvatar
    ) {
      return;
    }

    if (
      Platform.OS ===
      "ios"
    ) {
      ActionSheetIOS
        .showActionSheetWithOptions(
          {
            title:
              "Profile Photo",

            options: [
              "Cancel",
              "Take Photo",
              "Choose from Photos",
            ],

            cancelButtonIndex:
              0,
          },

          (
            buttonIndex,
          ) => {
            if (
              buttonIndex ===
              1
            ) {
              void takePhoto();
            }

            if (
              buttonIndex ===
              2
            ) {
              void choosePhoto();
            }
          },
        );

      return;
    }

    Alert.alert(
      "Profile Photo",

      "Choose how you want to update your photo.",

      [
        {
          text:
            "Take Photo",

          onPress: () =>
            void takePhoto(),
        },

        {
          text:
            "Choose from Photos",

          onPress: () =>
            void choosePhoto(),
        },

        {
          text:
            "Cancel",

          style:
            "cancel",
        },
      ],
    );
  }

  // ============================================================
  // SAVE PERSONAL INFO
  // ============================================================

  async function savePersonalInfo() {
    const token =
      await getToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    if (
      !fullName.trim()
    ) {
      Alert.alert(
        "Name required",
        "Please enter your full name.",
      );

      return;
    }

    try {
      setSaving(
        true,
      );

      const updated =
        await updateMe(
          token,
          {
            fullName:
              fullName.trim(),

            phone:
              phone.trim(),

            country:
              country.trim(),

            city:
              city.trim(),
          },
        );

      setUser(
        (previous) =>
          previous
            ? {
              ...previous,
              ...updated,
            }
            : updated,
      );

      Alert.alert(
        "Profile updated",
        "Your personal information was saved successfully.",
      );
    } catch (error) {
      Alert.alert(
        "Update failed",

        error instanceof Error
          ? error.message
          : "Unable to update profile.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  // ============================================================
  // SAVE NOTIFICATIONS
  // ============================================================

  async function saveNotifications() {
    const token =
      await getToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    try {
      setSaving(
        true,
      );

      const updated =
        await updateNotificationPreferences(
          token,
          {
            emailNotifications,

            // Mobile = buyer.
            // Lead notification belongs to the professional flow.
            leadNotifications:
              false,

            matchNotifications,

            propertyAlertNotifications,
          },
        );

      setEmailNotifications(
        updated.emailNotifications,
      );

      setMatchNotifications(
        updated.matchNotifications,
      );

      setPropertyAlertNotifications(
        updated.propertyAlertNotifications,
      );

      setUser(
        (previous) =>
          previous
            ? {
              ...previous,

              emailNotifications:
                updated.emailNotifications,

              leadNotifications:
                updated.leadNotifications,

              matchNotifications:
                updated.matchNotifications,

              propertyAlertNotifications:
                updated.propertyAlertNotifications,
            }
            : previous,
      );

      Alert.alert(
        "Preferences saved",
        "Your notification preferences were updated.",
      );
    } catch (error) {
      Alert.alert(
        "Update failed",

        error instanceof Error
          ? error.message
          : "Unable to save your notification preferences.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  async function handleChangePassword() {
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      Alert.alert(
        "Missing fields",
        "Please complete all password fields.",
      );

      return;
    }

    if (
      newPassword.length <
      8
    ) {
      Alert.alert(
        "Weak password",
        "The new password must contain at least 8 characters.",
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      Alert.alert(
        "Password mismatch",
        "New password and confirmation do not match.",
      );

      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {
      Alert.alert(
        "Password unchanged",
        "Your new password must be different from your current password.",
      );

      return;
    }

    const token =
      await getToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    try {
      setSaving(
        true,
      );

      await changePassword(
        token,
        {
          currentPassword,

          newPassword,
        },
      );

      setCurrentPassword(
        "",
      );

      setNewPassword(
        "",
      );

      setConfirmPassword(
        "",
      );

      Alert.alert(
        "Password updated",
        "Your password was changed successfully.",
      );
    } catch (error) {
      Alert.alert(
        "Password update failed",

        error instanceof Error
          ? error.message
          : "Unable to change your password.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  async function performLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      // Current authentication uses an access token stored locally.
      // Removing the local session immediately removes access from
      // this device. A backend refresh-token revocation endpoint can
      // be added later when refresh tokens are implemented.
      await clearSession();

      setUser(null);
      setSavedCount(0);
      setUnreadMessages(0);

      router.replace("/login");
    } catch (error) {
      Alert.alert(
        "Logout failed",
        error instanceof Error
          ? error.message
          : "Unable to sign out. Please try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  function handleLogout() {
    if (loggingOut) {
      return;
    }

    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out of your account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            void performLogout();
          },
        },
      ],
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
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
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView
        style={
          styles.center
        }
      >
        <Text
          style={
            styles.errorText
          }
        >
          Unable to load your profile.
        </Text>
      </SafeAreaView>
    );
  }

  // ============================================================
  // BUYER TABS
  // ============================================================

  const tabs = [
    {
      key:
        "personal" as TabKey,

      label:
        "Personal",

      icon:
        User,
    },

    {
      key:
        "notifications" as TabKey,

      label:
        "Notifications",

      icon:
        Bell,
    },

    {
      key:
        "security" as TabKey,

      label:
        "Security",

      icon:
        Shield,
    },
  ];

  // ============================================================
  // UI
  // ============================================================

  return (
    <SafeAreaView
      edges={[
        "top",
      ]}
      style={
        styles.safeArea
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}

        <View
          style={
            styles.headerRow
          }
        >
          <View
            style={
              styles.headerContent
            }
          >
            <Text
              style={
                styles.eyebrow
              }
            >
              BUYER ACCOUNT
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Profile
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Manage your personal information,
              notifications and account security.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open application menu"
            onPress={() =>
              setMenuVisible(
                true,
              )
            }
            style={({
              pressed,
            }) => [
                styles.menuButton,

                pressed &&
                styles.menuButtonPressed,
              ]}
          >
            <Menu
              size={23}
              color={
                Colors.navy
              }
              strokeWidth={2.3}
            />
          </Pressable>
        </View>

        {/* PROFILE CARD */}

        <View
          style={
            styles.profileCard
          }
        >
          <View
            style={
              styles.avatarContainer
            }
          >
            <View
              style={
                styles.avatar
              }
            >
              {avatarUrl ? (
                <Image
                  source={{
                    uri:
                      avatarUrl,
                  }}
                  style={
                    styles.avatarImage
                  }
                  resizeMode="cover"
                />
              ) : (
                <Text
                  style={
                    styles.avatarInitial
                  }
                >
                  {getInitials(
                    user.fullName,
                    user.email,
                  )}
                </Text>
              )}

              {uploadingAvatar && (
                <View
                  style={
                    styles.avatarLoading
                  }
                >
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                </View>
              )}
            </View>

            <Pressable
              disabled={
                uploadingAvatar
              }
              onPress={
                openPhotoOptions
              }
              style={({
                pressed,
              }) => [
                  styles.cameraButton,

                  pressed &&
                  styles.cameraButtonPressed,
                ]}
            >
              <Camera
                size={16}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          <View
            style={
              styles.profileIdentity
            }
          >
            <Text
              numberOfLines={1}
              style={
                styles.profileName
              }
            >
              {user.fullName ||
                "Buyer"}
            </Text>

            <Text
              numberOfLines={1}
              style={
                styles.profileEmail
              }
            >
              {user.email}
            </Text>

            <View
              style={
                styles.roleBadge
              }
            >
              <Text
                style={
                  styles.roleBadgeText
                }
              >
                BUYER
              </Text>
            </View>

            <Pressable
              disabled={
                uploadingAvatar
              }
              onPress={
                openPhotoOptions
              }
              style={
                styles.photoButton
              }
            >
              {uploadingAvatar ? (
                <ActivityIndicator
                  size="small"
                  color={
                    Colors.navy
                  }
                />
              ) : (
                <ImagePlus
                  size={15}
                  color={
                    Colors.navy
                  }
                />
              )}

              <Text
                style={
                  styles.photoButtonText
                }
              >
                {uploadingAvatar
                  ? "Uploading..."
                  : "Change Photo"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* TABS */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.tabs
          }
        >
          {tabs.map(
            (
              tab,
            ) => {
              const Icon =
                tab.icon;

              const active =
                activeTab ===
                tab.key;

              return (
                <Pressable
                  key={
                    tab.key
                  }
                  onPress={() =>
                    setActiveTab(
                      tab.key,
                    )
                  }
                  style={[
                    styles.tab,

                    active &&
                    styles.tabActive,
                  ]}
                >
                  <Icon
                    size={16}
                    color={
                      active
                        ? "#FFFFFF"
                        : Colors.navy
                    }
                  />

                  <Text
                    style={[
                      styles.tabText,

                      active &&
                      styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            },
          )}
        </ScrollView>

        {/* PERSONAL */}

        {activeTab ===
          "personal" && (
            <View
              style={
                styles.section
              }
            >
              <SectionHeader
                icon={
                  <User
                    size={21}
                    color={
                      Colors.navy
                    }
                  />
                }
                title="Personal Information"
                subtitle="Information used throughout your buyer account."
              />

              <Field
                label="Full Name"
                value={
                  fullName
                }
                onChangeText={
                  setFullName
                }
                placeholder="Your full name"
              />

              <Field
                label="Email Address"
                value={
                  user.email
                }
                editable={
                  false
                }
              />

              <Field
                label="Phone Number"
                value={
                  phone
                }
                onChangeText={
                  setPhone
                }
                placeholder="+351 ..."
              />

              <Field
                label="Country"
                value={
                  country
                }
                onChangeText={
                  setCountry
                }
                placeholder="Portugal"
              />

              <Field
                label="City"
                value={
                  city
                }
                onChangeText={
                  setCity
                }
                placeholder="Lisbon"
              />

              <Field
                label="Account Role"
                value="BUYER"
                editable={
                  false
                }
              />

              <PrimaryButton
                loading={
                  saving
                }
                label="Save Changes"
                icon={
                  <Save
                    size={18}
                    color="#FFFFFF"
                  />
                }
                onPress={() =>
                  void savePersonalInfo()
                }
              />
            </View>
          )}

        {/* NOTIFICATIONS */}

        {activeTab ===
          "notifications" && (
            <View
              style={
                styles.section
              }
            >
              <SectionHeader
                icon={
                  <Bell
                    size={21}
                    color={
                      Colors.navy
                    }
                  />
                }
                title="Notifications"
                subtitle="Choose the buyer updates you want to receive."
              />

              <ToggleRow
                title="Email notifications"
                description="Receive important account and platform updates by email."
                value={
                  emailNotifications
                }
                onChange={
                  setEmailNotifications
                }
              />

              <ToggleRow
                title="Match notifications"
                description="Receive updates when a verified professional is matched with one of your requests."
                value={
                  matchNotifications
                }
                onChange={
                  setMatchNotifications
                }
              />

              <ToggleRow
                title="Property alerts"
                description="Receive alerts when published properties match your active property searches."
                value={
                  propertyAlertNotifications
                }
                onChange={
                  setPropertyAlertNotifications
                }
              />

              <PrimaryButton
                loading={
                  saving
                }
                label="Save Preferences"
                icon={
                  <Save
                    size={18}
                    color="#FFFFFF"
                  />
                }
                onPress={() =>
                  void saveNotifications()
                }
              />
            </View>
          )}

        {/* SECURITY */}

        {activeTab ===
          "security" && (
            <View
              style={
                styles.section
              }
            >
              <SectionHeader
                icon={
                  <LockKeyhole
                    size={21}
                    color={
                      Colors.navy
                    }
                  />
                }
                title="Security"
                subtitle="Keep your account protected with a secure password."
              />

              <PasswordField
                label="Current Password"
                value={
                  currentPassword
                }
                onChangeText={
                  setCurrentPassword
                }
              />

              <PasswordField
                label="New Password"
                value={
                  newPassword
                }
                onChangeText={
                  setNewPassword
                }
              />

              <PasswordField
                label="Confirm New Password"
                value={
                  confirmPassword
                }
                onChangeText={
                  setConfirmPassword
                }
              />

              <PrimaryButton
                loading={
                  saving
                }
                label="Update Password"
                icon={
                  <Shield
                    size={18}
                    color="#FFFFFF"
                  />
                }
                onPress={() =>
                  void handleChangePassword()
                }
              />
            </View>
          )}

        {/* LOGOUT */}

        <View
          style={
            styles.logoutSection
          }
        >
          <View
            style={
              styles.logoutContent
            }
          >
            <View
              style={
                styles.logoutIcon
              }
            >
              <LogOut
                size={21}
                color="#B42318"
              />
            </View>

            <View
              style={
                styles.logoutTextContent
              }
            >
              <Text
                style={
                  styles.logoutTitle
                }
              >
                Sign out
              </Text>

              <Text
                style={
                  styles.logoutDescription
                }
              >
                End your current session on this device.
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            disabled={
              loggingOut
            }
            onPress={
              handleLogout
            }
            style={({
              pressed,
            }) => [
              styles.logoutButton,

              pressed &&
              !loggingOut &&
              styles.logoutButtonPressed,

              loggingOut &&
              styles.buttonDisabled,
            ]}
          >
            {loggingOut ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <LogOut
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.logoutButtonText
                  }
                >
                  Sign out
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <View
          style={
            styles.bottomSpace
          }
        />
      </ScrollView>

      <AppMenu
        visible={
          menuVisible
        }
        onClose={() =>
          setMenuVisible(
            false,
          )
        }
        user={
          user
        }
        savedCount={
          savedCount
        }
        unreadMessages={
          unreadMessages
        }
      />
    </SafeAreaView>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;

  title: string;

  subtitle: string;
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      <View
        style={
          styles.sectionIcon
        }
      >
        {icon}
      </View>

      <View
        style={
          styles.sectionHeaderText
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.sectionSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// PRIMARY BUTTON
// ============================================================

function PrimaryButton({
  loading,
  label,
  icon,
  onPress,
}: {
  loading: boolean;

  label: string;

  icon: React.ReactNode;

  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={
        loading
      }
      onPress={
        onPress
      }
      style={[
        styles.primaryButton,

        loading &&
        styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color="#FFFFFF"
        />
      ) : (
        <>
          {icon}

          <Text
            style={
              styles.primaryButtonText
            }
          >
            {label}
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

      paddingHorizontal:
        24,
    },

    loadingText: {
      marginTop: 12,

      color:
        Colors.textSecondary,

      fontSize: 14,
    },

    errorText: {
      color:
        Colors.error,

      textAlign:
        "center",
    },

    content: {
      paddingHorizontal:
        18,

      paddingTop:
        20,
    },

    headerRow: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap: 14,
    },

    headerContent: {
      flex: 1,
    },

    menuButton: {
      width: 50,

      height: 50,

      borderRadius: 17,

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

    menuButtonPressed: {
      opacity:
        0.82,
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

    profileCard: {
      marginTop: 24,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 16,

      borderWidth: 1,

      borderColor:
        Colors.border,

      borderRadius: 24,

      backgroundColor:
        Colors.white,

      padding: 18,
    },

    avatarContainer: {
      position:
        "relative",
    },

    avatar: {
      width: 78,

      height: 78,

      borderRadius: 39,

      overflow:
        "hidden",

      backgroundColor:
        Colors.navy,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    avatarImage: {
      width:
        "100%",

      height:
        "100%",
    },

    avatarInitial: {
      color:
        Colors.white,

      fontSize: 27,

      fontWeight:
        "800",
    },


    avatarLoading: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,

      backgroundColor:
        "rgba(15, 35, 64, 0.58)",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    cameraButton: {
      position:
        "absolute",

      right: -3,

      bottom: -3,

      width: 32,

      height: 32,

      borderRadius: 16,

      borderWidth: 3,

      borderColor:
        Colors.white,

      backgroundColor:
        Colors.navy,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    cameraButtonPressed: {
      opacity:
        0.8,
    },

    profileIdentity: {
      flex: 1,
    },

    profileName: {
      color:
        Colors.navyDark,

      fontSize: 20,

      fontWeight:
        "800",
    },

    profileEmail: {
      marginTop: 3,

      color:
        Colors.textSecondary,

      fontSize: 12,
    },

    roleBadge: {
      marginTop: 8,

      alignSelf:
        "flex-start",

      borderRadius: 999,

      backgroundColor:
        "#EEF3F8",

      paddingHorizontal: 10,

      paddingVertical: 5,
    },

    roleBadgeText: {
      color:
        Colors.navy,

      fontSize: 10,

      fontWeight:
        "800",

      letterSpacing:
        0.5,
    },

    photoButton: {
      marginTop: 9,

      alignSelf:
        "flex-start",

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 6,

      borderWidth: 1,

      borderColor:
        "#D0D5DD",

      borderRadius: 10,

      paddingHorizontal: 10,

      paddingVertical: 7,
    },

    photoButtonText: {
      color:
        Colors.navy,

      fontSize: 11,

      fontWeight:
        "700",
    },

    tabs: {
      paddingTop: 18,

      paddingBottom: 7,

      gap: 8,
    },

    tab: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 7,

      borderWidth: 1,

      borderColor:
        "#D0D5DD",

      borderRadius: 13,

      backgroundColor:
        Colors.white,

      paddingHorizontal: 14,

      paddingVertical: 10,
    },

    tabActive: {
      borderColor:
        Colors.navy,

      backgroundColor:
        Colors.navy,
    },

    tabText: {
      color:
        Colors.navy,

      fontSize: 12,

      fontWeight:
        "700",
    },

    tabTextActive: {
      color:
        Colors.white,
    },

    section: {
      marginTop: 12,

      borderWidth: 1,

      borderColor:
        Colors.border,

      borderRadius: 24,

      backgroundColor:
        Colors.white,

      padding: 18,
    },

    sectionHeader: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap: 11,

      marginBottom: 22,
    },

    sectionIcon: {
      width: 42,

      height: 42,

      borderRadius: 13,

      backgroundColor:
        "#EEF3F8",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    sectionHeaderText: {
      flex: 1,
    },

    sectionTitle: {
      color:
        Colors.navyDark,

      fontSize: 18,

      fontWeight:
        "800",
    },

    sectionSubtitle: {
      marginTop: 4,

      color:
        Colors.textSecondary,

      fontSize: 12,

      lineHeight: 18,
    },

    field: {
      marginBottom: 16,
    },

    fieldLabel: {
      marginBottom: 7,

      color:
        Colors.navyDark,

      fontSize: 13,

      fontWeight:
        "700",
    },

    input: {
      minHeight: 52,

      borderWidth: 1,

      borderColor:
        Colors.border,

      borderRadius: 14,

      backgroundColor:
        Colors.white,

      paddingHorizontal: 14,

      color:
        Colors.navyDark,

      fontSize: 14,
    },

    inputDisabled: {
      backgroundColor:
        "#F9FAFB",

      color:
        Colors.textSecondary,
    },

    passwordWrapper: {
      minHeight: 52,

      flexDirection:
        "row",

      alignItems:
        "center",

      borderWidth: 1,

      borderColor:
        Colors.border,

      borderRadius: 14,

      backgroundColor:
        Colors.white,
    },

    passwordInput: {
      flex: 1,

      minHeight: 50,

      paddingHorizontal: 14,

      color:
        Colors.navyDark,

      fontSize: 14,
    },

    eyeButton: {
      width: 48,

      height: 48,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    toggleRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 14,

      borderWidth: 1,

      borderColor:
        "#EAECF0",

      borderRadius: 17,

      padding: 15,

      marginBottom: 12,
    },

    toggleContent: {
      flex: 1,
    },

    toggleTitle: {
      color:
        Colors.navyDark,

      fontSize: 14,

      fontWeight:
        "700",
    },

    toggleDescription: {
      marginTop: 4,

      color:
        Colors.textSecondary,

      fontSize: 11,

      lineHeight: 17,
    },

    primaryButton: {
      marginTop: 10,

      minHeight: 52,

      borderRadius: 15,

      backgroundColor:
        Colors.navy,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 8,

      paddingHorizontal:
        15,
    },

    primaryButtonText: {
      color:
        Colors.white,

      fontSize: 14,

      fontWeight:
        "800",
    },

    buttonDisabled: {
      opacity:
        0.6,
    },

    logoutSection: {
      marginTop: 16,

      borderWidth: 1,

      borderColor:
        "#FECACA",

      borderRadius: 24,

      backgroundColor:
        "#FFF7F7",

      padding: 18,
    },

    logoutContent: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 12,
    },

    logoutIcon: {
      width: 42,

      height: 42,

      borderRadius: 13,

      backgroundColor:
        "#FEE4E2",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    logoutTextContent: {
      flex: 1,
    },

    logoutTitle: {
      color:
        "#912018",

      fontSize: 16,

      fontWeight:
        "800",
    },

    logoutDescription: {
      marginTop: 3,

      color:
        "#B5473C",

      fontSize: 12,

      lineHeight: 18,
    },

    logoutButton: {
      marginTop: 16,

      minHeight: 52,

      borderRadius: 15,

      backgroundColor:
        "#B42318",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 8,

      paddingHorizontal: 15,
    },

    logoutButtonPressed: {
      opacity: 0.86,
    },

    logoutButtonText: {
      color:
        "#FFFFFF",

      fontSize: 14,

      fontWeight:
        "800",
    },

    bottomSpace: {
      height: 40,
    },
  });