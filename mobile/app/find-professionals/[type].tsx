import {
  ActivityIndicator,
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
  ArrowRight,
  BadgeCheck,
  Building2,
  Landmark,
  MapPin,
  Scale,
  Search,
  Star,
  Users,
} from "lucide-react-native";

import {
  router,
  type Href,
  useLocalSearchParams,
} from "expo-router";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPublicProfessionals,
  type Professional,
  type ProfessionalType,
} from "@/lib/professionals-api";

import {
  getAssetUrl,
} from "@/lib/api";

import {
  Colors,
} from "@/constants/colors";

function getCategoryMeta(
  type: ProfessionalType,
) {
  if (
    type ===
    "MORTGAGE_BROKER"
  ) {
    return {
      title:
        "Mortgage Brokers",

      eyebrow:
        "FINANCING EXPERTS",

      description:
        "Compare verified mortgage specialists who can guide you through financing options in Portugal.",

      icon:
        Landmark,

      color:
        "#15803D",

      background:
        "#ECFDF3",
    };
  }

  if (
    type ===
    "PROPERTY_LAWYER"
  ) {
    return {
      title:
        "Property Lawyers",

      eyebrow:
        "LEGAL EXPERTS",

      description:
        "Find verified lawyers who can support due diligence, contracts and property transactions.",

      icon:
        Scale,

      color:
        "#7C3AED",

      background:
        "#F3E8FF",
    };
  }

  return {
    title:
      "Property Agents",

    eyebrow:
      "PROPERTY EXPERTS",

    description:
      "Discover verified property agents who can help you search, compare and evaluate properties.",

    icon:
      Building2,

    color:
      Colors.navy,

    background:
      "#EEF3F8",
  };
}

