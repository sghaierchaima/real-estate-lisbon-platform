import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    router,
    useLocalSearchParams,
    type Href,
} from "expo-router";
import {
    SafeAreaView,
} from "react-native-safe-area-context";

import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock3,
    ImageOff,
    MapPin,
    Wrench,
} from "lucide-react-native";



import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getPublicStory,
    type Story,
} from "@/lib/stories-api";

import {
    getAssetUrl,
} from "@/lib/api";

import {
    Colors,
} from "@/constants/colors";

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

export default function StoryDetailScreen() {
    const {
        id,
    } =
        useLocalSearchParams<{
            id: string;
        }>();

    const storyId =
        Array.isArray(id)
            ? id[0]
            : id;

    const [
        story,
        setStory,
    ] =
        useState<Story | null>(
            null,
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    useEffect(() => {
        async function load() {
            if (!storyId) {
                setLoading(
                    false,
                );

                return;
            }

            try {
                const data =
                    await getPublicStory(
                        storyId,
                    );

                setStory(
                    data,
                );
            } catch {
                setStory(
                    null,
                );
            } finally {
                setLoading(
                    false,
                );
            }
        }

        void load();
    }, [
        storyId,
    ]);

    const image =
        useMemo(
            () =>
                getAssetUrl(
                    story?.imageUrl,
                ),
            [
                story?.imageUrl,
            ],
        );

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
            </SafeAreaView>
        );
    }

    if (!story) {
        return (
            <SafeAreaView
                style={
                    styles.center
                }
            >
                <Text
                    style={
                        styles.notFoundTitle
                    }
                >
                    Story not found
                </Text>

                <Pressable
                    onPress={() =>
                        router.replace(
                            "/stories" as Href,
                        )
                    }
                    style={
                        styles.primaryButton
                    }
                >
                    <Text
                        style={
                            styles.primaryButtonText
                        }
                    >
                        Back to Stories
                    </Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const paragraphs =
        (
            story.content ||
            "No content available yet."
        )
            .split("\n")
            .map(
                (item) =>
                    item.trim(),
            )
            .filter(Boolean);

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

                    <Text
                        style={
                            styles.backText
                        }
                    >
                        Stories
                    </Text>
                </Pressable>

                <View
                    style={
                        styles.hero
                    }
                >
                    {image ? (
                        <Image
                            source={{
                                uri:
                                    image,
                            }}
                            style={
                                styles.heroImage
                            }
                        />
                    ) : (
                        <View
                            style={
                                styles.heroFallback
                            }
                        >
                            <ImageOff
                                size={40}
                                color={
                                    Colors.navy
                                }
                            />
                        </View>
                    )}

                    <View
                        style={
                            styles.overlay
                        }
                    />

                    <View
                        style={
                            styles.storyBadge
                        }
                    >
                        <Text
                            style={
                                styles.storyBadgeText
                            }
                        >
                            SUCCESS STORY
                        </Text>
                    </View>

                    <View
                        style={
                            styles.heroContent
                        }
                    >
                        <Text
                            style={
                                styles.heroTitle
                            }
                        >
                            {
                                story.title
                            }
                        </Text>

                        <View
                            style={
                                styles.heroMeta
                            }
                        >
                            <Meta
                                icon={
                                    Calendar
                                }
                                text={new Date(
                                    story.createdAt,
                                ).toLocaleDateString()}
                            />

                            <Meta
                                icon={
                                    Clock3
                                }
                                text={`${readingTime(
                                    story.content,
                                )} min read`}
                            />

                            <Meta
                                icon={
                                    MapPin
                                }
                                text={
                                    story.location ||
                                    "Portugal"
                                }
                            />
                        </View>
                    </View>
                </View>

                <View
                    style={
                        styles.authorCard
                    }
                >
                    <View
                        style={
                            styles.authorAvatar
                        }
                    >
                        <Text
                            style={
                                styles.authorAvatarText
                            }
                        >
                            {(
                                story.author ||
                                "V"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </Text>
                    </View>

                    <View
                        style={{
                            flex: 1,
                        }}
                    >
                        <Text
                            style={
                                styles.authorName
                            }
                        >
                            {story.author ||
                                "Verified Buyer"}
                        </Text>

                        <Text
                            style={
                                styles.authorLocation
                            }
                        >
                            {story.location ||
                                "Portugal"}
                        </Text>
                    </View>

                    {story.isVerified ? (
                        <Text
                            style={
                                styles.verified
                            }
                        >
                            Verified
                        </Text>
                    ) : null}
                </View>

                {story.excerpt ? (
                    <Text
                        style={
                            styles.excerpt
                        }
                    >
                        {
                            story.excerpt
                        }
                    </Text>
                ) : null}

                <View
                    style={
                        styles.article
                    }
                >
                    {paragraphs.map(
                        (
                            paragraph,
                            index,
                        ) => (
                            <Text
                                key={`${index}-${paragraph.slice(
                                    0,
                                    12,
                                )}`}
                                style={
                                    styles.paragraph
                                }
                            >
                                {
                                    paragraph
                                }
                            </Text>
                        ),
                    )}
                </View>

                <View
                    style={
                        styles.takeaway
                    }
                >
                    <CheckCircle
                        size={23}
                        color="#16A34A"
                    />

                    <View
                        style={{
                            flex: 1,
                        }}
                    >
                        <Text
                            style={
                                styles.takeawayTitle
                            }
                        >
                            Key Takeaway
                        </Text>

                        <Text
                            style={
                                styles.takeawayText
                            }
                        >
                            This story helps buyers understand real decision points, expected timeline, and practical challenges when purchasing property in Portugal.
                        </Text>
                    </View>
                </View>

                <View
                    style={
                        styles.cta
                    }
                >
                    <Wrench
                        size={28}
                        color={
                            Colors.gold
                        }
                    />

                    <Text
                        style={
                            styles.ctaTitle
                        }
                    >
                        Ready to Start Your Own Success Story?
                    </Text>

                    <Text
                        style={
                            styles.ctaText
                        }
                    >
                        Use our tools to compare neighborhoods, estimate costs, and connect with verified professionals.
                    </Text>

                    <Pressable
                        onPress={() =>
                            router.push(
                                "/tools",
                            )
                        }
                        style={
                            styles.goldButton
                        }
                    >
                        <Text
                            style={
                                styles.goldButtonText
                            }
                        >
                            Start with Smart Tools
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() =>
                            router.push(
                                "/(tabs)/properties",
                            )
                        }
                        style={
                            styles.outlineButton
                        }
                    >
                        <Text
                            style={
                                styles.outlineButtonText
                            }
                        >
                            Browse Properties
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function Meta({
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
                styles.meta
            }
        >
            <Icon
                size={13}
                color="rgba(255,255,255,0.86)"
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
            paddingHorizontal:
                24,
            backgroundColor:
                Colors.background,
        },

        notFoundTitle: {
            color:
                Colors.navyDark,
            fontSize: 25,
            fontWeight:
                "800",
        },

        primaryButton: {
            marginTop: 18,
            minHeight: 50,
            borderRadius: 15,
            backgroundColor:
                Colors.navy,
            alignItems:
                "center",
            justifyContent:
                "center",
            paddingHorizontal: 20,
        },

        primaryButtonText: {
            color:
                Colors.white,
            fontWeight:
                "800",
        },

        content: {
            paddingHorizontal:
                20,
            paddingTop: 12,
            paddingBottom: 44,
        },

        backButton: {
            alignSelf:
                "flex-start",
            minHeight: 44,
            borderRadius: 14,
            borderWidth: 1,
            borderColor:
                Colors.border,
            backgroundColor:
                Colors.white,
            flexDirection:
                "row",
            alignItems:
                "center",
            gap: 7,
            paddingHorizontal: 13,
        },

        backText: {
            color:
                Colors.navy,
            fontSize: 12,
            fontWeight:
                "800",
        },

        hero: {
            marginTop: 14,
            height: 390,
            borderRadius: 24,
            overflow:
                "hidden",
            backgroundColor:
                "#E8EEF5",
        },

        heroImage: {
            width:
                "100%",
            height:
                "100%",
        },

        heroFallback: {
            flex: 1,
            alignItems:
                "center",
            justifyContent:
                "center",
            backgroundColor:
                "#E8EEF5",
        },

        overlay: {
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor:
                "rgba(8,26,51,0.42)",
        },

        storyBadge: {
            position:
                "absolute",
            left: 16,
            top: 16,
            borderRadius: 999,
            backgroundColor:
                Colors.gold,
            paddingHorizontal: 12,
            paddingVertical: 7,
        },

        storyBadgeText: {
            color:
                Colors.white,
            fontSize: 9,
            fontWeight:
                "900",
            letterSpacing: 0.8,
        },

        heroContent: {
            position:
                "absolute",
            left: 18,
            right: 18,
            bottom: 18,
        },

        heroTitle: {
            color:
                Colors.white,
            fontSize: 28,
            lineHeight: 34,
            fontWeight:
                "800",
        },

        heroMeta: {
            marginTop: 12,
            flexDirection:
                "row",
            flexWrap:
                "wrap",
            gap: 10,
        },

        meta: {
            flexDirection:
                "row",
            alignItems:
                "center",
            gap: 5,
        },

        metaText: {
            color:
                "rgba(255,255,255,0.86)",
            fontSize: 10,
        },

        authorCard: {
            marginTop: 16,
            borderWidth: 1,
            borderColor:
                Colors.border,
            borderRadius: 20,
            backgroundColor:
                Colors.white,
            padding: 15,
            flexDirection:
                "row",
            alignItems:
                "center",
            gap: 11,
        },

        authorAvatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor:
                Colors.navy,
            borderWidth: 2,
            borderColor:
                Colors.gold,
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        authorAvatarText: {
            color:
                Colors.white,
            fontSize: 17,
            fontWeight:
                "900",
        },

        authorName: {
            color:
                Colors.navyDark,
            fontSize: 14,
            fontWeight:
                "800",
        },

        authorLocation: {
            marginTop: 3,
            color:
                Colors.textSecondary,
            fontSize: 11,
        },

        verified: {
            color:
                Colors.gold,
            fontSize: 10,
            fontWeight:
                "800",
        },

        excerpt: {
            marginTop: 19,
            color:
                Colors.textSecondary,
            fontSize: 16,
            lineHeight: 26,
            fontWeight:
                "500",
        },

        article: {
            marginTop: 18,
            borderWidth: 1,
            borderColor:
                Colors.border,
            borderRadius: 22,
            backgroundColor:
                Colors.white,
            padding: 18,
        },

        paragraph: {
            marginBottom: 14,
            color:
                "#475467",
            fontSize: 15,
            lineHeight: 25,
        },

        takeaway: {
            marginTop: 17,
            flexDirection:
                "row",
            gap: 11,
            borderLeftWidth: 4,
            borderLeftColor:
                "#16A34A",
            borderRadius: 18,
            backgroundColor:
                "#F0FDF4",
            padding: 17,
        },

        takeawayTitle: {
            color:
                Colors.navyDark,
            fontSize: 16,
            fontWeight:
                "800",
        },

        takeawayText: {
            marginTop: 5,
            color:
                Colors.textSecondary,
            fontSize: 13,
            lineHeight: 20,
        },

        cta: {
            marginTop: 18,
            borderRadius: 24,
            backgroundColor:
                Colors.navyDark,
            padding: 20,
            alignItems:
                "center",
        },

        ctaTitle: {
            marginTop: 11,
            color:
                Colors.white,
            fontSize: 21,
            lineHeight: 27,
            fontWeight:
                "800",
            textAlign:
                "center",
        },

        ctaText: {
            marginTop: 9,
            color:
                "rgba(255,255,255,0.75)",
            fontSize: 13,
            lineHeight: 20,
            textAlign:
                "center",
        },

        goldButton: {
            marginTop: 17,
            width:
                "100%",
            minHeight: 50,
            borderRadius: 15,
            backgroundColor:
                Colors.gold,
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        goldButtonText: {
            color:
                Colors.navyDark,
            fontSize: 13,
            fontWeight:
                "800",
        },

        outlineButton: {
            marginTop: 9,
            width:
                "100%",
            minHeight: 48,
            borderRadius: 15,
            borderWidth: 1,
            borderColor:
                "rgba(255,255,255,0.55)",
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        outlineButtonText: {
            color:
                Colors.white,
            fontSize: 13,
            fontWeight:
                "800",
        },
    });
