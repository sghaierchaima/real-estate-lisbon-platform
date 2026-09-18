import {
  ActivityIndicator,
  Alert,
  Image,
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

import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Lock,
  MapPin,
  PenLine,
  Send,
  Sparkles,
  User,
} from "lucide-react-native";

import * as ImagePicker
  from "expo-image-picker";

import {
  router,
} from "expo-router";

import {
  useEffect,
  useState,
} from "react";

import {
  createStoryWithImage,
  type MobileStoryImage,
} from "@/lib/stories-api";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import type {
  AuthUser,
} from "@/types/auth";

import {
  Colors,
} from "@/constants/colors";

export default function SubmitStoryScreen() {
  const [
    user,
    setUser,
  ] =
    useState<AuthUser | null>(
      null,
    );

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    author,
    setAuthor,
  ] =
    useState("");

  const [
    location,
    setLocation,
  ] =
    useState("");

  const [
    excerpt,
    setExcerpt,
  ] =
    useState("");

  const [
    content,
    setContent,
  ] =
    useState("");

  const [
    image,
    setImage,
  ] =
    useState<MobileStoryImage | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  useEffect(() => {
    async function loadUser() {
      const storedUser =
        await getStoredUser<AuthUser>();

      setUser(
        storedUser,
      );

      if (
        storedUser?.fullName
      ) {
        setAuthor(
          storedUser.fullName,
        );
      }
    }

    void loadUser();
  }, []);

  const canSubmit =
    user?.role ===
    "BUYER";

  async function pickImage() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (
      !permission.granted
    ) {
      Alert.alert(
        "Permission required",
        "Please allow photo access to select a story image.",
      );

      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync(
        {
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsEditing:
            true,
          quality:
            0.85,
        },
      );

    if (
      result.canceled ||
      !result.assets[0]
    ) {
      return;
    }

    const asset =
      result.assets[0];

    const extension =
      asset.fileName
        ?.split(".")
        .pop() ||
      "jpg";

    setImage({
      uri:
        asset.uri,
      name:
        asset.fileName ||
        `story-${Date.now()}.${extension}`,
      type:
        asset.mimeType ||
        "image/jpeg",
    });
  }

  async function handleSubmit() {
    if (
      !canSubmit
    ) {
      router.push(
        "/access-denied",
      );

      return;
    }

    if (
      !title.trim()
    ) {
      Alert.alert(
        "Title required",
        "Please add a title for your story.",
      );

      return;
    }

    if (
      !author.trim()
    ) {
      Alert.alert(
        "Name required",
        "Please add your name.",
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
      setLoading(
        true,
      );

      setSuccess(
        false,
      );

      await createStoryWithImage(
        token,
        {
          title:
            title.trim(),
          author:
            author.trim(),
          location:
            location
              .trim() ||
            undefined,
          excerpt:
            excerpt
              .trim() ||
            undefined,
          content:
            content
              .trim() ||
            undefined,
          image,
        },
      );

      setSuccess(
        true,
      );

      setTitle(
        "",
      );

      setLocation(
        "",
      );

      setExcerpt(
        "",
      );

      setContent(
        "",
      );

      setImage(
        null,
      );
    } catch (
      error
    ) {
      Alert.alert(
        "Unable to submit story",
        error instanceof Error
          ? error.message
          : "Please try again.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  if (
    user &&
    !canSubmit
  ) {
    return (
      <SafeAreaView
        style={
          styles.center
        }
      >
        <Lock
          size={42}
          color="#DC2626"
        />

        <Text
          style={
            styles.deniedTitle
          }
        >
          Buyer access only
        </Text>

        <Text
          style={
            styles.deniedText
          }
        >
          Only Buyer accounts can submit success stories.
        </Text>

        <Pressable
          onPress={() =>
            router.replace(
              "/access-denied",
            )
          }
          style={
            styles.deniedButton
          }
        >
          <Text
            style={
              styles.deniedButtonText
            }
          >
            Continue
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
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
        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
        >
          <ArrowLeft
            size={21}
            color={
              Colors.navy
            }
          />
        </Pressable>

        <View
          style={
            styles.headerIcon
          }
        >
          <Sparkles
            size={25}
            color={
              Colors.gold
            }
          />
        </View>

        <Text
          style={
            styles.eyebrow
          }
        >
          BUYER COMMUNITY
        </Text>

        <Text
          style={
            styles.title
          }
        >
          Share Your Success Story
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Tell future buyers what you learned during your property journey in Portugal.
        </Text>

        {success ? (
          <View
            style={
              styles.successCard
            }
          >
            <CheckCircle2
              size={25}
              color="#15803D"
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.successTitle
                }
              >
                Story submitted
              </Text>

              <Text
                style={
                  styles.successText
                }
              >
                Your story is now pending review before it becomes public.
              </Text>
            </View>
          </View>
        ) : null}

        <View
          style={
            styles.formCard
          }
        >
          <Field
            label="Story title"
            icon={
              PenLine
            }
          >
            <TextInput
              value={
                title
              }
              onChangeText={
                setTitle
              }
              placeholder="My property journey in Lisbon"
              placeholderTextColor="#98A2B3"
              style={
                styles.input
              }
            />
          </Field>

          <Field
            label="Your name"
            icon={
              User
            }
          >
            <TextInput
              value={
                author
              }
              onChangeText={
                setAuthor
              }
              placeholder="Your name"
              placeholderTextColor="#98A2B3"
              style={
                styles.input
              }
            />
          </Field>

          <Field
            label="Location"
            icon={
              MapPin
            }
          >
            <TextInput
              value={
                location
              }
              onChangeText={
                setLocation
              }
              placeholder="Lisbon, Cascais..."
              placeholderTextColor="#98A2B3"
              style={
                styles.input
              }
            />
          </Field>

          <Text
            style={
              styles.label
            }
          >
            Short summary
          </Text>

          <TextInput
            value={
              excerpt
            }
            onChangeText={
              setExcerpt
            }
            placeholder="A short introduction to your experience..."
            placeholderTextColor="#98A2B3"
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.excerptInput,
            ]}
          />

          <Text
            style={
              styles.label
            }
          >
            Full story
          </Text>

          <TextInput
            value={
              content
            }
            onChangeText={
              setContent
            }
            placeholder="What happened? What did you learn? What would you recommend to other buyers?"
            placeholderTextColor="#98A2B3"
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.contentInput,
            ]}
          />

          <Text
            style={
              styles.label
            }
          >
            Story image
          </Text>

          <Pressable
            onPress={() =>
              void pickImage()
            }
            style={
              styles.imagePicker
            }
          >
            {image ? (
              <Image
                source={{
                  uri:
                    image.uri,
                }}
                style={
                  styles.previewImage
                }
              />
            ) : (
              <>
                <ImagePlus
                  size={28}
                  color={
                    Colors.navy
                  }
                />

                <Text
                  style={
                    styles.imagePickerTitle
                  }
                >
                  Choose an image
                </Text>

                <Text
                  style={
                    styles.imagePickerText
                  }
                >
                  Select a photo that represents your property journey.
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            disabled={
              loading
            }
            onPress={() =>
              void handleSubmit()
            }
            style={[
              styles.submitButton,
              loading &&
                styles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator
                color={
                  Colors.white
                }
              />
            ) : (
              <>
                <Send
                  size={18}
                  color={
                    Colors.white
                  }
                />

                <Text
                  style={
                    styles.submitButtonText
                  }
                >
                  Submit Story
                </Text>
              </>
            )}
          </Pressable>

          <View
            style={
              styles.reviewNotice
            }
          >
            <Lock
              size={16}
              color={
                Colors.gold
              }
            />

            <Text
              style={
                styles.reviewNoticeText
              }
            >
              Stories are reviewed before publication to keep the community trustworthy.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon:
    typeof User;
  children:
    React.ReactNode;
}) {
  return (
    <View
      style={
        styles.field
      }
    >
      <View
        style={
          styles.labelRow
        }
      >
        <Icon
          size={16}
          color={
            Colors.navy
          }
        />

        <Text
          style={
            styles.label
          }
        >
          {label}
        </Text>
      </View>

      {children}
    </View>
  );
}

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
      paddingHorizontal:
        28,
      backgroundColor:
        Colors.background,
    },

    deniedTitle: {
      marginTop: 14,
      color:
        Colors.navyDark,
      fontSize: 24,
      fontWeight:
        "800",
    },

    deniedText: {
      marginTop: 8,
      color:
        Colors.textSecondary,
      textAlign:
        "center",
      lineHeight: 22,
    },

    deniedButton: {
      marginTop: 18,
      minHeight: 48,
      borderRadius: 14,
      backgroundColor:
        Colors.navy,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 22,
    },

    deniedButtonText: {
      color:
        Colors.white,
      fontWeight:
        "800",
    },

    content: {
      paddingHorizontal:
        20,
      paddingTop: 12,
      paddingBottom: 44,
    },

    backButton: {
      width: 48,
      height: 48,
      borderRadius: 16,
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

    headerIcon: {
      marginTop: 22,
      width: 55,
      height: 55,
      borderRadius: 18,
      backgroundColor:
        "#FFF8E1",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    eyebrow: {
      marginTop: 18,
      color:
        Colors.gold,
      fontSize: 11,
      fontWeight:
        "900",
      letterSpacing: 1.4,
    },

    title: {
      marginTop: 7,
      color:
        Colors.navyDark,
      fontSize: 33,
      lineHeight: 40,
      fontWeight:
        "800",
    },

    subtitle: {
      marginTop: 9,
      color:
        Colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
    },

    successCard: {
      marginTop: 18,
      flexDirection:
        "row",
      gap: 11,
      borderWidth: 1,
      borderColor:
        "#BBF7D0",
      borderRadius: 18,
      backgroundColor:
        "#F0FDF4",
      padding: 15,
    },

    successTitle: {
      color:
        "#166534",
      fontSize: 14,
      fontWeight:
        "800",
    },

    successText: {
      marginTop: 3,
      color:
        "#15803D",
      fontSize: 12,
      lineHeight: 18,
    },

    formCard: {
      marginTop: 18,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 24,
      backgroundColor:
        Colors.white,
      padding: 18,
    },

    field: {
      marginBottom: 16,
    },

    labelRow: {
      marginBottom: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    label: {
      color:
        Colors.navyDark,
      fontSize: 13,
      fontWeight:
        "800",
    },

    input: {
      minHeight: 52,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 15,
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 14,
      color:
        Colors.navyDark,
      fontSize: 14,
    },

    excerptInput: {
      marginTop: 8,
      minHeight: 95,
      paddingTop: 13,
    },

    contentInput: {
      marginTop: 8,
      minHeight: 180,
      paddingTop: 13,
    },

    imagePicker: {
      marginTop: 8,
      minHeight: 170,
      overflow:
        "hidden",
      borderWidth: 1,
      borderStyle:
        "dashed",
      borderColor:
        "#B8C1CC",
      borderRadius: 18,
      backgroundColor:
        "#F8FAFC",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 18,
    },

    previewImage: {
      width:
        "100%",
      height: 210,
      borderRadius: 14,
    },

    imagePickerTitle: {
      marginTop: 9,
      color:
        Colors.navyDark,
      fontSize: 14,
      fontWeight:
        "800",
    },

    imagePickerText: {
      marginTop: 4,
      maxWidth: 250,
      color:
        Colors.textSecondary,
      fontSize: 11,
      lineHeight: 17,
      textAlign:
        "center",
    },

    submitButton: {
      marginTop: 20,
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
      gap: 8,
    },

    submitButtonText: {
      color:
        Colors.white,
      fontSize: 14,
      fontWeight:
        "800",
    },

    disabled: {
      opacity: 0.55,
    },

    reviewNotice: {
      marginTop: 14,
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 8,
      borderRadius: 14,
      backgroundColor:
        "#FFFBEA",
      padding: 12,
    },

    reviewNoticeText: {
      flex: 1,
      color:
        Colors.textSecondary,
      fontSize: 11,
      lineHeight: 17,
    },
  });
