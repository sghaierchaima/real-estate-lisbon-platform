import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
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
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  router,
} from "expo-router";

import {
  ArrowLeft,
  ArrowRight,
  BadgeEuro,
  Brain,
  Building2,
  CheckCircle2,
  Coffee,
  MapPin,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TramFront,
  TrendingUp,
  Trophy,
} from "lucide-react-native";

import AppMenu from "@/components/AppMenu";

import {
  useAppMenu,
} from "@/hooks/useAppMenu";

import {
  getNeighborhoods,
} from "@/lib/neighborhoods-api";

import type {
  Neighborhood as ApiNeighborhood,
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
   TYPES
============================================================ */

type ProfileType =
  | "all"
  | "family"
  | "investor"
  | "expat";

type GoalType =
  | "all"
  | "live"
  | "invest"
  | "retire";

type MobileNeighborhood = {
  id: string;

  name: string;

  zone: string;

  description: string;

  tags: string[];

  highlights: string[];

  avgPrice: number;

  pricePerSqm: number;

  rentYield: number;

  growth: number;

  latitude: number;

  longitude: number;

  scores: {
    schools: number;

    transport: number;

    amenities: number;

    safety: number;
  };

  icon:
    | "waves"
    | "tree"
    | "building"
    | "sun";

  sourceNotes?: string;

  aiScore:
    | number
    | null;

  aiSummary:
    | string
    | null;
};

/* ============================================================
   OPTIONS
============================================================ */

const PROFILE_OPTIONS: {
  value: ProfileType;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },

  {
    value: "family",
    label: "Family",
  },

  {
    value: "investor",
    label: "Investor",
  },

  {
    value: "expat",
    label: "Expat",
  },
];

const GOAL_OPTIONS: {
  value: GoalType;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },

  {
    value: "live",
    label: "Live",
  },

  {
    value: "invest",
    label: "Invest",
  },

  {
    value: "retire",
    label: "Retire",
  },
];

/* ============================================================
   HELPERS
============================================================ */

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.max(
    min,
    Math.min(
      max,
      value,
    ),
  );
}

function normalizeScore(
  value: number,
) {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }

  return clamp(
    value,
    0,
    5,
  );
}

function normalizeAIScore(
  value:
    | number
    | null
    | undefined,
) {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    )
  ) {
    return null;
  }

  return clamp(
    Math.round(
      value,
    ),
    0,
    100,
  );
}

function mapApiNeighborhood(
  row: ApiNeighborhood,
): MobileNeighborhood {
  const icon =
    row.icon === "waves" ||
    row.icon === "tree" ||
    row.icon === "building" ||
    row.icon === "sun"
      ? row.icon
      : "building";

  return {
    id:
      row.id,

    name:
      row.name,

    zone:
      row.zone ||
      "Lisbon Area",

    description:
      row.description ||
      "No description available.",

    tags:
      row.tags ||
      [],

    highlights:
      row.highlights ||
      [],

    avgPrice:
      Number(
        row.avgPrice ||
          0,
      ),

    pricePerSqm:
      Number(
        row.pricePerSqm ||
          0,
      ),

    rentYield:
      Number(
        row.rentYield ||
          0,
      ),

    growth:
      Number(
        row.growthPercent ||
          0,
      ),

    latitude:
      Number(
        row.latitude ||
          38.7223,
      ),

    longitude:
      Number(
        row.longitude ||
          -9.1393,
      ),

    scores: {
      schools:
        normalizeScore(
          Number(
            row.schoolsScore ||
              0,
          ),
        ),

      transport:
        normalizeScore(
          Number(
            row.transportScore ||
              0,
          ),
        ),

      amenities:
        normalizeScore(
          Number(
            row.amenitiesScore ||
              0,
          ),
        ),

      safety:
        normalizeScore(
          Number(
            row.safetyScore ||
              0,
          ),
        ),
    },

    icon,

    sourceNotes:
      row.sourceNotes ||
      "",

    aiScore:
      normalizeAIScore(
        row.aiScore,
      ),

    aiSummary:
      row.aiSummary ||
      null,
  };
}

function getMarketAverage(
  items:
    MobileNeighborhood[],
) {
  if (
    items.length ===
    0
  ) {
    return 0;
  }

  return (
    items.reduce(
      (
        sum,
        item,
      ) =>
        sum +
        item.pricePerSqm,
      0,
    ) /
    items.length
  );
}

