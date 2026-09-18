import {
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
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Landmark,
  Scale,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react-native";

import {
  router,
  type Href,
} from "expo-router";

import {
  Colors,
} from "@/constants/colors";

const categories = [
  {
    type: "PROPERTY_AGENT",
    title: "Property Agents",
    description:
      "Find verified property experts who can help you discover, compare and evaluate homes.",
    icon: Building2,
    accent: "#1B365D",
    background:
      "#EEF3F8",
  },

  {
    type: "MORTGAGE_BROKER",
    title: "Mortgage Brokers",
    description:
      "Understand financing options, mortgage scenarios and lending conditions in Portugal.",
    icon: Landmark,
    accent: "#15803D",
    background:
      "#ECFDF3",
  },

  {
    type: "LAWYER",
    title: "Property Lawyers",
    description:
      "Get legal guidance for due diligence, contracts and property transactions.",
    icon: Scale,
    accent: "#7C3AED",
    background:
      "#F3E8FF",
  },
] as const;

export default function FindProfessionalsScreen() {
  function openCategory(
  type:
    | "PROPERTY_AGENT"
    | "MORTGAGE_BROKER"
    | "LAWYER",
) {
  router.push(
    `/find-professionals/${type}` as Href,
  );
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
        <View
          style={
            styles.topRow
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
              styles.topIcon
            }
          >
            <BriefcaseBusiness
              size={21}
              color={
                Colors.navy
              }
            />
          </View>
        </View>

        <Text
          style={
            styles.eyebrow
          }
        >
          VERIFIED EXPERTS
        </Text>

        <Text
          style={
            styles.title
          }
        >
          Find Professionals
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Connect with verified experts who can support your property journey in Portugal.
        </Text>

        <View
          style={
            styles.trustStrip
          }
        >
          <TrustItem
            icon={
              BadgeCheck
            }
            text="Verified profiles"
          />

          <TrustItem
            icon={
              Star
            }
            text="Buyer reviews"
          />

          <TrustItem
            icon={
              ShieldCheck
            }
            text="Trusted network"
          />
        </View>

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
            PROFESSIONAL SERVICES
          </Text>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Choose the support you need
          </Text>
        </View>

        {categories.map(
          (
            category,
          ) => {
            const Icon =
              category.icon;

            return (
              <Pressable
                key={
                  category.type
                }
                onPress={() =>
                  openCategory(
                    category.type,
                  )
                }
                style={({ pressed }) => [
                  styles.categoryCard,

                  pressed && {
                    opacity: 0.8,
                  },
                ]}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    {
                      backgroundColor:
                        category.background,
                    },
                  ]}
                >
                  <Icon
                    size={25}
                    color={
                      category.accent
                    }
                  />
                </View>

                <View
                  style={
                    styles.categoryContent
                  }
                >
                  <Text
                    style={
                      styles.categoryTitle
                    }
                  >
                    {
                      category.title
                    }
                  </Text>

                  <Text
                    style={
                      styles.categoryDescription
                    }
                  >
                    {
                      category.description
                    }
                  </Text>

                  <View
                    style={
                      styles.exploreRow
                    }
                  >
                    <Text
                      style={
                        styles.exploreText
                      }
                    >
                      Explore professionals
                    </Text>

                    <ArrowRight
                      size={16}
                      color={
                        Colors.navy
                      }
                    />
                  </View>
                </View>
              </Pressable>
            );
          },
        )}

        <View
          style={
            styles.whyCard
          }
        >
          <View
            style={
              styles.whyIcon
            }
          >
            <Users
              size={25}
              color={
                Colors.gold
              }
            />
          </View>

          <Text
            style={
              styles.whyTitle
            }
          >
            Why use verified professionals?
          </Text>

          <Text
            style={
              styles.whyText
            }
          >
            Professional profiles, buyer reviews and Smart Matching help you make more informed decisions.
          </Text>

          <View
            style={
              styles.benefits
            }
          >
            <Benefit text="Verified professional profiles" />

            <Benefit text="Real buyer feedback" />

            <Benefit text="Smart Matching with your requests" />

            <Benefit text="Access from your buyer journey" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TrustItem({
  icon: Icon,
  text,
}: {
  icon:
    typeof BadgeCheck;
  text: string;
}) {
  return (
    <View
      style={
        styles.trustItem
      }
    >
      <Icon
        size={16}
        color={
          Colors.gold
        }
      />

      <Text
        style={
          styles.trustText
        }
      >
        {text}
      </Text>
    </View>
  );
}

function Benefit({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={
        styles.benefit
      }
    >
      <View
        style={
          styles.benefitDot
        }
      />

      <Text
        style={
          styles.benefitText
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

    content: {
      paddingHorizontal:
        20,

      paddingTop:
        14,

      paddingBottom:
        44,
    },

    topRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
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

    topIcon: {
      width:
        48,

      height:
        48,

      borderRadius:
        16,

      backgroundColor:
        "#EEF3F8",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    eyebrow: {
      marginTop:
        26,

      color:
        Colors.gold,

      fontSize:
        11,

      fontWeight:
        "900",

      letterSpacing:
        1.4,
    },

    title: {
      marginTop:
        7,

      color:
        Colors.navyDark,

      fontSize:
        36,

      lineHeight:
        42,

      fontWeight:
        "900",

      letterSpacing:
        -1,
    },

    subtitle: {
      marginTop:
        10,

      color:
        Colors.textSecondary,

      fontSize:
        15,

      lineHeight:
        24,
    },

    trustStrip: {
      marginTop:
        20,

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        9,
    },

    trustItem: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        6,

      borderWidth:
        1,

      borderColor:
        Colors.border,

      borderRadius:
        999,

      backgroundColor:
        Colors.white,

      paddingHorizontal:
        11,

      paddingVertical:
        8,
    },

    trustText: {
      color:
        Colors.navyDark,

      fontSize:
        10,

      fontWeight:
        "700",
    },

    sectionHeader: {
      marginTop:
        28,

      marginBottom:
        13,
    },

    sectionEyebrow: {
      color:
        Colors.gold,

      fontSize:
        10,

      fontWeight:
        "900",

      letterSpacing:
        1.2,
    },

    sectionTitle: {
      marginTop:
        5,

      color:
        Colors.navyDark,

      fontSize:
        22,

      fontWeight:
        "800",
    },

    categoryCard: {
      marginBottom:
        13,

      flexDirection:
        "row",

      gap:
        14,

      borderWidth:
        1,

      borderColor:
        Colors.border,

      borderRadius:
        22,

      backgroundColor:
        Colors.white,

      padding:
        16,
    },

    categoryIcon: {
      width:
        54,

      height:
        54,

      borderRadius:
        17,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    categoryContent: {
      flex:
        1,
    },

    categoryTitle: {
      color:
        Colors.navyDark,

      fontSize:
        17,

      fontWeight:
        "900",
    },

    categoryDescription: {
      marginTop:
        6,

      color:
        Colors.textSecondary,

      fontSize:
        12,

      lineHeight:
        19,
    },

    exploreRow: {
      marginTop:
        11,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        5,
    },

    exploreText: {
      color:
        Colors.navy,

      fontSize:
        11,

      fontWeight:
        "800",
    },

    whyCard: {
      marginTop:
        18,

      borderRadius:
        24,

      backgroundColor:
        Colors.navyDark,

      padding:
        20,
    },

    whyIcon: {
      width:
        50,

      height:
        50,

      borderRadius:
        16,

      backgroundColor:
        "rgba(255,255,255,0.08)",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    whyTitle: {
      marginTop:
        14,

      color:
        Colors.white,

      fontSize:
        20,

      fontWeight:
        "800",
    },

    whyText: {
      marginTop:
        8,

      color:
        "rgba(255,255,255,0.74)",

      fontSize:
        13,

      lineHeight:
        20,
    },

    benefits: {
      marginTop:
        17,

      gap:
        10,
    },

    benefit: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        9,
    },

    benefitDot: {
      width:
        7,

      height:
        7,

      borderRadius:
        999,

      backgroundColor:
        Colors.gold,
    },

    benefitText: {
      flex:
        1,

      color:
        Colors.white,

      fontSize:
        12,

      fontWeight:
        "600",
    },
  });