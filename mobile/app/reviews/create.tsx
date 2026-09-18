import {
  ActivityIndicator,
  Alert,
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
  Clock3,
  ShieldCheck,
  Star,
} from "lucide-react-native";

import {
  router,
  type Href,
  useLocalSearchParams,
} from "expo-router";

import {
  useEffect,
  useState,
} from "react";

import {
  createReview,
  getMyMatchReview,
  type Review,
} from "@/lib/reviews-api";

import {
  getToken,
} from "@/lib/session";

import {
  Colors,
} from "@/constants/colors";

export default function CreateReviewScreen() {
  const {
    matchId,
    professionalId,
  } =
    useLocalSearchParams<{
      matchId: string;
      professionalId: string;
    }>();

  const resolvedMatchId =
    Array.isArray(
      matchId,
    )
      ? matchId[0]
      : matchId;

  const resolvedProfessionalId =
    Array.isArray(
      professionalId,
    )
      ? professionalId[0]
      : professionalId;

  const [
    rating,
    setRating,
  ] =
    useState(0);

  const [
    comment,
    setComment,
  ] =
    useState("");

  const [
    existingReview,
    setExistingReview,
  ] =
    useState<Review | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    async function load() {
      if (
        !resolvedMatchId
      ) {
        setError(
          "Match ID is missing.",
        );

        setLoading(
          false,
        );

        return;
      }

      try {
        setLoading(
          true,
        );

        setError("");

        const token =
          await getToken();

        if (!token) {
          router.replace(
            "/login" as Href,
          );

          return;
        }

        const current =
          await getMyMatchReview(
            token,
            resolvedMatchId,
          );

        setExistingReview(
          current,
        );
      } catch (
        err
      ) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify your review.",
        );
      } finally {
        setLoading(
          false,
        );
      }
    }

    void load();
  }, [
    resolvedMatchId,
  ]);

  async function handleSubmit() {
    if (
      !resolvedMatchId
    ) {
      Alert.alert(
        "Missing match",
        "A valid match is required.",
      );

      return;
    }

    if (
      rating < 1 ||
      rating > 5
    ) {
      Alert.alert(
        "Rating required",
        "Please select a rating between 1 and 5 stars.",
      );

      return;
    }

    try {
      setSubmitting(
        true,
      );

      const token =
        await getToken();

      if (!token) {
        router.replace(
          "/login" as Href,
        );

        return;
      }

      const result =
        await createReview(
          token,
          {
            matchId:
              resolvedMatchId,

            rating,

            comment:
              comment.trim() ||
              undefined,
          },
        );

      setExistingReview(
        result.review,
      );

      Alert.alert(
        "Review submitted",
        "Your review is pending approval before publication.",
        [
          {
            text: "OK",
          },
        ],
      );
    } catch (
      err
    ) {
      Alert.alert(
        "Unable to submit review",
        err instanceof Error
          ? err.message
          : "Please try again.",
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

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
          Checking your review...
        </Text>
      </SafeAreaView>
    );
  }

  if (
    existingReview
  ) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <ScrollView
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
              styles.successCard
            }
          >
            <CheckCircle2
              size={34}
              color="#15803D"
            />

            <Text
              style={
                styles.successEyebrow
              }
            >
              REVIEW SUBMITTED
            </Text>

            <Text
              style={
                styles.successTitle
              }
            >
              Thank you for your feedback
            </Text>

            <Text
              style={
                styles.successText
              }
            >
              You already submitted a review for this match.
            </Text>
          </View>

          <View
            style={
              styles.reviewCard
            }
          >
            <Text
              style={
                styles.label
              }
            >
              Your rating
            </Text>

            <View
              style={
                styles.starRow
              }
            >
              {[1, 2, 3, 4, 5].map(
                (
                  star,
                ) => (
                  <Star
                    key={
                      star
                    }
                    size={27}
                    color="#D4A91F"
                    fill={
                      star <=
                      existingReview.rating
                        ? "#D4A91F"
                        : "transparent"
                    }
                  />
                ),
              )}
            </View>

            <View
              style={
                styles.statusCard
              }
            >
              {existingReview.status ===
              "APPROVED" ? (
                <CheckCircle2
                  size={20}
                  color="#15803D"
                />
              ) : (
                <Clock3
                  size={20}
                  color="#B45309"
                />
              )}

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.statusTitle
                  }
                >
                  Status:{" "}
                  {
                    existingReview.status
                  }
                </Text>

                <Text
                  style={
                    styles.statusText
                  }
                >
                  {existingReview.status ===
                  "APPROVED"
                    ? "Your review is public."
                    : existingReview.status ===
                        "REJECTED"
                      ? "Your review was not approved."
                      : "Your review is waiting for moderation."}
                </Text>
              </View>
            </View>

            {existingReview.comment ? (
              <>
                <Text
                  style={[
                    styles.label,
                    {
                      marginTop:
                        18,
                    },
                  ]}
                >
                  Your comment
                </Text>

                <View
                  style={
                    styles.commentReadOnly
                  }
                >
                  <Text
                    style={
                      styles.commentReadOnlyText
                    }
                  >
                    {
                      existingReview.comment
                    }
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              if (
                resolvedProfessionalId
              ) {
                router.push(
                  `/reviews/${resolvedProfessionalId}` as Href,
                );
              } else {
                router.push(
                  "/(tabs)/requests" as Href,
                );
              }
            }}
            style={
              styles.primaryButton
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              View Buyer Reviews
            </Text>
          </Pressable>
        </ScrollView>
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
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

        <Text
          style={
            styles.eyebrow
          }
        >
          VERIFIED BUYER REVIEW
        </Text>

        <Text
          style={
            styles.title
          }
        >
          Leave a Review
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Share your experience after completing your match with this professional.
        </Text>

        {error ? (
          <View
            style={
              styles.errorCard
            }
          >
            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>
          </View>
        ) : null}

        <View
          style={
            styles.formCard
          }
        >
          <Text
            style={
              styles.formTitle
            }
          >
            How was your experience?
          </Text>

          <View
            style={
              styles.starRow
            }
          >
            {[1, 2, 3, 4, 5].map(
              (
                star,
              ) => (
                <Pressable
                  key={
                    star
                  }
                  onPress={() =>
                    setRating(
                      star,
                    )
                  }
                  style={
                    styles.starButton
                  }
                >
                  <Star
                    size={33}
                    color="#D4A91F"
                    fill={
                      star <=
                      rating
                        ? "#D4A91F"
                        : "transparent"
                    }
                  />
                </Pressable>
              ),
            )}
          </View>

          <Text
            style={
              styles.ratingText
            }
          >
            {rating === 0
              ? "Select a rating"
              : `${rating} / 5`}
          </Text>

          <Text
            style={[
              styles.label,
              {
                marginTop:
                  22,
              },
            ]}
          >
            Comment
          </Text>

          <TextInput
            value={
              comment
            }
            onChangeText={
              setComment
            }
            multiline
            maxLength={1500}
            textAlignVertical="top"
            placeholder="What went well? What should future buyers know?"
            placeholderTextColor="#98A2B3"
            style={
              styles.commentInput
            }
          />

          <Text
            style={
              styles.counter
            }
          >
            {comment.length}
            /1500
          </Text>

          <Pressable
            disabled={
              submitting ||
              rating === 0
            }
            onPress={() =>
              void handleSubmit()
            }
            style={[
              styles.submitButton,

              (submitting ||
                rating ===
                  0) &&
                styles.disabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator
                color={
                  Colors.white
                }
              />
            ) : (
              <Text
                style={
                  styles.submitText
                }
              >
                Submit Review
              </Text>
            )}
          </Pressable>
        </View>

        <View
          style={
            styles.moderationCard
          }
        >
          <ShieldCheck
            size={21}
            color={
              Colors.gold
            }
          />

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.moderationTitle
              }
            >
              Moderated review
            </Text>

            <Text
              style={
                styles.moderationText
              }
            >
              Your review will be reviewed before publication.
            </Text>
          </View>
        </View>
      </ScrollView>
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

    center: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        Colors.background,
    },

    loadingText: {
      marginTop: 12,
      color:
        Colors.textSecondary,
    },

    content: {
      paddingHorizontal:
        20,
      paddingTop: 14,
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

    eyebrow: {
      marginTop: 24,
      color:
        Colors.gold,
      fontSize: 11,
      fontWeight:
        "900",
      letterSpacing: 1.3,
    },

    title: {
      marginTop: 6,
      color:
        Colors.navyDark,
      fontSize: 34,
      fontWeight:
        "900",
    },

    subtitle: {
      marginTop: 8,
      color:
        Colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
    },

    errorCard: {
      marginTop: 16,
      borderWidth: 1,
      borderColor:
        "#FECACA",
      borderRadius: 16,
      backgroundColor:
        "#FEF2F2",
      padding: 14,
    },

    errorText: {
      color:
        "#B42318",
      fontSize: 12,
    },

    formCard: {
      marginTop: 20,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 22,
      backgroundColor:
        Colors.white,
      padding: 18,
    },

    formTitle: {
      color:
        Colors.navyDark,
      fontSize: 19,
      fontWeight:
        "900",
    },

    starRow: {
      marginTop: 16,
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      gap: 5,
    },

    starButton: {
      flex: 1,
      height: 52,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    ratingText: {
      marginTop: 4,
      color:
        Colors.textSecondary,
      fontSize: 11,
      textAlign:
        "center",
    },

    label: {
      color:
        Colors.navyDark,
      fontSize: 13,
      fontWeight:
        "800",
    },

    commentInput: {
      marginTop: 9,
      minHeight: 150,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 16,
      padding: 14,
      color:
        Colors.navyDark,
      fontSize: 14,
      lineHeight: 21,
    },

    counter: {
      marginTop: 6,
      color:
        "#98A2B3",
      fontSize: 10,
      textAlign:
        "right",
    },

    submitButton: {
      marginTop: 18,
      minHeight: 54,
      borderRadius: 16,
      backgroundColor:
        Colors.navy,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    submitText: {
      color:
        Colors.white,
      fontWeight:
        "900",
    },

    disabled: {
      opacity: 0.45,
    },

    moderationCard: {
      marginTop: 16,
      flexDirection:
        "row",
      gap: 11,
      borderWidth: 1,
      borderColor:
        "#F4DF8C",
      borderRadius: 20,
      backgroundColor:
        "#FFFBEA",
      padding: 16,
    },

    moderationTitle: {
      color:
        Colors.navyDark,
      fontWeight:
        "800",
    },

    moderationText: {
      marginTop: 4,
      color:
        Colors.textSecondary,
      fontSize: 11,
    },

    successCard: {
      marginTop: 20,
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        "#BBF7D0",
      borderRadius: 22,
      backgroundColor:
        "#ECFDF3",
      padding: 22,
    },

    successEyebrow: {
      marginTop: 10,
      color:
        "#15803D",
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing: 1.1,
    },

    successTitle: {
      marginTop: 6,
      color:
        Colors.navyDark,
      fontSize: 22,
      fontWeight:
        "900",
      textAlign:
        "center",
    },

    successText: {
      marginTop: 6,
      color:
        Colors.textSecondary,
      fontSize: 12,
      textAlign:
        "center",
    },

    reviewCard: {
      marginTop: 16,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 22,
      backgroundColor:
        Colors.white,
      padding: 18,
    },

    statusCard: {
      marginTop: 18,
      flexDirection:
        "row",
      gap: 10,
      borderRadius: 16,
      backgroundColor:
        "#F8FAFC",
      padding: 14,
    },

    statusTitle: {
      color:
        Colors.navyDark,
      fontSize: 13,
      fontWeight:
        "800",
    },

    statusText: {
      marginTop: 3,
      color:
        Colors.textSecondary,
      fontSize: 11,
      lineHeight: 17,
    },

    commentReadOnly: {
      marginTop: 9,
      borderRadius: 16,
      backgroundColor:
        "#F8FAFC",
      padding: 14,
    },

    commentReadOnlyText: {
      color:
        Colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
    },

    primaryButton: {
      marginTop: 16,
      minHeight: 52,
      borderRadius: 15,
      backgroundColor:
        Colors.navy,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    primaryButtonText: {
      color:
        Colors.white,
      fontWeight:
        "900",
    },
  });
