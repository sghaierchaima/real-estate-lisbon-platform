import {
  ActivityIndicator,
  Alert,
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
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  router,
} from "expo-router";

import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  MapPin,
  Ruler,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";

import AppMenu from "@/components/AppMenu";

import {
  useAppMenu,
} from "@/hooks/useAppMenu";

import {
  getNeighborhoods,
} from "@/lib/neighborhoods-api";

import type {
  Neighborhood,
} from "@/lib/neighborhoods-api";

import {
  createLeadFromPriceChecker,
} from "@/lib/leads-api";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import type {
  AuthUser,
} from "@/types/auth";

import {
  Colors,
} from "@/constants/colors";

/* ============================================================
   HELPERS
============================================================ */

function parseNumber(
  value: string,
) {
  const cleaned =
    value.replace(
      /[^\d.]/g,
      "",
    );

  const parsed =
    Number(cleaned);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}

function normalize(
  value: string,
) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
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

/* ============================================================
   PAGE
============================================================ */

export default function PriceCheckerScreen() {
  const {
    menuVisible,
    menuUser,
    savedCount,
    unreadMessages,
    openMenu,
    closeMenu,
  } = useAppMenu();

  const [
    neighborhoods,
    setNeighborhoods,
  ] =
    useState<Neighborhood[]>(
      [],
    );

  const [
    location,
    setLocation,
  ] =
    useState("");

  const [
    askingPrice,
    setAskingPrice,
  ] =
    useState("");

  const [
    marketPrice,
    setMarketPrice,
  ] =
    useState("");

  const [
    sizeInput,
    setSizeInput,
  ] =
    useState("");

  const [
    detectedNeighborhood,
    setDetectedNeighborhood,
  ] =
    useState("");

  const [
    loadingMarketPrice,
    setLoadingMarketPrice,
  ] =
    useState(false);

  const [
    marketDataLocked,
    setMarketDataLocked,
  ] =
    useState(false);

  const [
    savingRequest,
    setSavingRequest,
  ] =
    useState(false);

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

  /* ============================================================
     LOAD NEIGHBORHOODS
  ============================================================ */

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getNeighborhoods();

        setNeighborhoods(
          Array.isArray(data)
            ? data
            : [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load market data.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  /* ============================================================
     AUTO MARKET VALUE
  ============================================================ */

  useEffect(() => {
    if (
      !location ||
      !sizeInput ||
      marketDataLocked
    ) {
      return;
    }

    const size =
      parseNumber(
        sizeInput,
      );

    if (
      size <= 0
    ) {
      return;
    }

    setLoadingMarketPrice(
      true,
    );

    const query =
      normalize(
        location,
      );

    const matched =
      neighborhoods.find(
        (item) => {
          const area =
            normalize(
              item.name ||
                "",
            );

          const zone =
            normalize(
              item.zone ||
                "",
            );

          return (
            query.includes(
              area,
            ) ||
            area.includes(
              query,
            ) ||
            zone.includes(
              query,
            )
          );
        },
      );

    if (
      matched?.pricePerSqm
    ) {
      const computed =
        Math.round(
          Number(
            matched.pricePerSqm,
          ) *
            size,
        );

      setMarketPrice(
        String(
          computed,
        ),
      );

      setDetectedNeighborhood(
        matched.name,
      );
    } else {
      setDetectedNeighborhood(
        "",
      );

      setMarketPrice(
        "",
      );
    }

    setLoadingMarketPrice(
      false,
    );
  }, [
    location,
    sizeInput,
    neighborhoods,
    marketDataLocked,
  ]);

  /* ============================================================
     RESULTS
  ============================================================ */

  const results =
    useMemo(() => {
      const asking =
        parseNumber(
          askingPrice,
        );

      const market =
        parseNumber(
          marketPrice,
        );

      const size =
        parseNumber(
          sizeInput,
        );

      const askingPerSqm =
        size > 0
          ? asking /
            size
          : 0;

      const marketPerSqm =
        size > 0
          ? market /
            size
          : 0;

      const difference =
        asking -
        market;

      const variancePct =
        market > 0
          ? (difference /
              market) *
            100
          : 0;

      let verdict =
        "Fairly priced";

      let badgeText =
        "Reasonable";

      let explanation =
        "The asking price is close to the estimated market value.";

      let status:
        | "fair"
        | "high"
        | "low"
        | "incomplete" =
        "fair";

      if (
        market === 0
      ) {
        verdict =
          "Waiting for market data";

        badgeText =
          "Incomplete";

        explanation =
          "We need neighborhood market data to compare this asking price properly.";

        status =
          "incomplete";
      } else if (
        variancePct >
        8
      ) {
        verdict =
          "Overpriced";

        badgeText =
          "Negotiation advised";

        explanation =
          "The asking price is meaningfully above the estimated market value.";

        status =
          "high";
      } else if (
        variancePct <
        -6
      ) {
        verdict =
          "Below market";

        badgeText =
          "Potential opportunity";

        explanation =
          "The asking price is below the estimated market value and may be attractive.";

        status =
          "low";
      }

      return {
        asking,
        market,
        size,
        askingPerSqm,
        marketPerSqm,
        difference,
        variancePct,
        verdict,
        badgeText,
        explanation,
        status,
      };
    }, [
      askingPrice,
      marketPrice,
      sizeInput,
    ]);

  const hasUserInput =
    askingPrice !== "" ||
    marketPrice !== "" ||
    sizeInput !== "" ||
    location !== "";

  /* ============================================================
     CREATE REQUEST
  ============================================================ */

  async function handleCreateBuyerRequest() {
    const token =
      await getToken();

    const user =
      await getStoredUser<AuthUser>();

    if (
      !token ||
      !user
    ) {
      Alert.alert(
        "Login required",
        "Please sign in as a buyer.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text: "Sign in",
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
        "Only buyers can create requests.",
      );

      return;
    }

    if (
      !location.trim() ||
      !askingPrice.trim() ||
      !sizeInput.trim()
    ) {
      Alert.alert(
        "Missing information",
        "Please enter location, asking price and property size.",
      );

      return;
    }

    if (
      !marketPrice.trim() ||
      results.market <= 0
    ) {
      Alert.alert(
        "Market value required",
        "Please enter or auto-detect the estimated market value.",
      );

      return;
    }

    try {
      setSavingRequest(
        true,
      );

      const lead =
        await createLeadFromPriceChecker(
          token,
          {
            location,

            askingPrice,

            marketPrice,

            size:
              sizeInput,

            verdict:
              results.verdict,

            variancePct:
              results.variancePct.toFixed(
                1,
              ),
          },
        );

      Alert.alert(
        lead.alreadyExists
          ? "Request already exists"
          : "Buyer request created",

        lead.alreadyExists
          ? "This price checker request is already available in My Requests."
          : "Your price checker request was created successfully and is ready for matching.",

        [
          {
            text:
              "View Requests",

            onPress: () =>
              router.push(
                "/(tabs)/requests",
              ),
          },

          {
            text:
              "OK",
          },
        ],
      );
    } catch (err) {
      Alert.alert(
        "Unable to create request",
        err instanceof Error
          ? err.message
          : "Please try again later.",
      );
    } finally {
      setSavingRequest(
        false,
      );
    }
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="large"
          color="#2B77D8"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading market data...
        </Text>
      </SafeAreaView>
    );
  }

  /* ============================================================
     UI
  ============================================================ */

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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.content
        }
      >
        {/* TOP BAR */}

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
              styles.iconButton
            }
          >
            <ArrowLeft
              size={21}
              color={
                Colors.navyDark
              }
            />
          </Pressable>

          <Pressable
            onPress={
              openMenu
            }
            style={
              styles.menuButton
            }
          >
            <Text
              style={
                styles.menuText
              }
            >
              Menu
            </Text>
          </Pressable>
        </View>

        {/* HERO */}

        <View
          style={
            styles.hero
          }
        >
          <View
            style={
              styles.heroIcon
            }
          >
            <TrendingUp
              size={24}
              color="#2B77D8"
            />
          </View>

          <Text
            style={
              styles.eyebrow
            }
          >
            MARKET ANALYSIS
          </Text>

          <Text
            style={
              styles.title
            }
          >
            Price Checker
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Compare a property asking price against neighborhood market data and see whether the listing appears fairly priced.
          </Text>
        </View>

        {/* ERROR */}

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
              {error}
            </Text>
          </View>
        ) : null}

        {/* INPUTS */}

        <View
          style={
            styles.formCard
          }
        >
          <Text
            style={
              styles.formEyebrow
            }
          >
            INPUTS
          </Text>

          <Text
            style={
              styles.formTitle
            }
          >
            Compare the numbers
          </Text>

          <Text
            style={
              styles.formDescription
            }
          >
            Market value can be estimated automatically from the Neighborhood Finder dataset.
          </Text>

          <Field
            label="Location"
            value={
              location
            }
            onChangeText={(
              value,
            ) => {
              setLocation(
                value,
              );

              setMarketDataLocked(
                false,
              );

              setDetectedNeighborhood(
                "",
              );

              setMarketPrice(
                "",
              );
            }}
            placeholder="Example: Cascais"
            icon={
              MapPin
            }
            keyboardType="default"
          />

          {loadingMarketPrice ? (
            <Text
              style={
                styles.helper
              }
            >
              Loading market data...
            </Text>
          ) : detectedNeighborhood ? (
            <View
              style={
                styles.detectedBox
              }
            >
              <CheckCircle2
                size={15}
                color="#15803D"
              />

              <Text
                style={
                  styles.detectedText
                }
              >
                Market value estimated from{" "}
                {
                  detectedNeighborhood
                }
                .
              </Text>
            </View>
          ) : null}

          <Field
            label="Asking price"
            value={
              askingPrice
            }
            onChangeText={
              setAskingPrice
            }
            placeholder="Example: 595000"
            prefix="€"
            keyboardType="numeric"
          />

          <Field
            label="Property size"
            value={
              sizeInput
            }
            onChangeText={(
              value,
            ) => {
              setSizeInput(
                value,
              );

              setMarketDataLocked(
                false,
              );

              setMarketPrice(
                "",
              );
            }}
            placeholder="Example: 120"
            suffix="m²"
            icon={
              Ruler
            }
            keyboardType="numeric"
          />

          <Field
            label="Estimated market value"
            value={
              marketPrice
            }
            onChangeText={(
              value,
            ) => {
              setMarketPrice(
                value,
              );

              setMarketDataLocked(
                true,
              );
            }}
            placeholder="Auto-detected or manual"
            prefix="€"
            keyboardType="numeric"
          />

          <Text
            style={
              styles.manualHint
            }
          >
            You can override the automatically estimated market value manually.
          </Text>
        </View>

        {/* VERDICT */}

        <View
          style={[
            styles.verdictCard,
            results.status ===
              "high" &&
              styles.verdictHigh,

            results.status ===
              "low" &&
              styles.verdictLow,

            results.status ===
              "fair" &&
              styles.verdictFair,

            results.status ===
              "incomplete" &&
              styles.verdictIncomplete,
          ]}
        >
          <View
            style={
              styles.verdictTop
            }
          >
            <View
              style={
                styles.verdictIcon
              }
            >
              <BarChart3
                size={22}
                color="#FFFFFF"
              />
            </View>

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.verdictEyebrow
                }
              >
                PRICE VERDICT
              </Text>

              <Text
                style={
                  styles.verdictTitle
                }
              >
                {hasUserInput
                  ? results.verdict
                  : "Waiting for your data"}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.verdictPrices
            }
          >
            <View
              style={
                styles.verdictPrice
              }
            >
              <Text
                style={
                  styles.verdictLabel
                }
              >
                Asking price
              </Text>

              <Text
                style={
                  styles.verdictValue
                }
              >
                {hasUserInput
                  ? formatEuro(
                      results.asking,
                    )
                  : "—"}
              </Text>
            </View>

            <View
              style={
                styles.verdictDivider
              }
            />

            <View
              style={
                styles.verdictPrice
              }
            >
              <Text
                style={
                  styles.verdictLabel
                }
              >
                Market value
              </Text>

              <Text
                style={
                  styles.verdictValue
                }
              >
                {hasUserInput
                  ? formatEuro(
                      results.market,
                    )
                  : "—"}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.verdictBadge
            }
          >
            <Text
              style={
                styles.verdictBadgeText
              }
            >
              {hasUserInput
                ? results.badgeText
                : "Incomplete"}
            </Text>
          </View>

          <Text
            style={
              styles.verdictExplanation
            }
          >
            {hasUserInput
              ? results.explanation
              : "Enter property and market information to generate a comparison."}
          </Text>
        </View>

        {/* COMPARISON */}

        <SectionHeader
          eyebrow="COMPARISON"
          title="Price comparison summary"
          description="Understand both the absolute difference and price per square metre."
        />

        <View
          style={
            styles.metricsGrid
          }
        >
          <MetricCard
            label="Asking / m²"
            value={
              results.size > 0
                ? `${formatEuro(
                    results.askingPerSqm,
                  )}/m²`
                : "—"
            }
          />

          <MetricCard
            label="Market / m²"
            value={
              results.size >
                0 &&
              results.market >
                0
                ? `${formatEuro(
                    results.marketPerSqm,
                  )}/m²`
                : "—"
            }
          />

          <MetricCard
            label="Difference"
            value={
              hasUserInput
                ? formatEuro(
                    results.difference,
                  )
                : "—"
            }
          />

          <MetricCard
            label="Variance"
            value={
              results.market >
              0
                ? `${results.variancePct > 0 ? "+" : ""}${results.variancePct.toFixed(
                    1,
                  )}%`
                : "—"
            }
          />
        </View>

        <View
          style={
            styles.summaryCard
          }
        >
          <ResultRow
            label="Location"
            value={
              location ||
              "Not provided"
            }
          />

          <ResultRow
            label="Property size"
            value={
              results.size >
              0
                ? `${results.size} m²`
                : "—"
            }
          />

          <ResultRow
            label="Asking price"
            value={
              hasUserInput
                ? formatEuro(
                    results.asking,
                  )
                : "—"
            }
          />

          <ResultRow
            label="Estimated market value"
            value={
              results.market >
              0
                ? formatEuro(
                    results.market,
                  )
                : "—"
            }
          />

          <ResultRow
            label="Difference"
            value={
              hasUserInput
                ? formatEuro(
                    results.difference,
                  )
                : "—"
            }
          />

          <ResultRow
            label="Verdict"
            value={
              hasUserInput
                ? results.verdict
                : "—"
            }
            strong
          />
        </View>

        {/* REQUEST */}

        {results.market >
          0 &&
        results.asking >
          0 &&
        results.size >
          0 &&
        location.trim() ? (
          <View
            style={
              styles.requestCard
            }
          >
            <Search
              size={23}
              color="#2B77D8"
            />

            <Text
              style={
                styles.requestEyebrow
              }
            >
              NEXT STEP
            </Text>

            <Text
              style={
                styles.requestTitle
              }
            >
              Want professional advice on this property?
            </Text>

            <Text
              style={
                styles.requestText
              }
            >
              Create a buyer request from this price analysis and continue to professional matching.
            </Text>

            <Pressable
              disabled={
                savingRequest
              }
              onPress={() =>
                void handleCreateBuyerRequest()
              }
              style={[
                styles.requestButton,

                savingRequest &&
                  styles.requestButtonDisabled,
              ]}
            >
              {savingRequest ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Text
                    style={
                      styles.requestButtonText
                    }
                  >
                    Create Buyer Request
                  </Text>

                  <Text
                    style={
                      styles.requestButtonSubtext
                    }
                  >
                    Continue to matching
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* TRUST */}

        <View
          style={
            styles.notice
          }
        >
          <ShieldCheck
            size={20}
            color={
              Colors.gold
            }
          />

          <Text
            style={
              styles.noticeText
            }
          >
            Market estimates use neighborhood data stored in your platform and should be considered indicative, not a formal valuation.
          </Text>
        </View>

        <View
          style={{
            height: 34,
          }}
        />
      </ScrollView>

      <AppMenu
        visible={
          menuVisible
        }
        onClose={
          closeMenu
        }
        user={
          menuUser
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

/* ============================================================
   COMPONENTS
============================================================ */

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  prefix,
  suffix,
  icon: Icon,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText:
    (
      value: string,
    ) => void;
  placeholder: string;
  prefix?: string;
  suffix?: string;
  icon?:
    React.ComponentType<any>;
  keyboardType:
    "default" |
    "numeric";
}) {
  return (
    <View
      style={
        styles.field
      }
    >
      <Text
        style={
          styles.fieldLabel
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.inputWrapper
        }
      >
        {Icon ? (
          <Icon
            size={17}
            color="#667085"
          />
        ) : null}

        {prefix ? (
          <Text
            style={
              styles.affix
            }
          >
            {prefix}
          </Text>
        ) : null}

        <TextInput
          value={value}
          onChangeText={
            onChangeText
          }
          placeholder={
            placeholder
          }
          placeholderTextColor="#98A2B3"
          keyboardType={
            keyboardType
          }
          style={
            styles.input
          }
        />

        {suffix ? (
          <Text
            style={
              styles.affix
            }
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
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

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.metricCard
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

function ResultRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View
      style={
        styles.resultRow
      }
    >
      <Text
        style={[
          styles.resultLabel,

          strong &&
            styles.strongText,
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.resultValue,

          strong &&
            styles.strongText,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#F6F7F9",
    },

    center: {
      flex: 1,
      backgroundColor:
        "#F6F7F9",
      alignItems: "center",
      justifyContent:
        "center",
    },

    loadingText: {
      marginTop: 12,
      color:
        Colors.textSecondary,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 14,
    },

    topBar: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    iconButton: {
      width: 46,
      height: 46,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    menuButton: {
      minHeight: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 15,
      alignItems: "center",
      justifyContent:
        "center",
    },

    menuText: {
      color:
        Colors.navy,
      fontSize: 12,
      fontWeight: "800",
    },

    hero: {
      marginTop: 26,
    },

    heroIcon: {
      width: 50,
      height: 50,
      borderRadius: 17,
      backgroundColor:
        "#EFF6FF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    eyebrow: {
      marginTop: 16,
      color: "#2B77D8",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.2,
    },

    title: {
      marginTop: 7,
      color:
        Colors.navyDark,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "900",
      letterSpacing: -1,
    },

    subtitle: {
      marginTop: 9,
      color:
        Colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
    },

    errorBox: {
      marginTop: 15,
      borderRadius: 14,
      backgroundColor:
        "#FEF2F2",
      padding: 13,
    },

    errorText: {
      color: "#B42318",
      fontSize: 11,
    },

    formCard: {
      marginTop: 24,
      borderRadius: 24,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      backgroundColor:
        "#FFFFFF",
      padding: 18,
    },

    formEyebrow: {
      color: "#2B77D8",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
    },

    formTitle: {
      marginTop: 6,
      color:
        Colors.navyDark,
      fontSize: 21,
      fontWeight: "900",
    },

    formDescription: {
      marginTop: 7,
      color:
        Colors.textSecondary,
      fontSize: 11,
      lineHeight: 18,
    },

    field: {
      marginTop: 19,
    },

    fieldLabel: {
      color:
        Colors.navyDark,
      fontSize: 11,
      fontWeight: "900",
    },

    inputWrapper: {
      marginTop: 8,
      minHeight: 54,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      backgroundColor:
        "#FCFCFD",
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 13,
    },

    input: {
      flex: 1,
      color:
        Colors.navyDark,
      fontSize: 14,
    },

    affix: {
      color: "#667085",
      fontWeight: "800",
    },

    helper: {
      marginTop: 8,
      color: "#667085",
      fontSize: 9,
    },

    detectedBox: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    detectedText: {
      color: "#15803D",
      fontSize: 9,
      fontWeight: "700",
    },

    manualHint: {
      marginTop: 7,
      color: "#98A2B3",
      fontSize: 9,
      lineHeight: 14,
    },

    verdictCard: {
      marginTop: 18,
      borderRadius: 24,
      padding: 19,
    },

    verdictHigh: {
      backgroundColor:
        "#B42318",
    },

    verdictLow: {
      backgroundColor:
        "#1D4ED8",
    },

    verdictFair: {
      backgroundColor:
        "#287B2B",
    },

    verdictIncomplete: {
      backgroundColor:
        "#667085",
    },

    verdictTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    verdictIcon: {
      width: 43,
      height: 43,
      borderRadius: 14,
      backgroundColor:
        "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent:
        "center",
    },

    verdictEyebrow: {
      color:
        "rgba(255,255,255,0.75)",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
    },

    verdictTitle: {
      marginTop: 3,
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "900",
    },

    verdictPrices: {
      marginTop: 19,
      flexDirection: "row",
      alignItems:
        "center",
    },

    verdictPrice: {
      flex: 1,
    },

    verdictLabel: {
      color:
        "rgba(255,255,255,0.7)",
      fontSize: 9,
    },

    verdictValue: {
      marginTop: 4,
      color: "#FFFFFF",
      fontSize: 22,
      fontWeight: "900",
    },

    verdictDivider: {
      width: 1,
      height: 43,
      backgroundColor:
        "rgba(255,255,255,0.17)",
      marginHorizontal: 10,
    },

    verdictBadge: {
      marginTop: 18,
      alignSelf:
        "flex-start",
      borderRadius: 999,
      backgroundColor:
        "rgba(255,255,255,0.14)",
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    verdictBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "800",
    },

    verdictExplanation: {
      marginTop: 11,
      color:
        "rgba(255,255,255,0.85)",
      fontSize: 10,
      lineHeight: 17,
    },

    sectionHeader: {
      marginTop: 29,
      marginBottom: 14,
    },

    sectionEyebrow: {
      color: "#2B77D8",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
    },

    sectionTitle: {
      marginTop: 5,
      color:
        Colors.navyDark,
      fontSize: 22,
      fontWeight: "900",
    },

    sectionDescription: {
      marginTop: 5,
      color:
        Colors.textSecondary,
      fontSize: 10,
      lineHeight: 17,
    },

    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },

    metricCard: {
      width: "48%",
      minHeight: 92,
      borderRadius: 18,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      padding: 14,
      justifyContent:
        "center",
    },

    metricLabel: {
      color:
        Colors.textSecondary,
      fontSize: 9,
    },

    metricValue: {
      marginTop: 5,
      color:
        Colors.navyDark,
      fontSize: 15,
      fontWeight: "900",
    },

    summaryCard: {
      marginTop: 12,
      borderRadius: 21,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      padding: 16,
    },

    resultRow: {
      minHeight: 46,
      borderBottomWidth: 1,
      borderBottomColor:
        "#F2F4F7",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
    },

    resultLabel: {
      flex: 1,
      color:
        Colors.textSecondary,
      fontSize: 10,
    },

    resultValue: {
      maxWidth: "55%",
      textAlign: "right",
      color:
        Colors.navyDark,
      fontSize: 10,
      fontWeight: "800",
    },

    strongText: {
      color:
        Colors.navyDark,
      fontSize: 12,
      fontWeight: "900",
    },

    requestCard: {
      marginTop: 18,
      borderRadius: 24,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#DCE6F7",
      padding: 18,
    },

    requestEyebrow: {
      marginTop: 12,
      color: "#2B77D8",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
    },

    requestTitle: {
      marginTop: 6,
      color:
        Colors.navyDark,
      fontSize: 18,
      fontWeight: "900",
    },

    requestText: {
      marginTop: 6,
      color:
        Colors.textSecondary,
      fontSize: 10,
      lineHeight: 17,
    },

    requestButton: {
      marginTop: 15,
      minHeight: 60,
      borderRadius: 17,
      backgroundColor:
        Colors.navy,
      alignItems: "center",
      justifyContent:
        "center",
    },

    requestButtonDisabled: {
      opacity: 0.65,
    },

    requestButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "900",
    },

    requestButtonSubtext: {
      marginTop: 3,
      color: "#D0D5DD",
      fontSize: 9,
      fontWeight: "600",
    },

    notice: {
      marginTop: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#F3E6AD",
      backgroundColor:
        "#FFFBEB",
      padding: 15,
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 10,
    },

    noticeText: {
      flex: 1,
      color:
        Colors.textSecondary,
      fontSize: 10,
      lineHeight: 17,
    },
  });