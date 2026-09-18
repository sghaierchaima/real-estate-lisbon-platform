import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
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
} from "expo-router";

import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Heart,
  MapPin,
  Maximize,
} from "lucide-react-native";

import {
  getAssetUrl,
} from "@/lib/api";

import {
  getSavedProperties,
  removeSavedProperty,
} from "@/lib/saved-properties-api";

import {
  getToken,
  getStoredUser,
} from "@/lib/session";

import type {
  SavedPropertyItem,
} from "@/lib/saved-properties-api";

import type {
  AuthUser,
} from "@/types/auth";

import {
  Colors,
} from "@/constants/colors";

export default function SavedPropertiesScreen() {
  const [
    items,
    setItems,
  ] =
    useState<SavedPropertyItem[]>([]);

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
    removingIds,
    setRemovingIds,
  ] =
    useState<Set<string>>(
      new Set(),
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const loadSavedProperties =
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

          const token =
            await getToken();

          const user =
            await getStoredUser<AuthUser>();

          if (
            !token ||
            !user
          ) {
            router.replace(
              "/login",
            );

            return;
          }

          if (
            user.role !==
            "BUYER"
          ) {
            setError(
              "Saved properties are available for buyer accounts only.",
            );

            return;
          }

          const data =
            await getSavedProperties(
              token,
            );

          setItems(
            Array.isArray(
              data,
            )
              ? data
              : [],
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load saved properties.",
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
    void loadSavedProperties();
  }, [loadSavedProperties]);

  async function handleRemove(
    propertyId: string,
  ) {
    const token =
      await getToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    const previous =
      items;

    setRemovingIds(
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

    setItems(
      (current) =>
        current.filter(
          (item) =>
            item.propertyId !==
            propertyId,
        ),
    );

    try {
      await removeSavedProperty(
        token,
        propertyId,
      );
    } catch (err) {
      setItems(
        previous,
      );

      Alert.alert(
        "Unable to remove property",
        err instanceof Error
          ? err.message
          : "Please try again.",
      );
    } finally {
      setRemovingIds(
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
          Loading saved homes...
        </Text>
      </SafeAreaView>
    );
  }

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
          items
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
              void loadSavedProperties(
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
                  styles.backButton
                }
              >
                <ArrowLeft
                  size={23}
                  color={
                    Colors.navyDark
                  }
                />
              </Pressable>

              <View
                style={
                  styles.headerCount
                }
              >
                <Heart
                  size={16}
                  color={
                    "#DC2626"
                  }
                  fill="#DC2626"
                />

                <Text
                  style={
                    styles.headerCountText
                  }
                >
                  {
                    items.length
                  }
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.eyebrow
              }
            >
              BUYER COLLECTION
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Saved homes
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Keep your favourite properties in one place and revisit them anytime.
            </Text>

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
        }
        ListEmptyComponent={
          <View
            style={
              styles.emptyCard
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Heart
                size={32}
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
              No saved homes yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Browse properties and tap the heart icon to build your private collection.
            </Text>

            <Pressable
              onPress={() =>
                router.push(
                  "/(tabs)/properties",
                )
              }
              style={
                styles.exploreButton
              }
            >
              <Text
                style={
                  styles.exploreButtonText
                }
              >
                Explore properties
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({
          item,
        }) => (
          <SavedPropertyCard
            item={
              item
            }
            removing={
              removingIds.has(
                item.propertyId,
              )
            }
            onRemove={() =>
              void handleRemove(
                item.propertyId,
              )
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

function SavedPropertyCard({
  item,
  removing,
  onRemove,
}: {
  item:
    SavedPropertyItem;

  removing:
    boolean;

  onRemove:
    () => void;
}) {
  const {
    property,
  } =
    item;

  const image =
    getAssetUrl(
      property.imageUrls?.[0],
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
      style={({ pressed }) => [
        styles.card,

        pressed && {
          opacity:
            0.97,
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
              styles.placeholder
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
              No image available
            </Text>
          </View>
        )}

        <View
          style={
            styles.savedBadge
          }
        >
          <Heart
            size={13}
            color="#FFFFFF"
            fill="#FFFFFF"
          />

          <Text
            style={
              styles.savedBadgeText
            }
          >
            Saved
          </Text>
        </View>

        <Pressable
          disabled={
            removing
          }
          onPress={(
            event,
          ) => {
            event.stopPropagation();

            onRemove();
          }}
          style={
            styles.removeButton
          }
        >
          {removing ? (
            <ActivityIndicator
              size="small"
              color="#DC2626"
            />
          ) : (
            <Heart
              size={22}
              color="#DC2626"
              fill="#DC2626"
            />
          )}
        </Pressable>
      </View>

      <View
        style={
          styles.cardContent
        }
      >
        <Text
          style={
            styles.propertyType
          }
        >
          {property.propertyType
            ?.replaceAll(
              "_",
              " ",
            ) ||
            "PROPERTY"}
        </Text>

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
            numberOfLines={
              1
            }
            style={
              styles.location
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
          <PropertySpec
            icon={
              <BedDouble
                size={16}
                color={
                  Colors.navy
                }
              />
            }
            value={`${property.bedrooms ?? "—"} beds`}
          />

          <PropertySpec
            icon={
              <Bath
                size={16}
                color={
                  Colors.navy
                }
              />
            }
            value={`${property.bathrooms ?? "—"} baths`}
          />

          <PropertySpec
            icon={
              <Maximize
                size={16}
                color={
                  Colors.navy
                }
              />
            }
            value={
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

function PropertySpec({
  icon,
  value,
}: {
  icon:
    React.ReactNode;

  value:
    string;
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
        {value}
      </Text>
    </View>
  );
}

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
      backgroundColor:
        "#F7F8FA",
    },

    loadingText: {
      marginTop: 12,
      color:
        Colors.textSecondary,
    },

    list: {
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 35,
    },

    topBar: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 24,
    },

    backButton: {
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

    headerCount: {
      minWidth: 52,
      height: 38,
      paddingHorizontal: 12,
      borderRadius: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 6,
      backgroundColor:
        "#FEF2F2",
    },

    headerCountText: {
      color:
        "#DC2626",
      fontWeight:
        "900",
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
      fontSize: 36,
      fontWeight:
        "900",
      letterSpacing:
        -1,
    },

    subtitle: {
      marginTop: 9,
      marginBottom: 24,
      color:
        Colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
    },

    errorBox: {
      marginBottom: 18,
      borderRadius: 15,
      backgroundColor:
        "#FEF2F2",
      padding: 13,
    },

    errorText: {
      color:
        Colors.error,
      fontSize: 13,
    },

    card: {
      overflow:
        "hidden",
      marginBottom: 18,
      borderRadius: 24,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      backgroundColor:
        "#FFFFFF",
    },

    imageWrapper: {
      position:
        "relative",
      height: 225,
      backgroundColor:
        "#EEF1F5",
    },

    image: {
      width: "100%",
      height: "100%",
    },

    placeholder: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    placeholderText: {
      marginTop: 8,
      color:
        Colors.muted,
      fontSize: 12,
    },

    savedBadge: {
      position:
        "absolute",
      left: 14,
      top: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 7,
      backgroundColor:
        Colors.navy,
    },

    savedBadgeText: {
      color:
        "#FFFFFF",
      fontSize: 10,
      fontWeight:
        "900",
    },

    removeButton: {
      position:
        "absolute",
      right: 14,
      top: 14,
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(255,255,255,0.95)",
    },

    cardContent: {
      padding: 17,
    },

    propertyType: {
      color:
        Colors.gold,
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing:
        1.2,
      textTransform:
        "uppercase",
    },

    propertyTitle: {
      marginTop: 7,
      color:
        Colors.navyDark,
      fontSize: 20,
      lineHeight: 26,
      fontWeight:
        "900",
    },

    price: {
      marginTop: 9,
      color:
        Colors.navy,
      fontSize: 27,
      fontWeight:
        "900",
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
      borderTopWidth: 1,
      borderTopColor:
        "#F0F1F3",
      flexDirection:
        "row",
      gap: 15,
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

    emptyCard: {
      marginTop: 30,
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      borderRadius: 26,
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 26,
      paddingVertical: 40,
    },

    emptyIcon: {
      width: 70,
      height: 70,
      borderRadius: 24,
      backgroundColor:
        "#F2F4F7",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    emptyTitle: {
      marginTop: 20,
      color:
        Colors.navyDark,
      fontSize: 21,
      fontWeight:
        "900",
    },

    emptyText: {
      marginTop: 9,
      maxWidth: 290,
      textAlign:
        "center",
      color:
        Colors.textSecondary,
      lineHeight: 22,
    },

    exploreButton: {
      marginTop: 22,
      minHeight: 50,
      borderRadius: 15,
      backgroundColor:
        Colors.navy,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 22,
    },

    exploreButtonText: {
      color:
        "#FFFFFF",
      fontSize: 13,
      fontWeight:
        "900",
    },
  });