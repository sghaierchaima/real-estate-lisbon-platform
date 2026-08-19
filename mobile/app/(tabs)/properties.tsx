import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  getAssetUrl,
} from "@/lib/api";
import { useEffect, useState } from "react";

import { router } from "expo-router";

import {
  BedDouble,
  Bath,
  MapPin,
  Maximize,
  Building2
} from "lucide-react-native";

import {
  getPublicProperties,
} from "@/lib/properties-api";

import type {
  Property,
} from "@/types/property";

import { Colors } from "@/constants/colors";

export default function PropertiesScreen() {
  const [properties, setProperties] =
    useState<Property[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getPublicProperties();

        setProperties(
          Array.isArray(data)
            ? data
            : [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load properties.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProperties();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
          color={Colors.navy}
        />

        <Text style={styles.loadingText}>
          Loading properties...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <FlatList
        data={properties}
        keyExtractor={(item) =>
          item.id
        }
        contentContainerStyle={
          styles.list
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>
              PROPERTY MARKET
            </Text>

            <Text style={styles.title}>
              Properties
            </Text>

            <Text style={styles.subtitle}>
              Explore published properties
              available across Portugal.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              No properties available
            </Text>

            <Text style={styles.emptyText}>
              New published listings will
              appear here automatically.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
          />
        )}
      />
    </SafeAreaView>
  );
}

function PropertyCard({
  property,
}: {
  property: Property;
}) {
  const image =
  getAssetUrl(
    property.imageUrls?.[0],
  );

  const location = [
    property.city,
    property.region,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push(
          `/properties/${property.id}`,
        )
      }
    >
      <View style={styles.imageWrapper}>
        {image ? (
  <Image
    source={{ uri: image }}
    style={styles.image}
    resizeMode="cover"
    onError={(event) => {
      console.log(
        "PROPERTY IMAGE ERROR:",
        property.id,
        image,
        event.nativeEvent,
      );
    }}
  />
) : (
  <View style={styles.imagePlaceholder}>
    <Building2
      size={44}
      color={Colors.muted}
    />

    <Text style={styles.placeholderText}>
      No image available
    </Text>
  </View>
)}

        {property.featured && (
          <View style={styles.featured}>
            <Text
              style={
                styles.featuredText
              }
            >
              Featured
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text
          style={styles.propertyTitle}
          numberOfLines={2}
        >
          {property.title}
        </Text>

        <View style={styles.locationRow}>
          <MapPin
            size={16}
            color={
              Colors.textSecondary
            }
          />

          <Text
            style={styles.location}
            numberOfLines={1}
          >
            {location ||
              property.location ||
              "Portugal"}
          </Text>
        </View>

        <Text style={styles.price}>
          €
          {Number(
            property.price || 0,
          ).toLocaleString()}
        </Text>

        <View style={styles.specs}>
          <View style={styles.spec}>
            <BedDouble
              size={17}
              color={
                Colors.textSecondary
              }
            />

            <Text style={styles.specText}>
              {property.bedrooms ??
                "—"}
            </Text>
          </View>

          <View style={styles.spec}>
            <Bath
              size={17}
              color={
                Colors.textSecondary
              }
            />

            <Text style={styles.specText}>
              {property.bathrooms ??
                "—"}
            </Text>
          </View>

          <View style={styles.spec}>
            <Maximize
              size={17}
              color={
                Colors.textSecondary
              }
            />

            <Text style={styles.specText}>
              {property.area
                ? `${property.area} m²`
                : "—"}
            </Text>
          </View>
        </View>
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
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        Colors.background,
    },

    loadingText: {
      marginTop: 12,
      color:
        Colors.textSecondary,
    },

    list: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 30,
    },

    header: {
      marginBottom: 24,
    },

    eyebrow: {
      color: Colors.gold,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1.4,
    },

    title: {
      marginTop: 8,
      color: Colors.navyDark,
      fontSize: 34,
      fontWeight: "800",
    },

    subtitle: {
      marginTop: 8,
      maxWidth: 320,
      color:
        Colors.textSecondary,
      fontSize: 16,
      lineHeight: 25,
    },

    errorBox: {
      marginTop: 18,
      borderRadius: 16,
      padding: 14,
      backgroundColor:
        "#FEF2F2",
    },

    errorText: {
      color: Colors.error,
      fontSize: 14,
      lineHeight: 21,
    },

    card: {
      marginBottom: 20,
      overflow: "hidden",
      borderRadius: 24,
      backgroundColor:
        Colors.white,
      borderWidth: 1,
      borderColor:
        Colors.border,
    },

    imageWrapper: {
      position: "relative",
      height: 230,
      backgroundColor:
        "#EEF1F5",
    },

    image: {
      width: "100%",
      height: "100%",
    },

    imagePlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    featured: {
      position: "absolute",
      left: 14,
      top: 14,
      borderRadius: 999,
      backgroundColor:
        Colors.gold,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },

    featuredText: {
      color: Colors.white,
      fontSize: 12,
      fontWeight: "800",
    },

    cardContent: {
      padding: 18,
    },

    propertyTitle: {
      color: Colors.navyDark,
      fontSize: 20,
      lineHeight: 27,
      fontWeight: "800",
    },

    locationRow: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    location: {
      flex: 1,
      color:
        Colors.textSecondary,
      fontSize: 14,
    },

    price: {
      marginTop: 16,
      color: Colors.navy,
      fontSize: 26,
      fontWeight: "800",
    },

    specs: {
      marginTop: 16,
      flexDirection: "row",
      gap: 18,
      borderTopWidth: 1,
      borderTopColor:
        Colors.border,
      paddingTop: 15,
    },

    spec: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    specText: {
      color:
        Colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },

    empty: {
      marginTop: 40,
      alignItems: "center",
      padding: 30,
    },

    emptyTitle: {
      color: Colors.navyDark,
      fontSize: 20,
      fontWeight: "800",
    },

    emptyText: {
      marginTop: 10,
      textAlign: "center",
      color:
        Colors.textSecondary,
      lineHeight: 23,
    },
    placeholderText: {
  marginTop: 8,
  color: Colors.muted,
  fontSize: 13,
},
  });