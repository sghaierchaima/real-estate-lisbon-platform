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
  useState,
} from "react";

import {
  router,
} from "expo-router";

import {
  ArrowLeft,
  CircleDollarSign,
  CheckCircle2,
  Gauge,
  Landmark,
  ShieldCheck,
  TrendingUp,
} from "lucide-react-native";

import AppMenu from "@/components/AppMenu";

import {
  useAppMenu,
} from "@/hooks/useAppMenu";

import {
  calculateBankAffordability,
} from "@/lib/calculators-api";

import {
  createLeadFromAffordabilityCalculator,
} from "@/lib/leads-api";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import type {
  AuthUser,
} from "@/types/auth";

import type {
  BankAffordabilityResult,
  MortgageBank,
  PropertyPurpose,
} from "@/lib/calculators-api";

import {
  Colors,
} from "@/constants/colors";

const BANKS: {
  value: MortgageBank;
  label: string;
}[] = [
  {
    value: "SANTANDER",
    label: "Santander",
  },
  {
    value: "CGD",
    label: "CGD",
  },
];

const PURPOSES: {
  value: PropertyPurpose;
  label: string;
}[] = [
  {
    value: "PRIMARY_RESIDENCE",
    label: "Primary residence",
  },
  {
    value: "SECOND_HOME",
    label: "Second home",
  },
  {
    value: "INVESTMENT",
    label: "Investment",
  },
];

