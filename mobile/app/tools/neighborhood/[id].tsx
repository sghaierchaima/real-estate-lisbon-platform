import {
  ActivityIndicator,
  Alert,
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
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  ArrowLeft,
  BadgeEuro,
  Brain,
  Building2,
  Check,
  CheckCircle2,
  Coffee,
  Landmark,
  MapPin,
  School,
  ShieldCheck,
  Sparkles,
  Star,
  TramFront,
  TrendingUp,
} from "lucide-react-native";

import AppMenu from "@/components/AppMenu";

import {
  useAppMenu,
} from "@/hooks/useAppMenu";

import {
  getNeighborhood,
} from "@/lib/neighborhoods-api";

import type {
  Neighborhood,
} from "@/lib/neighborhoods-api";

import {
  createLeadFromNeighborhoodFinder,
} from "@/lib/leads-api";

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

/* ============================================================
   PAGE
============================================================ */

export default function NeighborhoodDetailsScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const id =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const {
    menuVisible,
    menuUser,
    savedCount,
    unreadMessages,
    openMenu,
    closeMenu,
  } = useAppMenu();

  const [
    neighborhood,
    setNeighborhood,
  ] =
    useState<Neighborhood | null>(
      null,
    );

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
    creatingRequest,
    setCreatingRequest,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* ============================================================
     LOAD NEIGHBORHOOD
  ============================================================ */

  const loadNeighborhood =
    useCallback(
      async (
        refresh = false,
      ) => {
        if (!id) {
          setError(
            "Neighborhood ID is missing.",
          );

          setLoading(false);

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

          const data =
            await getNeighborhood(
              id,
            );

          setNeighborhood(
            data,
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load neighborhood.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [id],
    );

  useEffect(() => {
    void loadNeighborhood();
  }, [
    loadNeighborhood,
  ]);

  /* ============================================================
     CREATE BUYER REQUEST
  ============================================================ */

  async function handleCreateRequest() {
    if (
      !neighborhood ||
      creatingRequest
    ) {
      return;
    }

    const token =
      await getToken();

    const user =
      await getStoredUser<AuthUser>();

    if (
      !token ||
      !user
    ) {
      Alert.alert(
        "Login required",
        "Please sign in as a buyer to create a neighborhood request.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text: "Sign in",
            onPress: () =>
              router.push(
                "/login",
              ),
          },
        ],
      );

      return;
    }

    if (
      user.role !==
      "BUYER"
    ) {
      Alert.alert(
        "Buyer account required",
        "Only buyer accounts can create neighborhood requests.",
      );

      return;
    }

    try {
      setCreatingRequest(
        true,
      );

      const lead =
        await createLeadFromNeighborhoodFinder(
          token,
          {
            neighborhoodId:
              neighborhood.id,

            neighborhoodName:
              neighborhood.name,

            profile:
              "all",

            goal:
              "all",
          },
        );

      const matched =
        lead.status ===
          "MATCHED" ||
        lead.autoMatching
          ?.matched;

      const match =
        lead.matches?.[0];

      const professionalName =
        match?.professional
          ?.user
          ?.fullName;

      const score =
        match?.score;

      if (matched) {
        Alert.alert(
          "Smart match found",
          professionalName &&
          typeof score ===
            "number"
            ? `${professionalName} matches your ${neighborhood.name} request with a ${score}% compatibility score.`
            : `Your ${neighborhood.name} request has been matched with a verified professional.`,
          [
            {
              text:
                "View Requests",

              onPress: () =>
                router.push(
                  "/(tabs)/requests",
                ),
            },

            {
              text:
                "OK",
            },
          ],
        );

        return;
      }

      Alert.alert(
        lead.alreadyExists
          ? "Request already exists"
          : "Neighborhood request created",

        lead.alreadyExists
          ? `Your ${neighborhood.name} request already exists in My Requests.`
          : `Your ${neighborhood.name} request was created successfully and is ready for professional matching.`,

        [
          {
            text:
              "View Requests",

            onPress: () =>
              router.push(
                "/(tabs)/requests",
              ),
          },

          {
            text:
              "OK",
          },
        ],
      );
    } catch (err) {
      Alert.alert(
        "Request failed",
        err instanceof Error
          ? err.message
          : "Unable to create the neighborhood request.",
      );
    } finally {
      setCreatingRequest(
        false,
      );
    }
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="large"
          color="#E1A820"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading neighborhood...
        </Text>
      </SafeAreaView>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (
    error ||
    !neighborhood
  ) {
    return (
      <SafeAreaView
        style={
          styles.center
        }
      >
        <MapPin
          size={40}
          color="#E1A820"
        />

        <Text
          style={
            styles.errorTitle
          }
        >
          Neighborhood unavailable
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          {error ||
            "Unable to find this neighborhood."}
        </Text>

        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.errorButton
          }
        >
          <Text
            style={
              styles.errorButtonText
            }
          >
            Go back
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  /* ============================================================
     VALUES
  ============================================================ */

  const avgPrice =
    Number(
      neighborhood.avgPrice ||
        0,
    );

  const pricePerSqm =
    Number(
      neighborhood.pricePerSqm ||
        0,
    );

  const rentYield =
    Number(
      neighborhood.rentYield ||
        0,
    );

  const growth =
    Number(
      neighborhood.growthPercent ||
        0,
    );

  const aiScore =
    typeof neighborhood.aiScore ===
    "number"
      ? neighborhood.aiScore
      : null;

  /* ============================================================
     UI
  ============================================================ */

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
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void loadNeighborhood(
                true,
              )
            }
            tintColor="#E1A820"
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* ====================================================
            TOP BAR
        ==================================================== */}

        <View
          style={
            styles.topBar
          }
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            style={
              styles.iconButton
            }
          >
            <ArrowLeft
              size={21}
              color={
                Colors.navyDark
              }
            />
          </Pressable>

          <Pressable
            onPress={
              openMenu
            }
            style={
              styles.menuButton
            }
          >
            <Text
              style={
                styles.menuText
              }
            >
              Menu
            </Text>
          </Pressable>
        </View>

        {/* ====================================================
            HERO
        ==================================================== */}

        <View
          style={
            styles.hero
          }
        >
          <View
            style={
              styles.heroDecorationOne
            }
          />

          <View
            style={
              styles.heroDecorationTwo
            }
          />

          <View
            style={
              styles.heroBadge
            }
          >
            <MapPin
              size={14}
              color="#D4A91F"
            />

            <Text
              style={
                styles.heroBadgeText
              }
            >
              {neighborhood.zone ||
                "Lisbon Area"}
            </Text>
          </View>

          <Text
            style={
              styles.heroTitle
            }
          >
            {
              neighborhood.name
            }
          </Text>

          <Text
            style={
              styles.heroDescription
            }
          >
            {neighborhood.description ||
              "Explore market data, lifestyle scores and investment indicators for this neighborhood."}
          </Text>

          {aiScore !==
          null ? (
            <View
              style={
                styles.aiScoreHero
              }
            >
              <Sparkles
                size={18}
                color="#D4A91F"
              />

              <View>
                <Text
                  style={
                    styles.aiScoreValue
                  }
                >
                  {aiScore}%
                </Text>

                <Text
                  style={
                    styles.aiScoreLabel
                  }
                >
                  AI area score
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ====================================================
            MARKET OVERVIEW
        ==================================================== */}

        <SectionTitle
          eyebrow="MARKET DATA"
          title="Market overview"
          description="Key property and investment indicators for this area."
        />

        <View
          style={
            styles.metricsGrid
          }
        >
          <MetricCard
            icon={
              BadgeEuro
            }
            label="Average price"
            value={formatEuro(
              avgPrice,
            )}
          />

          <MetricCard
            icon={
              Building2
            }
            label="Price / m²"
            value={`${formatEuro(
              pricePerSqm,
            )}/m²`}
          />

          <MetricCard
            icon={
              TrendingUp
            }
            label="Growth"
            value={`${formatNumber(
              growth,
            )}%`}
          />

          <MetricCard
            icon={
              Landmark
            }
            label="Rental yield"
            value={`${formatNumber(
              rentYield,
            )}%`}
          />
        </View>

        {/* ====================================================
            AI ANALYSIS
        ==================================================== */}

        {neighborhood.aiSummary ? (
          <>
            <SectionTitle
              eyebrow="SMART ANALYSIS"
              title="AI neighborhood insight"
              description="Platform-generated analysis based on market and lifestyle indicators."
            />

            <View
              style={
                styles.aiCard
              }
            >
              <View
                style={
                  styles.aiIcon
                }
              >
                <Brain
                  size={21}
                  color="#6D28D9"
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.aiTitle
                  }
                >
                  Smart Area Analysis
                </Text>

                <Text
                  style={
                    styles.aiText
                  }
                >
                  {
                    neighborhood.aiSummary
                  }
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {/* ====================================================
            LIFESTYLE SCORES
        ==================================================== */}

        <SectionTitle
          eyebrow="QUALITY OF LIFE"
          title="Lifestyle scores"
          description="Compare essential day-to-day factors on a five-point scale."
        />

        <View
          style={
            styles.scoreGrid
          }
        >
          <ScoreCard
            icon={
              School
            }
            title="Schools"
            value={Number(
              neighborhood.schoolsScore ||
                0,
            )}
            count={
              neighborhood.schoolsCount
            }
          />

          <ScoreCard
            icon={
              TramFront
            }
            title="Transport"
            value={Number(
              neighborhood.transportScore ||
                0,
            )}
            count={
              neighborhood.transportCount
            }
          />

          <ScoreCard
            icon={
              Coffee
            }
            title="Amenities"
            value={Number(
              neighborhood.amenitiesScore ||
                0,
            )}
            count={
              neighborhood.amenitiesCount
            }
          />

          <ScoreCard
            icon={
              ShieldCheck
            }
            title="Safety"
            value={Number(
              neighborhood.safetyScore ||
                0,
            )}
          />
        </View>

        {/* ====================================================
            TAGS
        ==================================================== */}

        {neighborhood.tags
          ?.length >
        0 ? (
          <>
            <SectionTitle
              eyebrow="AREA PROFILE"
              title="Best known for"
              description="Characteristics associated with this neighborhood."
            />

            <View
              style={
                styles.tagContainer
              }
            >
              {neighborhood.tags.map(
                (
                  tag,
                ) => (
                  <View
                    key={
                      tag
                    }
                    style={
                      styles.tag
                    }
                  >
                    <Text
                      style={
                        styles.tagText
                      }
                    >
                      {tag}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </>
        ) : null}

        {/* ====================================================
            HIGHLIGHTS
        ==================================================== */}

        {neighborhood
          .highlights
          ?.length >
        0 ? (
          <>
            <SectionTitle
              eyebrow="WHY THIS AREA"
              title="Neighborhood highlights"
              description="Important features and advantages of the area."
            />

            <View
              style={
                styles.highlightsCard
              }
            >
              {neighborhood.highlights.map(
                (
                  highlight,
                  index,
                ) => (
                  <View
                    key={`${highlight}-${index}`}
                    style={
                      styles.highlightRow
                    }
                  >
                    <View
                      style={
                        styles.highlightIcon
                      }
                    >
                      <Check
                        size={14}
                        color="#15803D"
                      />
                    </View>

                    <Text
                      style={
                        styles.highlightText
                      }
                    >
                      {
                        highlight
                      }
                    </Text>
                  </View>
                ),
              )}
            </View>
          </>
        ) : null}

        {/* ====================================================
            LOCATION
        ==================================================== */}

        <SectionTitle
          eyebrow="LOCATION"
          title="Geographic position"
          description="Reference coordinates associated with this neighborhood."
        />

        <View
          style={
            styles.locationCard
          }
        >
          <View
            style={
              styles.locationIcon
            }
          >
            <MapPin
              size={22}
              color="#E1A820"
            />
          </View>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.locationTitle
              }
            >
              {
                neighborhood.name
              }
            </Text>

            <Text
              style={
                styles.locationZone
              }
            >
              {neighborhood.zone ||
                "Lisbon Area"}
            </Text>

            {typeof neighborhood.latitude ===
              "number" &&
            typeof neighborhood.longitude ===
              "number" ? (
              <Text
                style={
                  styles.coordinates
                }
              >
                {neighborhood.latitude.toFixed(
                  5,
                )}
                {" , "}
                {neighborhood.longitude.toFixed(
                  5,
                )}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ====================================================
            SOURCE
        ==================================================== */}

        {neighborhood.sourceNotes ? (
          <>
            <SectionTitle
              eyebrow="DATA TRANSPARENCY"
              title="Data source"
              description="Information about the market data used by the platform."
            />

            <View
              style={
                styles.sourceCard
              }
            >
              <ShieldCheck
                size={20}
                color={
                  Colors.gold
                }
              />

              <Text
                style={
                  styles.sourceText
                }
              >
                {
                  neighborhood.sourceNotes
                }
              </Text>
            </View>
          </>
        ) : null}

        {/* ====================================================
            CREATE REQUEST
        ==================================================== */}

        <View
          style={
            styles.requestCard
          }
        >
          <View
            style={
              styles.requestIcon
            }
          >
            <Sparkles
              size={23}
              color="#D4A91F"
            />
          </View>

          <Text
            style={
              styles.requestEyebrow
            }
          >
            NEXT STEP
          </Text>

          <Text
            style={
              styles.requestTitle
            }
          >
            Interested in{" "}
            {
              neighborhood.name
            }
            ?
          </Text>

          <Text
            style={
              styles.requestText
            }
          >
            Create a buyer request and let Real Estate Lisbon connect you with verified professionals who can help with your property project in this area.
          </Text>

          <Pressable
            disabled={
              creatingRequest
            }
            onPress={() =>
              void handleCreateRequest()
            }
            style={[
              styles.requestButton,

              creatingRequest &&
                styles.requestButtonDisabled,
            ]}
          >
            {creatingRequest ? (
              <ActivityIndicator
                color="#0F2340"
              />
            ) : (
              <>
                <CheckCircle2
                  size={17}
                  color="#0F2340"
                />

                <Text
                  style={
                    styles.requestButtonText
                  }
                >
                  Create Buyer Request
                </Text>
              </>
            )}
          </Pressable>

          <Text
            style={
              styles.requestFootnote
            }
          >
            Your request can automatically enter Smart Matching.
          </Text>
        </View>

        <View
          style={{
            height: 34,
          }}
        />
      </ScrollView>

      <AppMenu
        visible={
          menuVisible
        }
        onClose={
          closeMenu
        }
        user={
          menuUser
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

/* ============================================================
   SECTION TITLE
============================================================ */

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      <Text
        style={
          styles.sectionEyebrow
        }
      >
        {eyebrow}
      </Text>

      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.sectionDescription
        }
      >
        {description}
      </Text>
    </View>
  );
}

/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ComponentType<any>;

  label: string;

  value: string;
}) {
  return (
    <View
      style={
        styles.metricCard
      }
    >
      <View
        style={
          styles.metricIcon
        }
      >
        <Icon
          size={18}
          color="#E1A820"
        />
      </View>

      <Text
        style={
          styles.metricLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.metricValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

/* ============================================================
   SCORE CARD
============================================================ */

function ScoreCard({
  icon: Icon,
  title,
  value,
  count,
}: {
  icon:
    React.ComponentType<any>;

  title: string;

  value: number;

  count?: number;
}) {
  const safeValue =
    Math.max(
      0,
      Math.min(
        5,
        Number(
          value || 0,
        ),
      ),
    );

  return (
    <View
      style={
        styles.scoreCard
      }
    >
      <View
        style={
          styles.scoreCardIcon
        }
      >
        <Icon
          size={19}
          color="#C9A227"
        />
      </View>

      <Text
        style={
          styles.scoreCardTitle
        }
      >
        {title}
      </Text>

      <View
        style={
          styles.scoreRow
        }
      >
        <Star
          size={14}
          color="#C9A227"
          fill="#C9A227"
        />

        <Text
          style={
            styles.scoreCardValue
          }
        >
          {safeValue.toFixed(
            1,
          )}
        </Text>

        <Text
          style={
            styles.scoreOutOf
          }
        >
          / 5
        </Text>
      </View>

      {typeof count ===
        "number" ? (
        <Text
          style={
            styles.scoreCount
          }
        >
          {count} nearby
        </Text>
      ) : null}
    </View>
  );
}

/* ============================================================
   FORMATTERS
============================================================ */

function formatEuro(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IE",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits:
        0,
    },
  ).format(
    value || 0,
  );
}

function formatNumber(
  value: number,
) {
  return Number(
    value || 0,
  ).toLocaleString(
    "en-IE",
    {
      maximumFractionDigits:
        1,
    },
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#F6F7F9",
    },

    center: {
      flex: 1,
      backgroundColor:
        "#F6F7F9",
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 28,
    },

    loadingText: {
      marginTop: 12,
      color:
        Colors.textSecondary,
    },

    errorTitle: {
      marginTop: 14,
      color:
        Colors.navyDark,
      fontSize: 20,
      fontWeight: "900",
      textAlign: "center",
    },

    errorText: {
      marginTop: 8,
      color:
        Colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },

    errorButton: {
      marginTop: 20,
      minHeight: 48,
      borderRadius: 15,
      backgroundColor:
        Colors.navy,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent:
        "center",
    },

    errorButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 14,
    },

    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    iconButton: {
      width: 46,
      height: 46,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    menuButton: {
      minHeight: 44,
      borderRadius: 14,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      paddingHorizontal: 15,
      alignItems: "center",
      justifyContent:
        "center",
    },

    menuText: {
      color: Colors.navy,
      fontSize: 12,
      fontWeight: "800",
    },

    hero: {
      position: "relative",
      overflow: "hidden",
      marginTop: 20,
      borderRadius: 28,
      backgroundColor:
        "#10284D",
      padding: 22,
    },

    heroDecorationOne: {
      position: "absolute",
      width: 160,
      height: 160,
      borderRadius: 80,
      right: -70,
      top: -65,
      backgroundColor:
        "rgba(212,169,31,0.15)",
    },

    heroDecorationTwo: {
      position: "absolute",
      width: 130,
      height: 130,
      borderRadius: 65,
      left: -60,
      bottom: -70,
      backgroundColor:
        "rgba(255,255,255,0.05)",
    },

    heroBadge: {
      alignSelf:
        "flex-start",
      borderRadius: 999,
      backgroundColor:
        "rgba(255,255,255,0.08)",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },

    heroBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "800",
    },

    heroTitle: {
      marginTop: 18,
      color: "#FFFFFF",
      fontSize: 32,
      lineHeight: 38,
      fontWeight: "900",
      letterSpacing: -0.8,
    },

    heroDescription: {
      marginTop: 10,
      color: "#D0D5DD",
      fontSize: 13,
      lineHeight: 21,
    },

    aiScoreHero: {
      marginTop: 18,
      alignSelf:
        "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 16,
      backgroundColor:
        "rgba(255,255,255,0.08)",
      paddingHorizontal: 14,
      paddingVertical: 10,
    },

    aiScoreValue: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "900",
    },

    aiScoreLabel: {
      color: "#D0D5DD",
      fontSize: 8,
    },

    sectionHeader: {
      marginTop: 30,
      marginBottom: 14,
    },

    sectionEyebrow: {
      color: "#E1A820",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.2,
    },

    sectionTitle: {
      marginTop: 5,
      color:
        Colors.navyDark,
      fontSize: 23,
      fontWeight: "900",
    },

    sectionDescription: {
      marginTop: 6,
      color:
        Colors.textSecondary,
      fontSize: 11,
      lineHeight: 18,
    },

    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },

    metricCard: {
      width: "48%",
      minHeight: 112,
      borderRadius: 20,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      padding: 14,
    },

    metricIcon: {
      width: 37,
      height: 37,
      borderRadius: 12,
      backgroundColor:
        "#FFF8E1",
      alignItems: "center",
      justifyContent:
        "center",
    },

    metricLabel: {
      marginTop: 9,
      color: "#667085",
      fontSize: 9,
    },

    metricValue: {
      marginTop: 3,
      color:
        Colors.navyDark,
      fontSize: 15,
      fontWeight: "900",
    },

    aiCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "#DDD6FE",
      backgroundColor:
        "#F5F3FF",
      padding: 16,
      flexDirection: "row",
      gap: 11,
    },

    aiIcon: {
      width: 41,
      height: 41,
      borderRadius: 13,
      backgroundColor:
        "#EDE9FE",
      alignItems: "center",
      justifyContent:
        "center",
    },

    aiTitle: {
      color: "#5B21B6",
      fontSize: 13,
      fontWeight: "900",
    },

    aiText: {
      marginTop: 5,
      color: "#475467",
      fontSize: 11,
      lineHeight: 18,
    },

    scoreGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },

    scoreCard: {
      width: "48%",
      minHeight: 140,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      backgroundColor:
        "#FFFFFF",
      padding: 14,
    },

    scoreCardIcon: {
      width: 39,
      height: 39,
      borderRadius: 13,
      backgroundColor:
        "#F7F3E8",
      alignItems: "center",
      justifyContent:
        "center",
    },

    scoreCardTitle: {
      marginTop: 10,
      color:
        Colors.navyDark,
      fontSize: 12,
      fontWeight: "900",
    },

    scoreRow: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    scoreCardValue: {
      color:
        Colors.navyDark,
      fontSize: 17,
      fontWeight: "900",
    },

    scoreOutOf: {
      color: "#98A2B3",
      fontSize: 9,
    },

    scoreCount: {
      marginTop: 5,
      color: "#667085",
      fontSize: 8,
    },

    tagContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    tag: {
      borderRadius: 999,
      backgroundColor:
        "#EEF3F8",
      paddingHorizontal: 12,
      paddingVertical: 7,
    },

    tagText: {
      color: Colors.navy,
      fontSize: 9,
      fontWeight: "800",
    },

    highlightsCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      backgroundColor:
        "#FFFFFF",
      padding: 16,
      gap: 12,
    },

    highlightRow: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 9,
    },

    highlightIcon: {
      width: 27,
      height: 27,
      borderRadius: 9,
      backgroundColor:
        "#ECFDF3",
      alignItems: "center",
      justifyContent:
        "center",
    },

    highlightText: {
      flex: 1,
      color: "#475467",
      fontSize: 11,
      lineHeight: 18,
      paddingTop: 4,
    },

    locationCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      backgroundColor:
        "#FFFFFF",
      padding: 16,
      flexDirection: "row",
      gap: 12,
    },

    locationIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor:
        "#FFF8E1",
      alignItems: "center",
      justifyContent:
        "center",
    },

    locationTitle: {
      color:
        Colors.navyDark,
      fontSize: 15,
      fontWeight: "900",
    },

    locationZone: {
      marginTop: 3,
      color:
        Colors.textSecondary,
      fontSize: 10,
    },

    coordinates: {
      marginTop: 6,
      color: Colors.gold,
      fontSize: 9,
      fontWeight: "700",
    },

    sourceCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#F3E6AD",
      backgroundColor:
        "#FFFBEB",
      padding: 15,
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 10,
    },

    sourceText: {
      flex: 1,
      color: "#667085",
      fontSize: 10,
      lineHeight: 17,
    },

    requestCard: {
      marginTop: 32,
      borderRadius: 27,
      backgroundColor:
        "#10284D",
      padding: 22,
      alignItems: "center",
    },

    requestIcon: {
      width: 50,
      height: 50,
      borderRadius: 17,
      backgroundColor:
        "rgba(212,169,31,0.12)",
      alignItems: "center",
      justifyContent:
        "center",
    },

    requestEyebrow: {
      marginTop: 14,
      color: "#D4A91F",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.2,
    },

    requestTitle: {
      marginTop: 7,
      color: "#FFFFFF",
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "900",
      textAlign: "center",
    },

    requestText: {
      marginTop: 8,
      color: "#D0D5DD",
      fontSize: 11,
      lineHeight: 18,
      textAlign: "center",
    },

    requestButton: {
      marginTop: 18,
      minHeight: 54,
      alignSelf: "stretch",
      borderRadius: 16,
      backgroundColor:
        "#D4A91F",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 7,
    },

    requestButtonDisabled: {
      opacity: 0.65,
    },

    requestButtonText: {
      color: "#0F2340",
      fontSize: 12,
      fontWeight: "900",
    },

    requestFootnote: {
      marginTop: 9,
      color: "#98A2B3",
      fontSize: 8,
    },
  });