import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
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
  useMemo,
  useState,
} from "react";

import {
  router,
} from "expo-router";

import {
  MessageCircle,
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  Heart,
  Home,
  FileText,
  Landmark,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react-native";

import AppHeader from "@/components/AppHeader";
import AppMenu from "@/components/AppMenu";
import FloatingMenuButton from "@/components/FloatingMenuButton";

import {
  getAssetUrl,
} from "@/lib/api";

import {
  getPublicProperties,
} from "@/lib/properties-api";

import {
  getPublicProfessionals,
  type Professional,
} from "@/lib/professionals-api";

import {
  getUnreadNotificationCount,
} from "@/lib/notifications-api";

import {
  getPublicStories,
  type Story,
} from "@/lib/stories-api";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import {
  useAppMenu,
} from "@/hooks/useAppMenu";

import type {
  AuthUser,
} from "@/types/auth";

import type {
  Property,
} from "@/types/property";

import {
  Colors,
} from "@/constants/colors";

// ============================================================
// CONSTANTS
// ============================================================

const NAVY = "#0F2340";
const PRIMARY = "#1B365D";
const GOLD = "#C9A227";
const BACKGROUND = "#F6F7F9";
const WHITE = "#FFFFFF";
const MUTED = "#667085";
const BORDER = "#EAECF0";

// ============================================================
// HOME
// ============================================================

export default function HomeScreen() {
  const [
    user,
    setUser,
  ] =
    useState<AuthUser | null>(
      null,
    );

  const [
    properties,
    setProperties,
  ] =
    useState<Property[]>(
      [],
    );

  const [
    professionals,
    setProfessionals,
  ] =
    useState<
      Professional[]
    >([]);

  const [
    stories,
    setStories,
  ] =
    useState<Story[]>(
      [],
    );

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] =
    useState(0);

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

  const {
    menuVisible,
    menuUser,
    savedCount,
    unreadMessages,
    openMenu,
    closeMenu,
    refreshMenu,
  } = useAppMenu();

  // ============================================================
  // LOAD
  // ============================================================

  const loadHome =
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

          const [
            storedUser,
            propertiesData,
            professionalsData,
            storiesData,
          ] =
            await Promise.all([
              getStoredUser<AuthUser>(),

              getPublicProperties(),

              getPublicProfessionals(),

              getPublicStories(),
            ]);

          setUser(
            storedUser,
          );

          setProperties(
            Array.isArray(
              propertiesData,
            )
              ? propertiesData
              : [],
          );

          setProfessionals(
            Array.isArray(
              professionalsData,
            )
              ? professionalsData
              : [],
          );

          setStories(
            Array.isArray(
              storiesData,
            )
              ? storiesData
              : [],
          );

          if (
            storedUser?.role ===
            "BUYER"
          ) {
            try {
              const token =
                await getToken();

              if (token) {
                const result =
                  await getUnreadNotificationCount(
                    token,
                  );

                setUnreadNotifications(
                  Number(
                    result?.count ||
                    0,
                  ),
                );
              } else {
                setUnreadNotifications(
                  0,
                );
              }
            } catch {
              setUnreadNotifications(
                0,
              );
            }
          } else {
            setUnreadNotifications(
              0,
            );
          }

          await refreshMenu();
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load home data.",
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
      [
        refreshMenu,
      ],
    );

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  // ============================================================
  // COMPUTED DATA
  // ============================================================

  const featuredProperty =
    useMemo(() => {
      return (
        properties.find(
          (item) =>
            item.featured,
        ) ??
        properties[0] ??
        null
      );
    }, [
      properties,
    ]);

  const featuredCount =
    useMemo(
      () =>
        properties.filter(
          (item) =>
            item.featured,
        ).length,
      [
        properties,
      ],
    );

  const featuredProfessionals =
    useMemo(
      () =>
        professionals.slice(
          0,
          4,
        ),
      [
        professionals,
      ],
    );

  const featuredStories =
    useMemo(
      () =>
        stories.slice(
          0,
          3,
        ),
      [
        stories,
      ],
    );

  const ratingStatistics =
    useMemo(() => {
      const rated =
        professionals.filter(
          (professional) => {
            const rating =
              Number(
                professional.rating ||
                0,
              );

            const reviews =
              Number(
                professional.reviewsCount ||
                0,
              );

            return (
              rating > 0 &&
              reviews > 0
            );
          },
        );

      if (
        rated.length ===
        0
      ) {
        return {
          average: null as
            | number
            | null,

          reviewsCount:
            0,
        };
      }

      const reviewsCount =
        rated.reduce(
          (
            total,
            professional,
          ) =>
            total +
            Number(
              professional.reviewsCount ||
              0,
            ),
          0,
        );

      const weighted =
        rated.reduce(
          (
            total,
            professional,
          ) =>
            total +
            Number(
              professional.rating ||
              0,
            ) *
            Number(
              professional.reviewsCount ||
              0,
            ),
          0,
        );

      return {
        average:
          reviewsCount > 0
            ? weighted /
            reviewsCount
            : null,

        reviewsCount,
      };
    }, [
      professionals,
    ]);

  const ratingLabel =
    ratingStatistics.average !==
      null
      ? ratingStatistics.average.toFixed(
        1,
      )
      : "—";

  // ============================================================
  // TEMP ROUTE HELPER
  // ============================================================

  function goTo(
    route: string,
  ) {
    router.push(
      route as never,
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.loadingScreen
        }
      >
        <View
          style={
            styles.loadingLogo
          }
        >
          <Home
            size={30}
            color={
              PRIMARY
            }
          />
        </View>

        <ActivityIndicator
          style={{
            marginTop: 18,
          }}
          color={
            GOLD
          }
        />

        <Text
          style={
            styles.loadingTitle
          }
        >
          Real Estate Lisbon
        </Text>

        <Text
          style={
            styles.loadingText
          }
        >
          Preparing your property journey...
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
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void loadHome(
                true,
              )
            }
            tintColor={
              PRIMARY
            }
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* ======================================================
            APP HEADER
        ====================================================== */}

        <AppHeader
          eyebrow="REAL ESTATE LISBON"
          title={
            user?.fullName
              ? `Your property journey, ${firstName(user.fullName)}`
              : "Your property journey"
          }
          subtitle="Explore the market, evaluate opportunities and move forward with trusted professionals."
        />

        {/* ======================================================
            HERO
        ====================================================== */}

        <View
          style={
            styles.hero
          }
        >
          <View
            style={
              styles.heroDecorationOne
            }
          />

          <View
            style={
              styles.heroDecorationTwo
            }
          />

          <View
            style={
              styles.heroBadge
            }
          >
            <ShieldCheck
              size={15}
              color="#F3D675"
            />

            <Text
              style={
                styles.heroBadgeText
              }
            >
              Independent tools & verified experts
            </Text>
          </View>

          <Text
            style={
              styles.heroTitle
            }
          >
            Buy Property{"\n"}
            in Portugal
          </Text>

          <Text
            style={
              styles.heroGold
            }
          >
            With Complete Confidence
          </Text>

          <Text
            style={
              styles.heroText
            }
          >
            Explore verified listings, use buyer tools and connect with approved professionals.
          </Text>

          <View
            style={
              styles.heroActions
            }
          >
            <Pressable
              onPress={() =>
                goTo(
                  "/tools",
                )
              }
              style={
                styles.goldButton
              }
            >
              <Calculator
                size={17}
                color={
                  NAVY
                }
              />

              <Text
                style={
                  styles.goldButtonText
                }
              >
                Explore Tools
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                goTo(
                  "/(tabs)/properties",
                )
              }
              style={
                styles.heroSecondaryButton
              }
            >
              <Search
                size={17}
                color={
                  WHITE
                }
              />

              <Text
                style={
                  styles.heroSecondaryText
                }
              >
                Find a Home
              </Text>
            </Pressable>
          </View>

          <View
            style={
              styles.heroStats
            }
          >
            <HeroStat
              value={`${properties.length}`}
              label="Properties"
            />

            <View
              style={
                styles.heroStatDivider
              }
            />

            <HeroStat
              value={`${professionals.length}`}
              label="Experts"
            />

            <View
              style={
                styles.heroStatDivider
              }
            />

            <HeroStat
              value={
                ratingStatistics.average !==
                  null
                  ? `${ratingLabel}/5`
                  : "—"
              }
              label="Rating"
            />
          </View>
        </View>

        {/* ======================================================
            MY JOURNEY
        ====================================================== */}

        {user?.role ===
          "BUYER" && (
            <>
              <SectionHeader
                eyebrow="MY JOURNEY"
                title="Your buyer dashboard"
                description="Continue exactly where you left off."
              />

              <View
                style={
                  styles.journeyGrid
                }
              >
                <JourneyCard
                  icon={
                    Heart
                  }
                  iconColor="#DC2626"
                  iconBackground="#FEF2F2"
                  value={`${savedCount}`}
                  label="Saved homes"
                  onPress={() =>
                    goTo(
                      "/saved-properties",
                    )
                  }
                />

                <JourneyCard
                  icon={
                    FileText
                  }
                  iconColor={
                    PRIMARY
                  }
                  iconBackground="#EEF3F8"
                  value="Open"
                  label="My requests"
                  onPress={() =>
                    goTo(
                      "/(tabs)/requests",
                    )
                  }
                />

                <JourneyCard
                  icon={
                    MessageCircle
                  }
                  iconColor="#7C3AED"
                  iconBackground="#F3E8FF"
                  value={`${unreadMessages}`}
                  label="Unread messages"
                  onPress={() =>
                    goTo(
                      "/(tabs)/messages",
                    )
                  }
                />

                <JourneyCard
                  icon={
                    Bell
                  }
                  iconColor="#B45309"
                  iconBackground="#FEF3C7"
                  value={`${unreadNotifications}`}
                  label="Notifications"
                  onPress={() =>
                    goTo(
                      "/notifications",
                    )
                  }
                />
              </View>
            </>
          )}

        {/* ======================================================
            TRUST STRIP
        ====================================================== */}

        <SectionHeader
          eyebrow="LIVE PLATFORM"
          title="Trusted marketplace"
          description="Real platform activity, updated from public data."
        />

        <View
          style={
            styles.trustGrid
          }
        >
          <TrustMetric
            icon={
              <ShieldCheck
                size={20}
                color={
                  PRIMARY
                }
              />
            }
            value="Approved"
            label="Professionals"
          />

          <TrustMetric
            icon={
              <BadgeCheck
                size={20}
                color={
                  PRIMARY
                }
              />
            }
            value={`${properties.length}`}
            label="Listings"
          />

          <TrustMetric
            icon={
              <Users
                size={20}
                color={
                  PRIMARY
                }
              />
            }
            value={`${professionals.length}`}
            label="Experts"
          />

          <TrustMetric
            icon={
              <Star
                size={20}
                color={
                  GOLD
                }
              />
            }
            value={
              ratingLabel
            }
            label={
              ratingStatistics
                .reviewsCount >
                0
                ? `${ratingStatistics.reviewsCount} reviews`
                : "Buyer reviews"
            }
          />
        </View>

        {/* ======================================================
            FEATURED PROPERTY
        ====================================================== */}

        <SectionHeader
          eyebrow="LATEST OPPORTUNITY"
          title="Featured Property"
          description="Discover a recently published opportunity."
          action="View all"
          onAction={() =>
            goTo(
              "/(tabs)/properties",
            )
          }
        />

        {featuredProperty ? (
          <FeaturedPropertyCard
            property={
              featuredProperty
            }
          />
        ) : (
          <EmptyCard
            title="No published properties"
            description="New approved listings will appear here automatically."
          />
        )}

        {/* ======================================================
            MARKET INSIGHTS
        ====================================================== */}

        <SectionHeader
          eyebrow="PLATFORM ACTIVITY"
          title="Market Insights"
          description="Live information calculated from the platform."
        />

        <View
          style={
            styles.marketCard
          }
        >
          <View
            style={
              styles.marketHero
            }
          >
            <View>
              <Text
                style={
                  styles.marketHeroLabel
                }
              >
                Published listings
              </Text>

              <Text
                style={
                  styles.marketHeroValue
                }
              >
                {
                  properties.length
                }
              </Text>
            </View>

            <View
              style={
                styles.liveBadge
              }
            >
              <TrendingUp
                size={14}
                color="#15803D"
              />

              <Text
                style={
                  styles.liveText
                }
              >
                Live
              </Text>
            </View>
          </View>

          <MetricRow
            label="Verified professionals"
            value={`${professionals.length}`}
          />

          <MetricRow
            label="Featured properties"
            value={`${featuredCount}`}
          />

          <MetricRow
            label="Average rating"
            value={
              ratingStatistics.average !==
                null
                ? `${ratingLabel}/5`
                : "No ratings"
            }
          />

          <MetricRow
            label="Published reviews"
            value={`${ratingStatistics.reviewsCount}`}
          />
        </View>

        {/* ======================================================
            THREE QUESTIONS
        ====================================================== */}

        <SectionHeader
          eyebrow="A CLEARER BUYING JOURNEY"
          title="Three critical questions"
          description="Make informed decisions at every important stage."
        />

        <QuestionCard
          number="01"
          title="What can I afford?"
          description="Estimate your budget, mortgage payments and full purchase costs."
          items={[
            "Mortgage Calculator",
            "Affordability Calculator",
            "True Cost Calculator",
          ]}
          onPress={() =>
            goTo(
              "/tools",
            )
          }
        />

        <QuestionCard
          number="02"
          title="Is it worth it?"
          description="Compare prices, neighborhoods and estimated property value."
          items={[
            "Price Checker",
            "Neighborhood Finder",
            "Property Valuation",
          ]}
          onPress={() =>
            goTo(
              "/tools",
            )
          }
        />

        <QuestionCard
          number="03"
          title="How do I close safely?"
          description="Connect with approved agents, mortgage brokers and lawyers."
          items={[
            "Professional Directory",
            "Verified Lawyers",
            "Mortgage Brokers",
          ]}
          onPress={() =>
            goTo(
              "/find-professionals",
            )
          }
        />

        {/* ======================================================
            TOOLS
        ====================================================== */}

        <SectionHeader
          eyebrow="FREE BUYER TOOLS"
          title="Property tools"
          description="Independent calculators and analysis tools for better decisions."
          action="View all"
          onAction={() =>
            goTo(
              "/tools",
            )
          }
        />

        <View
          style={
            styles.toolsGrid
          }
        >
          <ToolCard
            icon={
              Calculator
            }
            title="Mortgage"
            description="Estimate monthly payments."
            onPress={() =>
              goTo(
                "/tools/mortgage-calculator",
              )
            }
          />

          <ToolCard
            icon={
              CircleDollarSign
            }
            title="Affordability"
            description="Estimate your buying power."
            onPress={() =>
              goTo(
                "/tools/affordability-calculator",
              )
            }
          />

          <ToolCard
            icon={
              MapPin
            }
            title="Neighborhood"
            description="Compare Portuguese areas."
            onPress={() =>
              goTo(
                "/tools/neighborhood-finder",
              )
            }
          />

          <ToolCard
            icon={
              TrendingUp
            }
            title="Price Checker"
            description="Compare price and market value."
            onPress={() =>
              goTo(
                "/tools/price-checker",
              )
            }
          />

          <ToolCard
            icon={
              Landmark
            }
            title="True Cost"
            description="Estimate taxes and fees."
            onPress={() =>
              goTo(
                "/tools/true-cost-calculator",
              )
            }
          />

          <ToolCard
            icon={
              CheckCircle2
            }
            title="Valuation"
            description="Estimate property value."
            onPress={() =>
              goTo(
                "/tools/property-valuation",
              )
            }
          />
        </View>

        {/* ======================================================
            PROFESSIONALS
        ====================================================== */}

        <SectionHeader
          eyebrow="ADMIN-APPROVED"
          title="Trusted Professionals"
          description="Meet specialists supporting international buyers."
          action="Directory"
          onAction={() =>
            goTo(
              "/professionals",
            )
          }
        />

        {featuredProfessionals.length >
          0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.professionalsRow
            }
          >
            {featuredProfessionals.map(
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
                    goTo(
                      `/professionals/${professional.id}`,
                    )
                  }
                />
              ),
            )}
          </ScrollView>
        ) : (
          <EmptyCard
            title="No professionals yet"
            description="Approved professionals will appear here automatically."
          />
        )}

        {/* ======================================================
            SUCCESS STORIES
        ====================================================== */}

        <SectionHeader
          eyebrow="BUYER COMMUNITY"
          title="Success Stories"
          description="Learn from real buyer journeys and practical experiences across Portugal."
          action="View all"
          onAction={() =>
            goTo(
              "/stories",
            )
          }
        />

        {featuredStories.length >
          0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.storiesRow
            }
          >
            {featuredStories.map(
              (
                story,
              ) => (
                <StoryPreviewCard
                  key={
                    story.id
                  }
                  story={
                    story
                  }
                  onPress={() =>
                    router.push({
                      pathname:
                        "/stories/[id]" as never,
                      params: {
                        id:
                          story.id,
                      },
                    })
                  }
                />
              ),
            )}
          </ScrollView>
        ) : (
          <EmptyCard
            title="No success stories yet"
            description="Approved buyer stories will appear here automatically."
          />
        )}

        {/* ======================================================
            FINAL CTA
        ====================================================== */}

        <View
          style={
            styles.cta
          }
        >
          <View
            style={
              styles.ctaIcon
            }
          >
            <Sparkles
              size={23}
              color={
                GOLD
              }
            />
          </View>

          <Text
            style={
              styles.ctaEyebrow
            }
          >
            YOUR BUYER JOURNEY
          </Text>

          <Text
            style={
              styles.ctaTitle
            }
          >
            Ready for your next step?
          </Text>

          <Text
            style={
              styles.ctaText
            }
          >
            Save homes, submit requests and connect with matched professionals.
          </Text>

          <Pressable
            onPress={() =>
              goTo(
                "/(tabs)/properties",
              )
            }
            style={
              styles.ctaButton
            }
          >
            <Text
              style={
                styles.ctaButtonText
              }
            >
              Explore Properties
            </Text>

            <ArrowRight
              size={18}
              color={
                NAVY
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
              Some live data could not be loaded: {error}
            </Text>
          </View>
        ) : null}

        <View
          style={{
            height: 34,
          }}
        />
      </ScrollView>

      <FloatingMenuButton
        onPress={
          openMenu
        }
      />

      <AppMenu
        visible={
          menuVisible
        }
        onClose={
          closeMenu
        }
        user={
          menuUser ??
          user
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

// ============================================================
// COMPONENTS
// ============================================================

function HeroStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View
      style={
        styles.heroStat
      }
    >
      <Text
        style={
          styles.heroStatValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.heroStatLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      <View
        style={
          styles.sectionTitleRow
        }
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.sectionEyebrow
            }
          >
            {eyebrow}
          </Text>

          <Text
            style={
              styles.sectionTitle
            }
          >
            {title}
          </Text>
        </View>

        {action &&
          onAction ? (
          <Pressable
            onPress={
              onAction
            }
            style={
              styles.sectionAction
            }
          >
            <Text
              style={
                styles.sectionActionText
              }
            >
              {action}
            </Text>

            <ArrowRight
              size={15}
              color={
                PRIMARY
              }
            />
          </Pressable>
        ) : null}
      </View>

      <Text
        style={
          styles.sectionDescription
        }
      >
        {description}
      </Text>
    </View>
  );
}

function TrustMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View
      style={
        styles.trustMetric
      }
    >
      <View
        style={
          styles.trustMetricIcon
        }
      >
        {icon}
      </View>

      <Text
        style={
          styles.trustMetricValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.trustMetricLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function FeaturedPropertyCard({
  property,
}: {
  property: Property;
}) {
  const image =
    getAssetUrl(
      property.imageUrls?.[0],
    );

  const location =
    [
      property.city,
      property.region,
    ]
      .filter(Boolean)
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
      style={
        styles.propertyCard
      }
    >
      <View
        style={
          styles.propertyImageWrap
        }
      >
        {image ? (
          <Image
            source={{
              uri: image,
            }}
            resizeMode="cover"
            style={
              styles.propertyImage
            }
          />
        ) : (
          <View
            style={
              styles.imageFallback
            }
          >
            <Home
              size={40}
              color={
                MUTED
              }
            />
          </View>
        )}

        {property.featured && (
          <View
            style={
              styles.featuredBadge
            }
          >
            <Sparkles
              size={12}
              color={
                WHITE
              }
            />

            <Text
              style={
                styles.featuredBadgeText
              }
            >
              Featured
            </Text>
          </View>
        )}
      </View>

      <View
        style={
          styles.propertyContent
        }
      >
        {property.propertyType ? (
          <Text
            style={
              styles.propertyType
            }
          >
            {property.propertyType.replaceAll(
              "_",
              " ",
            )}
          </Text>
        ) : null}

        <Text
          numberOfLines={
            2
          }
          style={
            styles.propertyTitle
          }
        >
          {
            property.title
          }
        </Text>

        <View
          style={
            styles.locationRow
          }
        >
          <MapPin
            size={15}
            color={
              MUTED
            }
          />

          <Text
            numberOfLines={
              1
            }
            style={
              styles.locationText
            }
          >
            {location}
          </Text>
        </View>

        <View
          style={
            styles.propertyFooter
          }
        >
          <Text
            style={
              styles.propertyPrice
            }
          >
            {formatEuro(
              Number(
                property.price ||
                0,
              ),
            )}
          </Text>

          <View
            style={
              styles.propertyArrow
            }
          >
            <ArrowRight
              size={17}
              color={
                WHITE
              }
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.metricRow
      }
    >
      <Text
        style={
          styles.metricLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.metricValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function QuestionCard({
  number,
  title,
  description,
  items,
  onPress,
}: {
  number: string;
  title: string;
  description: string;
  items: string[];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={
        styles.questionCard
      }
    >
      <Text
        style={
          styles.questionNumber
        }
      >
        {number}
      </Text>

      <Text
        style={
          styles.questionTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.questionText
        }
      >
        {description}
      </Text>

      <View
        style={
          styles.questionItems
        }
      >
        {items.map(
          (item) => (
            <View
              key={
                item
              }
              style={
                styles.questionItem
              }
            >
              <CheckCircle2
                size={15}
                color="#15803D"
              />

              <Text
                style={
                  styles.questionItemText
                }
              >
                {item}
              </Text>
            </View>
          ),
        )}
      </View>

      <View
        style={
          styles.questionAction
        }
      >
        <Text
          style={
            styles.questionActionText
          }
        >
          Explore
        </Text>

        <ArrowRight
          size={16}
          color={
            PRIMARY
          }
        />
      </View>
    </Pressable>
  );
}

function ToolCard({
  icon: Icon,
  title,
  description,
  onPress,
}: {
  icon:
  React.ComponentType<any>;

  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={
        styles.toolCard
      }
    >
      <View
        style={
          styles.toolIcon
        }
      >
        <Icon
          size={22}
          color={
            PRIMARY
          }
        />
      </View>

      <Text
        style={
          styles.toolTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.toolDescription
        }
      >
        {description}
      </Text>

      <View
        style={
          styles.toolAction
        }
      >
        <Text
          style={
            styles.toolActionText
          }
        >
          Open
        </Text>

        <ArrowRight
          size={14}
          color={
            PRIMARY
          }
        />
      </View>
    </Pressable>
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
        ?.avatarUrl,
    );

  return (
    <Pressable
      onPress={
        onPress
      }
      style={
        styles.professionalCard
      }
    >
      <View
        style={
          styles.professionalAccent
        }
      />

      <View
        style={
          styles.professionalAvatar
        }
      >
        {avatar ? (
          <Image
            source={{
              uri: avatar,
            }}
            style={
              styles.professionalAvatarImage
            }
          />
        ) : (
          <Text
            style={
              styles.professionalInitial
            }
          >
            {getInitials(
              professional.user
                ?.fullName,
            )}
          </Text>
        )}
      </View>

      <View
        style={
          styles.verifiedRow
        }
      >
        <BadgeCheck
          size={14}
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
        numberOfLines={
          1
        }
        style={
          styles.professionalName
        }
      >
        {professional.user
          ?.fullName ||
          "Professional"}
      </Text>

      <Text
        style={
          styles.professionalRole
        }
      >
        {professional.professionalType
          .replaceAll(
            "_",
            " ",
          )
          .toLowerCase()}
      </Text>

      <View
        style={
          styles.ratingRow
        }
      >
        <Star
          size={15}
          color={
            GOLD
          }
          fill={
            Number(
              professional.reviewsCount ||
              0,
            ) > 0
              ? GOLD
              : "transparent"
          }
        />

        <Text
          style={
            styles.ratingText
          }
        >
          {Number(
            professional.reviewsCount ||
            0,
          ) > 0
            ? Number(
              professional.rating ||
              0,
            ).toFixed(
              1,
            )
            : "New"}
        </Text>

        {professional.reviewsCount >
          0 && (
            <Text
              style={
                styles.reviewText
              }
            >
              (
              {
                professional.reviewsCount
              }
              )
            </Text>
          )}
      </View>

      {professional.languages
        ?.length > 0 && (
          <View
            style={
              styles.languageRow
            }
          >
            {professional.languages
              .slice(
                0,
                2,
              )
              .map(
                (
                  language,
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
        )}
    </Pressable>
  );
}

function JourneyCard({
  icon: Icon,
  iconColor,
  iconBackground,
  value,
  label,
  onPress,
}: {
  icon:
  React.ComponentType<any>;
  iconColor: string;
  iconBackground: string;
  value: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={
        styles.journeyCard
      }
    >
      <View
        style={[
          styles.journeyIcon,
          {
            backgroundColor:
              iconBackground,
          },
        ]}
      >
        <Icon
          size={19}
          color={
            iconColor
          }
        />
      </View>

      <Text
        style={
          styles.journeyValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.journeyLabel
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.journeyArrow
        }
      >
        <ArrowRight
          size={14}
          color={
            PRIMARY
          }
        />
      </View>
    </Pressable>
  );
}

function StoryPreviewCard({
  story,
  onPress,
}: {
  story: Story;
  onPress: () => void;
}) {
  const image =
    getAssetUrl(
      story.imageUrl,
    );

  return (
    <Pressable
      onPress={
        onPress
      }
      style={
        styles.storyCard
      }
    >
      <View
        style={
          styles.storyImageWrap
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
            resizeMode="cover"
          />
        ) : (
          <View
            style={
              styles.storyFallback
            }
          >
            <BookOpen
              size={30}
              color={
                PRIMARY
              }
            />
          </View>
        )}

        <View
          style={
            styles.storyBadge
          }
        >
          <BookOpen
            size={11}
            color={
              WHITE
            }
          />

          <Text
            style={
              styles.storyBadgeText
            }
          >
            Story
          </Text>
        </View>
      </View>

      <View
        style={
          styles.storyContent
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

        <Text
          numberOfLines={
            2
          }
          style={
            styles.storyExcerpt
          }
        >
          {story.excerpt ||
            "A real buyer journey in Portugal."}
        </Text>

        <View
          style={
            styles.storyFooter
          }
        >
          <Text
            numberOfLines={
              1
            }
            style={
              styles.storyAuthor
            }
          >
            {story.author ||
              "Verified Buyer"}
          </Text>

          <ArrowRight
            size={15}
            color={
              PRIMARY
            }
          />
        </View>
      </View>
    </Pressable>
  );
}

function EmptyCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View
      style={
        styles.emptyCard
      }
    >
      <Home
        size={30}
        color={
          PRIMARY
        }
      />

      <Text
        style={
          styles.emptyTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.emptyText
        }
      >
        {description}
      </Text>
    </View>
  );
}

// ============================================================
// HELPERS
// ============================================================

function firstName(
  name: string,
) {
  return (
    name
      .trim()
      .split(/\s+/)[0] ||
    name
  );
}

function getInitials(
  name?: string | null,
) {
  if (!name) {
    return "P";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part.charAt(0),
    )
    .join("")
    .toUpperCase();
}

function formatEuro(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IE",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits:
        0,
    },
  ).format(
    value || 0,
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
        BACKGROUND,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 18,
    },

    loadingScreen: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 30,
      backgroundColor:
        BACKGROUND,
    },

    loadingLogo: {
      width: 68,
      height: 68,
      borderRadius: 23,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#EEF3F8",
    },

    loadingTitle: {
      marginTop: 18,
      color: NAVY,
      fontSize: 18,
      fontWeight:
        "900",
    },

    loadingText: {
      marginTop: 7,
      color: MUTED,
      textAlign:
        "center",
    },

    // HERO

    hero: {
      position:
        "relative",
      overflow:
        "hidden",
      marginTop: 25,
      borderRadius: 30,
      backgroundColor:
        PRIMARY,
      paddingHorizontal: 22,
      paddingTop: 25,
      paddingBottom: 22,
    },

    heroDecorationOne: {
      position:
        "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      right: -75,
      top: -60,
      backgroundColor:
        "rgba(201,162,39,0.12)",
    },

    heroDecorationTwo: {
      position:
        "absolute",
      width: 150,
      height: 150,
      borderRadius: 75,
      left: -80,
      bottom: -80,
      backgroundColor:
        "rgba(255,255,255,0.05)",
    },

    heroBadge: {
      alignSelf:
        "flex-start",
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.16)",
      borderRadius: 999,
      backgroundColor:
        "rgba(255,255,255,0.08)",
      paddingHorizontal: 11,
      paddingVertical: 7,
    },

    heroBadgeText: {
      color: WHITE,
      fontSize: 10,
      fontWeight:
        "700",
    },

    heroTitle: {
      marginTop: 24,
      color: WHITE,
      fontSize: 35,
      lineHeight: 39,
      fontWeight:
        "900",
      letterSpacing:
        -1,
    },

    heroGold: {
      marginTop: 6,
      color: GOLD,
      fontSize: 20,
      lineHeight: 27,
      fontWeight:
        "900",
    },

    heroText: {
      marginTop: 14,
      color:
        "#E4E7EC",
      fontSize: 14,
      lineHeight: 22,
    },

    heroActions: {
      marginTop: 22,
      flexDirection:
        "row",
      gap: 10,
    },

    goldButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 15,
      flexDirection:
        "row",
      gap: 7,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        GOLD,
    },

    goldButtonText: {
      color: NAVY,
      fontSize: 12,
      fontWeight:
        "900",
    },

    heroSecondaryButton: {
      flex: 1,
      minHeight: 50,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.25)",
      borderRadius: 15,
      flexDirection:
        "row",
      gap: 7,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(255,255,255,0.08)",
    },

    heroSecondaryText: {
      color: WHITE,
      fontSize: 12,
      fontWeight:
        "800",
    },

    heroStats: {
      marginTop: 24,
      paddingTop: 19,
      borderTopWidth: 1,
      borderTopColor:
        "rgba(255,255,255,0.12)",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    heroStat: {
      flex: 1,
      alignItems:
        "center",
    },

    heroStatValue: {
      color: GOLD,
      fontSize: 19,
      fontWeight:
        "900",
    },

    heroStatLabel: {
      marginTop: 3,
      color:
        "#D0D5DD",
      fontSize: 9,
    },

    heroStatDivider: {
      width: 1,
      height: 30,
      backgroundColor:
        "rgba(255,255,255,0.12)",
    },

    // MY JOURNEY

    journeyGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 10,
    },

    journeyCard: {
      width: "48%",
      minHeight: 132,
      borderWidth: 1,
      borderColor:
        BORDER,
      borderRadius: 21,
      backgroundColor:
        WHITE,
      padding: 15,
    },

    journeyIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    journeyValue: {
      marginTop: 12,
      color: NAVY,
      fontSize: 22,
      fontWeight:
        "900",
    },

    journeyLabel: {
      marginTop: 3,
      color: MUTED,
      fontSize: 10,
      fontWeight:
        "700",
    },

    journeyArrow: {
      position:
        "absolute",
      right: 13,
      bottom: 13,
      width: 28,
      height: 28,
      borderRadius: 10,
      backgroundColor:
        "#EEF3F8",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    // SECTION

    sectionHeader: {
      marginTop: 34,
      marginBottom: 16,
    },

    sectionTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-end",
      gap: 12,
    },

    sectionEyebrow: {
      color: GOLD,
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing:
        1.25,
    },

    sectionTitle: {
      marginTop: 6,
      color: NAVY,
      fontSize: 25,
      lineHeight: 30,
      fontWeight:
        "900",
      letterSpacing:
        -0.6,
    },

    sectionDescription: {
      marginTop: 7,
      color: MUTED,
      fontSize: 13,
      lineHeight: 20,
    },

    sectionAction: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
      paddingBottom: 2,
    },

    sectionActionText: {
      color: PRIMARY,
      fontSize: 11,
      fontWeight:
        "800",
    },

    // TRUST

    trustGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 10,
    },

    trustMetric: {
      width: "48%",
      minHeight: 122,
      borderWidth: 1,
      borderColor:
        BORDER,
      borderRadius: 20,
      backgroundColor:
        WHITE,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 12,
    },

    trustMetricIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#EEF3F8",
    },

    trustMetricValue: {
      marginTop: 9,
      color: NAVY,
      fontSize: 17,
      fontWeight:
        "900",
    },

    trustMetricLabel: {
      marginTop: 3,
      color: MUTED,
      textAlign:
        "center",
      fontSize: 9,
    },

    // PROPERTY

    propertyCard: {
      overflow:
        "hidden",
      borderWidth: 1,
      borderColor:
        BORDER,
      borderRadius: 25,
      backgroundColor:
        WHITE,
    },

    propertyImageWrap: {
      position:
        "relative",
      height: 220,
      backgroundColor:
        "#EEF1F5",
    },

    propertyImage: {
      width: "100%",
      height: "100%",
    },

    imageFallback: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    featuredBadge: {
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
      backgroundColor:
        GOLD,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    featuredBadgeText: {
      color: WHITE,
      fontSize: 10,
      fontWeight:
        "900",
    },

    propertyContent: {
      padding: 17,
    },

    propertyType: {
      color: GOLD,
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing: 1,
    },

    propertyTitle: {
      marginTop: 6,
      color: NAVY,
      fontSize: 19,
      lineHeight: 25,
      fontWeight:
        "900",
    },

    locationRow: {
      marginTop: 9,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
    },

    locationText: {
      flex: 1,
      color: MUTED,
      fontSize: 12,
    },

    propertyFooter: {
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor:
        "#F0F1F3",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    propertyPrice: {
      flex: 1,
      color: PRIMARY,
      fontSize: 23,
      fontWeight:
        "900",
    },

    propertyArrow: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        PRIMARY,
    },

    // MARKET

    marketCard: {
      borderWidth: 1,
      borderColor:
        BORDER,
      borderRadius: 24,
      backgroundColor:
        WHITE,
      padding: 16,
    },

    marketHero: {
      minHeight: 106,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      borderRadius: 18,
      backgroundColor:
        "#F6F7F9",
      padding: 17,
      marginBottom: 10,
    },

    marketHeroLabel: {
      color: MUTED,
      fontSize: 11,
    },

    marketHeroValue: {
      marginTop: 5,
      color: NAVY,
      fontSize: 32,
      fontWeight:
        "900",
    },

    liveBadge: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      borderRadius: 999,
      backgroundColor:
        "#ECFDF3",
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    liveText: {
      color:
        "#15803D",
      fontSize: 10,
      fontWeight:
        "800",
    },

    metricRow: {
      minHeight: 48,
      marginTop: 7,
      borderRadius: 14,
      backgroundColor:
        "#F9FAFB",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 13,
    },

    metricLabel: {
      flex: 1,
      color: MUTED,
      fontSize: 11,
    },

    metricValue: {
      color: NAVY,
      fontSize: 12,
      fontWeight:
        "900",
    },

    // QUESTIONS

    questionCard: {
      marginBottom: 12,
      borderWidth: 1,
      borderColor:
        BORDER,
      borderRadius: 23,
      backgroundColor:
        WHITE,
      padding: 18,
    },

    questionNumber: {
      color:
        "rgba(201,162,39,0.25)",
      fontSize: 42,
      lineHeight: 47,
      fontWeight:
        "900",
    },

    questionTitle: {
      marginTop: -4,
      color: NAVY,
      fontSize: 19,
      fontWeight:
        "900",
    },

    questionText: {
      marginTop: 8,
      color: MUTED,
      fontSize: 12,
      lineHeight: 19,
    },

    questionItems: {
      marginTop: 14,
      gap: 8,
    },

    questionItem: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    questionItemText: {
      color:
        "#475467",
      fontSize: 11,
      fontWeight:
        "600",
    },

    questionAction: {
      marginTop: 16,
      paddingTop: 13,
      borderTopWidth: 1,
      borderTopColor:
        "#F0F1F3",
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    questionActionText: {
      color: PRIMARY,
      fontSize: 11,
      fontWeight:
        "900",
    },

    // TOOLS

    toolsGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 10,
    },

    toolCard: {
      width: "48%",
      minHeight: 178,
      borderWidth: 1,
      borderColor:
        BORDER,
      borderRadius: 21,
      backgroundColor:
        WHITE,
      padding: 15,
    },

    toolIcon: {
      width: 43,
      height: 43,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#EEF3F8",
    },

    toolTitle: {
      marginTop: 13,
      color: NAVY,
      fontSize: 14,
      fontWeight:
        "900",
    },

    toolDescription: {
      marginTop: 6,
      color: MUTED,
      fontSize: 10,
      lineHeight: 16,
    },

    toolAction: {
      marginTop: "auto",
      paddingTop: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    toolActionText: {
      color: PRIMARY,
      fontSize: 10,
      fontWeight:
        "900",
    },

    // PROFESSIONALS

    professionalsRow: {
      gap: 12,
      paddingRight: 8,
    },

    professionalCard: {
      position:
        "relative",
      overflow:
        "hidden",
      width: 190,
      minHeight: 248,
      borderWidth: 1,
      borderColor:
        BORDER,
      borderRadius: 23,
      backgroundColor:
        WHITE,
      padding: 16,
    },

    professionalAccent: {
      position:
        "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 4,
      backgroundColor:
        GOLD,
    },

    professionalAvatar: {
      width: 58,
      height: 58,
      borderRadius: 19,
      overflow:
        "hidden",
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#EEF3F8",
    },

    professionalAvatarImage: {
      width: "100%",
      height: "100%",
    },

    professionalInitial: {
      color: PRIMARY,
      fontSize: 18,
      fontWeight:
        "900",
    },

    verifiedRow: {
      marginTop: 13,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    verifiedText: {
      color:
        "#15803D",
      fontSize: 9,
      fontWeight:
        "800",
    },

    professionalName: {
      marginTop: 7,
      color: NAVY,
      fontSize: 15,
      fontWeight:
        "900",
    },

    professionalRole: {
      marginTop: 3,
      color: MUTED,
      fontSize: 10,
      textTransform:
        "capitalize",
    },

    ratingRow: {
      marginTop: 11,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    ratingText: {
      color: NAVY,
      fontSize: 11,
      fontWeight:
        "800",
    },

    reviewText: {
      color: MUTED,
      fontSize: 9,
    },

    languageRow: {
      marginTop: 10,
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 5,
    },

    languageBadge: {
      borderRadius: 999,
      backgroundColor:
        "#F2F4F7",
      paddingHorizontal: 7,
      paddingVertical: 4,
    },

    languageText: {
      color: MUTED,
      fontSize: 8,
      fontWeight:
        "700",
    },

    // STORIES

    storiesRow: {
      gap: 12,
      paddingRight: 10,
    },

    storyCard: {
      width: 278,
      overflow:
        "hidden",
      borderWidth: 1,
      borderColor:
        BORDER,
      borderRadius: 22,
      backgroundColor:
        WHITE,
    },

    storyImageWrap: {
      position:
        "relative",
      height: 155,
      backgroundColor:
        "#EEF3F8",
    },

    storyImage: {
      width: "100%",
      height: "100%",
    },

    storyFallback: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#EEF3F8",
    },

    storyBadge: {
      position:
        "absolute",
      left: 12,
      top: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      borderRadius: 999,
      backgroundColor:
        GOLD,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    storyBadgeText: {
      color: WHITE,
      fontSize: 9,
      fontWeight:
        "900",
    },

    storyContent: {
      padding: 15,
    },

    storyTitle: {
      color: NAVY,
      fontSize: 16,
      lineHeight: 22,
      fontWeight:
        "900",
    },

    storyExcerpt: {
      marginTop: 7,
      color: MUTED,
      fontSize: 11,
      lineHeight: 17,
    },

    storyFooter: {
      marginTop: 12,
      paddingTop: 11,
      borderTopWidth: 1,
      borderTopColor:
        "#F0F1F3",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 8,
    },

    storyAuthor: {
      flex: 1,
      color: PRIMARY,
      fontSize: 10,
      fontWeight:
        "800",
    },

    // CTA

    cta: {
      marginTop: 38,
      borderRadius: 28,
      backgroundColor:
        NAVY,
      alignItems:
        "center",
      paddingHorizontal: 23,
      paddingVertical: 30,
    },

    ctaIcon: {
      width: 49,
      height: 49,
      borderRadius: 17,
      backgroundColor:
        "rgba(201,162,39,0.12)",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    ctaEyebrow: {
      marginTop: 15,
      color: GOLD,
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1.2,
    },

    ctaTitle: {
      marginTop: 7,
      color: WHITE,
      textAlign:
        "center",
      fontSize: 24,
      lineHeight: 30,
      fontWeight:
        "900",
    },

    ctaText: {
      marginTop: 9,
      color:
        "#D0D5DD",
      textAlign:
        "center",
      fontSize: 12,
      lineHeight: 19,
    },

    ctaButton: {
      marginTop: 20,
      minHeight: 50,
      alignSelf:
        "stretch",
      borderRadius: 15,
      backgroundColor:
        GOLD,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
    },

    ctaButtonText: {
      color: NAVY,
      fontSize: 12,
      fontWeight:
        "900",
    },

    // EMPTY / ERROR

    emptyCard: {
      minHeight: 190,
      borderWidth: 1,
      borderStyle:
        "dashed",
      borderColor:
        "#D0D5DD",
      borderRadius: 23,
      backgroundColor:
        WHITE,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 25,
    },

    emptyTitle: {
      marginTop: 13,
      color: NAVY,
      textAlign:
        "center",
      fontSize: 17,
      fontWeight:
        "900",
    },

    emptyText: {
      marginTop: 7,
      color: MUTED,
      textAlign:
        "center",
      fontSize: 11,
      lineHeight: 18,
    },

    errorBox: {
      marginTop: 18,
      borderRadius: 16,
      backgroundColor:
        "#FFFBEB",
      padding: 14,
    },

    errorText: {
      color:
        "#92400E",
      fontSize: 11,
      lineHeight: 18,
    },
  });