export default function AffordabilityCalculatorScreen() {
  const {
    menuVisible,
    menuUser,
    savedCount,
    unreadMessages,
    openMenu,
    closeMenu,
  } = useAppMenu();

  const [
    bank,
    setBank,
  ] =
    useState<MortgageBank>(
      "SANTANDER",
    );

  const [
    purpose,
    setPurpose,
  ] =
    useState<PropertyPurpose>(
      "PRIMARY_RESIDENCE",
    );

  const [
    monthlyNetIncome,
    setMonthlyNetIncome,
  ] =
    useState("4500");

  const [
    existingMonthlyDebts,
    setExistingMonthlyDebts,
  ] =
    useState("500");

  const [
    availableDownPayment,
    setAvailableDownPayment,
  ] =
    useState("70000");

  const [
    loanTermYears,
    setLoanTermYears,
  ] =
    useState("30");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    result,
    setResult,
  ] =
    useState<BankAffordabilityResult | null>(
      null,
    );

  const [
    creatingRequest,
    setCreatingRequest,
  ] =
    useState(false);

  async function handleCalculate() {
    const income =
      Number(
        monthlyNetIncome,
      );

    const debts =
      Number(
        existingMonthlyDebts,
      );

    const downPayment =
      Number(
        availableDownPayment,
      );

    const term =
      Number(
        loanTermYears,
      );

    if (
      !income ||
      income <= 0
    ) {
      setError(
        "Enter a valid monthly net income.",
      );
      return;
    }

    if (
      debts < 0
    ) {
      setError(
        "Monthly debts cannot be negative.",
      );
      return;
    }

    if (
      downPayment < 0
    ) {
      setError(
        "Down payment cannot be negative.",
      );
      return;
    }

    if (
      !term ||
      term <= 0
    ) {
      setError(
        "Enter a valid loan term.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data =
        await calculateBankAffordability(
          {
            bank,

            monthlyNetIncome:
              income,

            existingMonthlyDebts:
              debts,

            availableDownPayment:
              downPayment,

            loanTermYears:
              term,

            purpose,
          },
        );

      setResult(
        data,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to calculate affordability.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRequest() {
    if (!result || creatingRequest) {
      return;
    }

    const token =
      await getToken();

    const user =
      await getStoredUser<AuthUser>();

    if (!token || !user) {
      Alert.alert(
        "Login required",
        "Please sign in as a buyer before creating a request.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Sign in",
            onPress: () =>
              router.push("/login"),
          },
        ],
      );

      return;
    }

    if (user.role !== "BUYER") {
      Alert.alert(
        "Buyer account required",
        "Only buyer accounts can create property requests.",
      );

      return;
    }

    try {
      setCreatingRequest(true);

      const lead =
        await createLeadFromAffordabilityCalculator(
          token,
          {
            annualIncome:
              String(
                Math.round(
                  result.monthlyNetIncome * 12,
                ),
              ),

            monthlyDebts:
              String(
                result.existingMonthlyDebts,
              ),

            downPayment:
              String(
                result.availableDownPayment,
              ),

            interestRate:
              String(
                result.initialTan,
              ),

            recommendedBudget:
              String(
                Math.round(
                  result.recommendedPropertyBudget,
                ),
              ),

            maximumBudget:
              String(
                Math.round(
                  result.maximumPropertyBudget,
                ),
              ),

            debtToIncome:
              Number(
                result.finalDsti,
              ).toFixed(1),

            riskLabel:
              result.riskLabel,
          },
        );

      Alert.alert(
        lead.alreadyExists
          ? "Request already exists"
          : "Buyer request created",
        lead.alreadyExists
          ? "This affordability request is already available in My Requests."
          : "Your affordability request was created successfully and is ready for matching.",
        [
          {
            text: "View Requests",
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
        "Request failed",
        err instanceof Error
          ? err.message
          : "Unable to create the buyer request.",
      );
    } finally {
      setCreatingRequest(false);
    }
  }

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
            <CircleDollarSign
              size={24}
              color="#287B2B"
            />
          </View>

          <Text
            style={
              styles.eyebrow
            }
          >
            BUYING POWER
          </Text>

          <Text
            style={
              styles.title
            }
          >
            Affordability Calculator
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Estimate how much property you may be able to afford based on your income, debts, available down payment and financing conditions.
          </Text>
        </View>

        <View
          style={
            styles.formCard
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Bank
          </Text>

          <View
            style={
              styles.segmentRow
            }
          >
            {BANKS.map(
              (
                item,
              ) => (
                <Pressable
                  key={
                    item.value
                  }
                  onPress={() =>
                    setBank(
                      item.value,
                    )
                  }
                  style={[
                    styles.segmentButton,

                    bank ===
                      item.value &&
                      styles.segmentButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,

                      bank ===
                        item.value &&
                        styles.segmentTextActive,
                    ]}
                  >
                    {
                      item.label
                    }
                  </Text>
                </Pressable>
              ),
            )}
          </View>

          <Text
            style={[
              styles.sectionTitle,
              {
                marginTop: 24,
              },
            ]}
          >
            Purchase purpose
          </Text>

          <View
            style={
              styles.purposeGrid
            }
          >
            {PURPOSES.map(
              (
                item,
              ) => (
                <Pressable
                  key={
                    item.value
                  }
                  onPress={() =>
                    setPurpose(
                      item.value,
                    )
                  }
                  style={[
                    styles.purposeButton,

                    purpose ===
                      item.value &&
                      styles.purposeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.purposeText,

                      purpose ===
                        item.value &&
                        styles.purposeTextActive,
                    ]}
                  >
                    {
                      item.label
                    }
                  </Text>
                </Pressable>
              ),
            )}
          </View>

          <Field
            label="Monthly net income"
            value={
              monthlyNetIncome
            }
            onChangeText={
              setMonthlyNetIncome
            }
            prefix="€"
            placeholder="4500"
          />

          <Field
            label="Existing monthly debts"
            value={
              existingMonthlyDebts
            }
            onChangeText={
              setExistingMonthlyDebts
            }
            prefix="€"
            placeholder="500"
          />

          <Field
            label="Available down payment"
            value={
              availableDownPayment
            }
            onChangeText={
              setAvailableDownPayment
            }
            prefix="€"
            placeholder="70000"
          />

          <Field
            label="Loan term"
            value={
              loanTermYears
            }
            onChangeText={
              setLoanTermYears
            }
            suffix="years"
            placeholder="30"
          />

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

          <Pressable
            disabled={
              loading
            }
            onPress={() =>
              void handleCalculate()
            }
            style={[
              styles.calculateButton,

              loading &&
                styles.calculateButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <>
                <CircleDollarSign
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.calculateButtonText
                  }
                >
                  Calculate Affordability
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {result ? (
          <>
            <AffordabilityResults
              result={
                result
              }
            />

            <View
              style={
                styles.requestCard
              }
            >
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
                Ready to move forward?
              </Text>

              <Text
                style={
                  styles.requestDescription
                }
              >
                Create a buyer request from this affordability simulation and let the platform match you with verified professionals.
              </Text>

              <Pressable
                disabled={
                  creatingRequest
                }
                onPress={() =>
                  void handleCreateRequest()
                }
                style={[
                  styles.requestButton,

                  creatingRequest &&
                    styles.requestButtonDisabled,
                ]}
              >
                {creatingRequest ? (
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
          </>
        ) : null}

        <View
          style={{
            height: 30,
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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  prefix,
  suffix,
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
        {prefix ? (
          <Text
            style={
              styles.inputAffix
            }
          >
            {prefix}
          </Text>
        ) : null}

        <TextInput
          value={
            value
          }
          onChangeText={
            onChangeText
          }
          placeholder={
            placeholder
          }
          placeholderTextColor="#98A2B3"
          keyboardType="decimal-pad"
          style={
            styles.input
          }
        />

        {suffix ? (
          <Text
            style={
              styles.inputAffix
            }
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function AffordabilityResults({
  result,
}: {
  result:
    BankAffordabilityResult;
}) {
  return (
    <View
      style={
        styles.resultsSection
      }
    >
      <View
        style={
          styles.resultHeader
        }
      >
        <View
          style={
            styles.resultHeaderIcon
          }
        >
          <Landmark
            size={22}
            color="#287B2B"
          />
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.resultEyebrow
            }
          >
            {
              result.bankName
            }
          </Text>

          <Text
            style={
              styles.resultTitle
            }
          >
            Buying Power Estimate
          </Text>
        </View>
      </View>

      <View
        style={
          styles.primaryResult
        }
      >
        <Text
          style={
            styles.primaryResultLabel
          }
        >
          Recommended property budget
        </Text>

        <Text
          style={
            styles.primaryResultValue
          }
        >
          {formatEuro(
            result.recommendedPropertyBudget,
          )}
        </Text>

        <Text
          style={
            styles.primaryResultSub
          }
        >
          Based on your current financial profile
        </Text>
      </View>

      <View
        style={
          styles.metricsGrid
        }
      >
        <MetricCard
          label="Maximum budget"
          value={formatEuro(
            result.maximumPropertyBudget,
          )}
        />

        <MetricCard
          label="Maximum loan"
          value={formatEuro(
            result.maximumLoanAmount,
          )}
        />

        <MetricCard
          label="Estimated payment"
          value={formatEuro(
            result.estimatedMortgagePayment,
          )}
        />

        <MetricCard
          label="Comfortable payment"
          value={formatEuro(
            result.comfortableMortgagePayment,
          )}
        />

        <MetricCard
          label="DSTI"
          value={`${formatPercent(
            result.finalDsti,
          )}%`}
        />

        <MetricCard
          label="Maximum LTV"
          value={`${formatPercent(
            result.maxLtv,
          )}%`}
        />
      </View>

      <View
        style={
          styles.detailCard
        }
      >
        <Text
          style={
            styles.detailTitle
          }
        >
          Financial profile
        </Text>

        <ResultRow
          label="Monthly net income"
          value={formatEuro(
            result.monthlyNetIncome,
          )}
        />

        <ResultRow
          label="Existing debts"
          value={formatEuro(
            result.existingMonthlyDebts,
          )}
        />

        <ResultRow
          label="Down payment"
          value={formatEuro(
            result.availableDownPayment,
          )}
        />

        <ResultRow
          label="Loan term"
          value={`${result.loanTermYears} years`}
        />

        <ResultRow
          label="Maximum mortgage payment"
          value={formatEuro(
            result.maximumMortgagePayment,
          )}
        />

        <ResultRow
          label="Comfortable mortgage payment"
          value={formatEuro(
            result.comfortableMortgagePayment,
          )}
        />

        <ResultRow
          label="Income-based maximum loan"
          value={formatEuro(
            result.incomeBasedMaximumLoan,
          )}
        />

        <ResultRow
          label="Down-payment maximum loan"
          value={formatEuro(
            result.downPaymentBasedMaximumLoan,
          )}
        />

        <ResultRow
          label="Reference maximum DSTI"
          value={`${formatPercent(
            result.referenceMaximumDsti,
          )}%`}
        />

        <ResultRow
          label="Comfortable DSTI"
          value={`${formatPercent(
            result.comfortableDsti,
          )}%`}
        />

        <ResultRow
          label="Final DSTI"
          value={`${formatPercent(
            result.finalDsti,
          )}%`}
        />

        <ResultRow
          label="Limiting factor"
          value={
            result.limitingFactor ===
            "INCOME"
              ? "Income"
              : "Down payment"
          }
        />

        {result.referenceTaeg !==
        undefined ? (
          <ResultRow
            label="Reference TAEG"
            value={`${formatPercent(
              result.referenceTaeg,
            )}%`}
          />
        ) : null}

        {result.euriborType ? (
          <ResultRow
            label="Euribor"
            value={
              result.euriborRate !==
              undefined
                ? `${result.euriborType} · ${formatPercent(
                    result.euriborRate,
                  )}%`
                : result.euriborType
            }
          />
        ) : null}

        {result.spread !==
        undefined ? (
          <ResultRow
            label="Spread"
            value={`${formatPercent(
              result.spread,
            )}%`}
          />
        ) : null}
      </View>

      <View
        style={[
          styles.riskCard,
          riskStyle(
            result.riskLevel,
          ),
        ]}
      >
        <View
          style={
            styles.riskHeader
          }
        >
          <Gauge
            size={20}
            color={riskColor(
              result.riskLevel,
            )}
          />

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={[
                styles.riskTitle,
                {
                  color:
                    riskColor(
                      result.riskLevel,
                    ),
                },
              ]}
            >
              {
                result.riskLabel
              }
            </Text>

            <Text
              style={
                styles.riskSubtitle
              }
            >
              Affordability risk assessment
            </Text>
          </View>
        </View>

        <View
          style={
            styles.riskMetrics
          }
        >
          <View
            style={
              styles.riskMetric
            }
          >
            <Text
              style={
                styles.riskMetricLabel
              }
            >
              Final DSTI
            </Text>

            <Text
              style={
                styles.riskMetricValue
              }
            >
              {formatPercent(
                result.finalDsti,
              )}
              %
            </Text>
          </View>

          <View
            style={
              styles.riskMetric
            }
          >
            <Text
              style={
                styles.riskMetricLabel
              }
            >
              Reference
            </Text>

            <Text
              style={
                styles.riskMetricValue
              }
            >
              {formatPercent(
                result.referenceMaximumDsti,
              )}
              %
            </Text>
          </View>
        </View>
      </View>

      <View
        style={
          styles.conditionsCard
        }
      >
        <TrendingUp
          size={19}
          color={
            Colors.navy
          }
        />

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.conditionsTitle
            }
          >
            Bank conditions
          </Text>

          <Text
            style={
              styles.conditionsText
            }
          >
            {
              result.conditions
                .sourceLabel
            }
          </Text>

          <Text
            style={
              styles.conditionsDate
            }
          >
            Effective from{" "}
            {
              result.conditions
                .effectiveFrom
            }
          </Text>
        </View>
      </View>

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

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.noticeTitle
            }
          >
            Indicative affordability estimate
          </Text>

          <Text
            style={
              styles.noticeText
            }
          >
            {
              result.disclaimer
            }
          </Text>
        </View>
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
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.resultRow
      }
    >
      <Text
        style={
          styles.resultRowLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.resultRowValue
        }
      >
        {value}
      </Text>
    </View>
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
    Number(
      value || 0,
    ),
  );
}

function formatPercent(
  value: number,
) {
  return Number(
    value || 0,
  ).toLocaleString(
    "en-IE",
    {
      maximumFractionDigits:
        2,
    },
  );
}

function riskColor(
  risk:
    BankAffordabilityResult["riskLevel"],
) {
  switch (risk) {
    case "COMFORTABLE":
      return "#15803D";

    case "MODERATE":
      return "#B45309";

    case "HIGH":
      return "#C2410C";

    case "ABOVE_REFERENCE":
      return "#B42318";

    default:
      return Colors.navy;
  }
}

function riskStyle(
  risk:
    BankAffordabilityResult["riskLevel"],
) {
  switch (risk) {
    case "COMFORTABLE":
      return {
        borderColor:
          "#ABEFC6",
        backgroundColor:
          "#ECFDF3",
      };

    case "MODERATE":
      return {
        borderColor:
          "#FEDF89",
        backgroundColor:
          "#FFFAEB",
      };

    case "HIGH":
      return {
        borderColor:
          "#FDB022",
        backgroundColor:
          "#FFF6ED",
      };

    case "ABOVE_REFERENCE":
      return {
        borderColor:
          "#FECDCA",
        backgroundColor:
          "#FEF3F2",
      };

    default:
      return {};
  }
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
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    iconButton: {
      width: 46,
      height: 46,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
    },

    menuButton: {
      minHeight: 44,
      paddingHorizontal: 15,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
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
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "#ECFDF3",
    },

    eyebrow: {
      marginTop: 16,
      color: "#287B2B",
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
      marginTop: 25,
      borderRadius: 24,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      padding: 18,
    },

    sectionTitle: {
      color:
        Colors.navyDark,
      fontSize: 13,
      fontWeight: "900",
    },

    segmentRow: {
      marginTop: 10,
      flexDirection: "row",
      gap: 8,
    },

    segmentButton: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "#FFFFFF",
    },

    segmentButtonActive: {
      borderColor:
        "#287B2B",
      backgroundColor:
        "#287B2B",
    },

    segmentText: {
      color:
        Colors.textSecondary,
      fontSize: 12,
      fontWeight: "800",
    },

    segmentTextActive: {
      color: "#FFFFFF",
    },

    purposeGrid: {
      marginTop: 10,
      gap: 8,
    },

    purposeButton: {
      minHeight: 47,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      justifyContent: "center",
      paddingHorizontal: 14,
      backgroundColor:
        "#FFFFFF",
    },

    purposeButtonActive: {
      borderColor:
        "#287B2B",
      backgroundColor:
        "#ECFDF3",
    },

    purposeText: {
      color:
        Colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },

    purposeTextActive: {
      color:
        "#287B2B",
      fontWeight: "900",
    },

    field: {
      marginTop: 20,
    },

    fieldLabel: {
      color:
        Colors.navyDark,
      fontSize: 12,
      fontWeight: "800",
    },

    inputWrapper: {
      marginTop: 8,
      minHeight: 54,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      backgroundColor:
        "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
    },

    inputAffix: {
      color:
        Colors.textSecondary,
      fontSize: 14,
      fontWeight: "700",
    },

    input: {
      flex: 1,
      minHeight: 52,
      paddingHorizontal: 9,
      color:
        Colors.navyDark,
      fontSize: 15,
      fontWeight: "700",
    },

    errorBox: {
      marginTop: 18,
      borderRadius: 14,
      backgroundColor:
        "#FEF2F2",
      padding: 13,
    },

    errorText: {
      color: "#B42318",
      fontSize: 11,
      lineHeight: 17,
    },

    calculateButton: {
      marginTop: 22,
      minHeight: 54,
      borderRadius: 16,
      backgroundColor:
        "#287B2B",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    calculateButtonDisabled: {
      opacity: 0.65,
    },

    calculateButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "900",
    },

    resultsSection: {
      marginTop: 24,
    },

    resultHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 14,
    },

    resultHeaderIcon: {
      width: 47,
      height: 47,
      borderRadius: 15,
      backgroundColor:
        "#ECFDF3",
      alignItems: "center",
      justifyContent: "center",
    },

    resultEyebrow: {
      color: "#287B2B",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    resultTitle: {
      marginTop: 2,
      color:
        Colors.navyDark,
      fontSize: 20,
      fontWeight: "900",
    },

    primaryResult: {
      borderRadius: 24,
      backgroundColor:
        "#287B2B",
      padding: 21,
    },

    primaryResultLabel: {
      color: "#D1FADF",
      fontSize: 11,
    },

    primaryResultValue: {
      marginTop: 8,
      color: "#FFFFFF",
      fontSize: 34,
      fontWeight: "900",
      letterSpacing: -1,
    },

    primaryResultSub: {
      marginTop: 5,
      color: "#D1FADF",
      fontSize: 10,
      fontWeight: "700",
    },

    metricsGrid: {
      marginTop: 12,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },

    metricCard: {
      width: "48%",
      minHeight: 94,
      borderRadius: 18,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      padding: 14,
      justifyContent: "center",
    },

    metricLabel: {
      color:
        Colors.textSecondary,
      fontSize: 10,
    },

    metricValue: {
      marginTop: 6,
      color:
        Colors.navyDark,
      fontSize: 16,
      fontWeight: "900",
    },

    detailCard: {
      marginTop: 12,
      borderRadius: 22,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      padding: 17,
    },

    detailTitle: {
      marginBottom: 7,
      color:
        Colors.navyDark,
      fontSize: 16,
      fontWeight: "900",
    },

    resultRow: {
      minHeight: 47,
      borderBottomWidth: 1,
      borderBottomColor:
        "#F2F4F7",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
    },

    resultRowLabel: {
      flex: 1,
      color:
        Colors.textSecondary,
      fontSize: 11,
    },

    resultRowValue: {
      maxWidth: "55%",
      textAlign: "right",
      color:
        Colors.navyDark,
      fontSize: 11,
      fontWeight: "800",
    },

    riskCard: {
      marginTop: 12,
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
    },

    riskHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    riskTitle: {
      fontSize: 13,
      fontWeight: "900",
    },

    riskSubtitle: {
      marginTop: 2,
      color:
        Colors.textSecondary,
      fontSize: 9,
    },

    riskMetrics: {
      marginTop: 14,
      flexDirection: "row",
      gap: 10,
    },

    riskMetric: {
      flex: 1,
      borderRadius: 14,
      backgroundColor:
        "rgba(255,255,255,0.65)",
      padding: 12,
    },

    riskMetricLabel: {
      color:
        Colors.textSecondary,
      fontSize: 9,
    },

    riskMetricValue: {
      marginTop: 3,
      color:
        Colors.navyDark,
      fontSize: 17,
      fontWeight: "900",
    },

    conditionsCard: {
      marginTop: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      backgroundColor:
        "#FFFFFF",
      padding: 16,
      flexDirection: "row",
      gap: 11,
    },

    conditionsTitle: {
      color:
        Colors.navyDark,
      fontSize: 13,
      fontWeight: "900",
    },

    conditionsText: {
      marginTop: 4,
      color:
        Colors.textSecondary,
      fontSize: 10,
      lineHeight: 16,
    },

    conditionsDate: {
      marginTop: 5,
      color: Colors.gold,
      fontSize: 9,
      fontWeight: "700",
    },

    notice: {
      marginTop: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#F3E6AD",
      backgroundColor:
        "#FFFBEB",
      padding: 15,
      flexDirection: "row",
      gap: 10,
    },

    noticeTitle: {
      color:
        Colors.navyDark,
      fontSize: 12,
      fontWeight: "900",
    },

    noticeText: {
      marginTop: 4,
      color:
        Colors.textSecondary,
      fontSize: 10,
      lineHeight: 17,
    },

    requestCard: {
      marginTop: 14,
      borderRadius: 22,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#EAECF0",
      padding: 18,
    },

    requestEyebrow: {
      color: "#287B2B",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.1,
    },

    requestTitle: {
      marginTop: 7,
      color: Colors.navyDark,
      fontSize: 18,
      fontWeight: "900",
    },

    requestDescription: {
      marginTop: 7,
      color: Colors.textSecondary,
      fontSize: 11,
      lineHeight: 18,
    },

    requestButton: {
      marginTop: 15,
      minHeight: 60,
      borderRadius: 17,
      backgroundColor: Colors.navy,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
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
  });