/*
 * Même logique que le Web.
 */
function computeAIScore(
  item:
    MobileNeighborhood,

  profile:
    ProfileType,

  goal:
    GoalType,

  marketAvg:
    number,
) {
  const {
    schools,
    transport,
    amenities,
    safety,
  } =
    item.scores;

  const lifestyleScore =
    (
      schools * 0.2 +
      transport * 0.25 +
      amenities * 0.25 +
      safety * 0.3
    ) *
    20;

  const priceScore =
    marketAvg > 0 &&
    item.pricePerSqm > 0
      ? clamp(
          (
            marketAvg /
            item.pricePerSqm
          ) *
            70,
          35,
          90,
        )
      : 60;

  const yieldScore =
    clamp(
      item.rentYield *
        16,
      35,
      85,
    );

  const growthScore =
    clamp(
      item.growth *
        5,
      35,
      90,
    );

  let finalScore =
    lifestyleScore *
      0.45 +
    priceScore *
      0.2 +
    yieldScore *
      0.15 +
    growthScore *
      0.2;

  if (
    profile ===
    "family"
  ) {
    finalScore =
      lifestyleScore *
        0.6 +
      priceScore *
        0.15 +
      yieldScore *
        0.05 +
      growthScore *
        0.2;
  }

  if (
    profile ===
    "investor"
  ) {
    finalScore =
      lifestyleScore *
        0.25 +
      priceScore *
        0.25 +
      yieldScore *
        0.25 +
      growthScore *
        0.25;
  }

  if (
    profile ===
    "expat"
  ) {
    finalScore =
      lifestyleScore *
        0.55 +
      priceScore *
        0.15 +
      yieldScore *
        0.1 +
      growthScore *
        0.2;
  }

  if (
    goal ===
    "invest"
  ) {
    finalScore +=
      item.rentYield >=
      4.5
        ? 5
        : -4;

    finalScore +=
      item.growth >=
      10
        ? 5
        : -2;
  }

  if (
    goal ===
    "live"
  ) {
    finalScore +=
      safety >= 4.6
        ? 4
        : -3;

    finalScore +=
      amenities >= 4.5
        ? 3
        : -2;
  }

  if (
    goal ===
    "retire"
  ) {
    finalScore +=
      safety >= 4.6
        ? 5
        : -4;

    finalScore -=
      item.growth >
      14
        ? 4
        : 0;
  }

  if (
    marketAvg > 0 &&
    item.pricePerSqm >
      marketAvg *
        1.25
  ) {
    finalScore -=
      6;
  }

  if (
    marketAvg > 0 &&
    item.pricePerSqm <
      marketAvg *
        0.85 &&
    item.growth >= 8
  ) {
    finalScore +=
      5;
  }

  return clamp(
    Math.round(
      finalScore,
    ),
    45,
    92,
  );
}

function getDisplayScore(
  item:
    MobileNeighborhood,

  profile:
    ProfileType,

  goal:
    GoalType,

  marketAvg:
    number,
) {
  const localScore =
    computeAIScore(
      item,
      profile,
      goal,
      marketAvg,
    );

  if (
    item.aiScore !==
      null &&
    item.aiScore !==
      undefined
  ) {
    return clamp(
      Math.round(
        item.aiScore *
          0.25 +
          localScore *
            0.75,
      ),
      45,
      92,
    );
  }

  return localScore;
}

function getScoreLabel(
  score: number,
) {
  if (
    score >= 85
  ) {
    return "Excellent";
  }

  if (
    score >= 70
  ) {
    return "Strong";
  }

  if (
    score >= 55
  ) {
    return "Good";
  }

  return "Moderate";
}

function getSmartBadges(
  item:
    MobileNeighborhood,

  marketAvg:
    number,
) {
  const badges:
    string[] = [];

  if (
    item.growth >=
    10
  ) {
    badges.push(
      "High growth",
    );
  }

  if (
    item.rentYield >=
    4.5
  ) {
    badges.push(
      "Good ROI",
    );
  }

  if (
    item.scores
      .schools >=
      4.5 &&
    item.scores.safety >=
      4.7
  ) {
    badges.push(
      "Family friendly",
    );
  }

  if (
    marketAvg > 0 &&
    item.pricePerSqm <
      marketAvg &&
    item.growth >= 8
  ) {
    badges.push(
      "Undervalued",
    );
  }

  if (
    marketAvg > 0 &&
    item.pricePerSqm >
      marketAvg *
        1.15
  ) {
    badges.push(
      "Premium area",
    );
  }

  if (
    item.scores
      .transport >=
    4.7
  ) {
    badges.push(
      "Strong access",
    );
  }

  return badges.slice(
    0,
    4,
  );
}

