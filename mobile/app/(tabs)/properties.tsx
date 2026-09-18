import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import AppMenu from "@/components/AppMenu";
import { useAppMenu } from "@/hooks/useAppMenu";




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
  Bath,
  BedDouble,
  Building2,
  ChevronDown,
  Heart,
  MapPin,
  Maximize,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react-native";

import {
  getAssetUrl,
} from "@/lib/api";

import {
  getPublicProperties,
} from "@/lib/properties-api";

import {
  getSavedPropertyIds,
  toggleSavedProperty,
} from "@/lib/saved-properties-api";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import type {
  Property,
} from "@/types/property";

import type {
  AuthUser,
} from "@/types/auth";

import {
  Colors,
} from "@/constants/colors";

// ============================================================
// TYPES
// ============================================================

type SortOption =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc";

const PROPERTY_TYPES = [
  "All",
  "Apartment",
  "House",
  "Villa",
  "Penthouse",
];

const BEDROOM_OPTIONS = [
  1,
  2,
  3,
  4,
  5,
];

// ============================================================
// SCREEN
// ============================================================

export default function PropertiesScreen() {
  const {
    menuVisible,
    menuUser,
    savedCount,
    unreadMessages,
    openMenu,
    closeMenu,
    refreshMenu,
  } = useAppMenu();

  const [
    properties,
    setProperties,
  ] =
    useState<Property[]>(
      [],
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
    search,
    setSearch,
  ] =
    useState("");

  const [
    selectedType,
    setSelectedType,
  ] =
    useState("All");

  const [
    filtersVisible,
    setFiltersVisible,
  ] =
    useState(false);

  const [
    minPrice,
    setMinPrice,
  ] =
    useState("");

  const [
    maxPrice,
    setMaxPrice,
  ] =
    useState("");

  const [
    bedrooms,
    setBedrooms,
  ] =
    useState<number | null>(
      null,
    );

  const [
    featuredOnly,
    setFeaturedOnly,
  ] =
    useState(false);

  const [
    sortBy,
    setSortBy,
  ] =
    useState<SortOption>(
      "featured",
    );

  const [
    savedIds,
    setSavedIds,
  ] =
    useState<
      Set<string>
    >(new Set());

  const [
    savingIds,
    setSavingIds,
  ] =
    useState<
      Set<string>
    >(new Set());

  const [
    isBuyer,
    setIsBuyer,
  ] =
    useState(false);

  // ============================================================
  // PAGINATION
  // ============================================================

  const ITEMS_PER_PAGE = 3;

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);
  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadProperties =
    useCallback(
      async (
        refresh = false,
      ) => {
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
            await getPublicProperties();

          setProperties(
            Array.isArray(
              data,
            )
              ? data
              : [],
          );

          const token =
            await getToken();

          const user =
            await getStoredUser<AuthUser>();

          const buyer =
            Boolean(token) &&
            user?.role ===
            "BUYER";

          setIsBuyer(
            buyer,
          );

          if (
            buyer &&
            token
          ) {
            try {
              const result =
                await getSavedPropertyIds(
                  token,
                );

              setSavedIds(
                new Set(
                  result.propertyIds,
                ),
              );
            } catch {
              setSavedIds(
                new Set(),
              );
            }
          } else {
            setSavedIds(
              new Set(),
            );
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load properties.",
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
    void loadProperties();
  }, [loadProperties]);

  // ============================================================
  // FILTERING
  // ============================================================

  const filteredProperties =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      const minimum =
        minPrice
          ? Number(
            minPrice,
          )
          : null;

      const maximum =
        maxPrice
          ? Number(
            maxPrice,
          )
          : null;

      const result =
        properties.filter(
          (property) => {
            const searchable =
              [
                property.title,
                property.city,
                property.region,
                property.location,
              ]
                .filter(
                  Boolean,
                )
                .join(" ")
                .toLowerCase();

            const matchesSearch =
              !keyword ||
              searchable.includes(
                keyword,
              );

            const matchesType =
              selectedType ===
              "All" ||
              property.propertyType
                ?.toLowerCase() ===
              selectedType.toLowerCase();

            const matchesMinimum =
              minimum ===
              null ||
              Number(
                property.price ||
                0,
              ) >= minimum;

            const matchesMaximum =
              maximum ===
              null ||
              Number(
                property.price ||
                0,
              ) <= maximum;

            const matchesBedrooms =
              bedrooms ===
              null ||
              (bedrooms === 5
                ? Number(
                  property.bedrooms ||
                  0,
                ) >= 5
                : Number(
                  property.bedrooms ||
                  0,
                ) ===
                bedrooms);

            const matchesFeatured =
              !featuredOnly ||
              Boolean(
                property.featured,
              );

            return (
              matchesSearch &&
              matchesType &&
              matchesMinimum &&
              matchesMaximum &&
              matchesBedrooms &&
              matchesFeatured
            );
          },
        );

      result.sort(
        (a, b) => {
          if (
            sortBy ===
            "price-asc"
          ) {
            return (
              Number(
                a.price,
              ) -
              Number(
                b.price,
              )
            );
          }

          if (
            sortBy ===
            "price-desc"
          ) {
            return (
              Number(
                b.price,
              ) -
              Number(
                a.price,
              )
            );
          }

          if (
            sortBy ===
            "newest"
          ) {
            return (
              new Date(
                b.createdAt,
              ).getTime() -
              new Date(
                a.createdAt,
              ).getTime()
            );
          }

          return (
            Number(
              Boolean(
                b.featured,
              ),
            ) -
            Number(
              Boolean(
                a.featured,
              ),
            ) ||
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime()
          );
        },
      );

      return result;
    }, [
      properties,
      search,
      selectedType,
      minPrice,
      maxPrice,
      bedrooms,
      featuredOnly,
      sortBy,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredProperties.length /
        ITEMS_PER_PAGE,
    ),
  );

  const paginatedProperties =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredProperties.slice(
        start,
        start + ITEMS_PER_PAGE,
      );
    }, [
      filteredProperties,
      currentPage,
    ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    selectedType,
    minPrice,
    maxPrice,
    bedrooms,
    featuredOnly,
    sortBy,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  // ============================================================
  // SAVED PROPERTY
  // ============================================================

  async function handleFavorite(
    propertyId: string,
  ) {
    if (
      savingIds.has(
        propertyId,
      )
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
        "Sign in required",
        "Please sign in to save properties.",
        [
          {
            text:
              "Cancel",
            style:
              "cancel",
          },

          {
            text:
              "Sign In",
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
        "Only buyer accounts can save properties.",
      );

      return;
    }

    const previous =
      new Set(
        savedIds,
      );

    const optimistic =
      new Set(
        savedIds,
      );

    if (
      optimistic.has(
        propertyId,
      )
    ) {
      optimistic.delete(
        propertyId,
      );
    } else {
      optimistic.add(
        propertyId,
      );
    }

    setSavedIds(
      optimistic,
    );

    setSavingIds(
      (current) => {
        const next =
          new Set(
            current,
          );

        next.add(
          propertyId,
        );

        return next;
      },
    );

    try {
      const result =
        await toggleSavedProperty(
          token,
          propertyId,
        );

      setSavedIds(
        (current) => {
          const next =
            new Set(
              current,
            );

          if (
            result.isSaved
          ) {
            next.add(
              propertyId,
            );
          } else {
            next.delete(
              propertyId,
            );
          }

          return next;
        },
      );

      await refreshMenu();
    } catch (err) {
      setSavedIds(
        previous,
      );

      Alert.alert(
        "Unable to save property",
        err instanceof Error
          ? err.message
          : "Please try again.",
      );
    } finally {
      setSavingIds(
        (current) => {
          const next =
            new Set(
              current,
            );

          next.delete(
            propertyId,
          );

          return next;
        },
      );
    }
  }

  // ============================================================
  // RESET
  // ============================================================

  function clearFilters() {
    setSearch("");
    setSelectedType(
      "All",
    );
    setMinPrice("");
    setMaxPrice("");
    setBedrooms(
      null,
    );
    setFeaturedOnly(
      false,
    );
    setSortBy(
      "featured",
    );
    setCurrentPage(1);
  }

  const activeFilterCount =
    [
      minPrice,
      maxPrice,
      bedrooms !== null,
      featuredOnly,
    ].filter(Boolean)
      .length;

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
        <View
          style={
            styles.loadingIcon
          }
        >
          <Building2
            size={30}
            color={
              Colors.navy
            }
          />
        </View>

        <ActivityIndicator
          style={{
            marginTop: 18,
          }}
          size="small"
          color={
            Colors.gold
          }
        />

        <Text
          style={
            styles.loadingTitle
          }
        >
          Finding properties
        </Text>

        <Text
          style={
            styles.loadingText
          }
        >
          Loading published homes across Portugal...
        </Text>
      </SafeAreaView>
    );
  }

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
      <FlatList
        data={
          paginatedProperties
        }
        keyExtractor={(
          item,
        ) =>
          item.id
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void loadProperties(
                true,
              )
            }
            tintColor={
              Colors.navy
            }
          />
        }
        ListHeaderComponent={
          <>
            {/* HERO */}

            <View
              style={
                styles.header
              }
            >
              <AppHeader
                eyebrow="REAL ESTATE LISBON"
                title="Explore homes"
                subtitle="Discover curated properties from verified professionals across Portugal."
                onMenuPress={openMenu}
              />

              {/* SEARCH */}

              <View
                style={
                  styles.searchRow
                }
              >
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
                    placeholder="City, area or property..."
                    placeholderTextColor="#98A2B3"
                    style={
                      styles.searchInput
                    }
                  />

                  {search ? (
                    <Pressable
                      onPress={() =>
                        setSearch(
                          "",
                        )
                      }
                    >
                      <X
                        size={18}
                        color="#98A2B3"
                      />
                    </Pressable>
                  ) : null}
                </View>

                <Pressable
                  onPress={() =>
                    setFiltersVisible(
                      true,
                    )
                  }
                  style={
                    styles.filterButton
                  }
                >
                  <SlidersHorizontal
                    size={21}
                    color="#FFFFFF"
                  />

                  {activeFilterCount >
                    0 && (
                      <View
                        style={
                          styles.filterBadge
                        }
                      >
                        <Text
                          style={
                            styles.filterBadgeText
                          }
                        >
                          {
                            activeFilterCount
                          }
                        </Text>
                      </View>
                    )}
                </Pressable>
              </View>

              {/* TYPES */}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.typeList
                }
              >
                {PROPERTY_TYPES.map(
                  (type) => {
                    const active =
                      selectedType ===
                      type;

                    return (
                      <Pressable
                        key={
                          type
                        }
                        onPress={() =>
                          setSelectedType(
                            type,
                          )
                        }
                        style={[
                          styles.typeChip,

                          active &&
                          styles.typeChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeChipText,

                            active &&
                            styles.typeChipTextActive,
                          ]}
                        >
                          {
                            type
                          }
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </ScrollView>

              {/* RESULT INFO */}

              <View
                style={
                  styles.resultsHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.resultsTitle
                    }
                  >
                    {
                      filteredProperties.length
                    }{" "}
                    {filteredProperties.length ===
                      1
                      ? "home"
                      : "homes"}
                  </Text>

                  <Text
                    style={
                      styles.resultsSubtitle
                    }
                  >
                    Matching your search
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    const options:
                      SortOption[] =
                      [
                        "featured",
                        "newest",
                        "price-asc",
                        "price-desc",
                      ];

                    const index =
                      options.indexOf(
                        sortBy,
                      );

                    setSortBy(
                      options[
                      (index +
                        1) %
                      options.length
                      ],
                    );
                  }}
                  style={
                    styles.sortButton
                  }
                >
                  <Text
                    style={
                      styles.sortText
                    }
                  >
                    {sortBy ===
                      "featured"
                      ? "Featured"
                      : sortBy ===
                        "newest"
                        ? "Newest"
                        : sortBy ===
                          "price-asc"
                          ? "Price ↑"
                          : "Price ↓"}
                  </Text>

                  <ChevronDown
                    size={16}
                    color={
                      Colors.navy
                    }
                  />
                </Pressable>
              </View>

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
                    {
                      error
                    }
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        }
        ListEmptyComponent={
          <View
            style={
              styles.empty
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Search
                size={30}
                color={
                  Colors.navy
                }
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No properties found
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Try adjusting your search or filters.
            </Text>

            <Pressable
              onPress={
                clearFilters
              }
              style={
                styles.clearButton
              }
            >
              <Text
                style={
                  styles.clearButtonText
                }
              >
                Clear filters
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({
          item,
        }) => (
          <PropertyCard
            property={
              item
            }
            saved={
              savedIds.has(
                item.id,
              )
            }
            saving={
              savingIds.has(
                item.id,
              )
            }
            showFavorite={
              isBuyer
            }
            onFavorite={() =>
              void handleFavorite(
                item.id,
              )
            }
          />
        )}
        ListFooterComponent={
          filteredProperties.length >
          ITEMS_PER_PAGE ? (
            <View
              style={
                styles.pagination
              }
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous properties page"
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
                  styles.paginationButton,
                  currentPage === 1 &&
                    styles.paginationButtonDisabled,
                  pressed &&
                    currentPage !== 1 &&
                    styles.paginationButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.paginationButtonText,
                    currentPage === 1 &&
                      styles.paginationButtonTextDisabled,
                  ]}
                >
                  Previous
                </Text>
              </Pressable>

              <View
                style={
                  styles.paginationInfo
                }
              >
                <Text
                  style={
                    styles.paginationPage
                  }
                >
                  {currentPage}
                </Text>

                <Text
                  style={
                    styles.paginationTotal
                  }
                >
                  of {totalPages}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next properties page"
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
                  styles.paginationButton,
                  currentPage ===
                    totalPages &&
                    styles.paginationButtonDisabled,
                  pressed &&
                    currentPage !==
                      totalPages &&
                    styles.paginationButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.paginationButtonText,
                    currentPage ===
                      totalPages &&
                      styles.paginationButtonTextDisabled,
                  ]}
                >
                  Next
                </Text>
              </Pressable>
            </View>
          ) : null
        }
      />

      {/* FILTER MODAL */}

      <Modal
        visible={
          filtersVisible
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setFiltersVisible(
            false,
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.filterSheet
            }
          >
            <View
              style={
                styles.sheetHandle
              }
            />

            <View
              style={
                styles.filterHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.filterTitle
                  }
                >
                  Filters
                </Text>

                <Text
                  style={
                    styles.filterSubtitle
                  }
                >
                  Refine your property search
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setFiltersVisible(
                    false,
                  )
                }
                style={
                  styles.closeButton
                }
              >
                <X
                  size={21}
                  color={
                    Colors.navyDark
                  }
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
            >
              {/* PRICE */}

              <Text
                style={
                  styles.filterLabel
                }
              >
                Price range
              </Text>

              <View
                style={
                  styles.priceRow
                }
              >
                <View
                  style={
                    styles.priceInputWrap
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
                      minPrice
                    }
                    onChangeText={
                      setMinPrice
                    }
                    keyboardType="numeric"
                    placeholder="Min"
                    placeholderTextColor="#98A2B3"
                    style={
                      styles.priceInput
                    }
                  />
                </View>

                <View
                  style={
                    styles.priceInputWrap
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
                      maxPrice
                    }
                    onChangeText={
                      setMaxPrice
                    }
                    keyboardType="numeric"
                    placeholder="Max"
                    placeholderTextColor="#98A2B3"
                    style={
                      styles.priceInput
                    }
                  />
                </View>
              </View>

              {/* BEDROOMS */}

              <Text
                style={[
                  styles.filterLabel,
                  {
                    marginTop:
                      24,
                  },
                ]}
              >
                Bedrooms
              </Text>

              <View
                style={
                  styles.bedroomRow
                }
              >
                <Pressable
                  onPress={() =>
                    setBedrooms(
                      null,
                    )
                  }
                  style={[
                    styles.numberChip,

                    bedrooms ===
                    null &&
                    styles.numberChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.numberChipText,

                      bedrooms ===
                      null &&
                      styles.numberChipTextActive,
                    ]}
                  >
                    Any
                  </Text>
                </Pressable>

                {BEDROOM_OPTIONS.map(
                  (value) => {
                    const active =
                      bedrooms ===
                      value;

                    return (
                      <Pressable
                        key={
                          value
                        }
                        onPress={() =>
                          setBedrooms(
                            value,
                          )
                        }
                        style={[
                          styles.numberChip,

                          active &&
                          styles.numberChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.numberChipText,

                            active &&
                            styles.numberChipTextActive,
                          ]}
                        >
                          {value ===
                            5
                            ? "5+"
                            : value}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>

              {/* FEATURED */}

              <View
                style={
                  styles.switchRow
                }
              >
                <View
                  style={
                    styles.switchContent
                  }
                >
                  <View
                    style={
                      styles.featuredIcon
                    }
                  >
                    <Sparkles
                      size={18}
                      color={
                        Colors.gold
                      }
                    />
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={
                        styles.switchTitle
                      }
                    >
                      Featured only
                    </Text>

                    <Text
                      style={
                        styles.switchSubtitle
                      }
                    >
                      Show highlighted properties
                    </Text>
                  </View>
                </View>

                <Switch
                  value={
                    featuredOnly
                  }
                  onValueChange={
                    setFeaturedOnly
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
            </ScrollView>

            <View
              style={
                styles.filterFooter
              }
            >
              <Pressable
                onPress={
                  clearFilters
                }
                style={
                  styles.resetButton
                }
              >
                <Text
                  style={
                    styles.resetText
                  }
                >
                  Reset
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setFiltersVisible(
                    false,
                  )
                }
                style={
                  styles.showButton
                }
              >
                <Text
                  style={
                    styles.showButtonText
                  }
                >
                  Show{" "}
                  {
                    filteredProperties.length
                  }{" "}
                  homes
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <AppMenu
        visible={menuVisible}
        onClose={closeMenu}
        user={menuUser}
        savedCount={savedCount}
        unreadMessages={unreadMessages}
      />
    </SafeAreaView>
  );
}

// ============================================================
// PROPERTY CARD
// ============================================================

function PropertyCard({
  property,
  saved,
  saving,
  showFavorite,
  onFavorite,
}: {
  property: Property;
  saved: boolean;
  saving: boolean;
  showFavorite: boolean;
  onFavorite: () => void;
}) {
  const image =
    getAssetUrl(
      property
        .imageUrls?.[0],
    );

  const location =
    [
      property.city,
      property.region,
    ]
      .filter(
        Boolean,
      )
      .join(", ") ||
    property.location ||
    "Portugal";

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname:
            "/properties/[id]",

          params: {
            id:
              property.id,
          },
        })
      }
      style={({
        pressed,
      }) => [
          styles.card,

          pressed && {
            opacity:
              0.96,
            transform: [
              {
                scale:
                  0.995,
              },
            ],
          },
        ]}
    >
      <View
        style={
          styles.imageWrapper
        }
      >
        {image ? (
          <Image
            source={{
              uri: image,
            }}
            style={
              styles.image
            }
            resizeMode="cover"
          />
        ) : (
          <View
            style={
              styles.imagePlaceholder
            }
          >
            <Building2
              size={42}
              color={
                Colors.muted
              }
            />

            <Text
              style={
                styles.placeholderText
              }
            >
              No image
            </Text>
          </View>
        )}

        <View
          style={
            styles.badges
          }
        >
          {property.featured && (
            <View
              style={
                styles.featured
              }
            >
              <Sparkles
                size={12}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.featuredText
                }
              >
                Featured
              </Text>
            </View>
          )}

          <View
            style={
              styles.publishedBadge
            }
          >
            <Text
              style={
                styles.publishedText
              }
            >
              Published
            </Text>
          </View>
        </View>

        {showFavorite && (
          <Pressable
            disabled={
              saving
            }
            onPress={(
              event,
            ) => {
              event.stopPropagation();

              onFavorite();
            }}
            style={
              styles.cardFavorite
            }
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color="#DC2626"
              />
            ) : (
              <Heart
                size={21}
                color={
                  saved
                    ? "#DC2626"
                    : Colors.navyDark
                }
                fill={
                  saved
                    ? "#DC2626"
                    : "transparent"
                }
              />
            )}
          </Pressable>
        )}
      </View>

      <View
        style={
          styles.cardContent
        }
      >
        <View
          style={
            styles.cardTop
          }
        >
          <Text
            style={
              styles.propertyTitle
            }
            numberOfLines={
              2
            }
          >
            {
              property.title
            }
          </Text>

          <Text
            style={
              styles.price
            }
          >
            €
            {Number(
              property.price ||
              0,
            ).toLocaleString()}
          </Text>
        </View>

        <View
          style={
            styles.locationRow
          }
        >
          <MapPin
            size={15}
            color={
              Colors.textSecondary
            }
          />

          <Text
            style={
              styles.location
            }
            numberOfLines={
              1
            }
          >
            {
              location
            }
          </Text>
        </View>

        <View
          style={
            styles.specs
          }
        >
          <Spec
            icon={
              <BedDouble
                size={16}
                color={
                  Colors.navy
                }
              />
            }
            text={`${property.bedrooms ??
              "—"
              } beds`}
          />

          <Spec
            icon={
              <Bath
                size={16}
                color={
                  Colors.navy
                }
              />
            }
            text={`${property.bathrooms ??
              "—"
              } baths`}
          />

          <Spec
            icon={
              <Maximize
                size={16}
                color={
                  Colors.navy
                }
              />
            }
            text={
              property.area
                ? `${property.area} m²`
                : "— m²"
            }
          />
        </View>
      </View>
    </Pressable>
  );
}

