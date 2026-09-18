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
  Calculator,
  CheckCircle2,
  Landmark,
  ShieldCheck,
  TrendingUp,
} from "lucide-react-native";

import AppMenu from "@/components/AppMenu";

import {
  useAppMenu,
} from "@/hooks/useAppMenu";

import {
  calculateBankMortgage,
} from "@/lib/calculators-api";

import {
  createLeadFromMortgageCalculator,
} from "@/lib/leads-api";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import type {
  AuthUser,
} from "@/types/auth";

import type {
  BankMortgageResult,
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

export default function MortgageCalculatorScreen() {
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
    propertyPrice,
    setPropertyPrice,
  ] =
    useState("350000");

  const [
    appraisalValue,
    setAppraisalValue,
  ] =
    useState("350000");

  const [
    downPayment,
    setDownPayment,
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
    useState<BankMortgageResult | null>(
      null,
    );

  const [
    creatingRequest,
    setCreatingRequest,
  ] =
    useState(false);

  async function handleCalculate() {
    const propertyPriceNumber =
      Number(
        propertyPrice,
      );

    const appraisalValueNumber =
      Number(
        appraisalValue,
      );

    const downPaymentNumber =
      Number(
        downPayment,
      );

    const termNumber =
      Number(
        loanTermYears,
      );

    if (
      !propertyPriceNumber ||
      propertyPriceNumber <= 0
    ) {
      setError(
        "Enter a valid property price.",
      );
      return;
    }

    if (
      !appraisalValueNumber ||
      appraisalValueNumber <= 0
    ) {
      setError(
        "Enter a valid appraisal value.",
      );
      return;
    }

    if (
      downPaymentNumber < 0
    ) {
      setError(
        "Down payment cannot be negative.",
      );
      return;
    }

    if (
      downPaymentNumber >=
      propertyPriceNumber
    ) {
      setError(
        "Down payment must be lower than the property price.",
      );
      return;
    }

    if (
      !termNumber ||
      termNumber <= 0
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
        await calculateBankMortgage(
          {
            bank,

            propertyPrice:
              propertyPriceNumber,

            appraisalValue:
              appraisalValueNumber,

            downPayment:
              downPaymentNumber,

            loanTermYears:
              termNumber,

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
          : "Unable to calculate mortgage.",
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
        "Please sign in as a buyer before creating a mortgage request.",
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
        "Only buyer accounts can create mortgage requests.",
      );

      return;
    }

    try {
      setCreatingRequest(true);

      const lead =
        await createLeadFromMortgageCalculator(
          token,
          {
            fullName:
              user.fullName ||
              undefined,

            email:
              user.email,

            source:
              "Mortgage Calculator",

            interest:
              `Mortgage / Property Purchase - ${result.bankName} simulation - Initial payment: ${formatEuro(
                result.initialMonthlyPayment,
              )} - Initial TAN: ${formatPercent(
                result.initialTan,
              )}%`,

            location:
              "Portugal",

            budget:
              `${formatEuro(
                result.propertyPrice,
              )} property`,
          },
        );

      Alert.alert(
        lead.alreadyExists
          ? "Request already exists"
          : "Mortgage request created",
        lead.alreadyExists
          ? "This mortgage request is already available in My Requests."
          : "Your mortgage request was created successfully and is ready for matching.",
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
          : "Unable to create the mortgage request.",
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
            <Calculator
              size={24}
              color={
                Colors.navy
              }
            />
          </View>

          <Text
            style={
              styles.eyebrow
            }
          >
            FINANCING TOOL
          </Text>

          <Text
            style={
              styles.title
            }
          >
            Mortgage Calculator
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Compare a real bank mortgage simulation based on your property value, financing needs and purchase purpose.
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
            label="Property price"
            value={
              propertyPrice
            }
            onChangeText={
              setPropertyPrice
            }
            prefix="€"
            placeholder="350000"
          />

          <Field
            label="Appraisal value"
            value={
              appraisalValue
            }
            onChangeText={
              setAppraisalValue
            }
            prefix="€"
            placeholder="350000"
          />

          <Field
            label="Down payment"
            value={
              downPayment
            }
            onChangeText={
              setDownPayment
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
                <Calculator
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.calculateButtonText
                  }
                >
                  Calculate Mortgage
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {result ? (
          <>
            <MortgageResults
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
                Need mortgage support?
              </Text>

              <Text
                style={
                  styles.requestDescription
                }
              >
                Create a mortgage request from this simulation and continue to professional matching.
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
                      Create Mortgage Request
                    </Text>

                    <Text
                      style={
                        styles.requestButtonSubtext
                      }
                    >
                      Get matched with a verified mortgage professional
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        ) : null}

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
              Indicative simulation
            </Text>

            <Text
              style={
                styles.noticeText
              }
            >
              This calculator provides an estimate based on the bank conditions stored in the platform. Final approval remains subject to the bank&apos;s credit assessment.
            </Text>
          </View>
        </View>

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

function MortgageResults({
  result,
}: {
  result:
    BankMortgageResult;
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
            color={
              Colors.gold
            }
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
            Mortgage Simulation
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
          Initial monthly payment
        </Text>

        <Text
          style={
            styles.primaryResultValue
          }
        >
          {formatEuro(
            result.initialMonthlyPayment,
          )}
        </Text>

        <Text
          style={
            styles.primaryResultSub
          }
        >
          First fixed-rate period
        </Text>
      </View>

      <View
        style={
          styles.metricsGrid
        }
      >
        <MetricCard
          label="Loan amount"
          value={formatEuro(
            result.loanAmount,
          )}
        />

        <MetricCard
          label="Variable payment"
          value={formatEuro(
            result.estimatedVariablePayment,
          )}
        />

        <MetricCard
          label="Initial TAN"
          value={`${formatPercent(
            result.initialTan,
          )}%`}
        />

        <MetricCard
          label="Variable TAN"
          value={`${formatPercent(
            result.variableTan,
          )}%`}
        />

        <MetricCard
          label="LTV"
          value={`${formatPercent(
            result.ltv,
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
          Financing details
        </Text>

        <ResultRow
          label="Property price"
          value={formatEuro(
            result.propertyPrice,
          )}
        />

        <ResultRow
          label="Appraisal value"
          value={formatEuro(
            result.appraisalValue,
          )}
        />

        <ResultRow
          label="Down payment"
          value={formatEuro(
            result.downPayment,
          )}
        />

        <ResultRow
          label="Loan term"
          value={`${result.loanTermYears} years`}
        />

        <ResultRow
          label="Fixed period"
          value={`${result.fixedPeriodYears} years`}
        />

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

        {result.referenceTaeg !==
        undefined ? (
          <ResultRow
            label="Reference TAEG"
            value={`${formatPercent(
              result.referenceTaeg,
            )}%`}
          />
        ) : null}

        <ResultRow
          label="Estimated interest"
          value={formatEuro(
            result.estimatedInterest,
          )}
        />

        <ResultRow
          label="Estimated total payments"
          value={formatEuro(
            result.estimatedTotalPayments,
          )}
        />
      </View>

      <View
        style={[
          styles.eligibilityCard,

          result.ltvEligible
            ? styles.eligibilityGood
            : styles.eligibilityWarning,
        ]}
      >
        <View
          style={
            styles.eligibilityHeader
          }
        >
          <CheckCircle2
            size={20}
            color={
              result.ltvEligible
                ? "#15803D"
                : "#B45309"
            }
          />

          <Text
            style={[
              styles.eligibilityTitle,

              {
                color:
                  result.ltvEligible
                    ? "#15803D"
                    : "#B45309",
              },
            ]}
          >
            {result.ltvEligible
              ? "LTV eligible"
              : "Additional equity required"}
          </Text>
        </View>

        <Text
          style={
            styles.eligibilityText
          }
        >
          {
            result.eligibility
              .message
          }
        </Text>

        {!result.ltvEligible &&
        result.additionalDownPaymentNeeded >
          0 ? (
          <View
            style={
              styles.additionalPayment
            }
          >
            <Text
              style={
                styles.additionalPaymentLabel
              }
            >
              Additional down payment
            </Text>

            <Text
              style={
                styles.additionalPaymentValue
              }
            >
              {formatEuro(
                result.additionalDownPaymentNeeded,
              )}
            </Text>
          </View>
        ) : null}
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

      <Text
        style={
          styles.disclaimer
        }
      >
        {
          result.disclaimer
        }
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
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "#EEF3F8",
    },

    eyebrow: {
      marginTop: 16,
      color: Colors.gold,
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
      color: Colors.navyDark,
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
        Colors.navy,
      backgroundColor:
        Colors.navy,
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
        Colors.navy,
      backgroundColor:
        "#EEF3F8",
    },

    purposeText: {
      color:
        Colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },

    purposeTextActive: {
      color: Colors.navy,
      fontWeight: "900",
    },

    field: {
      marginTop: 20,
    },

    fieldLabel: {
      color: Colors.navyDark,
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
        Colors.navy,
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
        "#FFF8E1",
      alignItems: "center",
      justifyContent: "center",
    },

    resultEyebrow: {
      color: Colors.gold,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    resultTitle: {
      marginTop: 2,
      color: Colors.navyDark,
      fontSize: 20,
      fontWeight: "900",
    },

    primaryResult: {
      borderRadius: 24,
      backgroundColor:
        Colors.navy,
      padding: 21,
    },

    primaryResultLabel: {
      color: "#D0D5DD",
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
      color: Colors.gold,
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
      color: Colors.navyDark,
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
      color: Colors.navyDark,
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
      justifyContent: "space-between",
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
      color: Colors.navyDark,
      fontSize: 11,
      fontWeight: "800",
    },

    eligibilityCard: {
      marginTop: 12,
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
    },

    eligibilityGood: {
      borderColor:
        "#ABEFC6",
      backgroundColor:
        "#ECFDF3",
    },

    eligibilityWarning: {
      borderColor:
        "#FEDF89",
      backgroundColor:
        "#FFFAEB",
    },

    eligibilityHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    eligibilityTitle: {
      fontSize: 13,
      fontWeight: "900",
    },

    eligibilityText: {
      marginTop: 8,
      color: "#475467",
      fontSize: 11,
      lineHeight: 18,
    },

    additionalPayment: {
      marginTop: 12,
      borderRadius: 14,
      backgroundColor:
        "rgba(255,255,255,0.65)",
      padding: 12,
    },

    additionalPaymentLabel: {
      color:
        Colors.textSecondary,
      fontSize: 10,
    },

    additionalPaymentValue: {
      marginTop: 4,
      color: "#B45309",
      fontSize: 18,
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
      color: Colors.navyDark,
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

    disclaimer: {
      marginTop: 12,
      color:
        Colors.textSecondary,
      fontSize: 9,
      lineHeight: 15,
    },

    notice: {
      marginTop: 22,
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
      color: Colors.navyDark,
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
      color: Colors.gold,
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
      minHeight: 62,
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
      textAlign: "center",
    },
  });