function formatEuro(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IE",
    {
      style:
        "currency",

      currency:
        "EUR",

      maximumFractionDigits:
        0,
    },
  ).format(
    value || 0,
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function NeighborhoodFinderScreen() {
  const {
    menuVisible,
    menuUser,
    savedCount,
    unreadMessages,
    openMenu,
    closeMenu,
  } =
    useAppMenu();

  const [
    neighborhoods,
    setNeighborhoods,
  ] =
    useState<
      MobileNeighborhood[]
    >([]);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    budgetMin,
    setBudgetMin,
  ] =
    useState("");

  const [
    budgetMax,
    setBudgetMax,
  ] =
    useState("");

  const [
    profile,
    setProfile,
  ] =
    useState<ProfileType>(
      "all",
    );

  const [
    goal,
    setGoal,
  ] =
    useState<GoalType>(
      "all",
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
    error,
    setError,
  ] =
    useState("");

  const [
    savingId,
    setSavingId,
  ] =
    useState<
      string | null
    >(null);

  /* ============================================================
     LOAD DATA
  ============================================================ */

  const loadNeighborhoods =
    useCallback(
      async (
        refresh = false,
      ) => {
        try {
          if (
            refresh
          ) {
            setRefreshing(
              true,
            );
          } else {
            setLoading(
              true,
            );
          }

          setError(
            "",
          );

          const data =
            await getNeighborhoods();

          setNeighborhoods(
            Array.isArray(
              data,
            )
              ? data.map(
                  mapApiNeighborhood,
                )
              : [],
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load neighborhoods.",
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
      [],
    );

  useEffect(() => {
    void loadNeighborhoods();
  }, [
    loadNeighborhoods,
  ]);

  /* ============================================================
     FILTER + RANK
  ============================================================ */

  const marketAvg =
    useMemo(
      () =>
        getMarketAverage(
          neighborhoods,
        ),
      [
        neighborhoods,
      ],
    );

  const rankedNeighborhoods =
    useMemo(() => {
      let data =
        [
          ...neighborhoods,
        ];

      const min =
        Number(
          budgetMin,
        );

      const max =
        Number(
          budgetMax,
        );

      if (
        budgetMin &&
        !Number.isNaN(
          min,
        )
      ) {
        data =
          data.filter(
            (
              item,
            ) =>
              item.avgPrice >=
              min,
          );
      }

      if (
        budgetMax &&
        !Number.isNaN(
          max,
        )
      ) {
        data =
          data.filter(
            (
              item,
            ) =>
              item.avgPrice <=
              max,
          );
      }

      if (
        search.trim()
      ) {
        const q =
          search
            .trim()
            .toLowerCase();

        data =
          data.filter(
            (
              item,
            ) =>
              item.name
                .toLowerCase()
                .includes(
                  q,
                ) ||
              item.zone
                .toLowerCase()
                .includes(
                  q,
                ) ||
              item.tags.some(
                (
                  tag,
                ) =>
                  tag
                    .toLowerCase()
                    .includes(
                      q,
                    ),
              ),
          );
      }

      return data.sort(
        (
          a,
          b,
        ) =>
          getDisplayScore(
            b,
            profile,
            goal,
            marketAvg,
          ) -
          getDisplayScore(
            a,
            profile,
            goal,
            marketAvg,
          ),
      );
    }, [
      neighborhoods,
      budgetMin,
      budgetMax,
      search,
      profile,
      goal,
      marketAvg,
    ]);

  const bestMatch =
    rankedNeighborhoods[
      0
    ] || null;

  /* ============================================================
     CREATE REQUEST
  ============================================================ */

  async function handleCreateRequest(
    item:
      MobileNeighborhood,
  ) {
    if (
      savingId
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
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Sign in",

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
      setSavingId(
        item.id,
      );

      const lead =
        await createLeadFromNeighborhoodFinder(
          token,
          {
            neighborhoodId:
              item.id,

            neighborhoodName:
              item.name,

            budgetMin:
              budgetMin ||
              undefined,

            budgetMax:
              budgetMax ||
              undefined,

            profile,

            goal,
          },
        );

      const autoMatched =
        lead.status ===
          "MATCHED" ||
        lead.autoMatching
          ?.matched;

      const bestProfessional =
        lead.matches?.[0];

      const professionalName =
        bestProfessional
          ?.professional
          ?.user
          ?.fullName;

      const score =
        bestProfessional
          ?.score;

      if (
        autoMatched
      ) {
        Alert.alert(
          "Smart match found",
          professionalName &&
          typeof score ===
            "number"
            ? `${professionalName} matches your ${item.name} request with a ${score}% compatibility score.`
            : `Your ${item.name} request has already been matched with a compatible verified professional.`,
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
          ? `Your ${item.name} request is already available in My Requests.`
          : `Your ${item.name} request has been saved and is ready for professional matching.`,

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
      setSavingId(
        null,
      );
    }
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (
    loading
  ) {
    return (
      <SafeAreaView
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          size="large"
          color={
            "#E1A820"
          }
        />

        <Text
          style={
            styles.loadingTitle
          }
        >
          Loading neighborhoods...
        </Text>
      </SafeAreaView>
    );
  }

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
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void loadNeighborhoods(
                true,
              )
            }
            tintColor={
              "#E1A820"
            }
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* TOP BAR */}

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
              size={
                21
              }
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

        {/* HERO */}

        <View
          style={
            styles.hero
          }
        >
          <View
            style={
              styles.heroIcon
            }
          >
            <MapPin
              size={
                25
              }
              color="#E1A820"
            />
          </View>

          <Text
            style={
              styles.eyebrow
            }
          >
            SMART AREA DISCOVERY
          </Text>

          <Text
            style={
              styles.title
            }
          >
            Neighborhood Finder
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Compare Lisbon-area neighborhoods using prices, investment indicators, transport, schools, amenities and safety.
          </Text>
        </View>

        {/* FILTERS */}

        <View
          style={
            styles.filterCard
          }
        >
          <View
            style={
              styles.searchBox
            }
          >
            <Search
              size={
                18
              }
              color="#667085"
            />

            <TextInput
              value={
                search
              }
              onChangeText={
                setSearch
              }
              placeholder="Search neighborhood or area"
              placeholderTextColor="#98A2B3"
              style={
                styles.searchInput
              }
            />
          </View>

          <Text
            style={
              styles.filterLabel
            }
          >
            Budget
          </Text>

          <View
            style={
              styles.budgetRow
            }
          >
            <View
              style={
                styles.budgetInputWrap
              }
            >
              <Text
                style={
                  styles.currency
                }
              >
                €
              </Text>

              <TextInput
                value={
                  budgetMin
                }
                onChangeText={
                  setBudgetMin
                }
                keyboardType="numeric"
                placeholder="Min"
                placeholderTextColor="#98A2B3"
                style={
                  styles.budgetInput
                }
              />
            </View>

            <View
              style={
                styles.budgetInputWrap
              }
            >
              <Text
                style={
                  styles.currency
                }
              >
                €
              </Text>

              <TextInput
                value={
                  budgetMax
                }
                onChangeText={
                  setBudgetMax
                }
                keyboardType="numeric"
                placeholder="Max"
                placeholderTextColor="#98A2B3"
                style={
                  styles.budgetInput
                }
              />
            </View>
          </View>

          <Text
            style={
              styles.filterLabel
            }
          >
            Buyer profile
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.chipRow
            }
          >
            {PROFILE_OPTIONS.map(
              (
                option,
              ) => (
                <ChoiceChip
                  key={
                    option.value
                  }
                  label={
                    option.label
                  }
                  active={
                    profile ===
                    option.value
                  }
                  onPress={() =>
                    setProfile(
                      option.value,
                    )
                  }
                />
              ),
            )}
          </ScrollView>

          <Text
            style={
              styles.filterLabel
            }
          >
            Main goal
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.chipRow
            }
          >
            {GOAL_OPTIONS.map(
              (
                option,
              ) => (
                <ChoiceChip
                  key={
                    option.value
                  }
                  label={
                    option.label
                  }
                  active={
                    goal ===
                    option.value
                  }
                  onPress={() =>
                    setGoal(
                      option.value,
                    )
                  }
                />
              ),
            )}
          </ScrollView>
        </View>

        {/* ERROR */}

        {error ? (
          <View
            style={
              styles.errorBox
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

        {/* BEST MATCH */}

        {bestMatch ? (
          <View
            style={
              styles.bestMatch
            }
          >
            <View
              style={
                styles.bestMatchHeader
              }
            >
              <View
                style={
                  styles.bestMatchIcon
                }
              >
                <Trophy
                  size={
                    19
                  }
                  color="#A66B00"
                />
              </View>

              <View
                style={{
                  flex:
                    1,
                }}
              >
                <Text
                  style={
                    styles.bestMatchEyebrow
                  }
                >
                  BEST MATCH
                </Text>

                <Text
                  style={
                    styles.bestMatchTitle
                  }
                >
                  {
                    bestMatch.name
                  }
                </Text>
              </View>

              <View
                style={
                  styles.scoreCircle
                }
              >
                <Text
                  style={
                    styles.scoreNumber
                  }
                >
                  {getDisplayScore(
                    bestMatch,
                    profile,
                    goal,
                    marketAvg,
                  )}
                </Text>

                <Text
                  style={
                    styles.scorePercent
                  }
                >
                  %
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.bestMatchText
              }
            >
              {bestMatch.aiSummary ||
                `${bestMatch.name} currently ranks highest for your selected profile, goal and budget.`}
            </Text>

            <Pressable
              onPress={() =>
                router.push({
                  pathname:
                    "/tools/neighborhood/[id]",

                  params: {
                    id:
                      bestMatch.id,
                  },
                })
              }
              style={
                styles.bestMatchButton
              }
            >
              <Text
                style={
                  styles.bestMatchButtonText
                }
              >
                Explore neighborhood
              </Text>

              <ArrowRight
                size={
                  16
                }
                color="#0F2340"
              />
            </Pressable>
          </View>
        ) : null}

        {/* LIST HEADER */}

        <View
          style={
            styles.listHeader
          }
        >
          <View>
            <Text
              style={
                styles.listEyebrow
              }
            >
              RANKED RESULTS
            </Text>

            <Text
              style={
                styles.listTitle
              }
            >
              Best neighborhoods
            </Text>
          </View>

          <View
            style={
              styles.countBadge
            }
          >
            <Text
              style={
                styles.countText
              }
            >
              {
                rankedNeighborhoods.length
              }
            </Text>
          </View>
        </View>

        {/* CARDS */}

        {rankedNeighborhoods.length ===
        0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <MapPin
              size={
                30
              }
              color="#E1A820"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No neighborhoods found
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Try changing your budget or search filters.
            </Text>
          </View>
        ) : (
          rankedNeighborhoods.map(
            (
              item,
              index,
            ) => (
              <NeighborhoodCard
                key={
                  item.id
                }
                item={
                  item
                }
                score={getDisplayScore(
                  item,
                  profile,
                  goal,
                  marketAvg,
                )}
                marketAvg={
                  marketAvg
                }
                recommended={
                  index ===
                  0
                }
                saving={
                  savingId ===
                  item.id
                }
                onOpen={() =>
                  router.push({
                    pathname:
                      "/tools/neighborhood/[id]",

                    params: {
                      id:
                        item.id,
                    },
                  })
                }
                onRequest={() =>
                  void handleCreateRequest(
                    item,
                  )
                }
              />
            ),
          )
        )}

        <View
          style={{
            height:
              34,
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
   CHOICE CHIP
============================================================ */

function ChoiceChip({
  label,
  active,
  onPress,
}: {
  label:
    string;

  active:
    boolean;

  onPress:
    () => void;
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={[
        styles.choiceChip,

        active &&
          styles.choiceChipActive,
      ]}
    >
      <Text
        style={[
          styles.choiceChipText,

          active &&
            styles.choiceChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ============================================================
   NEIGHBORHOOD CARD
============================================================ */

function NeighborhoodCard({
  item,
  score,
  marketAvg,
  recommended,
  saving,
  onOpen,
  onRequest,
}: {
  item:
    MobileNeighborhood;

  score:
    number;

  marketAvg:
    number;

  recommended:
    boolean;

  saving:
    boolean;

  onOpen:
    () => void;

  onRequest:
    () => void;
}) {
  const badges =
    getSmartBadges(
      item,
      marketAvg,
    );

  return (
    <View
      style={
        styles.card
      }
    >
      <View
        style={
          styles.cardTop
        }
      >
        <View
          style={{
            flex:
              1,
          }}
        >
          <View
            style={
              styles.zoneRow
            }
          >
            <Text
              style={
                styles.zone
              }
            >
              {
                item.zone
              }
            </Text>

            {recommended ? (
              <View
                style={
                  styles.recommendedBadge
                }
              >
                <Sparkles
                  size={
                    11
                  }
                  color="#A66B00"
                />

                <Text
                  style={
                    styles.recommendedText
                  }
                >
                  Recommended
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            style={
              styles.cardTitle
            }
          >
            {
              item.name
            }
          </Text>

          <Text
            numberOfLines={
              3
            }
            style={
              styles.cardDescription
            }
          >
            {
              item.description
            }
          </Text>
        </View>

        <View
          style={
            styles.cardScore
          }
        >
          <Text
            style={
              styles.cardScoreValue
            }
          >
            {score}
          </Text>

          <Text
            style={
              styles.cardScoreLabel
            }
          >
            {getScoreLabel(
              score,
            )}
          </Text>
        </View>
      </View>

      {badges.length >
      0 ? (
        <View
          style={
            styles.badges
          }
        >
          {badges.map(
            (
              badge,
            ) => (
              <View
                key={
                  badge
                }
                style={
                  styles.smartBadge
                }
              >
                <Text
                  style={
                    styles.smartBadgeText
                  }
                >
                  {badge}
                </Text>
              </View>
            ),
          )}
        </View>
      ) : null}

      <View
        style={
          styles.marketMetrics
        }
      >
        <MarketMetric
          icon={
            BadgeEuro
          }
          label="Avg price"
          value={formatEuro(
            item.avgPrice,
          )}
        />

        <MarketMetric
          icon={
            Building2
          }
          label="Price / m²"
          value={`${formatEuro(
            item.pricePerSqm,
          )}/m²`}
        />

        <MarketMetric
          icon={
            TrendingUp
          }
          label="Growth"
          value={`${item.growth.toFixed(
            1,
          )}%`}
        />

        <MarketMetric
          icon={
            Brain
          }
          label="Yield"
          value={`${item.rentYield.toFixed(
            1,
          )}%`}
        />
      </View>

      <View
        style={
          styles.scores
        }
      >
        <Score
          icon={
            School
          }
          label="Schools"
          value={
            item.scores
              .schools
          }
        />

        <Score
          icon={
            TramFront
          }
          label="Transport"
          value={
            item.scores
              .transport
          }
        />

        <Score
          icon={
            Coffee
          }
          label="Amenities"
          value={
            item.scores
              .amenities
          }
        />

        <Score
          icon={
            ShieldCheck
          }
          label="Safety"
          value={
            item.scores
              .safety
          }
        />
      </View>

      <View
        style={
          styles.actions
        }
      >
        <Pressable
          onPress={
            onOpen
          }
          style={
            styles.secondaryButton
          }
        >
          <Text
            style={
              styles.secondaryButtonText
            }
          >
            View details
          </Text>
        </Pressable>

        <Pressable
          disabled={
            saving
          }
          onPress={
            onRequest
          }
          style={[
            styles.primaryButton,

            saving &&
              styles.disabledButton,
          ]}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <>
              <CheckCircle2
                size={
                  15
                }
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Create Request
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================
   METRICS
============================================================ */

function MarketMetric({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ComponentType<any>;

  label:
    string;

  value:
    string;
}) {
  return (
    <View
      style={
        styles.marketMetric
      }
    >
      <Icon
        size={
          16
        }
        color="#E1A820"
      />

      <Text
        style={
          styles.marketMetricLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.marketMetricValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function Score({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ComponentType<any>;

  label:
    string;

  value:
    number;
}) {
  return (
    <View
      style={
        styles.scoreItem
      }
    >
      <View
        style={
          styles.scoreIcon
        }
      >
        <Icon
          size={
            16
          }
          color="#C9A227"
        />
      </View>

      <Text
        style={
          styles.scoreLabel
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.scoreValueRow
        }
      >
        <Star
          size={
            12
          }
          color="#C9A227"
          fill="#C9A227"
        />

        <Text
          style={
            styles.scoreValue
          }
        >
          {value.toFixed(
            1,
          )}
        </Text>
      </View>
    </View>
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

    loadingScreen: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#F6F7F9",
    },

    loadingTitle: {
      marginTop: 12,
      color:
        Colors.textSecondary,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 14,
    },

    topBar: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
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
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    menuButton: {
      minHeight: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 15,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    menuText: {
      color:
        Colors.navy,
      fontSize: 12,
      fontWeight:
        "800",
    },

    hero: {
      marginTop: 26,
    },

    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: 17,
      backgroundColor:
        "#FFF8E1",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    eyebrow: {
      marginTop: 16,
      color:
        "#E1A820",
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing:
        1.2,
    },

    title: {
      marginTop: 7,
      color:
        Colors.navyDark,
      fontSize: 34,
      lineHeight: 40,
      fontWeight:
        "900",
      letterSpacing:
        -1,
    },

    subtitle: {
      marginTop: 9,
      color:
        Colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
    },

    filterCard: {
      marginTop: 24,
      borderRadius: 24,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      padding: 17,
    },

    searchBox: {
      minHeight: 53,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      flexDirection: "row",
      alignItems:
        "center",
      paddingHorizontal: 14,
      gap: 9,
    },

    searchInput: {
      flex: 1,
      color:
        Colors.navyDark,
      fontSize: 13,
    },

    filterLabel: {
      marginTop: 19,
      marginBottom: 9,
      color:
        Colors.navyDark,
      fontSize: 11,
      fontWeight:
        "900",
    },

    budgetRow: {
      flexDirection: "row",
      gap: 9,
    },

    budgetInputWrap: {
      flex: 1,
      minHeight: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      flexDirection: "row",
      alignItems:
        "center",
      paddingHorizontal: 12,
    },

    currency: {
      color:
        "#667085",
      fontWeight:
        "800",
    },

    budgetInput: {
      flex: 1,
      paddingHorizontal: 7,
      color:
        Colors.navyDark,
    },

    chipRow: {
      gap: 8,
    },

    choiceChip: {
      minHeight: 40,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 15,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    choiceChipActive: {
      borderColor:
        "#E1A820",
      backgroundColor:
        "#FFF8E1",
    },

    choiceChipText: {
      color:
        "#667085",
      fontSize: 11,
      fontWeight:
        "700",
    },

    choiceChipTextActive: {
      color:
        "#8A6400",
      fontWeight:
        "900",
    },

    errorBox: {
      marginTop: 14,
      borderRadius: 15,
      backgroundColor:
        "#FEF2F2",
      padding: 13,
    },

    errorText: {
      color:
        "#B42318",
      fontSize: 11,
    },

    bestMatch: {
      marginTop: 20,
      borderRadius: 24,
      backgroundColor:
        "#10284D",
      padding: 18,
    },

    bestMatchHeader: {
      flexDirection: "row",
      alignItems:
        "center",
      gap: 10,
    },

    bestMatchIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor:
        "#FFF4CC",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    bestMatchEyebrow: {
      color:
        "#D4A91F",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1,
    },

    bestMatchTitle: {
      marginTop: 3,
      color:
        "#FFFFFF",
      fontSize: 18,
      fontWeight:
        "900",
    },

    scoreCircle: {
      width: 55,
      height: 55,
      borderRadius: 18,
      backgroundColor:
        "rgba(255,255,255,0.1)",
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    scoreNumber: {
      color:
        "#FFFFFF",
      fontSize: 18,
      fontWeight:
        "900",
    },

    scorePercent: {
      color:
        "#D4A91F",
      fontSize: 10,
      marginTop: 4,
    },

    bestMatchText: {
      marginTop: 13,
      color:
        "#D0D5DD",
      fontSize: 11,
      lineHeight: 18,
    },

    bestMatchButton: {
      marginTop: 15,
      minHeight: 48,
      borderRadius: 15,
      backgroundColor:
        "#D4A91F",
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 6,
    },

    bestMatchButtonText: {
      color:
        "#0F2340",
      fontSize: 11,
      fontWeight:
        "900",
    },

    listHeader: {
      marginTop: 30,
      marginBottom: 14,
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    listEyebrow: {
      color:
        "#E1A820",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1.1,
    },

    listTitle: {
      marginTop: 4,
      color:
        Colors.navyDark,
      fontSize: 23,
      fontWeight:
        "900",
    },

    countBadge: {
      minWidth: 37,
      height: 37,
      borderRadius: 13,
      backgroundColor:
        "#EEF3F8",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    countText: {
      color:
        Colors.navy,
      fontWeight:
        "900",
    },

    card: {
      marginBottom: 14,
      borderRadius: 23,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      padding: 17,
    },

    cardTop: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 10,
    },

    zoneRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems:
        "center",
      gap: 7,
    },

    zone: {
      color:
        "#C9A227",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        0.9,
      textTransform:
        "uppercase",
    },

    recommendedBadge: {
      borderRadius: 999,
      backgroundColor:
        "#FFF4CC",
      flexDirection: "row",
      alignItems:
        "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    recommendedText: {
      color:
        "#A66B00",
      fontSize: 8,
      fontWeight:
        "800",
    },

    cardTitle: {
      marginTop: 7,
      color:
        Colors.navyDark,
      fontSize: 20,
      fontWeight:
        "900",
    },

    cardDescription: {
      marginTop: 7,
      color:
        Colors.textSecondary,
      fontSize: 11,
      lineHeight: 18,
    },

    cardScore: {
      minWidth: 60,
      alignItems:
        "center",
      borderRadius: 17,
      backgroundColor:
        "#F8F9FA",
      paddingVertical: 10,
      paddingHorizontal: 8,
    },

    cardScoreValue: {
      color:
        Colors.navy,
      fontSize: 19,
      fontWeight:
        "900",
    },

    cardScoreLabel: {
      marginTop: 2,
      color:
        "#667085",
      fontSize: 8,
    },

    badges: {
      marginTop: 13,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },

    smartBadge: {
      borderRadius: 999,
      backgroundColor:
        "#F2F4F7",
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    smartBadgeText: {
      color:
        "#475467",
      fontSize: 8,
      fontWeight:
        "700",
    },

    marketMetrics: {
      marginTop: 15,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    marketMetric: {
      width: "48%",
      minHeight: 74,
      borderRadius: 15,
      backgroundColor:
        "#F9FAFB",
      padding: 11,
    },

    marketMetricLabel: {
      marginTop: 5,
      color:
        "#667085",
      fontSize: 8,
    },

    marketMetricValue: {
      marginTop: 2,
      color:
        Colors.navyDark,
      fontSize: 11,
      fontWeight:
        "900",
    },

    scores: {
      marginTop: 15,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor:
        "#F2F4F7",
      flexDirection: "row",
      justifyContent:
        "space-between",
    },

    scoreItem: {
      flex: 1,
      alignItems:
        "center",
    },

    scoreIcon: {
      width: 33,
      height: 33,
      borderRadius: 11,
      backgroundColor:
        "#F7F3E8",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    scoreLabel: {
      marginTop: 5,
      color:
        "#667085",
      fontSize: 7,
    },

    scoreValueRow: {
      marginTop: 3,
      flexDirection: "row",
      alignItems:
        "center",
      gap: 3,
    },

    scoreValue: {
      color:
        Colors.navyDark,
      fontSize: 9,
      fontWeight:
        "800",
    },

    actions: {
      marginTop: 17,
      flexDirection: "row",
      gap: 9,
    },

    secondaryButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    secondaryButtonText: {
      color:
        Colors.navy,
      fontSize: 10,
      fontWeight:
        "900",
    },

    primaryButton: {
      flex: 1.25,
      minHeight: 48,
      borderRadius: 15,
      backgroundColor:
        Colors.navy,
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 5,
    },

    primaryButtonText: {
      color:
        "#FFFFFF",
      fontSize: 10,
      fontWeight:
        "900",
    },

    disabledButton: {
      opacity: 0.6,
    },

    emptyCard: {
      minHeight: 180,
      borderRadius: 22,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor:
        "#D0D5DD",
      backgroundColor:
        "#FFFFFF",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 25,
    },

    emptyTitle: {
      marginTop: 10,
      color:
        Colors.navyDark,
      fontSize: 16,
      fontWeight:
        "900",
    },

    emptyText: {
      marginTop: 6,
      textAlign:
        "center",
      color:
        Colors.textSecondary,
      fontSize: 10,
    },
  });