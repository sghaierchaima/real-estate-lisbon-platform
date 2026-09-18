import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  BadgeCheck,
  Building2,
  ChevronRight,
  Landmark,
  Scale,
  Search,
  Star,
  Users,
} from "lucide-react-native";

import {
  router,
  
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
  getPublicProfessionals,
  type Professional,
  type ProfessionalType,
} from "@/lib/professionals-api";

import {
  Colors,
} from "@/constants/colors";

type FilterKey =
  | "ALL"
  | ProfessionalType;

const ITEMS_PER_PAGE = 2;

const FILTERS: {
  key: FilterKey;
  label: string;
}[] = [
  {
    key: "ALL",
    label: "All",
  },
  {
    key: "PROPERTY_AGENT",
    label: "Property Agents",
  },
  {
    key: "MORTGAGE_BROKER",
    label: "Mortgage Brokers",
  },
  {
    key: "PROPERTY_LAWYER",
    label: "Lawyers",
  },
];

function formatProfessionalType(
  type: ProfessionalType,
) {
  switch (type) {
    case "PROPERTY_AGENT":
      return "Property Agent";

    case "MORTGAGE_BROKER":
      return "Mortgage Broker";

    case "PROPERTY_LAWYER":
      return "Property Lawyer";

    default:
      return "Professional";
  }
}

