import {
  ActivityIndicator,
  Image,
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
  ArrowRight,
  Calendar,
  Clock3,
  ImageOff,
  MapPin,
  Search,
  Trophy,
  Upload,
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
  getPublicStories,
  type Story,
} from "@/lib/stories-api";

import {
  getAssetUrl,
} from "@/lib/api";

import {
  Colors,
} from "@/constants/colors";

const ITEMS_PER_PAGE = 3;

function readingTime(
  content?: string | null,
) {
  const words =
    content
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .length || 0;

  return Math.max(
    1,
    Math.ceil(
      words / 200,
    ),
  );
}

export default function StoriesScreen() {
  const [
    stories,
    setStories,
  ] =
    useState<Story[]>(
      [],
    );

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

  const loadStories =
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

          const data =
            await getPublicStories();

          setStories(
            Array.isArray(
              data,
            )
              ? data
              : [],
          );
        } catch {
          setStories(
            [],
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
    void loadStories();
  }, [
    loadStories,
  ]);

  const filteredStories =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return stories;
        }

        return stories.filter(
          (
            story,
          ) =>
            [
              story.title,
              story.excerpt,
              story.author,
              story.location,
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
        stories,
        search,
      ],
    );

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStories.length / ITEMS_PER_PAGE),
  );

  const paginatedStories = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStories.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [filteredStories, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (
    loading
  ) {
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
          Loading success stories...
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
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void loadStories(
                true,
              )
            }
            tintColor={
              Colors.navy
            }
          />
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={
            styles.hero
          }
        >
          <View
            style={
              styles.heroBadge
            }
          >
            <Trophy
              size={16}
              color="#F4D77B"
            />

            <Text
              style={
                styles.heroBadgeText
              }
            >
              APPROVED SUCCESS STORIES
            </Text>
          </View>

          <Text
            style={
              styles.heroTitle
            }
          >
            Real Buyer Success Stories
          </Text>

          <Text
            style={
              styles.heroSubtitle
            }
          >
            Discover real journeys from buyers navigating property decisions in Portugal.
          </Text>

          <Pressable
            onPress={() =>
              router.push(
                "/stories/submit",
              )
            }
            style={
              styles.submitStoryButton
            }
          >
            <Upload
              size={17}
              color={
                Colors.navyDark
              }
            />

            <Text
              style={
                styles.submitStoryText
              }
            >
              Share Your Story
            </Text>
          </Pressable>
        </View>

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
            placeholder="Search stories..."
            placeholderTextColor="#98A2B3"
            style={
              styles.searchInput
            }
          />
        </View>

        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionEyebrow
              }
            >
              COMMUNITY
            </Text>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Buyer journeys
            </Text>
          </View>

          <Text
            style={
              styles.resultCount
            }
          >
            {
              filteredStories.length
            }{" "}
            stories
          </Text>
        </View>

        {filteredStories.length ===
        0 ? (
          <View
            style={
              styles.empty
            }
          >
            <ImageOff
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
              No stories found
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Try another search or come back later.
            </Text>
          </View>
        ) : (
          paginatedStories.map(
            (
              story,
            ) => {
              const image =
                getAssetUrl(
                  story.imageUrl,
                );

              return (
                <Pressable
                  key={
                    story.id
                  }
                  onPress={() =>
                    router.push({
                      pathname:
                        "/stories/[id]",
                      params: {
                        id:
                          story.id,
                      },
                    })
                  }
                  style={
                    styles.storyCard
                  }
                >
                  <View
                    style={
                      styles.imageWrap
                    }
                  >
                    {image ? (
                      <Image
                        source={{
                          uri:
                            image,
                        }}
                        style={
                          styles.storyImage
                        }
                      />
                    ) : (
                      <View
                        style={
                          styles.imageFallback
                        }
                      >
                        <ImageOff
                          size={30}
                          color={
                            Colors.navy
                          }
                        />
                      </View>
                    )}

                    <View
                      style={
                        styles.imageBadge
                      }
                    >
                      <Text
                        style={
                          styles.imageBadgeText
                        }
                      >
                        Success Story
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.storyBody
                    }
                  >
                    <Text
                      numberOfLines={
                        2
                      }
                      style={
                        styles.storyTitle
                      }
                    >
                      {
                        story.title
                      }
                    </Text>

                    {story.excerpt ? (
                      <Text
                        numberOfLines={
                          3
                        }
                        style={
                          styles.storyExcerpt
                        }
                      >
                        {
                          story.excerpt
                        }
                      </Text>
                    ) : null}

                    <View
                      style={
                        styles.metaWrap
                      }
                    >
                      <MetaItem
                        icon={
                          Calendar
                        }
                        text={new Date(
                          story.createdAt,
                        ).toLocaleDateString()}
                      />

                      <MetaItem
                        icon={
                          Clock3
                        }
                        text={`${readingTime(
                          story.content,
                        )} min`}
                      />

                      <MetaItem
                        icon={
                          MapPin
                        }
                        text={
                          story.location ||
                          "Portugal"
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.cardFooter
                      }
                    >
                      <Text
                        style={
                          styles.author
                        }
                      >
                        {
                          story.author ||
                          "Verified Buyer"
                        }
                      </Text>

                      <View
                        style={
                          styles.readMore
                        }
                      >
                        <Text
                          style={
                            styles.readMoreText
                          }
                        >
                          Read story
                        </Text>

                        <ArrowRight
                          size={16}
                          color={
                            Colors.navy
                          }
                        />
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            },
          )
        )}

        {filteredStories.length > ITEMS_PER_PAGE ? (
          <View style={styles.pagination}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous stories page"
              disabled={currentPage === 1}
              onPress={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
              style={({ pressed }) => [
                styles.pageButton,
                currentPage === 1 && styles.pageButtonDisabled,
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

            <View style={styles.pageIndicator}>
              <Text style={styles.pageLabel}>PAGE</Text>
              <Text style={styles.pageIndicatorText}>
                {currentPage} / {totalPages}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next stories page"
              disabled={currentPage === totalPages}
              onPress={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1),
                )
              }
              style={({ pressed }) => [
                styles.pageButton,
                currentPage === totalPages &&
                  styles.pageButtonDisabled,
                pressed &&
                  currentPage !== totalPages &&
                  styles.pageButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.pageButtonText,
                  currentPage === totalPages &&
                    styles.pageButtonTextDisabled,
                ]}
              >
                Next
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaItem({
  icon: Icon,
  text,
}: {
  icon:
    typeof Calendar;
  text: string;
}) {
  return (
    <View
      style={
        styles.metaItem
      }
    >
      <Icon
        size={14}
        color="#98A2B3"
      />

      <Text
        style={
          styles.metaText
        }
      >
        {text}
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
      paddingTop: 16,
      paddingBottom: 44,
    },

    hero: {
      borderRadius: 28,
      backgroundColor:
        Colors.navyDark,
      padding: 22,
    },

    heroBadge: {
      alignSelf:
        "flex-start",
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
      borderRadius: 999,
      backgroundColor:
        "rgba(255,255,255,0.08)",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    heroBadgeText: {
      color:
        "#F4D77B",
      fontSize: 10,
      fontWeight:
        "800",
      letterSpacing: 1,
    },

    heroTitle: {
      marginTop: 17,
      color:
        Colors.white,
      fontSize: 32,
      lineHeight: 38,
      fontWeight:
        "800",
      letterSpacing:
        -0.7,
    },

    heroSubtitle: {
      marginTop: 10,
      color:
        "rgba(255,255,255,0.78)",
      fontSize: 14,
      lineHeight: 22,
    },

    submitStoryButton: {
      marginTop: 18,
      minHeight: 50,
      borderRadius: 15,
      backgroundColor:
        Colors.gold,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
    },

    submitStoryText: {
      color:
        Colors.navyDark,
      fontSize: 13,
      fontWeight:
        "800",
    },

    searchBox: {
      marginTop: 18,
      minHeight: 54,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.white,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
      paddingHorizontal: 15,
    },

    searchInput: {
      flex: 1,
      color:
        Colors.navyDark,
      fontSize: 14,
    },

    sectionHeader: {
      marginTop: 24,
      marginBottom: 12,
      flexDirection:
        "row",
      alignItems:
        "flex-end",
      justifyContent:
        "space-between",
    },

    sectionEyebrow: {
      color:
        Colors.gold,
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing: 1.2,
    },

    sectionTitle: {
      marginTop: 4,
      color:
        Colors.navyDark,
      fontSize: 22,
      fontWeight:
        "800",
    },

    resultCount: {
      color:
        Colors.textSecondary,
      fontSize: 11,
      fontWeight:
        "700",
    },

    storyCard: {
      marginBottom: 16,
      overflow:
        "hidden",
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.white,
    },

    imageWrap: {
      height: 205,
      backgroundColor:
        "#EEF3F8",
    },

    storyImage: {
      width:
        "100%",
      height:
        "100%",
    },

    imageFallback: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#EEF3F8",
    },

    imageBadge: {
      position:
        "absolute",
      left: 14,
      top: 14,
      borderRadius: 999,
      backgroundColor:
        Colors.gold,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },

    imageBadgeText: {
      color:
        Colors.white,
      fontSize: 9,
      fontWeight:
        "800",
    },

    storyBody: {
      padding: 17,
    },

    storyTitle: {
      color:
        Colors.navyDark,
      fontSize: 19,
      lineHeight: 25,
      fontWeight:
        "800",
    },

    storyExcerpt: {
      marginTop: 8,
      color:
        Colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
    },

    metaWrap: {
      marginTop: 13,
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 10,
    },

    metaItem: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    metaText: {
      color:
        "#98A2B3",
      fontSize: 10,
    },

    cardFooter: {
      marginTop: 15,
      paddingTop: 13,
      borderTopWidth: 1,
      borderTopColor:
        Colors.border,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    author: {
      flex: 1,
      color:
        Colors.navyDark,
      fontSize: 12,
      fontWeight:
        "700",
    },

    readMore: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    readMoreText: {
      color:
        Colors.navy,
      fontSize: 11,
      fontWeight:
        "800",
    },

    pagination: {
      marginTop: 8,
      marginBottom: 4,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },

    pageButton: {
      minWidth: 96,
      minHeight: 46,
      paddingHorizontal: 15,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: Colors.navy,
      backgroundColor: Colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },

    pageButtonPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },

    pageButtonDisabled: {
      borderColor: "#EAECF0",
      backgroundColor: "#EAECF0",
    },

    pageButtonText: {
      color: Colors.white,
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
      borderColor: Colors.border,
      backgroundColor: Colors.white,
      alignItems: "center",
      justifyContent: "center",
    },

    pageLabel: {
      color: Colors.gold,
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1.1,
    },

    pageIndicatorText: {
      marginTop: 2,
      color: Colors.navyDark,
      fontSize: 12,
      fontWeight: "800",
    },

    empty: {
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
      marginTop: 5,
      color:
        Colors.textSecondary,
      textAlign:
        "center",
    },
  });
