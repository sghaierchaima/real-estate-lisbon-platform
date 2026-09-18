import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";

import { useRouter } from "expo-router";

import {
  Sparkles,
  Calculator,
  CircleDollarSign,
  ShieldCheck,
  MapPin,
  TrendingUp,
  BadgeCheck,
  Check,
  ArrowRight,
  Menu,
  X,
  ArrowLeft,
  
  CheckCircle2,
  
  Landmark,
} from "lucide-react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  router,
} from "expo-router";



import AppMenu from "@/components/AppMenu";

import {
  useAppMenu,
} from "@/hooks/useAppMenu";

import {
  Colors,
} from "@/constants/colors";

const TOOLS = [
  {
    id: "property-search",
    title: "Property Search Assistant",
    description:
      "Describe your ideal property and let AI extract your search criteria automatically.",
    features: [
      "AI search analysis",
      "Automatic criteria extraction",
      "Buyer request creation",
    ],
    icon: Sparkles,
    iconBg: "#F2ECFF",
    iconColor: "#6D28D9",
    route: "/tools/property-search-assistant",
  },

  {
    id: "mortgage",
    title: "Mortgage Calculator",
    description:
      "Calculate monthly payments, financing limits and understand your property loan.",
    features: [
      "Monthly payments",
      "Interest breakdown",
      "Loan amount",
    ],
    icon: Calculator,
    iconBg: "#EEF3F8",
    iconColor: "#10284D",
    route: "/tools/mortgage-calculator",
  },

  {
    id: "affordability",
    title: "Affordability Calculator",
    description:
      "Understand your buying power based on income, debts and down payment.",
    features: [
      "Income analysis",
      "Debt-to-income ratio",
      "Budget estimate",
    ],
    icon: CircleDollarSign,
    iconBg: "#ECFDF3",
    iconColor: "#287B2B",
    route: "/tools/affordability-calculator",
  },

  {
    id: "true-cost",
    title: "True Cost Calculator",
    description:
      "See the complete estimated cost of buying property in Portugal.",
    features: [
      "IMT estimate",
      "Stamp duty",
      "Legal and bank fees",
    ],
    icon: ShieldCheck,
    iconBg: "#FEF2F2",
    iconColor: "#DC2D2D",
    route: "/tools/true-cost-calculator",
  },

  {
    id: "neighborhood",
    title: "Neighborhood Finder",
    description:
      "Explore neighborhoods and compare lifestyle, transport and amenities.",
    features: [
      "Area insights",
      "Transport access",
      "Amenities",
    ],
    icon: MapPin,
    iconBg: "#FFF8E1",
    iconColor: "#E1A820",
    route: "/tools/neighborhood-finder",
  },

  {
    id: "price-checker",
    title: "Price Checker",
    description:
      "Compare property prices and understand whether a listing is fairly priced.",
    features: [
      "Price comparisons",
      "Market trends",
      "Value analysis",
    ],
    icon: TrendingUp,
    iconBg: "#EFF6FF",
    iconColor: "#2B77D8",
    route: "/tools/price-checker",
  },

  {
    id: "valuation",
    title: "Property Valuation",
    description:
      "Estimate property value based on location, size, condition and market data.",
    features: [
      "Instant valuation",
      "Market estimate",
      "Investment potential",
    ],
    icon: BadgeCheck,
    iconBg: "#F5F3FF",
    iconColor: "#7B26B8",
    route: "/tools/property-valuation",
  },
];

export default function ToolsScreen() {
  const {
    menuVisible,
    menuUser,
    savedCount,
    unreadMessages,
    openMenu,
    closeMenu,
  } = useAppMenu();

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.safeArea}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() =>
              router.back()
            }
            style={styles.backButton}
          >
            <ArrowLeft
              size={21}
              color={Colors.navyDark}
            />
          </Pressable>

          <Pressable
            onPress={openMenu}
            style={styles.menuButton}
          >
            <Text style={styles.menuText}>
              Menu
            </Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <ShieldCheck
              size={16}
              color={Colors.gold}
            />

            <Text style={styles.heroBadgeText}>
              FREE BUYER TOOLS
            </Text>
          </View>

          <Text style={styles.title}>
            Property Tools
          </Text>

          <Text style={styles.subtitle}>
            Make better buying decisions with independent calculators and market-analysis tools.
          </Text>
        </View>

        <View style={styles.grid}>
          {TOOLS.map((tool) => {
            const Icon = tool.icon;

            return (
              <Pressable
                key={tool.id}
                onPress={() =>
                  router.push(
                    tool.route as never,
                  )
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed &&
                    styles.cardPressed,
                ]}
              >
                <View style={styles.iconBox}>
                  <Icon
                    size={23}
                    color={Colors.navy}
                  />
                </View>

                <Text style={styles.cardTitle}>
                  {tool.title}
                </Text>

                <Text style={styles.cardText}>
                  {tool.description}
                </Text>

                <View style={styles.cardAction}>
                  <Text style={styles.cardActionText}>
                    Open tool
                  </Text>

                  <ArrowRight
                    size={15}
                    color={Colors.navy}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.notice}>
          <Calculator
            size={20}
            color={Colors.gold}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>
              Independent estimates
            </Text>

            <Text style={styles.noticeText}>
              These tools support your property research and do not replace professional legal, tax or mortgage advice.
            </Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      <AppMenu
        visible={menuVisible}
        onClose={closeMenu}
        user={menuUser}
        savedCount={savedCount}
        unreadMessages={unreadMessages}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAECF0",
    backgroundColor:
      "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  menuButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAECF0",
    backgroundColor:
      "#FFFFFF",
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
    marginTop: 25,
  },

  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    backgroundColor:
      "#FFF8E1",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  heroBadgeText: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  title: {
    marginTop: 15,
    color: Colors.navyDark,
    fontSize: 35,
    lineHeight: 41,
    fontWeight: "900",
    letterSpacing: -1,
  },

  subtitle: {
    marginTop: 9,
    color:
      Colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },

  grid: {
    marginTop: 27,
    gap: 13,
  },

  card: {
    minHeight: 185,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#EAECF0",
    backgroundColor:
      "#FFFFFF",
    padding: 18,
  },

  cardPressed: {
    opacity: 0.88,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  iconBox: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor:
      "#EEF3F8",
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    marginTop: 14,
    color: Colors.navyDark,
    fontSize: 17,
    fontWeight: "900",
  },

  cardText: {
    marginTop: 7,
    color:
      Colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },

  cardAction: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor:
      "#F0F1F3",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  cardActionText: {
    color: Colors.navy,
    fontSize: 11,
    fontWeight: "900",
  },

  notice: {
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F3E6AD",
    backgroundColor:
      "#FFFBEB",
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },

  noticeTitle: {
    color: Colors.navyDark,
    fontSize: 13,
    fontWeight: "800",
  },

  noticeText: {
    marginTop: 4,
    color:
      Colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
});