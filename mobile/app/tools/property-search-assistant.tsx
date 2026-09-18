import {
  ActivityIndicator,
  Alert,
  Image,
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
  Check,
  CircleAlert,
  MapPin,
  Maximize,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react-native";

import AppMenu from "@/components/AppMenu";

import {
  useAppMenu,
} from "@/hooks/useAppMenu";

import {
  extractPropertySearch,
} from "@/lib/ai-api";

import {
  createLeadFromPropertySearch,
} from "@/lib/leads-api";

import type {
  MatchedProperty,
} from "@/lib/leads-api";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import {
  getAssetUrl,
} from "@/lib/api";

import type {
  AuthUser,
} from "@/types/auth";

import {
  Colors,
} from "@/constants/colors";

const PROPERTY_TYPES = [
  "apartment",
  "house",
  "villa",
  "penthouse",
];

const GOALS = [
  {
    value: "buy",
    label: "Buy to live",
  },
  {
    value: "invest",
    label: "Investment",
  },
  {
    value: "relocate",
    label: "Relocation",
  },
  {
    value: "retire",
    label: "Retirement",
  },
];

export default function PropertySearchAssistantScreen() {
  const {
    menuVisible,
    menuUser,
    savedCount,
    unreadMessages,
    openMenu,
    closeMenu,
  } = useAppMenu();

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    location,
    setLocation,
  ] = useState("");

  const [
    budget,
    setBudget,
  ] = useState("");

  const [
    propertyType,
    setPropertyType,
  ] = useState(
    "apartment",
  );

  const [
    bedrooms,
    setBedrooms,
  ] = useState("");

  const [
    goal,
    setGoal,
  ] = useState(
    "buy",
  );

  const [
    mustHave,
    setMustHave,
  ] = useState<
    string[]
  >([]);

  const [
    aiSummary,
    setAiSummary,
  ] = useState("");

  const [
    confidence,
    setConfidence,
  ] = useState<
    number | null
  >(null);

  const [
    extracting,
    setExtracting,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    matchingProperties,
    setMatchingProperties,
  ] = useState<
    MatchedProperty[]
  >([]);

  async function handleExtractWithAI() {
    if (
      !searchText.trim()
    ) {
      Alert.alert(
        "Search required",
        "Please describe what you are looking for.",
      );

      return;
    }

    try {
      setExtracting(
        true,
      );

      const extracted =
        await extractPropertySearch(
          searchText,
        );

      setLocation(
        extracted.location ||
          "",
      );

      setBudget(
        extracted.budget ||
          "",
      );

      setPropertyType(
        extracted.propertyType ||
          "apartment",
      );

      setBedrooms(
        extracted.bedrooms ||
          "",
      );

      setGoal(
        extracted.goal ||
          "buy",
      );

      setMustHave(
        extracted.mustHave ||
          [],
      );

      setAiSummary(
        extracted.summary ||
          "",
      );

      setConfidence(
        typeof extracted.confidence ===
          "number"
          ? extracted.confidence
          : null,
      );

      Alert.alert(
        "Search analyzed",
        "AI extracted the key search criteria successfully.",
      );
    } catch (err) {
      Alert.alert(
        "AI extraction failed",
        err instanceof Error
          ? err.message
          : "Please try again later.",
      );
    } finally {
      setExtracting(
        false,
      );
    }
  }

  async function handleCreateRequest() {
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
      !searchText.trim()
    ) {
      Alert.alert(
        "Search required",
        "Please describe what you are looking for.",
      );

      return;
    }

    try {
      setSaving(
        true,
      );

      setMatchingProperties(
        [],
      );

      const result =
        await createLeadFromPropertySearch(
          token,
          {
            searchText:
              searchText.trim(),

            location:
              location.trim() ||
              undefined,

            budget:
              budget.trim() ||
              undefined,

            propertyType:
              propertyType ||
              undefined,

            bedrooms:
              bedrooms
                ? Number(
                    bedrooms,
                  )
                : undefined,

            goal:
              goal ||
              undefined,

            mustHave,

            aiSummary:
              aiSummary ||
              undefined,

            confidence:
              confidence ??
              undefined,

            notificationsEnabled:
              true,
          },
        );

      if (
        result.found
      ) {
        setMatchingProperties(
          result.properties,
        );

        Alert.alert(
          "Properties found",
          `${result.properties.length} matching properties were found.`,
        );

        return;
      }

      if (
        result.alreadyExists
      ) {
        Alert.alert(
          "Search already exists",
          "This search request already exists in My Requests.",
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

        return;
      }

      Alert.alert(
        "Buyer request created",
        `${result.notifiedAgents} property agents have been notified.`,
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
      setSaving(
        false,
      );
    }
  }

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
              color="#6D28D9"
            />
          </View>

          <Text
            style={
              styles.eyebrow
            }
          >
            AI PROPERTY SEARCH
          </Text>

          <Text
            style={
              styles.title
            }
          >
            Tell us what you’re looking for
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Describe your ideal property in natural language. AI extracts the key criteria, then the platform searches for strong matching properties or creates a buyer request.
          </Text>
        </View>

        <View
          style={
            styles.formCard
          }
        >
          <Text
            style={
              styles.formTitle
            }
          >
            Describe your search
          </Text>

          <TextInput
            value={
              searchText
            }
            onChangeText={
              setSearchText
            }
            multiline
            textAlignVertical="top"
            placeholder="Example: I need a 3-bedroom apartment near metro in Lisbon under €550k..."
            placeholderTextColor="#98A2B3"
            style={
              styles.textArea
            }
          />

          <Pressable
            disabled={
              extracting
            }
            onPress={() =>
              void handleExtractWithAI()
            }
            style={[
              styles.aiButton,
              extracting &&
                styles.buttonDisabled,
            ]}
          >
            {extracting ? (
              <ActivityIndicator
                color="#6D28D9"
              />
            ) : (
              <>
                <WandSparkles
                  size={18}
                  color="#6D28D9"
                />

                <Text
                  style={
                    styles.aiButtonText
                  }
                >
                  Analyze with AI
                </Text>
              </>
            )}
          </Pressable>

          <Field
            label="Location"
            value={
              location
            }
            onChangeText={
              setLocation
            }
            placeholder="Lisbon"
            icon={MapPin}
            keyboardType="default"
          />

          <Field
            label="Budget"
            value={
              budget
            }
            onChangeText={
              setBudget
            }
            placeholder="550000"
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
              styles.chips
            }
          >
            {PROPERTY_TYPES.map(
              (
                type,
              ) => (
                <Chip
                  key={type}
                  label={
                    type
                  }
                  active={
                    propertyType ===
                    type
                  }
                  onPress={() =>
                    setPropertyType(
                      type,
                    )
                  }
                />
              ),
            )}
          </View>

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

          <Text
            style={[
              styles.fieldLabel,
              {
                marginTop: 19,
              },
            ]}
          >
            Main goal
          </Text>

          <View
            style={
              styles.chips
            }
          >
            {GOALS.map(
              (
                item,
              ) => (
                <Chip
                  key={
                    item.value
                  }
                  label={
                    item.label
                  }
                  active={
                    goal ===
                    item.value
                  }
                  onPress={() =>
                    setGoal(
                      item.value,
                    )
                  }
                />
              ),
            )}
          </View>

          {confidence !==
          null ? (
            <View
              style={
                styles.confidenceCard
              }
            >
              <Sparkles
                size={17}
                color="#6D28D9"
              />

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.confidenceLabel
                  }
                >
                  AI confidence
                </Text>

                <Text
                  style={
                    styles.confidenceValue
                  }
                >
                  {confidence}%
                </Text>
              </View>
            </View>
          ) : null}

          {mustHave.length >
          0 ? (
            <View
              style={
                styles.aiResultCard
              }
            >
              <Text
                style={
                  styles.aiResultTitle
                }
              >
                AI extracted priorities
              </Text>

              <View
                style={
                  styles.priorityWrap
                }
              >
                {mustHave.map(
                  (
                    item,
                  ) => (
                    <View
                      key={
                        item
                      }
                      style={
                        styles.priorityChip
                      }
                    >
                      <Text
                        style={
                          styles.priorityText
                        }
                      >
                        {item}
                      </Text>
                    </View>
                  ),
                )}
              </View>

              {aiSummary ? (
                <Text
                  style={
                    styles.aiSummary
                  }
                >
                  {aiSummary}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Pressable
            disabled={
              saving
            }
            onPress={() =>
              void handleCreateRequest()
            }
            style={[
              styles.searchButton,

              saving &&
                styles.buttonDisabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <>
                <Search
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.searchButtonText
                  }
                >
                  Find Properties / Create Request
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {matchingProperties.length >
        0 ? (
          <View
            style={
              styles.resultsSection
            }
          >
            <Text
              style={
                styles.resultsEyebrow
              }
            >
              STRONG MATCHES
            </Text>

            <Text
              style={
                styles.resultsTitle
              }
            >
              Matching Properties
            </Text>

            <Text
              style={
                styles.resultsText
              }
            >
              We found{" "}
              {
                matchingProperties.length
              }{" "}
              properties with a match score of at least 70%.
            </Text>

            {matchingProperties.map(
              (
                property,
              ) => (
                <MatchedPropertyCard
                  key={
                    property.id
                  }
                  property={
                    property
                  }
                />
              ),
            )}
          </View>
        ) : null}

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

function MatchedPropertyCard({
  property,
}: {
  property:
    MatchedProperty;
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

  const scoreColor =
    property.matchScore >=
    90
      ? "#15803D"
      : property.matchScore >=
        75
      ? "#B45309"
      : "#475467";

  return (
    <View
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
            style={
              styles.propertyImage
            }
            resizeMode="cover"
          />
        ) : (
          <View
            style={
              styles.propertyPlaceholder
            }
          >
            <Building2
              size={38}
              color="#98A2B3"
            />
          </View>
        )}

        <View
          style={[
            styles.matchBadge,
            {
              backgroundColor:
                scoreColor,
            },
          ]}
        >
          <Text
            style={
              styles.matchBadgeText
            }
          >
            {
              property.matchScore
            }
            % Match
          </Text>
        </View>
      </View>

      <View
        style={
          styles.propertyBody
        }
      >
        <Text
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
            size={14}
            color="#667085"
          />

          <Text
            style={
              styles.propertyLocation
            }
          >
            {location ||
              property.location ||
              "Portugal"}
          </Text>
        </View>

        <Text
          style={
            styles.propertyPrice
          }
        >
          {new Intl.NumberFormat(
            "en-IE",
            {
              style:
                "currency",
              currency:
                "EUR",
              maximumFractionDigits:
                0,
            },
          ).format(
            Number(
              property.price ||
                0,
            ),
          )}
        </Text>

        <View
          style={
            styles.specRow
          }
        >
          <Spec
            icon={BedDouble}
            value={
              property.bedrooms ??
              "—"
            }
          />

          <Spec
            icon={Bath}
            value={
              property.bathrooms ??
              "—"
            }
          />

          <Spec
            icon={Maximize}
            value={
              property.area
                ? `${property.area} m²`
                : "—"
            }
          />
        </View>

        <View
          style={
            styles.whyCard
          }
        >
          <Text
            style={
              styles.whyTitle
            }
          >
            Why this matches
          </Text>

          <Text
            style={
              styles.recommendation
            }
          >
            {
              property.recommendation
            }
          </Text>

          {property.matchedCriteria
            .length >
          0 ? (
            <View
              style={
                styles.criteriaBlock
              }
            >
              <Text
                style={
                  styles.criteriaGoodTitle
                }
              >
                Matches your criteria
              </Text>

              {property.matchedCriteria.map(
                (
                  item,
                ) => (
                  <View
                    key={
                      item
                    }
                    style={
                      styles.criteriaRow
                    }
                  >
                    <Check
                      size={13}
                      color="#15803D"
                    />

                    <Text
                      style={
                        styles.criteriaText
                      }
                    >
                      {item}
                    </Text>
                  </View>
                ),
              )}
            </View>
          ) : null}

          {property.missingCriteria
            .length >
          0 ? (
            <View
              style={
                styles.criteriaBlock
              }
            >
              <Text
                style={
                  styles.criteriaWarningTitle
                }
              >
                Things to consider
              </Text>

              {property.missingCriteria.map(
                (
                  item,
                ) => (
                  <View
                    key={
                      item
                    }
                    style={
                      styles.criteriaRow
                    }
                  >
                    <CircleAlert
                      size={13}
                      color="#B45309"
                    />

                    <Text
                      style={
                        styles.criteriaText
                      }
                    >
                      {item}
                    </Text>
                  </View>
                ),
              )}
            </View>
          ) : null}
        </View>

        {property.professionalProfile ? (
          <View
            style={
              styles.agentBox
            }
          >
            <Text
              style={
                styles.agentLabel
              }
            >
              Listed by
            </Text>

            <Text
              style={
                styles.agentName
              }
            >
              {property.professionalProfile
                .user
                .fullName ||
                "Property Agent"}
            </Text>

            {property.professionalProfile
              .companyName ? (
              <Text
                style={
                  styles.agentCompany
                }
              >
                {
                  property
                    .professionalProfile
                    .companyName
                }
              </Text>
            ) : null}
          </View>
        ) : null}

        <Pressable
          onPress={() =>
            router.push(
              `/properties/${property.id}`,
            )
          }
          style={
            styles.viewPropertyButton
          }
        >
          <Text
            style={
              styles.viewPropertyText
            }
          >
            View Property
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Spec({
  icon: Icon,
  value,
}: {
  icon:
    React.ComponentType<any>;
  value:
    string | number;
}) {
  return (
    <View
      style={
        styles.spec
      }
    >
      <Icon
        size={15}
        color="#667085"
      />

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

function Chip({
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
        styles.chip,

        active &&
          styles.chipActive,
      ]}
    >
      <Text
        style={[
          styles.chipText,

          active &&
            styles.chipTextActive,
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
  icon: Icon,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText:
    (value: string) => void;
  placeholder: string;
  prefix?: string;
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
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#F6F7F9",
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 14,
    },

    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
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
      width: 52,
      height: 52,
      borderRadius: 17,
      backgroundColor:
        "#F2ECFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    eyebrow: {
      marginTop: 16,
      color: "#6D28D9",
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

    formTitle: {
      color:
        Colors.navyDark,
      fontSize: 17,
      fontWeight: "900",
    },

    textArea: {
      marginTop: 10,
      minHeight: 145,
      borderRadius: 17,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      backgroundColor:
        "#FCFCFD",
      padding: 14,
      color:
        Colors.navyDark,
      fontSize: 13,
      lineHeight: 20,
    },

    aiButton: {
      marginTop: 12,
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#DDD6FE",
      backgroundColor:
        "#F5F3FF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 7,
    },

    aiButtonText: {
      color: "#6D28D9",
      fontSize: 12,
      fontWeight: "900",
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    field: {
      marginTop: 19,
    },

    fieldLabel: {
      marginTop: 19,
      color:
        Colors.navyDark,
      fontSize: 11,
      fontWeight: "900",
    },

    inputWrapper: {
      marginTop: 8,
      minHeight: 53,
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

    chips: {
      marginTop: 8,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    chip: {
      minHeight: 41,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 13,
      alignItems: "center",
      justifyContent:
        "center",
    },

    chipActive: {
      borderColor:
        "#6D28D9",
      backgroundColor:
        "#F5F3FF",
    },

    chipText: {
      color: "#667085",
      fontSize: 9,
      fontWeight: "700",
      textTransform:
        "capitalize",
    },

    chipTextActive: {
      color: "#6D28D9",
      fontWeight: "900",
    },

    confidenceCard: {
      marginTop: 18,
      borderRadius: 17,
      backgroundColor:
        "#F5F3FF",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 13,
    },

    confidenceLabel: {
      color: "#667085",
      fontSize: 9,
    },

    confidenceValue: {
      marginTop: 2,
      color: "#6D28D9",
      fontSize: 16,
      fontWeight: "900",
    },

    aiResultCard: {
      marginTop: 13,
      borderRadius: 19,
      backgroundColor:
        "#F8F9FA",
      padding: 15,
    },

    aiResultTitle: {
      color:
        Colors.navyDark,
      fontSize: 12,
      fontWeight: "900",
    },

    priorityWrap: {
      marginTop: 10,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },

    priorityChip: {
      borderRadius: 999,
      backgroundColor:
        "#FFF8E1",
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    priorityText: {
      color: "#8A6400",
      fontSize: 8,
      fontWeight: "800",
    },

    aiSummary: {
      marginTop: 12,
      color: "#667085",
      fontSize: 10,
      lineHeight: 17,
    },

    searchButton: {
      marginTop: 19,
      minHeight: 56,
      borderRadius: 17,
      backgroundColor:
        Colors.navy,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
    },

    searchButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
    },

    resultsSection: {
      marginTop: 30,
    },

    resultsEyebrow: {
      color: "#6D28D9",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.1,
    },

    resultsTitle: {
      marginTop: 5,
      color:
        Colors.navyDark,
      fontSize: 24,
      fontWeight: "900",
    },

    resultsText: {
      marginTop: 5,
      marginBottom: 14,
      color:
        Colors.textSecondary,
      fontSize: 11,
      lineHeight: 18,
    },

    propertyCard: {
      marginBottom: 16,
      borderRadius: 23,
      overflow: "hidden",
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
    },

    propertyImageWrap: {
      position: "relative",
      height: 220,
      backgroundColor:
        "#EEF1F5",
    },

    propertyImage: {
      width: "100%",
      height: "100%",
    },

    propertyPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
    },

    matchBadge: {
      position: "absolute",
      right: 12,
      top: 12,
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },

    matchBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "900",
    },

    propertyBody: {
      padding: 17,
    },

    propertyTitle: {
      color:
        Colors.navyDark,
      fontSize: 18,
      fontWeight: "900",
    },

    locationRow: {
      marginTop: 7,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    propertyLocation: {
      flex: 1,
      color: "#667085",
      fontSize: 10,
    },

    propertyPrice: {
      marginTop: 12,
      color: Colors.navy,
      fontSize: 23,
      fontWeight: "900",
    },

    specRow: {
      marginTop: 13,
      flexDirection: "row",
      gap: 15,
    },

    spec: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    specText: {
      color: "#667085",
      fontSize: 10,
      fontWeight: "700",
    },

    whyCard: {
      marginTop: 15,
      borderRadius: 18,
      backgroundColor:
        "#F8F9FA",
      padding: 14,
    },

    whyTitle: {
      color:
        Colors.navyDark,
      fontSize: 12,
      fontWeight: "900",
    },

    recommendation: {
      marginTop: 6,
      color: "#667085",
      fontSize: 10,
      lineHeight: 17,
    },

    criteriaBlock: {
      marginTop: 13,
    },

    criteriaGoodTitle: {
      color: "#15803D",
      fontSize: 10,
      fontWeight: "900",
    },

    criteriaWarningTitle: {
      color: "#B45309",
      fontSize: 10,
      fontWeight: "900",
    },

    criteriaRow: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
    },

    criteriaText: {
      flex: 1,
      color: "#475467",
      fontSize: 9,
      lineHeight: 15,
    },

    agentBox: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor:
        "#EAECF0",
    },

    agentLabel: {
      color:
        Colors.navyDark,
      fontSize: 10,
      fontWeight: "900",
    },

    agentName: {
      marginTop: 4,
      color: "#667085",
      fontSize: 10,
    },

    agentCompany: {
      marginTop: 2,
      color: "#98A2B3",
      fontSize: 8,
    },

    viewPropertyButton: {
      marginTop: 15,
      minHeight: 49,
      borderRadius: 15,
      backgroundColor:
        Colors.navy,
      alignItems: "center",
      justifyContent:
        "center",
    },

    viewPropertyText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
    },
  });