export default function ProfessionalsByTypeScreen() {
  const {
    type,
  } =
    useLocalSearchParams<{
      type: string;
    }>();

  const professionalType =
    (
      Array.isArray(type)
        ? type[0]
        : type
    ) as ProfessionalType;

  const [
    professionals,
    setProfessionals,
  ] =
    useState<
      Professional[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    search,
    setSearch,
  ] =
    useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(
          true,
        );

        const data =
          await getPublicProfessionals(
            professionalType,
          );

        setProfessionals(
          Array.isArray(
            data,
          )
            ? data
            : [],
        );
      } catch {
        setProfessionals(
          [],
        );
      } finally {
        setLoading(
          false,
        );
      }
    }

    if (
      professionalType
    ) {
      void load();
    }
  }, [
    professionalType,
  ]);

  const meta =
    getCategoryMeta(
      professionalType,
    );

  const CategoryIcon =
    meta.icon;

  const filtered =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return professionals;
        }

        return professionals.filter(
          (
            professional,
          ) =>
            [
              professional.user
                .fullName,

              professional
                .companyName,

              professional.user
                .city,

              professional.user
                .country,

              ...professional.languages,
            ]
              .filter(
                Boolean,
              )
              .join(" ")
              .toLowerCase()
              .includes(
                query,
              ),
        );
      },
      [
        professionals,
        search,
      ],
    );

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
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={
            styles.topRow
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
            style={[
              styles.categoryIcon,
              {
                backgroundColor:
                  meta.background,
              },
            ]}
          >
            <CategoryIcon
              size={22}
              color={
                meta.color
              }
            />
          </View>
        </View>

        <Text
          style={
            styles.eyebrow
          }
        >
          {
            meta.eyebrow
          }
        </Text>

        <Text
          style={
            styles.title
          }
        >
          {
            meta.title
          }
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          {
            meta.description
          }
        </Text>

        <View
          style={
            styles.searchBox
          }
        >
          <Search
            size={19}
            color="#98A2B3"
          />

          <TextInput
            value={
              search
            }
            onChangeText={
              setSearch
            }
            placeholder="Search professionals..."
            placeholderTextColor="#98A2B3"
            style={
              styles.searchInput
            }
          />
        </View>

        <View
          style={
            styles.resultsHeader
          }
        >
          <Text
            style={
              styles.resultsTitle
            }
          >
            Verified professionals
          </Text>

          <Text
            style={
              styles.resultsCount
            }
          >
            {
              filtered.length
            }
          </Text>
        </View>

        {loading ? (
          <View
            style={
              styles.loading
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
              Loading professionals...
            </Text>
          </View>
        ) : filtered.length ===
          0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <Users
              size={34}
              color={
                Colors.navy
              }
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No professionals found
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Try another search or check again later.
            </Text>
          </View>
        ) : (
          filtered.map(
            (
              professional,
            ) => (
              <ProfessionalCard
                key={
                  professional.id
                }
                professional={
                  professional
                }
                onPress={() =>
  router.push(
    `/professionals/${professional.id}` as Href,
  )
}
              />
            ),
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfessionalCard({
  professional,
  onPress,
}: {
  professional:
    Professional;

  onPress:
    () => void;
}) {
  const avatar =
    getAssetUrl(
      professional.user
        .avatarUrl,
    );

  const name =
    professional.user
      .fullName ||
    "Verified Professional";

  return (
    <Pressable
      onPress={
        onPress
      }
      style={({ pressed }) => [
        styles.professionalCard,

        pressed && {
          opacity:
            0.82,
        },
      ]}
    >
      <View
        style={
          styles.cardTop
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
              {name
                .charAt(0)
                .toUpperCase()}
            </Text>
          )}
        </View>

        <View
          style={
            styles.identity
          }
        >
          <View
            style={
              styles.nameRow
            }
          >
            <Text
              numberOfLines={
                1
              }
              style={
                styles.name
              }
            >
              {name}
            </Text>

            {professional.verificationStatus ===
            "ACTIVE" ? (
              <BadgeCheck
                size={17}
                color="#15803D"
              />
            ) : null}
          </View>

          <Text
            style={
              styles.company
            }
          >
            {professional
              .companyName ||
              "Independent Professional"}
          </Text>

          {professional.user
            .city ? (
            <View
              style={
                styles.locationRow
              }
            >
              <MapPin
                size={13}
                color="#98A2B3"
              />

              <Text
                style={
                  styles.locationText
                }
              >
                {
                  professional
                    .user
                    .city
                }
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={
          styles.statsRow
        }
      >
        <Stat
          icon={
            Star
          }
          value={Number(
            professional.rating ||
              0,
          ).toFixed(1)}
          label="Rating"
        />

        <Stat
          icon={
            BadgeCheck
          }
          value={`${professional.reviewsCount}`}
          label="Reviews"
        />

        <Stat
          icon={
            Users
          }
          value={`${professional.clientsCount}`}
          label="Clients"
        />
      </View>

      {professional.languages
        .length > 0 ? (
        <View
          style={
            styles.languages
          }
        >
          {professional.languages
            .slice(0, 3)
            .map(
              (
                language: string,
              ) => (
                <View
                  key={
                    language
                  }
                  style={
                    styles.languageBadge
                  }
                >
                  <Text
                    style={
                      styles.languageText
                    }
                  >
                    {
                      language
                    }
                  </Text>
                </View>
              ),
            )}
        </View>
      ) : null}

      <View
        style={
          styles.cardFooter
        }
      >
        <Text
          style={
            styles.viewProfileText
          }
        >
          View Profile
        </Text>

        <ArrowRight
          size={17}
          color={
            Colors.navy
          }
        />
      </View>
    </Pressable>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon:
    typeof Star;

  value:
    string;

  label:
    string;
}) {
  return (
    <View
      style={
        styles.stat
      }
    >
      <Icon
        size={15}
        color={
          Colors.gold
        }
      />

      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>
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

    content: {
      paddingHorizontal:
        20,

      paddingTop:
        14,

      paddingBottom:
        44,
    },

    topRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    backButton: {
      width:
        48,

      height:
        48,

      borderRadius:
        16,

      borderWidth:
        1,

      borderColor:
        Colors.border,

      backgroundColor:
        Colors.white,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    categoryIcon: {
      width:
        48,

      height:
        48,

      borderRadius:
        16,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    eyebrow: {
      marginTop:
        24,

      color:
        Colors.gold,

      fontSize:
        11,

      fontWeight:
        "900",

      letterSpacing:
        1.3,
    },

    title: {
      marginTop:
        7,

      color:
        Colors.navyDark,

      fontSize:
        34,

      lineHeight:
        41,

      fontWeight:
        "900",
    },

    subtitle: {
      marginTop:
        9,

      color:
        Colors.textSecondary,

      fontSize:
        15,

      lineHeight:
        23,
    },

    searchBox: {
      marginTop:
        20,

      minHeight:
        54,

      borderWidth:
        1,

      borderColor:
        Colors.border,

      borderRadius:
        16,

      backgroundColor:
        Colors.white,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        9,

      paddingHorizontal:
        15,
    },

    searchInput: {
      flex:
        1,

      color:
        Colors.navyDark,

      fontSize:
        14,
    },

    resultsHeader: {
      marginTop:
        22,

      marginBottom:
        12,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    resultsTitle: {
      color:
        Colors.navyDark,

      fontSize:
        18,

      fontWeight:
        "800",
    },

    resultsCount: {
      color:
        Colors.gold,

      fontSize:
        16,

      fontWeight:
        "900",
    },

    loading: {
      paddingVertical:
        40,

      alignItems:
        "center",
    },

    loadingText: {
      marginTop:
        10,

      color:
        Colors.textSecondary,

      fontSize:
        12,
    },

    emptyCard: {
      marginTop:
        8,

      borderWidth:
        1,

      borderColor:
        Colors.border,

      borderRadius:
        22,

      backgroundColor:
        Colors.white,

      padding:
        28,

      alignItems:
        "center",
    },

    emptyTitle: {
      marginTop:
        12,

      color:
        Colors.navyDark,

      fontSize:
        17,

      fontWeight:
        "800",
    },

    emptyText: {
      marginTop:
        5,

      color:
        Colors.textSecondary,

      textAlign:
        "center",
    },

    professionalCard: {
      marginBottom:
        14,

      borderWidth:
        1,

      borderColor:
        Colors.border,

      borderRadius:
        22,

      backgroundColor:
        Colors.white,

      padding:
        16,
    },

    cardTop: {
      flexDirection:
        "row",

      gap:
        12,
    },

    avatar: {
      width:
        58,

      height:
        58,

      borderRadius:
        18,

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

    avatarText: {
      color:
        Colors.white,

      fontSize:
        20,

      fontWeight:
        "900",
    },

    identity: {
      flex:
        1,
    },

    nameRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        6,
    },

    name: {
      flex:
        1,

      color:
        Colors.navyDark,

      fontSize:
        16,

      fontWeight:
        "900",
    },

    company: {
      marginTop:
        4,

      color:
        Colors.textSecondary,

      fontSize:
        12,
    },

    locationRow: {
      marginTop:
        5,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        4,
    },

    locationText: {
      color:
        "#98A2B3",

      fontSize:
        10,
    },

    statsRow: {
      marginTop:
        15,

      flexDirection:
        "row",

      gap:
        8,
    },

    stat: {
      flex:
        1,

      minHeight:
        66,

      borderRadius:
        15,

      backgroundColor:
        "#F8FAFC",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    statValue: {
      marginTop:
        3,

      color:
        Colors.navyDark,

      fontSize:
        14,

      fontWeight:
        "900",
    },

    statLabel: {
      marginTop:
        2,

      color:
        Colors.textSecondary,

      fontSize:
        9,
    },

    languages: {
      marginTop:
        13,

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        7,
    },

    languageBadge: {
      borderRadius:
        999,

      backgroundColor:
        "#EEF3F8",

      paddingHorizontal:
        9,

      paddingVertical:
        6,
    },

    languageText: {
      color:
        Colors.navy,

      fontSize:
        9,

      fontWeight:
        "700",
    },

    cardFooter: {
      marginTop:
        14,

      paddingTop:
        13,

      borderTopWidth:
        1,

      borderTopColor:
        Colors.border,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    viewProfileText: {
      color:
        Colors.navy,

      fontSize:
        12,

      fontWeight:
        "800",
    },
  });