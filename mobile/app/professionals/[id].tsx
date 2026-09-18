import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ChevronRight,
  Globe2,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Scale,
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
  getAssetUrl,
} from "@/lib/api";

import {
  getPublicProfessional,
  type Professional,
  type ProfessionalType,
} from "@/lib/professionals-api";

import {
  Colors,
} from "@/constants/colors";

/* ============================================================
   HELPERS
============================================================ */

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

  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length >= 2
  ) {
    return `${parts[0][0]}${parts[1][0]}`
      .toUpperCase();
  }

  return parts[0][0]
    .toUpperCase();
}

/* ============================================================
   SCREEN
============================================================ */

export default function ProfessionalDetailsScreen() {
  const {
    id,
  } =
    useLocalSearchParams<{
      id: string;
    }>();

  const professionalId =
    Array.isArray(id)
      ? id[0]
      : id;

  const [
    professional,
    setProfessional,
  ] =
    useState<Professional | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    async function loadProfessional() {
      if (
        !professionalId
      ) {
        setError(
          "Professional ID is missing.",
        );

        setLoading(
          false,
        );

        return;
      }

      try {
        setLoading(
          true,
        );

        setError(
          "",
        );

        const data =
          await getPublicProfessional(
            professionalId,
          );

        setProfessional(
          data,
        );
      } catch (
        err
      ) {
        setProfessional(
          null,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load professional profile.",
        );
      } finally {
        setLoading(
          false,
        );
      }
    }

    void loadProfessional();
  }, [
    professionalId,
  ]);

  const avatar =
    useMemo(
      () =>
        getAssetUrl(
          professional
            ?.user
            ?.avatarUrl,
        ),
      [
        professional
          ?.user
          ?.avatarUrl,
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

        <Text
          style={
            styles.loadingText
          }
        >
          Loading professional profile...
        </Text>
      </SafeAreaView>
    );
  }

  if (
    !professional ||
    error
  ) {
    return (
      <SafeAreaView
        style={
          styles.center
        }
      >
        <Text
          style={
            styles.errorTitle
          }
        >
          Professional unavailable
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          {error ||
            "This professional is not available."}
        </Text>

        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.backPrimary
          }
        >
          <Text
            style={
              styles.backPrimaryText
            }
          >
            Go back
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const currentProfessional =
    professional;

  const name =
    currentProfessional.user
      ?.fullName ||
    "Verified Professional";

  const role =
    formatProfessionalType(
      currentProfessional
        .professionalType,
    );

  const location = [
    currentProfessional.user
      ?.city,

    currentProfessional.user
      ?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const TypeIcon =
    currentProfessional
      .professionalType ===
    "MORTGAGE_BROKER"
      ? Landmark
      : currentProfessional
            .professionalType ===
          "PROPERTY_LAWYER"
        ? Scale
        : Building2;

  async function openEmail() {
    const email =
      currentProfessional.user
        ?.email;

    if (!email) {
      return;
    }

    try {
      await Linking.openURL(
        `mailto:${email}`,
      );
    } catch {
      // No compatible mail application.
    }
  }

  async function openPhone() {
    const phone =
      currentProfessional.user
        ?.phone;

    if (!phone) {
      return;
    }

    try {
      await Linking.openURL(
        `tel:${phone}`,
      );
    } catch {
      // Phone action unavailable.
    }
  }

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
        </Pressable>

        <View
          style={
            styles.hero
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
              styles.verifiedBadge
            }
          >
            <BadgeCheck
              size={16}
              color="#15803D"
            />

            <Text
              style={
                styles.verifiedText
              }
            >
              Verified
            </Text>
          </View>

          <Text
            style={
              styles.name
            }
          >
            {name}
          </Text>

          <View
            style={
              styles.roleRow
            }
          >
            <TypeIcon
              size={17}
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
          >
            {currentProfessional
              .companyName ||
              "Independent Professional"}
          </Text>

          {location ? (
            <View
              style={
                styles.locationRow
              }
            >
              <MapPin
                size={16}
                color={
                  Colors.textSecondary
                }
              />

              <Text
                style={
                  styles.location
                }
              >
                {location}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={
            styles.statsGrid
          }
        >
          <StatCard
            icon={
              <Star
                size={19}
                color="#D4A91F"
                fill="#D4A91F"
              />
            }
            label="Rating"
            value={Number(
              currentProfessional
                .rating ||
                0,
            ).toFixed(1)}
          />

          <StatCard
            icon={
              <MessageCircle
                size={19}
                color={
                  Colors.navy
                }
              />
            }
            label="Reviews"
            value={String(
              Number(
                currentProfessional
                  .reviewsCount ||
                  0,
              ),
            )}
          />

          <StatCard
            icon={
              <Users
                size={19}
                color="#15803D"
              />
            }
            label="Clients"
            value={String(
              Number(
                currentProfessional
                  .clientsCount ||
                  0,
              ),
            )}
          />
        </View>

        <Pressable
          onPress={() =>
            router.push(
              `/reviews/${currentProfessional.id}` as Href,
            )
          }
          style={({ pressed }) => [
            styles.reviewsButton,

            pressed &&
              styles.pressed,
          ]}
        >
          <View
            style={
              styles.reviewsButtonIcon
            }
          >
            <MessageCircle
              size={20}
              color={
                Colors.navy
              }
            />
          </View>

          <View
            style={
              styles.reviewsButtonContent
            }
          >
            <Text
              style={
                styles.reviewsButtonTitle
              }
            >
              Buyer Reviews
            </Text>

            <View
              style={
                styles.reviewsSummary
              }
            >
              <Star
                size={14}
                color="#D4A91F"
                fill="#D4A91F"
              />

              <Text
                style={
                  styles.reviewsButtonSubtitle
                }
              >
                {Number(
                  currentProfessional
                    .rating ||
                    0,
                ).toFixed(1)}
                {" · "}
                {Number(
                  currentProfessional
                    .reviewsCount ||
                    0,
                )}{" "}
                reviews
              </Text>
            </View>
          </View>

          <ChevronRight
            size={19}
            color="#98A2B3"
          />
        </Pressable>

        {currentProfessional
          .languages
          ?.length ? (
          <View
            style={
              styles.section
            }
          >
            <View
              style={
                styles.sectionTitleRow
              }
            >
              <Globe2
                size={20}
                color={
                  Colors.navy
                }
              />

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Languages
              </Text>
            </View>

            <View
              style={
                styles.languages
              }
            >
              {currentProfessional
                .languages
                .map(
                  (
                    language: string,
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
          </View>
        ) : null}

        <View
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            About
          </Text>

          <Text
            style={
              styles.aboutText
            }
          >
            {currentProfessional
              .bio ||
              `${name} is a verified ${role.toLowerCase()} available through the Real Estate Lisbon professional network.`}
          </Text>
        </View>

        <View
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Contact Information
          </Text>

          {currentProfessional
            .user
            ?.email ? (
            <Pressable
              onPress={() =>
                void openEmail()
              }
              style={
                styles.contactRow
              }
            >
              <View
                style={
                  styles.contactIcon
                }
              >
                <Mail
                  size={18}
                  color={
                    Colors.navy
                  }
                />
              </View>

              <View
                style={
                  styles.contactContent
                }
              >
                <Text
                  style={
                    styles.contactLabel
                  }
                >
                  Email
                </Text>

                <Text
                  style={
                    styles.contactValue
                  }
                >
                  {
                    currentProfessional
                      .user
                      .email
                  }
                </Text>
              </View>
            </Pressable>
          ) : null}

          {currentProfessional
            .user
            ?.phone ? (
            <Pressable
              onPress={() =>
                void openPhone()
              }
              style={
                styles.contactRow
              }
            >
              <View
                style={
                  styles.contactIcon
                }
              >
                <Phone
                  size={18}
                  color={
                    Colors.navy
                  }
                />
              </View>

              <View
                style={
                  styles.contactContent
                }
              >
                <Text
                  style={
                    styles.contactLabel
                  }
                >
                  Phone
                </Text>

                <Text
                  style={
                    styles.contactValue
                  }
                >
                  {
                    currentProfessional
                      .user
                      .phone
                  }
                </Text>
              </View>
            </Pressable>
          ) : null}
        </View>

        <View
          style={
            styles.matchCard
          }
        >
          <BadgeCheck
            size={24}
            color={
              Colors.gold
            }
          />

          <Text
            style={
              styles.matchTitle
            }
          >
            Work through Smart Matching
          </Text>

          <Text
            style={
              styles.matchText
            }
          >
            Create or review your buyer requests. When this professional matches one of your needs, continue through the assigned match and conversation.
          </Text>

          <Pressable
            onPress={() =>
              router.push(
                "/(tabs)/requests" as Href,
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
              View My Requests
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push(
                "/(tabs)/messages" as Href,
              )
            }
            style={
              styles.secondaryButton
            }
          >
            <MessageCircle
              size={18}
              color={
                Colors.navy
              }
            />

            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Open Messages
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon:
    React.ReactNode;

  label:
    string;

  value:
    string;
}) {
  return (
    <View
      style={
        styles.statCard
      }
    >
      {icon}

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
      marginTop:
        12,

      color:
        Colors.textSecondary,
    },

    errorTitle: {
      color:
        Colors.navyDark,

      fontSize:
        22,

      fontWeight:
        "800",
    },

    errorText: {
      marginTop:
        8,

      color:
        Colors.textSecondary,

      textAlign:
        "center",

      lineHeight:
        22,
    },

    backPrimary: {
      marginTop:
        20,

      borderRadius:
        14,

      backgroundColor:
        Colors.navy,

      paddingHorizontal:
        22,

      paddingVertical:
        13,
    },

    backPrimaryText: {
      color:
        Colors.white,

      fontWeight:
        "800",
    },

    content: {
      paddingHorizontal:
        20,

      paddingTop:
        14,

      paddingBottom:
        42,
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

    hero: {
      marginTop:
        18,

      alignItems:
        "center",

      borderRadius:
        28,

      backgroundColor:
        Colors.navyDark,

      paddingHorizontal:
        22,

      paddingTop:
        26,

      paddingBottom:
        28,
    },

    avatar: {
      width:
        104,

      height:
        104,

      borderRadius:
        52,

      overflow:
        "hidden",

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        Colors.navy,

      borderWidth:
        4,

      borderColor:
        "rgba(255, 255, 255, 0.14)",
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

      fontSize:
        30,

      fontWeight:
        "800",
    },

    verifiedBadge: {
      marginTop:
        14,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        6,

      borderRadius:
        999,

      backgroundColor:
        "#ECFDF3",

      paddingHorizontal:
        11,

      paddingVertical:
        6,
    },

    verifiedText: {
      color:
        "#166534",

      fontSize:
        11,

      fontWeight:
        "800",
    },

    name: {
      marginTop:
        13,

      color:
        Colors.white,

      fontSize:
        27,

      lineHeight:
        34,

      fontWeight:
        "800",

      textAlign:
        "center",
    },

    roleRow: {
      marginTop:
        8,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        7,
    },

    role: {
      color:
        "#E5C766",

      fontSize:
        14,

      fontWeight:
        "800",
    },

    company: {
      marginTop:
        7,

      color:
        "rgba(255, 255, 255, 0.78)",

      fontSize:
        13,

      textAlign:
        "center",
    },

    locationRow: {
      marginTop:
        11,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        6,
    },

    location: {
      color:
        "rgba(255, 255, 255, 0.72)",

      fontSize:
        12,
    },

    statsGrid: {
      marginTop:
        16,

      flexDirection:
        "row",

      gap:
        10,
    },

    statCard: {
      flex:
        1,

      minHeight:
        112,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderWidth:
        1,

      borderColor:
        Colors.border,

      borderRadius:
        20,

      backgroundColor:
        Colors.white,

      padding:
        12,
    },

    statValue: {
      marginTop:
        8,

      color:
        Colors.navyDark,

      fontSize:
        20,

      fontWeight:
        "800",
    },

    statLabel: {
      marginTop:
        3,

      color:
        Colors.textSecondary,

      fontSize:
        11,
    },

    reviewsButton: {
      marginTop:
        14,

      minHeight:
        76,

      borderWidth:
        1,

      borderColor:
        Colors.border,

      borderRadius:
        20,

      backgroundColor:
        Colors.white,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,

      padding:
        14,
    },

    pressed: {
      opacity:
        0.8,
    },

    reviewsButtonIcon: {
      width:
        46,

      height:
        46,

      borderRadius:
        14,

      backgroundColor:
        "#EEF3F8",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    reviewsButtonContent: {
      flex:
        1,
    },

    reviewsButtonTitle: {
      color:
        Colors.navyDark,

      fontSize:
        14,

      fontWeight:
        "800",
    },

    reviewsSummary: {
      marginTop:
        5,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        5,
    },

    reviewsButtonSubtitle: {
      color:
        Colors.textSecondary,

      fontSize:
        11,
    },

    section: {
      marginTop:
        16,

      borderWidth:
        1,

      borderColor:
        Colors.border,

      borderRadius:
        22,

      backgroundColor:
        Colors.white,

      padding:
        18,
    },

    sectionTitleRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        8,
    },

    sectionTitle: {
      color:
        Colors.navyDark,

      fontSize:
        18,

      fontWeight:
        "800",
    },

    languages: {
      marginTop:
        14,

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        8,
    },

    languageChip: {
      borderRadius:
        999,

      backgroundColor:
        "#EEF3F8",

      paddingHorizontal:
        12,

      paddingVertical:
        8,
    },

    languageText: {
      color:
        Colors.navy,

      fontSize:
        11,

      fontWeight:
        "700",
    },

    aboutText: {
      marginTop:
        11,

      color:
        Colors.textSecondary,

      fontSize:
        14,

      lineHeight:
        23,
    },

    contactRow: {
      marginTop:
        14,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,

      borderRadius:
        16,

      backgroundColor:
        "#F8FAFC",

      padding:
        13,
    },

    contactIcon: {
      width:
        40,

      height:
        40,

      borderRadius:
        13,

      backgroundColor:
        "#EEF3F8",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    contactContent: {
      flex:
        1,
    },

    contactLabel: {
      color:
        Colors.textSecondary,

      fontSize:
        11,
    },

    contactValue: {
      marginTop:
        2,

      color:
        Colors.navyDark,

      fontSize:
        13,

      fontWeight:
        "700",
    },

    matchCard: {
      marginTop:
        16,

      borderRadius:
        24,

      backgroundColor:
        "#FFFBEA",

      borderWidth:
        1,

      borderColor:
        "#F4DF8C",

      padding:
        19,
    },

    matchTitle: {
      marginTop:
        10,

      color:
        Colors.navyDark,

      fontSize:
        19,

      fontWeight:
        "800",
    },

    matchText: {
      marginTop:
        8,

      color:
        Colors.textSecondary,

      fontSize:
        13,

      lineHeight:
        21,
    },

    primaryButton: {
      marginTop:
        18,

      minHeight:
        52,

      borderRadius:
        15,

      backgroundColor:
        Colors.navy,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    primaryButtonText: {
      color:
        Colors.white,

      fontSize:
        14,

      fontWeight:
        "800",
    },

    secondaryButton: {
      marginTop:
        10,

      minHeight:
        50,

      borderRadius:
        15,

      borderWidth:
        1,

      borderColor:
        Colors.navy,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        8,
    },

    secondaryButtonText: {
      color:
        Colors.navy,

      fontSize:
        14,

      fontWeight:
        "800",
    },
  });
