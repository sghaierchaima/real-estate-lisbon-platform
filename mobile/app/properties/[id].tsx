import {
    ActivityIndicator,
    Dimensions,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Alert,
} from "react-native";

import {
    SafeAreaView,
} from "react-native-safe-area-context";

import {
    router,
    useLocalSearchParams,
} from "expo-router";

import {
    ArrowLeft,
    Bath,
    BedDouble,
    Building2,
    CheckCircle2,
    Heart,
    MapPin,
    Maximize,
} from "lucide-react-native";

import {
    useEffect,
    useState,
} from "react";

import {
    getPublicProperty,
} from "@/lib/properties-api";

import {
    getAssetUrl,
} from "@/lib/api";

import {
    getToken,
    getStoredUser,
} from "@/lib/session";

import {
    getSavedPropertyStatus,
    toggleSavedProperty,
} from "@/lib/saved-properties-api";

import type {
    Property,
} from "@/types/property";

import type {
    AuthUser,
} from "@/types/auth";

import {
    Colors,
} from "@/constants/colors";

const SCREEN_WIDTH =
    Dimensions.get("window").width;

export default function PropertyDetailScreen() {
    const params =
        useLocalSearchParams<{
            id?: string | string[];
        }>();

    const propertyId =
        Array.isArray(params.id)
            ? params.id[0]
            : params.id;

    const [property, setProperty] =
        useState<Property | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [saved, setSaved] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [isBuyer, setIsBuyer] =
        useState(false);
    const [activeImageIndex, setActiveImageIndex] =
        useState(0);

    useEffect(() => {
        if (!propertyId) {
            setError("Property id is missing.");
            setLoading(false);
            return;
        }

        async function loadPage() {
            try {
                setLoading(true);
                setError("");

                const propertyData =
                    await getPublicProperty(
                        propertyId!,
                    );

                setProperty(propertyData);

                const token =
                    await getToken();

                const user =
                    await getStoredUser<AuthUser>();

                const buyer =
                    Boolean(token) &&
                    user?.role === "BUYER";

                setIsBuyer(buyer);

                if (buyer && token) {
                    try {
                        const status =
                            await getSavedPropertyStatus(
                                token,
                                propertyId!,
                            );

                        setSaved(status.isSaved);
                    } catch {
                        setSaved(false);
                    }
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load property.",
                );
            } finally {
                setLoading(false);
            }
        }

        void loadPage();
    }, [propertyId]);

    async function handleToggleSave() {
  if (!propertyId || saving) {
    return;
  }

  const token = await getToken();
  const user =
    await getStoredUser<AuthUser>();

  if (!token || !user) {
    Alert.alert(
      "Login required",
      "Please sign in to save properties.",
    );
    return;
  }

  if (user.role !== "BUYER") {
    Alert.alert(
      "Buyer account required",
      "Only buyers can save properties.",
    );
    return;
  }

  try {
    setSaving(true);

    const result =
      await toggleSavedProperty(
        token,
        propertyId,
      );

    setSaved(result.isSaved);

    console.log(
      "SAVED PROPERTY:",
      result,
    );
  } catch (error) {
    Alert.alert(
      "Unable to update saved property",
      error instanceof Error
        ? error.message
        : "Please try again.",
    );
  } finally {
    setSaving(false);
  }
}

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
                    Loading property...
                </Text>
            </SafeAreaView>
        );
    }

    if (!property || error) {
        return (
            <SafeAreaView
                style={styles.center}
            >
                <Building2
                    size={48}
                    color={Colors.muted}
                />

                <Text style={styles.errorTitle}>
                    Property unavailable
                </Text>

                <Text style={styles.errorText}>
                    {error ||
                        "This property could not be found."}
                </Text>

                <Pressable
                    style={styles.errorButton}
                    onPress={() =>
                        router.back()
                    }
                >
                    <Text
                        style={
                            styles.errorButtonText
                        }
                    >
                        Go Back
                    </Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const images =
        property.imageUrls
            ?.map((item) =>
                getAssetUrl(item),
            )
            .filter(
                (
                    item,
                ): item is string =>
                    Boolean(item),
            ) || [];
    console.log(
        "PROPERTY IMAGES:",
        property.imageUrls,
    );

    console.log(
        "FORMATTED IMAGES:",
        images,
    );

    const location = [
        property.city,
        property.region,
        property.location,
    ]
        .filter(Boolean)
        .join(", ");

    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={["top"]}
        >
            <ScrollView
                showsVerticalScrollIndicator={
                    false
                }
            >
                <View style={styles.hero}>
                    {images.length > 0 ? (
                        <>
                            <ScrollView
                                horizontal
                                pagingEnabled
                                decelerationRate="fast"
                                snapToInterval={SCREEN_WIDTH}
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={(
                                    event: NativeSyntheticEvent<NativeScrollEvent>,
                                ) => {
                                    const index = Math.round(
                                        event.nativeEvent.contentOffset.x /
                                        SCREEN_WIDTH,
                                    );

                                    setActiveImageIndex(index);
                                }}
                            >
                                {images.map((image, index) => (
                                    <Image
                                        key={`${image}-${index}`}
                                        source={{ uri: image }}
                                        style={styles.heroImage}
                                        resizeMode="cover"
                                        onError={(event) => {
                                            console.log(
                                                `IMAGE ${index + 1} ERROR:`,
                                                image,
                                                event.nativeEvent,
                                            );
                                        }}
                                    />
                                ))}
                            </ScrollView>

                            {images.length > 1 && (
                                <>
                                    <View style={styles.imageCounter}>
                                        <Text style={styles.imageCounterText}>
                                            {activeImageIndex + 1} /{" "}
                                            {images.length}
                                        </Text>
                                    </View>

                                    <View style={styles.dotsContainer}>
                                        {images.map((_, index) => (
                                            <View
                                                key={index}
                                                style={[
                                                    styles.dot,
                                                    index ===
                                                    activeImageIndex &&
                                                    styles.activeDot,
                                                ]}
                                            />
                                        ))}
                                    </View>
                                </>
                            )}
                        </>
                    ) : (
                        <View style={styles.heroPlaceholder}>
                            <Building2
                                size={70}
                                color={Colors.muted}
                            />

                            <Text style={styles.heroPlaceholderText}>
                                No property image
                            </Text>
                        </View>
                    )}
                    <View
                        style={
                            styles.heroPlaceholder
                        }
                    >
                        <Building2
                            size={70}
                            color={Colors.muted}
                        />

                        <Text
                            style={
                                styles.heroPlaceholderText
                            }
                        >
                            No property image
                        </Text>
                    </View>


                    <Pressable
                        style={styles.backButton}
                        onPress={() =>
                            router.back()
                        }
                    >
                        <ArrowLeft
                            size={23}
                            color={Colors.navyDark}
                        />
                    </Pressable>

                    {isBuyer && (
                        <Pressable
                            style={
                                styles.favoriteButton
                            }
                            disabled={saving}
                            onPress={
                                handleToggleSave
                            }
                        >
                            <Pressable
                                style={[
                                    styles.favoriteButton,

                                    saved && {
                                        backgroundColor:
                                            "rgba(254,242,242,0.96)",
                                    },
                                ]}
                                disabled={saving}
                                onPress={handleToggleSave}
                            >
                                {saving ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#DC2626"
                                    />
                                ) : (
                                    <Heart
                                        size={24}
                                        strokeWidth={2.4}
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
                        </Pressable>
                    )}

                    {property.featured && (
                        <View
                            style={
                                styles.featuredBadge
                            }
                        >
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

                <View style={styles.content}>
                    <Text style={styles.type}>
                        {property.propertyType
                            ?.replaceAll(
                                "_",
                                " ",
                            ) ||
                            "PROPERTY"}
                    </Text>

                    <Text style={styles.title}>
                        {property.title}
                    </Text>

                    <View
                        style={
                            styles.locationRow
                        }
                    >
                        <MapPin
                            size={18}
                            color={
                                Colors.textSecondary
                            }
                        />

                        <Text
                            style={styles.location}
                        >
                            {location ||
                                "Portugal"}
                        </Text>
                    </View>

                    <Text style={styles.price}>
                        €
                        {Number(
                            property.price ||
                            0,
                        ).toLocaleString()}
                    </Text>

                    <View style={styles.specs}>
                        <SpecBox
                            icon={
                                <BedDouble
                                    size={21}
                                    color={Colors.navy}
                                />
                            }
                            value={
                                property.bedrooms ??
                                "—"
                            }
                            label="Bedrooms"
                        />

                        <SpecBox
                            icon={
                                <Bath
                                    size={21}
                                    color={Colors.navy}
                                />
                            }
                            value={
                                property.bathrooms ??
                                "—"
                            }
                            label="Bathrooms"
                        />

                        <SpecBox
                            icon={
                                <Maximize
                                    size={21}
                                    color={Colors.navy}
                                />
                            }
                            value={
                                property.area ??
                                "—"
                            }
                            label="m²"
                        />
                    </View>

                    {property.description ? (
                        <View style={styles.section}>
                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                About this property
                            </Text>

                            <Text
                                style={
                                    styles.description
                                }
                            >
                                {
                                    property.description
                                }
                            </Text>
                        </View>
                    ) : null}

                    {property.equipments
                        ?.length > 0 && (
                            <View style={styles.section}>
                                <Text
                                    style={
                                        styles.sectionTitle
                                    }
                                >
                                    Features
                                </Text>

                                <View
                                    style={
                                        styles.features
                                    }
                                >
                                    {property.equipments.map(
                                        (
                                            equipment,
                                        ) => (
                                            <View
                                                key={
                                                    equipment
                                                }
                                                style={
                                                    styles.feature
                                                }
                                            >
                                                <CheckCircle2
                                                    size={17}
                                                    color={
                                                        Colors.success
                                                    }
                                                />

                                                <Text
                                                    style={
                                                        styles.featureText
                                                    }
                                                >
                                                    {equipment}
                                                </Text>
                                            </View>
                                        ),
                                    )}
                                </View>
                            </View>
                        )}

                    <View style={styles.section}>
                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Property information
                        </Text>

                        <DetailRow
                            label="Property type"
                            value={
                                property.propertyType ||
                                "Not specified"
                            }
                        />

                        <DetailRow
                            label="City"
                            value={
                                property.city ||
                                "Not specified"
                            }
                        />

                        <DetailRow
                            label="Region"
                            value={
                                property.region ||
                                "Not specified"
                            }
                        />

                        <DetailRow
                            label="Land area"
                            value={
                                property.landArea
                                    ? `${property.landArea} m²`
                                    : "Not specified"
                            }
                        />

                        <DetailRow
                            label="Construction year"
                            value={
                                property.constructionYear
                                    ? String(
                                        property.constructionYear,
                                    )
                                    : "Not specified"
                            }
                        />
                    </View>

                    <Pressable
                        style={
                            styles.contactButton
                        }
                        onPress={() => {
                            Alert.alert(
                                "Next step",
                                "We will connect this button to the real property-agent chat workflow next.",
                            );
                        }}
                    >
                        <Text
                            style={
                                styles.contactButtonText
                            }
                        >
                            Contact Property Agent
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function SpecBox({
    icon,
    value,
    label,
}: {
    icon: React.ReactNode;
    value: string | number;
    label: string;
}) {
    return (
        <View style={styles.specBox}>
            {icon}

            <Text style={styles.specValue}>
                {value}
            </Text>

            <Text style={styles.specLabel}>
                {label}
            </Text>
        </View>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
                {label}
            </Text>

            <Text style={styles.detailValue}>
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
                Colors.background,
        },

        center: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 30,
            backgroundColor:
                Colors.background,
        },

        loadingText: {
            marginTop: 12,
            color:
                Colors.textSecondary,
        },

        errorTitle: {
            marginTop: 16,
            color: Colors.navyDark,
            fontSize: 24,
            fontWeight: "800",
        },

        errorText: {
            marginTop: 10,
            textAlign: "center",
            color:
                Colors.textSecondary,
            lineHeight: 23,
        },

        errorButton: {
            marginTop: 24,
            borderRadius: 16,
            backgroundColor:
                Colors.navy,
            paddingHorizontal: 24,
            paddingVertical: 14,
        },

        errorButtonText: {
            color: Colors.white,
            fontWeight: "800",
        },

        hero: {
            height: 330,
            position: "relative",
            backgroundColor:
                "#EEF1F5",
        },

        heroImage: {
            width: SCREEN_WIDTH,
            height: 330,
        },

        heroPlaceholder: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
        },

        heroPlaceholderText: {
            marginTop: 10,
            color: Colors.muted,
        },

        backButton: {
            position: "absolute",
            top: 16,
            left: 18,
            width: 46,
            height: 46,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
                "rgba(255,255,255,0.94)",
        },

        favoriteButton: {
            position: "absolute",
            top: 16,
            right: 18,
            width: 46,
            height: 46,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
                "rgba(255,255,255,0.94)",
        },

        featuredBadge: {
            position: "absolute",
            bottom: 16,
            left: 18,
            borderRadius: 999,
            backgroundColor:
                Colors.gold,
            paddingHorizontal: 14,
            paddingVertical: 7,
        },

        featuredText: {
            color: Colors.white,
            fontSize: 12,
            fontWeight: "800",
        },

        content: {
            paddingHorizontal: 22,
            paddingTop: 26,
            paddingBottom: 50,
        },

        type: {
            color: Colors.gold,
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 1.3,
            textTransform:
                "uppercase",
        },

        title: {
            marginTop: 10,
            color: Colors.navyDark,
            fontSize: 30,
            lineHeight: 38,
            fontWeight: "800",
        },

        locationRow: {
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
        },

        location: {
            flex: 1,
            color:
                Colors.textSecondary,
            fontSize: 15,
            lineHeight: 22,
        },

        price: {
            marginTop: 20,
            color: Colors.navy,
            fontSize: 34,
            fontWeight: "800",
        },

        specs: {
            marginTop: 24,
            flexDirection: "row",
            gap: 10,
        },

        specBox: {
            flex: 1,
            minHeight: 105,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor:
                Colors.border,
            borderRadius: 18,
            backgroundColor:
                Colors.white,
        },

        specValue: {
            marginTop: 7,
            color: Colors.navyDark,
            fontSize: 18,
            fontWeight: "800",
        },

        specLabel: {
            marginTop: 3,
            color:
                Colors.textSecondary,
            fontSize: 11,
        },

        section: {
            marginTop: 30,
        },

        sectionTitle: {
            color: Colors.navyDark,
            fontSize: 20,
            fontWeight: "800",
        },

        description: {
            marginTop: 12,
            color:
                Colors.textSecondary,
            fontSize: 15,
            lineHeight: 25,
        },

        features: {
            marginTop: 14,
            gap: 10,
        },

        feature: {
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            borderRadius: 14,
            backgroundColor:
                Colors.white,
            padding: 13,
        },

        featureText: {
            flex: 1,
            color: Colors.text,
            fontSize: 14,
        },

        detailRow: {
            minHeight: 52,
            flexDirection: "row",
            alignItems: "center",
            justifyContent:
                "space-between",
            gap: 15,
            borderBottomWidth: 1,
            borderBottomColor:
                Colors.border,
        },

        detailLabel: {
            color:
                Colors.textSecondary,
            fontSize: 14,
        },

        detailValue: {
            flex: 1,
            textAlign: "right",
            color: Colors.navyDark,
            fontSize: 14,
            fontWeight: "700",
        },

        contactButton: {
            marginTop: 34,
            height: 58,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
                Colors.navy,
        },

        contactButtonText: {
            color: Colors.white,
            fontSize: 16,
            fontWeight: "800",
        },
        imageCounter: {
            position: "absolute",
            right: 18,
            bottom: 18,

            borderRadius: 999,

            backgroundColor:
                "rgba(15,35,64,0.78)",

            paddingHorizontal: 12,
            paddingVertical: 7,
        },

        imageCounterText: {
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: "800",
        },

        dotsContainer: {
            position: "absolute",

            bottom: 20,
            left: 0,
            right: 0,

            flexDirection: "row",
            justifyContent: "center",

            gap: 6,
        },

        dot: {
            width: 7,
            height: 7,

            borderRadius: 999,

            backgroundColor:
                "rgba(255,255,255,0.55)",
        },

        activeDot: {
            width: 22,

            backgroundColor:
                "#FFFFFF",
        },
    });