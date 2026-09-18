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
  useMemo,
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
  CheckCircle2,
  Home,
  MapPin,
  Ruler,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";

import AppMenu from "@/components/AppMenu";
import { useAppMenu } from "@/hooks/useAppMenu";

import {
  createLeadFromPropertyValuation,
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

type ConditionType =
  | "renovated"
  | "good"
  | "needs_work";

type PropertyType =
  | "apartment"
  | "house"
  | "penthouse"
  | "villa";

const PROPERTY_TYPES: {
  value: PropertyType;
  label: string;
}[] = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "penthouse", label: "Penthouse" },
  { value: "villa", label: "Villa" },
];

const CONDITIONS: {
  value: ConditionType;
  label: string;
}[] = [
  { value: "renovated", label: "Renovated" },
  { value: "good", label: "Good" },
  { value: "needs_work", label: "Needs work" },
];

function parseNumber(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parsed = Number(cleaned);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function getConditionMultiplier(
  condition: ConditionType,
) {
  if (condition === "renovated") {
    return 1.08;
  }

  if (condition === "good") {
    return 1;
  }

  return 0.9;
}

function getPropertyTypeMultiplier(
  type: PropertyType,
) {
  if (type === "penthouse") {
    return 1.12;
  }

  if (type === "villa") {
    return 1.1;
  }

  if (type === "house") {
    return 1.04;
  }

  return 1;
}

function getLocationMultiplier(
  location: string,
) {
  const value =
    location.toLowerCase();

  if (value.includes("cascais")) {
    return 1.12;
  }

  if (value.includes("estoril")) {
    return 1.1;
  }

  if (
    value.includes("príncipe real") ||
    value.includes("principe real")
  ) {
    return 1.13;
  }

  if (value.includes("estrela")) {
    return 1.09;
  }

  if (
    value.includes("lisbon") ||
    value.includes("lisboa")
  ) {
    return 1.05;
  }

  if (value.includes("sintra")) {
    return 0.92;
  }

  if (value.includes("amadora")) {
    return 0.88;
  }

  if (value.includes("benfica")) {
    return 0.96;
  }

  if (value.includes("oeiras")) {
    return 1.03;
  }

  return 1;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat(
    "en-IE",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    },
  ).format(value || 0);
}

function formatPercent(value: number) {
  const rounded =
    Math.round(value * 10) / 10;

  return `${
    rounded > 0 ? "+" : ""
  }${rounded}%`;
}

