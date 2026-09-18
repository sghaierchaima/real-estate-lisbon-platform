import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  ArrowLeft,
  BadgeCheck,
  MessageSquareText,
  Star,
} from "lucide-react-native";

import {
  router,
  type Href,
  useLocalSearchParams,
} from "expo-router";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAssetUrl,
} from "@/lib/api";

import {
  getPublicProfessional,
  type Professional,
} from "@/lib/professionals-api";

import {
  getProfessionalReviews,
  type PublicProfessionalReview,
} from "@/lib/reviews-api";

import {
  Colors,
} from "@/constants/colors";

function getInitials(
  name?: string | null,
) {
  if (!name?.trim()) {
    return "B";
  }

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part[0]?.toUpperCase(),
    )
    .join("");
}

function formatDate(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleDateString();
}

export default function ProfessionalReviewsScreen() {
  const {
    professionalId,
  } =
    useLocalSearchParams<{
      professionalId: string;
    }>();

  const id =
    Array.isArray(
      professionalId,
    )
      ? professionalId[0]
      : professionalId;

  const [
    professional,
    setProfessional,
  ] =
    useState<Professional | null>(
      null,
    );

  const [
    reviews,
    setReviews,
  ] =
    useState<
      PublicProfessionalReview[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const load =
    useCallback(
      async (
        refresh = false,
      ) => {
        if (!id) {
          setError(
            "Professional ID is missing.",
          );

          setLoading(
            false,
          );

          return;
        }

        try {
          if (refresh) {
            setRefreshing(
              true,
            );
          } else {
            setLoading(
              true,
            );
          }

          setError("");

          const [
            professionalData,
            reviewData,
          ] =
            await Promise.all([
              getPublicProfessional(
                id,
              ),

              getProfessionalReviews(
                id,
              ),
            ]);

          setProfessional(
            professionalData,
          );

          setReviews(
            Array.isArray(
              reviewData,
            )
              ? reviewData
              : [],
          );
        } catch (
          err
        ) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load buyer reviews.",
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        id,
      ],
    );

  useEffect(() => {
    void load();
  }, [
    load,
  ]);

  const average =
    useMemo(
      () => {
        if (
          reviews.length ===
          0
        ) {
          return Number(
            professional?.rating ||
              0,
          );
        }

        return (
          reviews.reduce(
            (
              total,
              review,
            ) =>
              total +
              Number(
                review.rating,
              ),
            0,
          ) /
          reviews.length
        );
      },
      [
        reviews,
        professional,
      ],
    );

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
          Loading buyer reviews...
        </Text>
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
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void load(true)
            }
            tintColor={
              Colors.navy
            }
          />
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
          BUYER FEEDBACK
        </Text>

        <Text
          style={
            styles.title
          }
        >
          Client Reviews
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Feedback from buyers who completed their journey with this professional.
        </Text>

        {professional ? (
          <View
            style={
              styles.professionalCard
            }
          >
            <BadgeCheck
              size={24}
              color="#15803D"
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.professionalName
                }
              >
                {professional.user
                  .fullName ||
                  "Verified Professional"}
              </Text>

              <Text
                style={
                  styles.professionalCompany
                }
              >
                {professional
                  .companyName ||
                  "Independent Professional"}
              </Text>
            </View>
          </View>
        ) : null}

        <View
          style={
            styles.summaryCard
          }
        >
          <Text
            style={
              styles.average
            }
          >
            {average.toFixed(
              1,
            )}
          </Text>

          <View
            style={
              styles.stars
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
                  size={19}
                  color="#D4A91F"
                  fill={
                    star <=
                    Math.round(
                      average,
                    )
                      ? "#D4A91F"
                      : "transparent"
                  }
                />
              ),
            )}
          </View>

          <Text
            style={
              styles.summaryText
            }
          >
            {reviews.length}{" "}
            {reviews.length ===
            1
              ? "approved review"
              : "approved reviews"}
          </Text>
        </View>

        {error ? (
          <View
            style={
              styles.errorCard
            }
          >
            <Text
              style={
                styles.errorTitle
              }
            >
              Unable to load reviews
            </Text>

            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>
          </View>
        ) : null}

        {!error &&
        reviews.length ===
          0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <MessageSquareText
              size={36}
              color={
                Colors.navy
              }
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No buyer reviews yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Approved reviews from completed matches will appear here.
            </Text>
          </View>
        ) : null}

        {reviews.map(
          (
            review,
          ) => {
            const buyerName =
              review.buyer
                ?.fullName ||
              "Verified Buyer";

            const avatar =
              getAssetUrl(
                review.buyer
                  ?.avatarUrl,
              );

            return (
              <View
                key={
                  review.id
                }
                style={
                  styles.reviewCard
                }
              >
                <View
                  style={
                    styles.reviewHeader
                  }
                >
                  <View
                    style={
                      styles.avatar
                    }
                  >
                    {avatar ? (
                      <Image
                        source={{
                          uri:
                            avatar,
                        }}
                        style={
                          styles.avatarImage
                        }
                      />
                    ) : (
                      <Text
                        style={
                          styles.avatarText
                        }
                      >
                        {getInitials(
                          buyerName,
                        )}
                      </Text>
                    )}
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={
                        styles.buyerName
                      }
                    >
                      {buyerName}
                    </Text>

                    <View
                      style={
                        styles.verifiedBuyerRow
                      }
                    >
                      <BadgeCheck
                        size={13}
                        color="#15803D"
                      />

                      <Text
                        style={
                          styles.verifiedBuyerText
                        }
                      >
                        Verified Buyer
                      </Text>
                    </View>

                    <View
                      style={
                        styles.reviewStars
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
                            size={14}
                            color="#D4A91F"
                            fill={
                              star <=
                              review.rating
                                ? "#D4A91F"
                                : "transparent"
                            }
                          />
                        ),
                      )}
                    </View>
                  </View>
                </View>

                {review.comment ? (
                  <Text
                    style={
                      styles.comment
                    }
                  >
                    {review.comment}
                  </Text>
                ) : null}

                <Text
                  style={
                    styles.date
                  }
                >
                  {formatDate(
                    review.createdAt,
                  )}
                </Text>
              </View>
            );
          },
        )}

        <View
          style={
            styles.footerCard
          }
        >
          <Text
            style={
              styles.footerTitle
            }
          >
            Want to leave a review?
          </Text>

          <Text
            style={
              styles.footerText
            }
          >
            Reviews can be submitted only from a completed match in My Requests.
          </Text>

          <Pressable
            onPress={() =>
              router.push(
                "/(tabs)/requests" as Href,
              )
            }
            style={
              styles.requestsButton
            }
          >
            <Text
              style={
                styles.requestsButtonText
              }
            >
              View My Requests
            </Text>
          </Pressable>
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

    professionalCard: {
      marginTop: 18,
      flexDirection:
        "row",
      gap: 12,
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 18,
      backgroundColor:
        Colors.white,
      padding: 15,
    },

    professionalName: {
      color:
        Colors.navyDark,
      fontSize: 15,
      fontWeight:
        "900",
    },

    professionalCompany: {
      marginTop: 3,
      color:
        Colors.textSecondary,
      fontSize: 11,
    },

    summaryCard: {
      marginTop: 16,
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 22,
      backgroundColor:
        Colors.white,
      padding: 20,
    },

    average: {
      color:
        Colors.navyDark,
      fontSize: 38,
      fontWeight:
        "900",
    },

    stars: {
      marginTop: 5,
      flexDirection:
        "row",
      gap: 2,
    },

    summaryText: {
      marginTop: 7,
      color:
        Colors.textSecondary,
      fontSize: 11,
    },

    errorCard: {
      marginTop: 16,
      borderWidth: 1,
      borderColor:
        "#FECACA",
      borderRadius: 18,
      backgroundColor:
        "#FEF2F2",
      padding: 16,
    },

    errorTitle: {
      color:
        "#B42318",
      fontWeight:
        "800",
    },

    errorText: {
      marginTop: 5,
      color:
        "#B42318",
      fontSize: 12,
    },

    emptyCard: {
      marginTop: 16,
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 22,
      backgroundColor:
        Colors.white,
      padding: 28,
    },

    emptyTitle: {
      marginTop: 10,
      color:
        Colors.navyDark,
      fontSize: 17,
      fontWeight:
        "800",
    },

    emptyText: {
      marginTop: 6,
      color:
        Colors.textSecondary,
      textAlign:
        "center",
      fontSize: 12,
    },

    reviewCard: {
      marginTop: 14,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius: 20,
      backgroundColor:
        Colors.white,
      padding: 16,
    },

    reviewHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 11,
    },

    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
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
      width: "100%",
      height: "100%",
    },

    avatarText: {
      color:
        Colors.white,
      fontWeight:
        "900",
    },

    buyerName: {
      color:
        Colors.navyDark,
      fontSize: 13,
      fontWeight:
        "800",
    },

    verifiedBuyerRow: {
      marginTop: 3,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    verifiedBuyerText: {
      color:
        "#15803D",
      fontSize: 10,
      fontWeight:
        "700",
    },

    reviewStars: {
      marginTop: 5,
      flexDirection:
        "row",
      gap: 2,
    },

    comment: {
      marginTop: 13,
      color:
        Colors.textSecondary,
      fontSize: 13,
      lineHeight: 21,
    },

    date: {
      marginTop: 11,
      color:
        "#98A2B3",
      fontSize: 10,
    },

    footerCard: {
      marginTop: 18,
      borderRadius: 22,
      backgroundColor:
        Colors.navyDark,
      padding: 18,
    },

    footerTitle: {
      color:
        Colors.white,
      fontSize: 17,
      fontWeight:
        "800",
    },

    footerText: {
      marginTop: 6,
      color:
        "rgba(255,255,255,0.75)",
      fontSize: 12,
      lineHeight: 19,
    },

    requestsButton: {
      marginTop: 14,
      minHeight: 48,
      borderRadius: 14,
      backgroundColor:
        Colors.gold,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    requestsButtonText: {
      color:
        Colors.navyDark,
      fontWeight:
        "900",
    },
  });