function Spec({
  icon,
  text,
}: {
  icon:
  React.ReactNode;
  text: string;
}) {
  return (
    <View
      style={
        styles.spec
      }
    >
      {icon}

      <Text
        style={
          styles.specText
        }
      >
        {text}
      </Text>
    </View>
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
        "#F7F8FA",
    },

    center: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 32,
      backgroundColor:
        "#F7F8FA",
    },

    loadingIcon: {
      width: 68,
      height: 68,
      borderRadius: 24,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#EEF2F7",
    },

    loadingTitle: {
      marginTop: 18,
      color:
        Colors.navyDark,
      fontSize: 18,
      fontWeight:
        "800",
    },

    loadingText: {
      marginTop: 7,
      textAlign:
        "center",
      color:
        Colors.textSecondary,
      lineHeight: 21,
    },

    list: {
      paddingHorizontal: 18,
      paddingBottom: 34,
    },

    header: {
      paddingTop: 20,
      paddingBottom: 10,
    },

    headerTop: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    marketIcon: {
      width: 48,
      height: 48,
      borderRadius: 17,
      backgroundColor:
        "#EEF2F7",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    eyebrow: {
      color:
        Colors.gold,
      fontSize: 11,
      fontWeight:
        "900",
      letterSpacing:
        1.5,
    },

    title: {
      marginTop: 7,
      color:
        Colors.navyDark,
      fontSize: 35,
      lineHeight: 41,
      fontWeight:
        "900",
      letterSpacing:
        -1,
    },

    subtitle: {
      marginTop: 10,
      maxWidth: 350,
      color:
        Colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
    },

    searchRow: {
      marginTop: 22,
      flexDirection:
        "row",
      gap: 10,
    },

    searchBox: {
      flex: 1,
      height: 55,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 10,
      borderWidth: 1,
      borderColor:
        "#E4E7EC",
      borderRadius: 18,
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 15,
    },

    searchInput: {
      flex: 1,
      color:
        Colors.navyDark,
      fontSize: 14,
    },

    filterButton: {
      position:
        "relative",
      width: 55,
      height: 55,
      borderRadius: 18,
      backgroundColor:
        Colors.navy,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    filterBadge: {
      position:
        "absolute",
      right: -4,
      top: -4,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor:
        Colors.gold,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor:
        "#F7F8FA",
    },

    filterBadgeText: {
      color:
        "#FFFFFF",
      fontSize: 9,
      fontWeight:
        "900",
    },

    typeList: {
      paddingTop: 17,
      paddingBottom: 7,
      gap: 8,
    },

    typeChip: {
      borderWidth: 1,
      borderColor:
        "#E4E7EC",
      borderRadius: 999,
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 16,
      paddingVertical: 9,
    },

    typeChipActive: {
      borderColor:
        Colors.navy,
      backgroundColor:
        Colors.navy,
    },

    typeChipText: {
      color:
        Colors.textSecondary,
      fontSize: 12,
      fontWeight:
        "700",
    },

    typeChipTextActive: {
      color:
        "#FFFFFF",
    },

    resultsHeader: {
      marginTop: 22,
      marginBottom: 17,
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
      fontSize: 18,
      fontWeight:
        "900",
    },

    resultsSubtitle: {
      marginTop: 3,
      color:
        Colors.textSecondary,
      fontSize: 11,
    },

    sortButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      borderWidth: 1,
      borderColor:
        "#E4E7EC",
      borderRadius: 12,
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 12,
      paddingVertical: 9,
    },

    sortText: {
      color:
        Colors.navy,
      fontSize: 11,
      fontWeight:
        "800",
    },

    errorBox: {
      marginBottom: 14,
      borderRadius: 15,
      padding: 13,
      backgroundColor:
        "#FEF2F2",
    },

    errorText: {
      color:
        Colors.error,
      fontSize: 13,
    },

    card: {
      marginBottom: 18,
      overflow:
        "hidden",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      borderRadius: 24,
      backgroundColor:
        "#FFFFFF",
    },

    imageWrapper: {
      position:
        "relative",
      height: 235,
      backgroundColor:
        "#EEF1F5",
    },

    image: {
      width: "100%",
      height: "100%",
    },

    imagePlaceholder: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    placeholderText: {
      marginTop: 7,
      color:
        Colors.muted,
      fontSize: 12,
    },

    badges: {
      position:
        "absolute",
      top: 14,
      left: 14,
      flexDirection:
        "row",
      gap: 7,
    },

    featured: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      borderRadius: 999,
      backgroundColor:
        Colors.gold,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    featuredText: {
      color:
        "#FFFFFF",
      fontSize: 10,
      fontWeight:
        "900",
    },

    publishedBadge: {
      borderRadius: 999,
      backgroundColor:
        "rgba(255,255,255,0.94)",
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    publishedText: {
      color:
        Colors.navy,
      fontSize: 10,
      fontWeight:
        "800",
    },

    cardFavorite: {
      position:
        "absolute",
      top: 13,
      right: 13,
      width: 42,
      height: 42,
      borderRadius: 16,
      backgroundColor:
        "rgba(255,255,255,0.95)",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    cardContent: {
      padding: 17,
    },

    cardTop: {
      gap: 7,
    },

    propertyTitle: {
      color:
        Colors.navyDark,
      fontSize: 19,
      lineHeight: 25,
      fontWeight:
        "800",
    },

    price: {
      color:
        Colors.navy,
      fontSize: 25,
      fontWeight:
        "900",
      letterSpacing:
        -0.5,
    },

    locationRow: {
      marginTop: 10,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
    },

    location: {
      flex: 1,
      color:
        Colors.textSecondary,
      fontSize: 13,
    },

    specs: {
      marginTop: 15,
      paddingTop: 14,
      flexDirection:
        "row",
      gap: 15,
      borderTopWidth: 1,
      borderTopColor:
        "#F0F1F3",
    },

    spec: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    specText: {
      color:
        Colors.textSecondary,
      fontSize: 11,
      fontWeight:
        "700",
    },

    empty: {
      marginTop: 35,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      borderRadius: 25,
      backgroundColor:
        "#FFFFFF",
      alignItems:
        "center",
      padding: 32,
    },

    emptyIcon: {
      width: 66,
      height: 66,
      borderRadius: 22,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#F2F4F7",
    },

    emptyTitle: {
      marginTop: 19,
      color:
        Colors.navyDark,
      fontSize: 20,
      fontWeight:
        "900",
    },

    emptyText: {
      marginTop: 7,
      textAlign:
        "center",
      color:
        Colors.textSecondary,
      lineHeight: 21,
    },

    clearButton: {
      marginTop: 20,
      borderRadius: 14,
      backgroundColor:
        Colors.navy,
      paddingHorizontal: 18,
      paddingVertical: 11,
    },

    clearButtonText: {
      color:
        "#FFFFFF",
      fontSize: 12,
      fontWeight:
        "800",
    },

    // PAGINATION

    pagination: {
      marginTop: 4,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },

    paginationButton: {
      minWidth: 104,
      height: 46,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: "#D9DEE7",
      borderRadius: 15,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },

    paginationButtonPressed: {
      opacity: 0.82,
      transform: [
        {
          scale: 0.98,
        },
      ],
    },

    paginationButtonDisabled: {
      backgroundColor: "#F2F4F7",
      borderColor: "#EAECF0",
    },

    paginationButtonText: {
      color: Colors.navy,
      fontSize: 12,
      fontWeight: "800",
    },

    paginationButtonTextDisabled: {
      color: "#98A2B3",
    },

    paginationInfo: {
      minWidth: 64,
      alignItems: "center",
      justifyContent: "center",
    },

    paginationPage: {
      color: Colors.navyDark,
      fontSize: 18,
      fontWeight: "900",
    },

    paginationTotal: {
      marginTop: 1,
      color: Colors.textSecondary,
      fontSize: 10,
      fontWeight: "700",
    },

    // FILTER SHEET

    modalOverlay: {
      flex: 1,
      justifyContent:
        "flex-end",
      backgroundColor:
        "rgba(15,35,64,0.35)",
    },

    filterSheet: {
      maxHeight: "85%",
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 20,
      paddingBottom: 26,
    },

    sheetHandle: {
      alignSelf:
        "center",
      width: 42,
      height: 5,
      marginTop: 10,
      marginBottom: 17,
      borderRadius: 999,
      backgroundColor:
        "#D0D5DD",
    },

    filterHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 25,
    },

    filterTitle: {
      color:
        Colors.navyDark,
      fontSize: 24,
      fontWeight:
        "900",
    },

    filterSubtitle: {
      marginTop: 3,
      color:
        Colors.textSecondary,
      fontSize: 12,
    },

    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor:
        "#F2F4F7",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    filterLabel: {
      marginBottom: 10,
      color:
        Colors.navyDark,
      fontSize: 13,
      fontWeight:
        "800",
    },

    priceRow: {
      flexDirection:
        "row",
      gap: 10,
    },

    priceInputWrap: {
      flex: 1,
      height: 51,
      flexDirection:
        "row",
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        "#E4E7EC",
      borderRadius: 15,
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 13,
    },

    currency: {
      color:
        Colors.textSecondary,
      fontWeight:
        "800",
    },

    priceInput: {
      flex: 1,
      marginLeft: 7,
      color:
        Colors.navyDark,
      fontSize: 14,
    },

    bedroomRow: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
    },

    numberChip: {
      minWidth: 49,
      height: 43,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor:
        "#E4E7EC",
      borderRadius: 13,
      backgroundColor:
        "#FFFFFF",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    numberChipActive: {
      borderColor:
        Colors.navy,
      backgroundColor:
        Colors.navy,
    },

    numberChipText: {
      color:
        Colors.textSecondary,
      fontSize: 12,
      fontWeight:
        "800",
    },

    numberChipTextActive: {
      color:
        "#FFFFFF",
    },

    switchRow: {
      marginTop: 27,
      marginBottom: 28,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      borderRadius: 18,
      padding: 15,
    },

    switchContent: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 11,
    },

    featuredIcon: {
      width: 39,
      height: 39,
      borderRadius: 13,
      backgroundColor:
        "#FFF8E1",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    switchTitle: {
      color:
        Colors.navyDark,
      fontSize: 13,
      fontWeight:
        "800",
    },

    switchSubtitle: {
      marginTop: 2,
      color:
        Colors.textSecondary,
      fontSize: 10,
    },

    filterFooter: {
      paddingTop: 16,
      flexDirection:
        "row",
      gap: 10,
      borderTopWidth: 1,
      borderTopColor:
        "#EAECF0",
    },

    resetButton: {
      height: 52,
      minWidth: 100,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      borderRadius: 15,
    },

    resetText: {
      color:
        Colors.navy,
      fontSize: 13,
      fontWeight:
        "800",
    },

    showButton: {
      flex: 1,
      height: 52,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 15,
      backgroundColor:
        Colors.navy,
    },

    showButtonText: {
      color:
        "#FFFFFF",
      fontSize: 13,
      fontWeight:
        "900",
    },
  });