function getInitials(
  name?: string | null,
) {
  if (!name?.trim()) {
    return "P";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`
      .toUpperCase();
  }

  return parts[0][0]
    .toUpperCase();
}

export default function ProfessionalsScreen() {
  const [
    professionals,
    setProfessionals,
  ] =
    useState<Professional[]>([]);

  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<FilterKey>("ALL");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

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

  const loadProfessionals =
    useCallback(
      async (
        refresh = false,
      ) => {
        try {
          if (refresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const data =
            await getPublicProfessionals();

          setProfessionals(
            Array.isArray(data)
              ? data
              : [],
          );
        } catch (err) {
          setProfessionals([]);

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load professionals.",
          );
        } finally {
          setLoading(false);

          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadProfessionals();
  }, [loadProfessionals]);

  const filteredProfessionals =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return professionals
          .filter(
            (
              professional,
            ) => {
              if (
                selectedFilter !==
                  "ALL" &&
                professional.professionalType !==
                  selectedFilter
              ) {
                return false;
              }

              if (!query) {
                return true;
              }

              const haystack = [
                professional.user
                  ?.fullName,
                professional.companyName,
                professional.bio,
                professional.professionalType,
                ...(professional.languages ||
                  []),
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

              return haystack.includes(
                query,
              );
            },
          )
          .sort(
            (a, b) => {
              if (
                Boolean(
                  b.isFeatured,
                ) !==
                Boolean(
                  a.isFeatured,
                )
              ) {
                return Number(
                  Boolean(
                    b.isFeatured,
                  ),
                ) -
                  Number(
                    Boolean(
                      a.isFeatured,
                    ),
                  );
              }

              return (
                Number(
                  b.rating || 0,
                ) -
                Number(
                  a.rating || 0,
                )
              );
            },
          );
      },
      [
        professionals,
        search,
        selectedFilter,
      ],
    );

  // ============================================================
  // PAGINATION — 2 PROFESSIONALS PER PAGE
  // ============================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredProfessionals.length /
        ITEMS_PER_PAGE,
    ),
  );

  const paginatedProfessionals =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredProfessionals.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE,
      );
    }, [
      filteredProfessionals,
      currentPage,
    ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    selectedFilter,
  ]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages,
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

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
          Loading verified professionals...
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
      <FlatList
        data={
          paginatedProfessionals
        }
        keyExtractor={(
          item,
        ) =>
          item.id
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void loadProfessionals(
                true,
              )
            }
            tintColor={
              Colors.navy
            }
          />
        }
        contentContainerStyle={
          styles.list
        }
        ListHeaderComponent={
          <View>
            <Text
              style={
                styles.eyebrow
              }
            >
              VERIFIED NETWORK
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Professionals
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Connect with verified specialists who can support your property journey in Portugal.
            </Text>

            <View
              style={
                styles.trustCard
              }
            >
              <BadgeCheck
                size={22}
                color="#15803D"
              />

              <View
                style={
                  styles.trustContent
                }
              >
                <Text
                  style={
                    styles.trustTitle
                  }
                >
                  Admin-approved profiles
                </Text>

                <Text
                  style={
                    styles.trustText
                  }
                >
                  Only approved and active professionals are displayed.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.searchBox
              }
            >
              <Search
                size={20}
                color="#98A2B3"
              />

              <TextInput
                value={
                  search
                }
                onChangeText={
                  setSearch
                }
                placeholder="Search name, company, language..."
                placeholderTextColor="#98A2B3"
                style={
                  styles.searchInput
                }
              />
            </View>

            <FlatList
              horizontal
              data={
                FILTERS
              }
              keyExtractor={(
                item,
              ) =>
                item.key
              }
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.filters
              }
              renderItem={({
                item,
              }) => {
                const active =
                  selectedFilter ===
                  item.key;

                return (
                  <Pressable
                    onPress={() =>
                      setSelectedFilter(
                        item.key,
                      )
                    }
                    style={[
                      styles.filterButton,

                      active &&
                        styles.filterButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,

                        active &&
                          styles.filterTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />

            <View
              style={
                styles.resultsRow
              }
            >
              <Text
                style={
                  styles.resultsCount
                }
              >
                {filteredProfessionals.length}{" "}
                {filteredProfessionals.length ===
                1
                  ? "professional"
                  : "professionals"}
              </Text>

              <Text
                style={
                  styles.resultsHint
                }
              >
                verified network
              </Text>
            </View>

            {error ? (
              <View
                style={
                  styles.errorBox
                }
              >
                <Text
                  style={
                    styles.errorTitle
                  }
                >
                  Unable to load professionals
                </Text>

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {error}
                </Text>

                <Pressable
                  onPress={() =>
                    void loadProfessionals()
                  }
                  style={
                    styles.retryButton
                  }
                >
                  <Text
                    style={
                      styles.retryButtonText
                    }
                  >
                    Try again
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListFooterComponent={
          filteredProfessionals.length >
          ITEMS_PER_PAGE ? (
            <View
              style={
                styles.pagination
              }
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous professionals page"
                disabled={
                  currentPage === 1
                }
                onPress={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        1,
                        page - 1,
                      ),
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.pageButton,
                  currentPage === 1 &&
                    styles.pageButtonDisabled,
                  pressed &&
                    currentPage !== 1 &&
                    styles.pageButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.pageButtonText,
                    currentPage === 1 &&
                      styles.pageButtonTextDisabled,
                  ]}
                >
                  Previous
                </Text>
              </Pressable>

              <View
                style={
                  styles.pageIndicator
                }
              >
                <Text
                  style={
                    styles.pageLabel
                  }
                >
                  PAGE
                </Text>

                <Text
                  style={
                    styles.pageIndicatorText
                  }
                >
                  {currentPage} /{" "}
                  {totalPages}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next professionals page"
                disabled={
                  currentPage ===
                  totalPages
                }
                onPress={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        totalPages,
                        page + 1,
                      ),
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.pageButton,
                  currentPage ===
                    totalPages &&
                    styles.pageButtonDisabled,
                  pressed &&
                    currentPage !==
                      totalPages &&
                    styles.pageButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.pageButtonText,
                    currentPage ===
                      totalPages &&
                      styles.pageButtonTextDisabled,
                  ]}
                >
                  Next
                </Text>
              </Pressable>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !error ? (
            <View
              style={
                styles.empty
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
                Try another category or search term.
              </Text>
            </View>
          ) : null
        }
        renderItem={({
          item,
        }) => (
          <ProfessionalCard
            professional={
              item
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

function ProfessionalCard({
  professional,
}: {
  professional: Professional;
}) {
  const avatar =
    getAssetUrl(
      professional.user
        ?.avatarUrl,
    );

  const name =
    professional.user
      ?.fullName ||
    "Verified Professional";

  const role =
    formatProfessionalType(
      professional.professionalType,
    );

  const location = [
    professional.user?.city,
    professional.user?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const languages =
    professional.languages
      ?.filter(Boolean)
      .slice(0, 3) ||
    [];

  const TypeIcon =
    professional.professionalType ===
    "MORTGAGE_BROKER"
      ? Landmark
      : professional.professionalType ===
          "PROPERTY_LAWYER"
        ? Scale
        : Building2;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname:
            "/professionals/[id]",
          params: {
            id:
              professional.id,
          },
        })
      }
      style={({ pressed }) => [
        styles.card,

        pressed &&
          styles.cardPressed,
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
                styles.avatarInitials
              }
            >
              {getInitials(
                name,
              )}
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
              style={
                styles.name
              }
              numberOfLines={
                1
              }
            >
              {name}
            </Text>

            <BadgeCheck
              size={18}
              color="#15803D"
            />
          </View>

          <View
            style={
              styles.roleRow
            }
          >
            <TypeIcon
              size={15}
              color={
                Colors.gold
              }
            />

            <Text
              style={
                styles.role
              }
            >
              {role}
            </Text>
          </View>

          <Text
            style={
              styles.company
            }
            numberOfLines={
              1
            }
          >
            {professional.companyName ||
              "Independent Professional"}
          </Text>
        </View>
      </View>

      <View
        style={
          styles.statsRow
        }
      >
        <View
          style={
            styles.stat
          }
        >
          <Star
            size={16}
            color="#D4A91F"
            fill="#D4A91F"
          />

          <Text
            style={
              styles.statValue
            }
          >
            {Number(
              professional.rating ||
                0,
            ).toFixed(1)}
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            rating
          </Text>
        </View>

        <View
          style={
            styles.statDivider
          }
        />

        <View
          style={
            styles.stat
          }
        >
          <Text
            style={
              styles.statValue
            }
          >
            {Number(
              professional.reviewsCount ||
                0,
            )}
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            reviews
          </Text>
        </View>

        <View
          style={
            styles.statDivider
          }
        />

        <View
          style={
            styles.stat
          }
        >
          <Text
            style={
              styles.statValue
            }
          >
            {Number(
              professional.clientsCount ||
                0,
            )}
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            clients
          </Text>
        </View>
      </View>

      {location ? (
        <Text
          style={
            styles.location
          }
        >
          {location}
        </Text>
      ) : null}

      {languages.length >
      0 ? (
        <View
          style={
            styles.languageRow
          }
        >
          {languages.map(
            (
              language,
            ) => (
              <View
                key={
                  language
                }
                style={
                  styles.languageChip
                }
              >
                <Text
                  style={
                    styles.languageText
                  }
                >
                  {language}
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

        <ChevronRight
          size={19}
          color={
            Colors.navy
          }
        />
      </View>
    </Pressable>
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
      paddingHorizontal:
        24,
    },

    loadingText: {
      marginTop: 12,
      color:
        Colors.textSecondary,
    },

    list: {
      paddingHorizontal:
        20,
      paddingTop: 24,
      paddingBottom: 42,
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
      marginTop: 8,
      color:
        Colors.navyDark,
      fontSize: 36,
      lineHeight: 43,
      fontWeight:
        "800",
      letterSpacing:
        -1,
    },

    subtitle: {
      marginTop: 9,
      color:
        Colors.textSecondary,
      fontSize: 16,
      lineHeight: 25,
    },

    trustCard: {
      marginTop: 20,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#BBF7D0",
      backgroundColor:
        "#F0FDF4",
      padding: 15,
    },

    trustContent: {
      flex: 1,
    },

    trustTitle: {
      color:
        "#166534",
      fontSize: 14,
      fontWeight:
        "800",
    },

    trustText: {
      marginTop: 3,
      color:
        "#4B5563",
      fontSize: 12,
      lineHeight: 18,
    },

    searchBox: {
      marginTop: 20,
      minHeight: 56,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 10,
      borderRadius: 17,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.white,
      paddingHorizontal:
        16,
    },

    searchInput: {
      flex: 1,
      color:
        Colors.navyDark,
      fontSize: 15,
    },

    filters: {
      paddingTop: 15,
      paddingBottom: 6,
      gap: 9,
    },

    filterButton: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.white,
      paddingHorizontal:
        16,
      paddingVertical:
        10,
    },

    filterButtonActive: {
      borderColor:
        Colors.navy,
      backgroundColor:
        Colors.navy,
    },

    filterText: {
      color:
        Colors.textSecondary,
      fontSize: 13,
      fontWeight:
        "700",
    },

    filterTextActive: {
      color:
        Colors.white,
    },

    resultsRow: {
      marginTop: 15,
      marginBottom: 13,
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    resultsCount: {
      color:
        Colors.navyDark,
      fontSize: 18,
      fontWeight:
        "800",
    },

    resultsHint: {
      color:
        Colors.textSecondary,
      fontSize: 12,
    },

    errorBox: {
      marginBottom: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#FECACA",
      backgroundColor:
        "#FEF2F2",
      padding: 16,
    },

    errorTitle: {
      color:
        "#B42318",
      fontSize: 15,
      fontWeight:
        "800",
    },

    errorText: {
      marginTop: 5,
      color:
        "#B42318",
      fontSize: 13,
      lineHeight: 20,
    },

    retryButton: {
      marginTop: 12,
      alignSelf:
        "flex-start",
      borderRadius: 10,
      backgroundColor:
        "#B42318",
      paddingHorizontal:
        14,
      paddingVertical: 9,
    },

    retryButtonText: {
      color:
        "#FFFFFF",
      fontWeight:
        "800",
    },

    pagination: {
      marginTop: 5,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    pageButton: {
      minWidth: 96,
      minHeight: 46,
      paddingHorizontal: 15,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        Colors.navy,
      backgroundColor:
        Colors.navy,
      alignItems: "center",
      justifyContent:
        "center",
    },

    pageButtonPressed: {
      opacity: 0.82,
      transform: [
        {
          scale: 0.98,
        },
      ],
    },

    pageButtonDisabled: {
      borderColor:
        "#EAECF0",
      backgroundColor:
        "#EAECF0",
    },

    pageButtonText: {
      color:
        Colors.white,
      fontSize: 12,
      fontWeight: "800",
    },

    pageButtonTextDisabled: {
      color: "#98A2B3",
    },

    pageIndicator: {
      minWidth: 70,
      minHeight: 46,
      paddingHorizontal: 10,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.white,
      alignItems: "center",
      justifyContent:
        "center",
    },

    pageLabel: {
      color:
        Colors.gold,
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1.1,
    },

    pageIndicatorText: {
      marginTop: 2,
      color:
        Colors.navyDark,
      fontSize: 12,
      fontWeight: "800",
    },

    empty: {
      marginTop: 30,
      alignItems:
        "center",
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.white,
      padding: 28,
    },

    emptyTitle: {
      marginTop: 12,
      color:
        Colors.navyDark,
      fontSize: 18,
      fontWeight:
        "800",
    },

    emptyText: {
      marginTop: 6,
      color:
        Colors.textSecondary,
      textAlign:
        "center",
    },

    card: {
      marginBottom: 16,
      borderRadius: 24,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.white,
      padding: 18,
    },

    cardPressed: {
      opacity: 0.87,
    },

    cardTop: {
      flexDirection:
        "row",
      gap: 14,
    },

    avatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      overflow:
        "hidden",
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        Colors.navy,
    },

    avatarImage: {
      width:
        "100%",
      height:
        "100%",
    },

    avatarInitials: {
      color:
        Colors.white,
      fontSize: 20,
      fontWeight:
        "800",
    },

    identity: {
      flex: 1,
      justifyContent:
        "center",
    },

    nameRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
    },

    name: {
      flexShrink: 1,
      color:
        Colors.navyDark,
      fontSize: 18,
      fontWeight:
        "800",
    },

    roleRow: {
      marginTop: 5,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
    },

    role: {
      color:
        Colors.gold,
      fontSize: 12,
      fontWeight:
        "800",
    },

    company: {
      marginTop: 4,
      color:
        Colors.textSecondary,
      fontSize: 12,
    },

    statsRow: {
      marginTop: 17,
      flexDirection:
        "row",
      alignItems:
        "center",
      borderRadius: 16,
      backgroundColor:
        "#F8FAFC",
      paddingVertical:
        13,
      paddingHorizontal:
        10,
    },

    stat: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      flexDirection:
        "row",
      gap: 4,
    },

    statValue: {
      color:
        Colors.navyDark,
      fontSize: 13,
      fontWeight:
        "800",
    },

    statLabel: {
      color:
        Colors.textSecondary,
      fontSize: 10,
    },

    statDivider: {
      width: 1,
      height: 24,
      backgroundColor:
        Colors.border,
    },

    location: {
      marginTop: 13,
      color:
        Colors.textSecondary,
      fontSize: 12,
    },

    languageRow: {
      marginTop: 11,
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 7,
    },

    languageChip: {
      borderRadius: 999,
      backgroundColor:
        "#EEF3F8",
      paddingHorizontal:
        10,
      paddingVertical: 6,
    },

    languageText: {
      color:
        Colors.navy,
      fontSize: 10,
      fontWeight:
        "700",
    },

    cardFooter: {
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
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
      fontSize: 13,
      fontWeight:
        "800",
    },
  });