export default function PropertyValuationScreen() {
  const {
    menuVisible,
    menuUser,
    savedCount,
    unreadMessages,
    openMenu,
    closeMenu,
  } = useAppMenu();

  const [
    askingPrice,
    setAskingPrice,
  ] = useState("");

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    propertyType,
    setPropertyType,
  ] =
    useState<PropertyType>(
      "apartment",
    );

  const [
    condition,
    setCondition,
  ] =
    useState<ConditionType>(
      "good",
    );

  const [
    sizeInput,
    setSizeInput,
  ] = useState("");

  const [
    bedrooms,
    setBedrooms,
  ] = useState("");

  const [
    bathrooms,
    setBathrooms,
  ] = useState("");

  const [
    floorLevel,
    setFloorLevel,
  ] = useState("2");

  const [
    savingRequest,
    setSavingRequest,
  ] = useState(false);

  const valuation =
    useMemo(() => {
      const size =
        parseNumber(
          sizeInput,
        );

      const price =
        parseNumber(
          askingPrice,
        );

      const beds =
        parseNumber(
          bedrooms,
        );

      const baths =
        parseNumber(
          bathrooms,
        );

      const floor =
        parseNumber(
          floorLevel,
        );

      const basePricePerSqm =
        4300;

      const conditionAdj =
        getConditionMultiplier(
          condition,
        );

      const typeAdj =
        getPropertyTypeMultiplier(
          propertyType,
        );

      const bedroomAdj =
        beds >= 3
          ? 1.03
          : 1;

      const bathroomAdj =
        baths >= 2
          ? 1.02
          : 1;

      const floorAdj =
        floor >= 3
          ? 1.02
          : 1;

      const locationAdj =
        getLocationMultiplier(
          address,
        );

      const estimatedPsm =
        basePricePerSqm *
        conditionAdj *
        typeAdj *
        bedroomAdj *
        bathroomAdj *
        floorAdj *
        locationAdj;

      const marketValue =
        size > 0
          ? size *
            estimatedPsm
          : 0;

      const lowRange =
        marketValue * 0.94;

      const highRange =
        marketValue * 1.04;

      const variancePct =
        marketValue > 0
          ? ((price -
              marketValue) /
              marketValue) *
            100
          : 0;

      const averageAreaPsm =
        basePricePerSqm *
        locationAdj;

      const comparableLow =
        averageAreaPsm *
        0.96;

      const comparableHigh =
        averageAreaPsm *
        1.03;

      let verdict =
        "Fairly priced";

      let badgeText =
        "Reasonable";

      let status:
        | "fair"
        | "high"
        | "low" =
        "fair";

      if (
        variancePct > 8
      ) {
        verdict =
          "Overpriced";

        badgeText =
          "Negotiation advised";

        status =
          "high";
      } else if (
        variancePct < -6
      ) {
        verdict =
          "Potential opportunity";

        badgeText =
          "Below market";

        status =
          "low";
      }

      return {
        size,
        price,
        marketValue,
        lowRange,
        highRange,
        variancePct,
        verdict,
        badgeText,
        status,
        estimatedPsm,
        averageAreaPsm,
        comparableLow,
        comparableHigh,
      };
    }, [
      sizeInput,
      askingPrice,
      condition,
      propertyType,
      bedrooms,
      bathrooms,
      floorLevel,
      address,
    ]);

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
        "Please sign in as a Buyer to create a valuation request.",
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
        "Only Buyer accounts can create valuation requests.",
      );

      return;
    }

    if (
      !address.trim() ||
      !sizeInput.trim() ||
      !askingPrice.trim()
    ) {
      Alert.alert(
        "Missing information",
        "Please enter the address, property size and asking price before creating a request.",
      );

      return;
    }

    if (
      valuation.marketValue <=
      0
    ) {
      Alert.alert(
        "Invalid valuation",
        "Please check the property size and asking price.",
      );

      return;
    }

    try {
      setSavingRequest(true);

      const lead =
        await createLeadFromPropertyValuation(
          token,
          {
            address:
              address.trim(),

            propertyType,

            condition,

            size:
              sizeInput,

            askingPrice,

            bedrooms,

            bathrooms,

            floorLevel,

            estimatedValue:
              String(
                Math.round(
                  valuation.marketValue,
                ),
              ),

            valuationRange:
              `${Math.round(
                valuation.lowRange,
              )} - ${Math.round(
                valuation.highRange,
              )}`,

            verdict:
              valuation.verdict,
          },
        );

      Alert.alert(
        lead.alreadyExists
          ? "Request already exists"
          : "Valuation request created",

        lead.alreadyExists
          ? "This valuation request is already available in My Requests."
          : "Your valuation request has been created and is ready for matching.",

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
            text: "OK",
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
      setSavingRequest(false);
    }
  }

  function resetForm() {
    setAskingPrice("");
    setAddress("");
    setPropertyType(
      "apartment",
    );
    setCondition("good");
    setSizeInput("");
    setBedrooms("");
    setBathrooms("");
    setFloorLevel("2");
  }

  const hasValuation =
    valuation.marketValue >
      0 &&
    valuation.size > 0;

  return (
    <SafeAreaView
      edges={["top"]}
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
            <Sparkles
              size={24}
              color="#7B26B8"
            />
          </View>

          <Text
            style={
              styles.eyebrow
            }
          >
            SMART MARKET ESTIMATE
          </Text>

          <Text
            style={
              styles.title
            }
          >
            Property Valuation
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Estimate a property's market value from its location, size, condition and key characteristics.
          </Text>
        </View>

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
            PROPERTY DETAILS
          </Text>

          <Text
            style={
              styles.formTitle
            }
          >
            Describe the property
          </Text>

          <Field
            label="Address or area"
            value={address}
            onChangeText={
              setAddress
            }
            placeholder="Example: Cascais"
            icon={MapPin}
            keyboardType="default"
          />

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

          <Text
            style={
              styles.fieldLabel
            }
          >
            Property type
          </Text>

          <View
            style={
              styles.optionGrid
            }
          >
            {PROPERTY_TYPES.map(
              (
                option,
              ) => (
                <OptionButton
                  key={
                    option.value
                  }
                  label={
                    option.label
                  }
                  active={
                    propertyType ===
                    option.value
                  }
                  onPress={() =>
                    setPropertyType(
                      option.value,
                    )
                  }
                />
              ),
            )}
          </View>

          <Text
            style={[
              styles.fieldLabel,
              {
                marginTop: 20,
              },
            ]}
          >
            Condition
          </Text>

          <View
            style={
              styles.optionGrid
            }
          >
            {CONDITIONS.map(
              (
                option,
              ) => (
                <OptionButton
                  key={
                    option.value
                  }
                  label={
                    option.label
                  }
                  active={
                    condition ===
                    option.value
                  }
                  onPress={() =>
                    setCondition(
                      option.value,
                    )
                  }
                />
              ),
            )}
          </View>

          <Field
            label="Property size"
            value={
              sizeInput
            }
            onChangeText={
              setSizeInput
            }
            placeholder="Example: 120"
            suffix="m²"
            icon={Ruler}
            keyboardType="numeric"
          />

          <View
            style={
              styles.inlineFields
            }
          >
            <View
              style={{
                flex: 1,
              }}
            >
              <Field
                label="Bedrooms"
                value={
                  bedrooms
                }
                onChangeText={
                  setBedrooms
                }
                placeholder="3"
                icon={
                  BedDouble
                }
                keyboardType="numeric"
              />
            </View>

            <View
              style={{
                flex: 1,
              }}
            >
              <Field
                label="Bathrooms"
                value={
                  bathrooms
                }
                onChangeText={
                  setBathrooms
                }
                placeholder="2"
                icon={Bath}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Field
            label="Floor level"
            value={
              floorLevel
            }
            onChangeText={
              setFloorLevel
            }
            placeholder="2"
            icon={Building2}
            keyboardType="numeric"
          />

          <Pressable
            onPress={
              resetForm
            }
            style={
              styles.resetButton
            }
          >
            <Text
              style={
                styles.resetButtonText
              }
            >
              Reset form
            </Text>
          </Pressable>
        </View>

        {hasValuation ? (
          <>
            <View
              style={[
                styles.valuationCard,

                valuation.status ===
                  "high" &&
                  styles.valuationHigh,

                valuation.status ===
                  "low" &&
                  styles.valuationLow,

                valuation.status ===
                  "fair" &&
                  styles.valuationFair,
              ]}
            >
              <Text
                style={
                  styles.valuationEyebrow
                }
              >
                ESTIMATED VALUE
              </Text>

              <Text
                style={
                  styles.valuationValue
                }
              >
                {formatEuro(
                  valuation.lowRange,
                )}
                {" — "}
                {formatEuro(
                  valuation.highRange,
                )}
              </Text>

              <Text
                style={
                  styles.valuationCenter
                }
              >
                Mid estimate:{" "}
                {formatEuro(
                  valuation.marketValue,
                )}
              </Text>

              <View
                style={
                  styles.valuationBadge
                }
              >
                <Text
                  style={
                    styles.valuationBadgeText
                  }
                >
                  {
                    valuation.badgeText
                  }
                </Text>
              </View>

              <Text
                style={
                  styles.valuationVerdict
                }
              >
                {
                  valuation.verdict
                }
              </Text>
            </View>

            <View
              style={
                styles.metricsGrid
              }
            >
              <MetricCard
                label="Estimated / m²"
                value={`${formatEuro(
                  valuation.estimatedPsm,
                )}/m²`}
              />

              <MetricCard
                label="Area average"
                value={`${formatEuro(
                  valuation.averageAreaPsm,
                )}/m²`}
              />

              <MetricCard
                label="Comparable low"
                value={`${formatEuro(
                  valuation.comparableLow,
                )}/m²`}
              />

              <MetricCard
                label="Comparable high"
                value={`${formatEuro(
                  valuation.comparableHigh,
                )}/m²`}
              />
            </View>

            <View
              style={
                styles.summaryCard
              }
            >
              <ResultRow
                label="Address"
                value={
                  address ||
                  "Not provided"
                }
              />

              <ResultRow
                label="Property type"
                value={
                  propertyType
                }
              />

              <ResultRow
                label="Condition"
                value={
                  condition.replace(
                    "_",
                    " ",
                  )
                }
              />

              <ResultRow
                label="Size"
                value={`${valuation.size} m²`}
              />

              <ResultRow
                label="Asking price"
                value={formatEuro(
                  valuation.price,
                )}
              />

              <ResultRow
                label="Estimated value"
                value={formatEuro(
                  valuation.marketValue,
                )}
              />

              <ResultRow
                label="Variance"
                value={formatPercent(
                  valuation.variancePct,
                )}
              />

              <ResultRow
                label="Verdict"
                value={
                  valuation.verdict
                }
                strong
              />
            </View>

            <View
              style={
                styles.marketContext
              }
            >
              {valuation.variancePct >
              8 ? (
                <TrendingUp
                  size={21}
                  color="#B42318"
                />
              ) : valuation.variancePct <
                -6 ? (
                <TrendingDown
                  size={21}
                  color="#1D4ED8"
                />
              ) : (
                <CheckCircle2
                  size={21}
                  color="#287B2B"
                />
              )}

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.marketContextTitle
                  }
                >
                  Market context
                </Text>

                <Text
                  style={
                    styles.marketContextText
                  }
                >
                  {valuation.variancePct >
                  8
                    ? "The asking price is above the platform estimate, suggesting potential room for negotiation."
                    : valuation.variancePct <
                      -6
                    ? "The asking price is below the estimated market value and may represent an opportunity."
                    : "The asking price is reasonably close to the estimated market value."}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.requestCard
              }
            >
              <Sparkles
                size={23}
                color="#7B26B8"
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
                Need help evaluating this property?
              </Text>

              <Text
                style={
                  styles.requestText
                }
              >
                Create a valuation request and continue to professional matching.
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
                      Create Valuation Request
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
          </>
        ) : (
          <View
            style={
              styles.emptyResult
            }
          >
            <Home
              size={28}
              color="#7B26B8"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              Enter property details
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Add the address and property size to generate the valuation estimate.
            </Text>
          </View>
        )}

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
            This tool provides an indicative platform estimate and does not replace a formal bank or chartered surveyor valuation.
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

function OptionButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={[
        styles.optionButton,

        active &&
          styles.optionButtonActive,
      ]}
    >
      <Text
        style={[
          styles.optionButtonText,

          active &&
            styles.optionButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

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
    (value: string) => void;
  placeholder: string;
  prefix?: string;
  suffix?: string;
  icon?: React.ComponentType<any>;
  keyboardType:
    | "default"
    | "numeric";
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
            styles.strong,
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.resultValue,

          strong &&
            styles.strong,
        ]}
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
      backgroundColor: "#F6F7F9",
    },
    content: {
      paddingHorizontal: 18,
      paddingTop: 14,
    },
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    iconButton: {
      width: 46,
      height: 46,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#EAECF0",
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    menuButton: {
      minHeight: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#EAECF0",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    menuText: {
      color: Colors.navy,
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
      backgroundColor: "#F5F3FF",
      alignItems: "center",
      justifyContent: "center",
    },
    eyebrow: {
      marginTop: 16,
      color: "#7B26B8",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.2,
    },
    title: {
      marginTop: 7,
      color: Colors.navyDark,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "900",
      letterSpacing: -1,
    },
    subtitle: {
      marginTop: 9,
      color: Colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
    },
    formCard: {
      marginTop: 24,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#EAECF0",
      backgroundColor: "#FFFFFF",
      padding: 18,
    },
    formEyebrow: {
      color: "#7B26B8",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
    },
    formTitle: {
      marginTop: 6,
      color: Colors.navyDark,
      fontSize: 21,
      fontWeight: "900",
    },
    field: {
      marginTop: 19,
    },
    fieldLabel: {
      color: Colors.navyDark,
      fontSize: 11,
      fontWeight: "900",
    },
    inputWrapper: {
      marginTop: 8,
      minHeight: 54,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: "#D0D5DD",
      backgroundColor: "#FCFCFD",
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 13,
    },
    input: {
      flex: 1,
      color: Colors.navyDark,
      fontSize: 14,
    },
    affix: {
      color: "#667085",
      fontWeight: "800",
    },
    optionGrid: {
      marginTop: 9,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    optionButton: {
      minHeight: 42,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#D0D5DD",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    optionButtonActive: {
      borderColor: "#7B26B8",
      backgroundColor: "#F5F3FF",
    },
    optionButtonText: {
      color: "#667085",
      fontSize: 10,
      fontWeight: "700",
    },
    optionButtonTextActive: {
      color: "#7B26B8",
      fontWeight: "900",
    },
    inlineFields: {
      flexDirection: "row",
      gap: 10,
    },
    resetButton: {
      marginTop: 20,
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#D0D5DD",
      alignItems: "center",
      justifyContent: "center",
    },
    resetButtonText: {
      color: Colors.navy,
      fontSize: 11,
      fontWeight: "800",
    },
    valuationCard: {
      marginTop: 18,
      borderRadius: 24,
      padding: 19,
    },
    valuationHigh: {
      backgroundColor: "#B42318",
    },
    valuationLow: {
      backgroundColor: "#1D4ED8",
    },
    valuationFair: {
      backgroundColor: "#287B2B",
    },
    valuationEyebrow: {
      color: "rgba(255,255,255,0.75)",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
    },
    valuationValue: {
      marginTop: 8,
      color: "#FFFFFF",
      fontSize: 27,
      fontWeight: "900",
      lineHeight: 34,
    },
    valuationCenter: {
      marginTop: 5,
      color: "rgba(255,255,255,0.8)",
      fontSize: 10,
    },
    valuationBadge: {
      marginTop: 15,
      alignSelf: "flex-start",
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.14)",
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    valuationBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "800",
    },
    valuationVerdict: {
      marginTop: 9,
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
    },
    metricsGrid: {
      marginTop: 12,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    metricCard: {
      width: "48%",
      minHeight: 92,
      borderRadius: 18,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#EAECF0",
      padding: 14,
      justifyContent: "center",
    },
    metricLabel: {
      color: Colors.textSecondary,
      fontSize: 9,
    },
    metricValue: {
      marginTop: 5,
      color: Colors.navyDark,
      fontSize: 15,
      fontWeight: "900",
    },
    summaryCard: {
      marginTop: 12,
      borderRadius: 21,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#EAECF0",
      padding: 16,
    },
    resultRow: {
      minHeight: 46,
      borderBottomWidth: 1,
      borderBottomColor: "#F2F4F7",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    resultLabel: {
      flex: 1,
      color: Colors.textSecondary,
      fontSize: 10,
    },
    resultValue: {
      maxWidth: "55%",
      textAlign: "right",
      color: Colors.navyDark,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "capitalize",
    },
    strong: {
      color: Colors.navyDark,
      fontSize: 12,
      fontWeight: "900",
    },
    marketContext: {
      marginTop: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#EAECF0",
      backgroundColor: "#FFFFFF",
      padding: 15,
      flexDirection: "row",
      gap: 10,
    },
    marketContextTitle: {
      color: Colors.navyDark,
      fontSize: 12,
      fontWeight: "900",
    },
    marketContextText: {
      marginTop: 4,
      color: Colors.textSecondary,
      fontSize: 10,
      lineHeight: 17,
    },
    requestCard: {
      marginTop: 18,
      borderRadius: 24,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7DDF4",
      padding: 18,
    },
    requestEyebrow: {
      marginTop: 11,
      color: "#7B26B8",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
    },
    requestTitle: {
      marginTop: 6,
      color: Colors.navyDark,
      fontSize: 18,
      fontWeight: "900",
    },
    requestText: {
      marginTop: 6,
      color: Colors.textSecondary,
      fontSize: 10,
      lineHeight: 17,
    },
    requestButton: {
      marginTop: 15,
      minHeight: 60,
      borderRadius: 17,
      backgroundColor: Colors.navy,
      alignItems: "center",
      justifyContent: "center",
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
    emptyResult: {
      marginTop: 18,
      minHeight: 155,
      borderRadius: 22,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: "#D0D5DD",
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      padding: 22,
    },
    emptyTitle: {
      marginTop: 10,
      color: Colors.navyDark,
      fontSize: 15,
      fontWeight: "900",
    },
    emptyText: {
      marginTop: 5,
      color: Colors.textSecondary,
      fontSize: 10,
      lineHeight: 17,
      textAlign: "center",
    },
    notice: {
      marginTop: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#F3E6AD",
      backgroundColor: "#FFFBEB",
      padding: 15,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    noticeText: {
      flex: 1,
      color: Colors.textSecondary,
      fontSize: 10,
      lineHeight: 17,
    },
  });
