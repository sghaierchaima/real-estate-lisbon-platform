import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import AppMenu from "@/components/AppMenu";
import { useAppMenu } from "@/hooks/useAppMenu";
import {
  router,
  type Href,
} from "expo-router";
import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Bell,
  BellOff,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Euro,
  Flame,
  MapPin,
  MessageCircle,
  Search,
  Target,
  UserCheck,
  Users,
  Star,
} from "lucide-react-native";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getMyLeads,
  updatePropertyAlerts,
  type Lead,
  type LeadQuality,
  type MatchStatus,
} from "@/lib/leads-api";



import type {
  AuthUser,
} from "@/types/auth";

import {
  Colors,
} from "@/constants/colors";

// ============================================================
// COLORS
// ============================================================

const NAVY = "#0F2340";
const PRIMARY = "#1B365D";
const GOLD = "#C9A227";
const TEXT_MUTED = "#667085";
const BORDER = "#E4E7EC";
const BACKGROUND = "#F8F9FA";
const WHITE = "#FFFFFF";

const ITEMS_PER_PAGE = 3;

// ============================================================
// HELPERS
// ============================================================

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    ).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(new Date(value));
  } catch {
    return value;
  }
}

function formatProfessionalType(
  value?: string | null,
) {
  if (!value) {
    return "Professional";
  }

  return value
    .split("_")
    .join(" ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function getQualityColors(
  quality: LeadQuality,
) {
  if (quality === "HOT") {
    return {
      background: "#FEF2F2",
      text: "#DC2626",
    };
  }

  if (quality === "WARM") {
    return {
      background: "#FFFBEB",
      text: "#B45309",
    };
  }

  return {
    background: "#EFF6FF",
    text: "#2563EB",
  };
}

function getStatusColors(
  status: string,
) {
  if (
    status === "ACTIVE" ||
    status === "MATCHED"
  ) {
    return {
      background: "#ECFDF3",
      text: "#15803D",
    };
  }

  if (status === "CONTACTED") {
    return {
      background: "#F5F3FF",
      text: "#7C3AED",
    };
  }

  if (status === "COMPLETED") {
    return {
      background: "#ECFDF5",
      text: "#047857",
    };
  }

  if (status === "PENDING") {
    return {
      background: "#FFFBEB",
      text: "#B45309",
    };
  }

  if (status === "NEW") {
    return {
      background: "#EFF6FF",
      text: "#2563EB",
    };
  }

  if (status === "CLOSED") {
    return {
      background: "#F2F4F7",
      text: "#475467",
    };
  }

  return {
    background: "#FEF2F2",
    text: "#DC2626",
  };
}

function getProgressText(
  matchStatus?: MatchStatus,
  leadStatus?: string,
) {
  if (matchStatus === "ACTIVE") {
    return "A professional has been assigned to your request.";
  }

  if (matchStatus === "CONTACTED") {
    return "The professional has contacted you. Check your messages.";
  }

  if (matchStatus === "COMPLETED") {
    return "This request has been completed.";
  }

  if (matchStatus === "PENDING") {
    return "Your professional match is being prepared.";
  }

  if (matchStatus === "CANCELLED") {
    return "This match is no longer active.";
  }

  if (leadStatus === "MATCHED") {
    return "Professionals have been matched with this request.";
  }

  if (leadStatus === "NEW") {
    return "We are automatically searching for the best professional match.";
  }

  if (leadStatus === "CONTACTED") {
    return "Your request is currently being followed up.";
  }

  if (leadStatus === "CLOSED") {
    return "This request has been closed.";
  }

  if (leadStatus === "LOST") {
    return "This request is no longer active.";
  }

  return "Your request is being processed.";
}

// ============================================================
// STAT CARD
// ============================================================

type StatCardProps = {
  value: number;
  label: string;
  icon: React.ReactNode;
};

function StatCard({
  value,
  label,
  icon,
}: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        {icon}
      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

// ============================================================
// BADGE
// ============================================================

type BadgeProps = {
  label: string;
  backgroundColor: string;
  textColor: string;
};

function Badge({
  label,
  backgroundColor,
  textColor,
}: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: textColor,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// ============================================================
// SCREEN
// ============================================================

export default function RequestsScreen() {
  const {
    menuVisible,
    menuUser,
    savedCount,
    unreadMessages,
    openMenu,
    closeMenu,
  } = useAppMenu();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [leads, setLeads] =
    useState<Lead[]>([]);

  const [search, setSearch] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    updatingAlertId,
    setUpdatingAlertId,
  ] = useState<string | null>(null);

  const [
    error,
    setError,
  ] = useState("");
  // ============================================================
  // LOAD REQUESTS
  // ============================================================

  const loadRequests =
    useCallback(
      async (
        isRefresh = false,
      ) => {
        try {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const storedUser =
            await getStoredUser<AuthUser>();

          const token =
            await getToken();

          setUser(storedUser);

          if (!token) {
            setLeads([]);

            setError(
              "Your session has expired. Please sign in again.",
            );

            return;
          }

          if (
            storedUser?.role !==
            "BUYER"
          ) {
            setLeads([]);
            return;
          }

          const data =
            await getMyLeads(
              token,
            );

          setLeads(
            Array.isArray(data)
              ? data
              : [],
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your requests.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );
  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredLeads =
    useMemo(() => {
      const query =
        search
          .toLowerCase()
          .trim();

      if (!query) {
        return leads;
      }

      return leads.filter(
        (lead) => {
          const bestMatch =
            lead.matches?.[0];

          return [
            lead.fullName,
            lead.email,
            lead.source,
            lead.interest,
            lead.location,
            lead.budget,
            lead.searchText,
            lead.propertyType,
            lead.goal,
            lead.mustHave?.join(" "),
            lead.quality,
            lead.status,
            bestMatch?.status,
            bestMatch
              ?.professional
              ?.companyName,
            bestMatch
              ?.professional
              ?.user
              ?.fullName,
            bestMatch
              ?.professional
              ?.professionalType,
          ]
            .filter(Boolean)
            .some(
              (value) =>
                String(value)
                  .toLowerCase()
                  .includes(
                    query,
                  ),
            );
        },
      );
    }, [
      leads,
      search,
    ]);


  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredLeads.length /
        ITEMS_PER_PAGE,
    ),
  );

  const paginatedLeads =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredLeads.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE,
      );
    }, [
      filteredLeads,
      currentPage,
    ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages,
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  // ============================================================
  // STATISTICS
  // ============================================================

  const stats =
    useMemo(
      () => ({
        total:
          leads.length,

        hot:
          leads.filter(
            (lead) =>
              lead.quality ===
              "HOT",
          ).length,

        matched:
          leads.filter(
            (lead) =>
              (
                lead.matches
                  ?.length || 0
              ) > 0,
          ).length,

        contacted:
          leads.filter(
            (lead) =>
              lead.matches?.some(
                (match) =>
                  match.status ===
                  "CONTACTED",
              ),
          ).length,
      }),
      [leads],
    );

  // ============================================================
  // PROPERTY ALERTS
  // ============================================================

  async function handleTogglePropertyAlerts(
    lead: Lead,
  ) {
    if (
      updatingAlertId ===
      lead.id
    ) {
      return;
    }

    const token =
      await getToken();

    if (!token) {
      Alert.alert(
        "Session required",
        "Please sign in again.",
      );

      return;
    }

    const nextEnabled =
      !Boolean(
        lead.notificationsEnabled,
      );

    try {
      setUpdatingAlertId(
        lead.id,
      );

      const updated =
        await updatePropertyAlerts(
          token,
          lead.id,
          nextEnabled,
        );

      setLeads(
        (
          currentLeads,
        ) =>
          currentLeads.map(
            (item) =>
              item.id ===
                lead.id
                ? {
                  ...item,

                  isActive:
                    updated.isActive,

                  notificationsEnabled:
                    updated.notificationsEnabled,
                }
                : item,
          ),
      );

      Alert.alert(
        updated.notificationsEnabled
          ? "Property alerts enabled"
          : "Property alerts disabled",

        updated.notificationsEnabled
          ? "We will notify you when a new property matches this search."
          : "Your search remains saved, but matching property notifications are disabled.",
      );
    } catch (err) {
      Alert.alert(
        "Unable to update alerts",

        err instanceof Error
          ? err.message
          : "Please try again.",
      );
    } finally {
      setUpdatingAlertId(
        null,
      );
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.centerScreen
        }
      >
        <ActivityIndicator
          size="large"
          color={PRIMARY}
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading your requests...
        </Text>
      </SafeAreaView>
    );
  }

  // ============================================================
  // ACCESS DENIED
  // ============================================================

  if (
    user &&
    user.role !== "BUYER"
  ) {
    return (
      <SafeAreaView
        style={
          styles.centerScreen
        }
      >
        <View
          style={
            styles.accessCard
          }
        >
          <View
            style={
              styles.accessIcon
            }
          >
            <Users
              size={28}
              color={PRIMARY}
            />
          </View>

          <Text
            style={
              styles.accessTitle
            }
          >
            Access denied
          </Text>

          <Text
            style={
              styles.accessDescription
            }
          >
            Only buyers can
            access their
            personal requests.
          </Text>
        </View>

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
      style={styles.safeArea}
    >
      <ScrollView
        style={
          styles.container
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void loadRequests(
                true,
              )
            }
            tintColor={
              PRIMARY
            }
          />
        }
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View>
          <AppHeader
            eyebrow="BUYER DASHBOARD"
            title="My Requests"
            subtitle="Track your property requests, qualification status and matching progress."
            onMenuPress={openMenu}
          />
        </View>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error ? (
          <View
            style={
              styles.errorCard
            }
          >
            <Text
              style={
                styles.errorTitle
              }
            >
              Unable to load requests
            </Text>

            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>

            <Pressable
              style={
                styles.retryButton
              }
              onPress={() =>
                void loadRequests()
              }
            >
              <Text
                style={
                  styles.retryButtonText
                }
              >
                Try again
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* ================================================= */}
        {/* STATS */}
        {/* ================================================= */}

        {!error && (
          <>
            <View
              style={
                styles.statsGrid
              }
            >
              <StatCard
                value={
                  stats.total
                }
                label="Total Requests"
                icon={
                  <Users
                    size={22}
                    color={
                      PRIMARY
                    }
                  />
                }
              />

              <StatCard
                value={
                  stats.hot
                }
                label="Hot Requests"
                icon={
                  <Flame
                    size={22}
                    color="#DC2626"
                  />
                }
              />

              <StatCard
                value={
                  stats.matched
                }
                label="Matched"
                icon={
                  <Target
                    size={22}
                    color="#15803D"
                  />
                }
              />

              <StatCard
                value={
                  stats.contacted
                }
                label="Contacted"
                icon={
                  <UserCheck
                    size={22}
                    color="#7C3AED"
                  />
                }
              />
            </View>

            {/* ================================================= */}
            {/* SEARCH */}
            {/* ================================================= */}

            <View
              style={
                styles.searchContainer
              }
            >
              <Search
                size={20}
                color="#98A2B3"
              />

              <TextInput
                value={
                  search
                }
                onChangeText={
                  setSearch
                }
                placeholder="Search requests..."
                placeholderTextColor="#98A2B3"
                style={
                  styles.searchInput
                }
                autoCapitalize="none"
                autoCorrect={
                  false
                }
              />
            </View>

            {/* ================================================= */}
            {/* EMPTY */}
            {/* ================================================= */}

            {filteredLeads.length ===
              0 ? (
              <View
                style={
                  styles.emptyCard
                }
              >
                <View
                  style={
                    styles.emptyIcon
                  }
                >
                  <Search
                    size={30}
                    color={
                      PRIMARY
                    }
                  />
                </View>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No requests found
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  {search
                    ? "No request matches your search."
                    : "Use one of our buying tools or submit a property request to start your journey."}
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.requestsList
                }
              >
                {paginatedLeads.map(
                  (lead) => {
                    const bestMatch =
                      lead.matches?.[0];

                    const displayStatus =
                      bestMatch?.status ||
                      lead.status;

                    const qualityColors =
                      getQualityColors(
                        lead.quality,
                      );

                    const statusColors =
                      getStatusColors(
                        displayStatus,
                      );

                    const isPropertySearch =
                      lead.source ===
                      "Property Search Assistant" &&
                      Boolean(
                        lead.searchText,
                      );

                    const updating =
                      updatingAlertId ===
                      lead.id;

                    return (
                      <View
                        key={
                          lead.id
                        }
                        style={
                          styles.requestCard
                        }
                      >
                        {/* REQUEST HEADER */}

                        <View
                          style={
                            styles.requestHeader
                          }
                        >
                          <View
                            style={
                              styles.requestHeaderContent
                            }
                          >
                            <Text
                              style={
                                styles.requestSource
                              }
                            >
                              {lead.source ||
                                "Property Request"}
                            </Text>

                            <Text
                              style={
                                styles.requestInterest
                              }
                            >
                              {lead.interest ||
                                "Property Purchase"}
                            </Text>
                          </View>

                          <Badge
                            label={
                              lead.quality
                            }
                            backgroundColor={
                              qualityColors.background
                            }
                            textColor={
                              qualityColors.text
                            }
                          />
                        </View>

                        {/* LOCATION / DATE */}

                        <View
                          style={
                            styles.metaRow
                          }
                        >
                          <View
                            style={
                              styles.metaItem
                            }
                          >
                            <MapPin
                              size={16}
                              color={
                                TEXT_MUTED
                              }
                            />

                            <Text
                              style={
                                styles.metaText
                              }
                              numberOfLines={
                                1
                              }
                            >
                              {lead.location ||
                                "Portugal"}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.metaItem
                            }
                          >
                            <CalendarDays
                              size={16}
                              color={
                                TEXT_MUTED
                              }
                            />

                            <Text
                              style={
                                styles.metaText
                              }
                            >
                              {formatDate(
                                lead.createdAt,
                              )}
                            </Text>
                          </View>
                        </View>

                        {/* INFO */}

                        <View
                          style={
                            styles.infoGrid
                          }
                        >
                          <View
                            style={
                              styles.infoBox
                            }
                          >
                            <Text
                              style={
                                styles.infoLabel
                              }
                            >
                              BUDGET
                            </Text>

                            <View
                              style={
                                styles.budgetRow
                              }
                            >
                              <Euro
                                size={
                                  16
                                }
                                color={
                                  PRIMARY
                                }
                              />

                              <Text
                                style={
                                  styles.infoValue
                                }
                              >
                                {lead.budget ||
                                  "-"}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={
                              styles.infoBox
                            }
                          >
                            <Text
                              style={
                                styles.infoLabel
                              }
                            >
                              PROGRESS
                            </Text>

                            <View
                              style={
                                styles.progressBadgeWrapper
                              }
                            >
                              <Badge
                                label={
                                  displayStatus
                                }
                                backgroundColor={
                                  statusColors.background
                                }
                                textColor={
                                  statusColors.text
                                }
                              />
                            </View>
                          </View>
                        </View>

                        {/* STATUS MESSAGE */}

                        <View
                          style={
                            styles.progressMessage
                          }
                        >
                          <Clock3
                            size={
                              17
                            }
                            color={
                              statusColors.text
                            }
                          />

                          <Text
                            style={[
                              styles.progressMessageText,
                              {
                                color:
                                  statusColors.text,
                              },
                            ]}
                          >
                            {getProgressText(
                              bestMatch?.status,
                              lead.status,
                            )}
                          </Text>
                        </View>

                        {/* PROPERTY SEARCH ALERT */}

                        {isPropertySearch && (
                          <View
                            style={
                              styles.alertCard
                            }
                          >
                            <View
                              style={
                                styles.alertHeader
                              }
                            >
                              <View
                                style={
                                  styles.alertTitleRow
                                }
                              >
                                {lead.notificationsEnabled ? (
                                  <Bell
                                    size={
                                      19
                                    }
                                    color={
                                      PRIMARY
                                    }
                                  />
                                ) : (
                                  <BellOff
                                    size={
                                      19
                                    }
                                    color={
                                      TEXT_MUTED
                                    }
                                  />
                                )}

                                <Text
                                  style={
                                    styles.alertTitle
                                  }
                                >
                                  Property Alerts
                                </Text>
                              </View>

                              <Badge
                                label={
                                  lead.notificationsEnabled
                                    ? "ACTIVE"
                                    : "OFF"
                                }
                                backgroundColor={
                                  lead.notificationsEnabled
                                    ? "#DCFCE7"
                                    : "#EAECF0"
                                }
                                textColor={
                                  lead.notificationsEnabled
                                    ? "#15803D"
                                    : TEXT_MUTED
                                }
                              />
                            </View>

                            <Text
                              style={
                                styles.alertDescription
                              }
                            >
                              {lead.notificationsEnabled
                                ? "We will notify you when a newly published property reaches at least a 70% match."
                                : "This search remains saved, but matching property notifications are disabled."}
                            </Text>

                            {lead.lastMatchedAt ? (
                              <Text
                                style={
                                  styles.lastMatched
                                }
                              >
                                Last match:{" "}
                                {formatDateTime(
                                  lead.lastMatchedAt,
                                )}
                              </Text>
                            ) : null}

                            <Pressable
                              disabled={
                                updating
                              }
                              onPress={() =>
                                void handleTogglePropertyAlerts(
                                  lead,
                                )
                              }
                              style={({ pressed }) => [
                                styles.alertButton,

                                lead.notificationsEnabled
                                  ? styles.alertButtonActive
                                  : styles.alertButtonInactive,

                                pressed &&
                                styles.buttonPressed,

                                updating &&
                                styles.buttonDisabled,
                              ]}
                            >
                              {updating ? (
                                <ActivityIndicator
                                  size="small"
                                  color={
                                    lead.notificationsEnabled
                                      ? WHITE
                                      : PRIMARY
                                  }
                                />
                              ) : lead.notificationsEnabled ? (
                                <Bell
                                  size={
                                    17
                                  }
                                  color={
                                    WHITE
                                  }
                                />
                              ) : (
                                <BellOff
                                  size={
                                    17
                                  }
                                  color={
                                    PRIMARY
                                  }
                                />
                              )}

                              <Text
                                style={[
                                  styles.alertButtonText,

                                  {
                                    color:
                                      lead.notificationsEnabled
                                        ? WHITE
                                        : PRIMARY,
                                  },
                                ]}
                              >
                                {updating
                                  ? "Saving..."
                                  : lead.notificationsEnabled
                                    ? "Disable Alerts"
                                    : "Enable Alerts"}
                              </Text>
                            </Pressable>
                          </View>
                        )}

                        {/* ASSIGNED PROFESSIONAL */}

                        {bestMatch ? (
                          <View style={styles.professionalCard}>
                            <View style={styles.professionalTitleRow}>
                              <View style={styles.professionalTitleLeft}>
                                <CheckCircle2 size={18} color="#15803D" />
                                <Text style={styles.professionalLabel}>ASSIGNED PROFESSIONAL</Text>
                              </View>

                              <Badge
                                label={bestMatch.status}
                                backgroundColor={getStatusColors(bestMatch.status).background}
                                textColor={getStatusColors(bestMatch.status).text}
                              />
                            </View>

                            <Text style={styles.professionalName}>
                              {bestMatch.professional.user.fullName || "Verified Professional"}
                            </Text>

                            <Text style={styles.companyName}>
                              {bestMatch.professional.companyName || "Independent Professional"}
                            </Text>

                            <View style={styles.professionalDetails}>
                              <View style={styles.professionalDetail}>
                                <Text style={styles.professionalDetailLabel}>TYPE</Text>
                                <Text style={styles.professionalDetailValue}>
                                  {formatProfessionalType(bestMatch.professional.professionalType)}
                                </Text>
                              </View>

                              <View style={styles.professionalDetail}>
                                <Text style={styles.professionalDetailLabel}>MATCH SCORE</Text>
                                <Text style={styles.matchScore}>{Math.round(bestMatch.score)}%</Text>
                              </View>
                            </View>

                            <View
                              style={
                                styles.professionalActions
                              }
                            >
                              {/* VIEW PROFESSIONAL */}

                              <Pressable
                                onPress={() =>
                                  router.push(
                                    `/professionals/${bestMatch.professional.id}` as Href,
                                  )
                                }
                                style={({ pressed }) => [
                                  styles.viewProfessionalButton,

                                  pressed &&
                                  styles.buttonPressed,
                                ]}
                              >
                                <Text
                                  style={
                                    styles.viewProfessionalText
                                  }
                                >
                                  View Professional
                                </Text>

                                <ChevronRight
                                  size={17}
                                  color={
                                    PRIMARY
                                  }
                                />
                              </Pressable>

                              {/* MESSAGES */}

                              {(bestMatch.status ===
                                "CONTACTED" ||
                                bestMatch.status ===
                                "ACTIVE") ? (
                                <Pressable
                                  onPress={() =>
                                    router.push(
                                      "/(tabs)/messages" as Href,
                                    )
                                  }
                                  style={({ pressed }) => [
                                    styles.openMessagesButton,

                                    pressed &&
                                    styles.buttonPressed,
                                  ]}
                                >
                                  <MessageCircle
                                    size={17}
                                    color={
                                      WHITE
                                    }
                                  />

                                  <Text
                                    style={
                                      styles.openMessagesText
                                    }
                                  >
                                    Messages
                                  </Text>
                                </Pressable>
                              ) : null}

                              {/* LEAVE REVIEW
      Only after a completed match.
  */}

                              {bestMatch.status ===
                                "COMPLETED" ? (
                                <Pressable
                                  onPress={() =>
                                    router.push(
                                      `/reviews/create?professionalId=${encodeURIComponent(
                                        bestMatch.professional.id,
                                      )}&matchId=${encodeURIComponent(
                                        bestMatch.id,
                                      )}` as Href,
                                    )
                                  }
                                  style={({ pressed }) => [
                                    styles.leaveReviewButton,

                                    pressed &&
                                    styles.buttonPressed,
                                  ]}
                                >
                                  <Star
                                    size={18}
                                    color={
                                      GOLD
                                    }
                                    fill={
                                      GOLD
                                    }
                                  />

                                  <Text
                                    style={
                                      styles.leaveReviewText
                                    }
                                  >
                                    Leave a Review
                                  </Text>
                                </Pressable>
                              ) : null}
                            </View>
                          </View>
                        ) : null}
                      </View>
                    );
                  },
                )}
              </View>
            )}

            {filteredLeads.length >
              ITEMS_PER_PAGE ? (
              <View
                style={
                  styles.pagination
                }
              >
                <Pressable
                  disabled={
                    currentPage === 1
                  }
                  onPress={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1,
                        ),
                    )
                  }
                  style={[
                    styles.pageButton,
                    currentPage ===
                      1 &&
                      styles.pageButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageButtonText,
                      currentPage ===
                        1 &&
                        styles.pageButtonTextDisabled,
                    ]}
                  >
                    Previous
                  </Text>
                </Pressable>

                <View
                  style={
                    styles.pageIndicator
                  }
                >
                  <Text
                    style={
                      styles.pageIndicatorText
                    }
                  >
                    {currentPage} /{" "}
                    {totalPages}
                  </Text>
                </View>

                <Pressable
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onPress={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1,
                        ),
                    )
                  }
                  style={[
                    styles.pageButton,
                    currentPage ===
                      totalPages &&
                      styles.pageButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageButtonText,
                      currentPage ===
                        totalPages &&
                        styles.pageButtonTextDisabled,
                    ]}
                  >
                    Next
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}

        <View
          style={
            styles.bottomSpace
          }
        />
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

    container: {
      flex: 1,
      backgroundColor:
        BACKGROUND,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 20,
    },

    centerScreen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        BACKGROUND,
      paddingHorizontal: 24,
    },

    loadingText: {
      marginTop: 14,
      color: TEXT_MUTED,
      fontSize: 15,
      fontWeight: "500",
    },

    eyebrow: {
      color: GOLD,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1.4,
      marginBottom: 8,
    },

    title: {
      color: NAVY,
      fontSize: 36,
      lineHeight: 40,
      fontWeight: "800",
      letterSpacing: -1.1,
    },

    subtitle: {
      marginTop: 10,
      color: TEXT_MUTED,
      fontSize: 16,
      lineHeight: 24,
      maxWidth: 360,
    },

    statsGrid: {
      marginTop: 26,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },

    statCard: {
      width: "48%",
      minHeight: 142,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor:
        WHITE,
      padding: 17,
    },

    statIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "#F8FAFC",
    },

    statValue: {
      marginTop: 18,
      color: NAVY,
      fontSize: 30,
      lineHeight: 34,
      fontWeight: "800",
    },

    statLabel: {
      marginTop: 3,
      color: TEXT_MUTED,
      fontSize: 13,
      fontWeight: "500",
    },

    searchContainer: {
      marginTop: 20,
      minHeight: 56,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#D0D5DD",
      backgroundColor:
        WHITE,
      paddingHorizontal: 17,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },

    searchInput: {
      flex: 1,
      color: NAVY,
      fontSize: 15,
      minHeight: 54,
    },

    requestsList: {
      marginTop: 18,
      gap: 16,
    },

    requestCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor:
        WHITE,
      padding: 18,
    },

    requestHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent:
        "space-between",
      gap: 12,
    },

    requestHeaderContent: {
      flex: 1,
    },

    requestSource: {
      color: NAVY,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "800",
    },

    requestInterest: {
      marginTop: 4,
      color: TEXT_MUTED,
      fontSize: 14,
      lineHeight: 20,
    },

    badge: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },

    badgeText: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.3,
    },

    metaRow: {
      marginTop: 16,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
    },

    metaItem: {
      maxWidth: "70%",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    metaText: {
      color: TEXT_MUTED,
      fontSize: 13,
    },

    infoGrid: {
      marginTop: 18,
      flexDirection: "row",
      gap: 10,
    },

    infoBox: {
      flex: 1,
      minHeight: 84,
      borderRadius: 17,
      backgroundColor:
        "#F8FAFC",
      padding: 13,
    },

    infoLabel: {
      color: "#98A2B3",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.8,
    },

    budgetRow: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    infoValue: {
      flex: 1,
      color: NAVY,
      fontSize: 15,
      fontWeight: "700",
    },

    progressBadgeWrapper: {
      marginTop: 8,
    },

    progressMessage: {
      marginTop: 14,
      borderRadius: 15,
      backgroundColor:
        "#F8FAFC",
      padding: 13,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 9,
    },

    progressMessageText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600",
    },

    alertCard: {
      marginTop: 16,
      borderRadius: 19,
      borderWidth: 1,
      borderColor:
        "#DCE4EE",
      backgroundColor:
        "#F8FAFC",
      padding: 16,
    },

    alertHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      gap: 10,
    },

    alertTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    alertTitle: {
      color: NAVY,
      fontSize: 15,
      fontWeight: "800",
    },

    alertDescription: {
      marginTop: 11,
      color: TEXT_MUTED,
      fontSize: 13,
      lineHeight: 20,
    },

    lastMatched: {
      marginTop: 8,
      color: "#98A2B3",
      fontSize: 11,
      lineHeight: 17,
      fontWeight: "500",
    },

    alertButton: {
      marginTop: 14,
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    alertButtonActive: {
      backgroundColor:
        PRIMARY,
      borderColor: PRIMARY,
    },

    alertButtonInactive: {
      backgroundColor:
        WHITE,
      borderColor:
        "#D0D5DD",
    },

    alertButtonText: {
      fontSize: 13,
      fontWeight: "800",
    },

    buttonPressed: {
      opacity: 0.82,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    professionalCard: {
      marginTop: 16,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor:
        "#F8F9FA",
      padding: 16,
    },

    professionalTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },

    professionalTitleLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    professionalLabel: {
      color: TEXT_MUTED,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.7,
    },

    professionalName: {
      marginTop: 12,
      color: NAVY,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "800",
    },

    companyName: {
      marginTop: 3,
      color: TEXT_MUTED,
      fontSize: 13,
    },

    professionalDetails: {
      marginTop: 15,
      flexDirection: "row",
      gap: 10,
    },

    professionalDetail: {
      flex: 1,
      borderRadius: 14,
      backgroundColor:
        WHITE,
      padding: 12,
    },

    professionalDetailLabel: {
      color: "#98A2B3",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.7,
    },

    professionalDetailValue: {
      marginTop: 5,
      color: NAVY,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
    },

    matchScore: {
      marginTop: 5,
      color: GOLD,
      fontSize: 17,
      fontWeight: "900",
    },

    professionalActions: {
      marginTop: 14,
      gap: 9,
    },

    viewProfessionalButton: {
      minHeight: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: PRIMARY,
      backgroundColor: WHITE,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingHorizontal: 16,
    },

    viewProfessionalText: {
      color: PRIMARY,
      fontSize: 13,
      fontWeight: "800",
    },

    openMessagesButton: {
      minHeight: 48,
      borderRadius: 14,
      backgroundColor: PRIMARY,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingHorizontal: 16,
    },

    openMessagesText: {
      color: WHITE,
      fontSize: 13,
      fontWeight: "800",
    },
    leaveReviewButton: {
  minHeight: 48,

  borderRadius: 14,

  borderWidth: 1,

  borderColor:
    GOLD,

  backgroundColor:
    "#FFFBEA",

  flexDirection:
    "row",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap: 8,

  paddingHorizontal:
    16,
},

leaveReviewText: {
  color:
    NAVY,

  fontSize:
    13,

  fontWeight:
    "800",
},

    emptyCard: {
      marginTop: 18,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor:
        WHITE,
      paddingHorizontal: 24,
      paddingVertical: 42,
      alignItems: "center",
    },

    emptyIcon: {
      width: 60,
      height: 60,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "#F2F4F7",
    },

    emptyTitle: {
      marginTop: 17,
      color: NAVY,
      fontSize: 20,
      fontWeight: "800",
    },

    emptyText: {
      marginTop: 8,
      color: TEXT_MUTED,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
    },

    errorCard: {
      marginTop: 22,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#FECACA",
      backgroundColor:
        "#FEF2F2",
      padding: 18,
    },

    errorTitle: {
      color: "#B42318",
      fontSize: 16,
      fontWeight: "800",
    },

    errorText: {
      marginTop: 6,
      color: "#B42318",
      fontSize: 13,
      lineHeight: 19,
    },

    retryButton: {
      marginTop: 14,
      minHeight: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "#B42318",
    },

    retryButtonText: {
      color: WHITE,
      fontSize: 13,
      fontWeight: "800",
    },

    accessCard: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: PRIMARY,
      backgroundColor:
        WHITE,
      padding: 28,
      alignItems: "center",
    },

    accessIcon: {
      width: 58,
      height: 58,
      borderRadius: 19,
      backgroundColor:
        "#F2F4F7",
      alignItems: "center",
      justifyContent: "center",
    },

    accessTitle: {
      marginTop: 17,
      color: NAVY,
      fontSize: 22,
      fontWeight: "800",
    },

    accessDescription: {
      marginTop: 8,
      color: TEXT_MUTED,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
    },

    pagination: {
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    pageButton: {
      minWidth: 94,
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor:
        PRIMARY,
      alignItems: "center",
      justifyContent:
        "center",
    },

    pageButtonDisabled: {
      backgroundColor:
        "#EAECF0",
    },

    pageButtonText: {
      color: WHITE,
      fontSize: 12,
      fontWeight: "800",
    },

    pageButtonTextDisabled: {
      color: "#98A2B3",
    },

    pageIndicator: {
      minHeight: 44,
      paddingHorizontal: 15,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: WHITE,
      alignItems: "center",
      justifyContent:
        "center",
    },

    pageIndicatorText: {
      color: NAVY,
      fontSize: 12,
      fontWeight: "800",
    },

    bottomSpace: {
      height: 32,
    },
  });