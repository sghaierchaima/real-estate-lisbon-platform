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
  BadgeEuro,
  Landmark,
  Receipt,
  ShieldCheck,
  WalletCards,
} from "lucide-react-native";

import AppMenu from "@/components/AppMenu";

import {
  useAppMenu,
} from "@/hooks/useAppMenu";

import {
  calculateBankTrueCost,
} from "@/lib/calculators-api";

import type {
  BankTrueCostResult,
  MortgageBank,
  PropertyPurpose,
} from "@/lib/calculators-api";

import {
  createLeadFromTrueCostCalculator,
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
   OPTIONS
============================================================ */

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

/* ============================================================
   PAGE
============================================================ */

export default function TrueCostCalculatorScreen() {
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
  ] = useState<MortgageBank>(
    "SANTANDER",
  );

  const [
    purpose,
    setPurpose,
  ] = useState<PropertyPurpose>(
    "PRIMARY_RESIDENCE",
  );

  const [
    propertyPrice,
    setPropertyPrice,
  ] = useState(
    "350000",
  );

  const [
    vptValue,
    setVptValue,
  ] = useState(
    "300000",
  );

  const [
    loanAmount,
    setLoanAmount,
  ] = useState(
    "280000",
  );

  const [
    loanTermYears,
    setLoanTermYears,
  ] = useState(
    "30",
  );

  const [
    legalFees,
    setLegalFees,
  ] = useState(
    "1500",
  );

  const [
    registrationNotaryFees,
    setRegistrationNotaryFees,
  ] = useState(
    "1200",
  );

  const [
    loading,
    setLoading,
  ] = useState(
    false,
  );

  const [
    creatingRequest,
    setCreatingRequest,
  ] = useState(
    false,
  );

  const [
    error,
    setError,
  ] = useState(
    "",
  );

  const [
    result,
    setResult,
  ] =
    useState<BankTrueCostResult | null>(
      null,
    );

  /* ============================================================
     CALCULATE
  ============================================================ */

  async function handleCalculate() {
    const propertyPriceNumber =
      Number(
        propertyPrice,
      );

    const vptValueNumber =
      Number(
        vptValue,
      );

    const loanAmountNumber =
      Number(
        loanAmount,
      );

    const loanTermYearsNumber =
      Number(
        loanTermYears,
      );

    const legalFeesNumber =
      Number(
        legalFees,
      );

    const registrationFeesNumber =
      Number(
        registrationNotaryFees,
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
      !vptValueNumber ||
      vptValueNumber <= 0
    ) {
      setError(
        "Enter a valid VPT value.",
      );

      return;
    }

    if (
      loanAmountNumber < 0
    ) {
      setError(
        "Loan amount cannot be negative.",
      );

      return;
    }

    if (
      loanAmountNumber >
      propertyPriceNumber
    ) {
      setError(
        "Loan amount cannot be higher than the property price.",
      );

      return;
    }

    if (
      !loanTermYearsNumber ||
      loanTermYearsNumber <= 0
    ) {
      setError(
        "Enter a valid loan term.",
      );

      return;
    }

    if (
      legalFeesNumber < 0 ||
      registrationFeesNumber < 0
    ) {
      setError(
        "Fees cannot be negative.",
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

      setResult(
        null,
      );

      const data =
        await calculateBankTrueCost(
          {
            propertyPrice:
              propertyPriceNumber,

            vptValue:
              vptValueNumber,

            purpose,

            region:
              "MAINLAND",

            bank,

            loanAmount:
              loanAmountNumber,

            loanTermYears:
              loanTermYearsNumber,

            legalFees:
              legalFeesNumber,

            registrationNotaryFees:
              registrationFeesNumber,
          },
        );

      setResult(
        data,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to calculate acquisition costs.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  /* ============================================================
     CREATE BUYER REQUEST
  ============================================================ */

  async function handleCreateRequest() {
    if (
      !result ||
      creatingRequest
    ) {
      return;
    }

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
        "Please sign in as a buyer before creating a request.",
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
        "Only buyer accounts can create property requests.",
      );

      return;
    }

    try {
      setCreatingRequest(
        true,
      );

      const lead =
        await createLeadFromTrueCostCalculator(
          token,
          {
            propertyPrice:
              String(
                result.propertyPrice,
              ),

            imtTax:
              String(
                result.imtTax,
              ),

            stampDuty:
              String(
                result.acquisitionStampDuty +
                  result.mortgageStampDuty,
              ),

            notaryFees:
              String(
                result.registrationNotaryFees,
              ),

            legalFees:
              String(
                result.legalFees,
              ),

            bankFees:
              String(
                result.bankFees.total,
              ),

            totalExtraCosts:
              String(
                result.totalExtraCosts,
              ),

            totalCost:
              String(
                result.estimatedTotalAcquisitionCost,
              ),
          },
        );

      Alert.alert(
        lead.alreadyExists
          ? "Request already exists"
          : "Buyer request created",

        lead.alreadyExists
          ? "This True Cost request is already available in My Requests."
          : "Your property cost request was created successfully and is ready for professional matching.",

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
        "Request failed",

        err instanceof Error
          ? err.message
          : "Unable to create the buyer request.",
      );
    } finally {
      setCreatingRequest(
        false,
      );
    }
  }

  /* ============================================================
     RENDER
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
        {/* HEADER */}

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
            <Receipt
              size={24}
              color="#DC2D2D"
            />
          </View>

          <Text
            style={
              styles.eyebrow
            }
          >
            PURCHASE COSTS
          </Text>

          <Text
            style={
              styles.title
            }
          >
            True Cost Calculator
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Estimate the complete cost of buying property in Portugal, including taxes, financing costs, bank fees, legal fees and registration costs.
          </Text>
        </View>

        {/* FORM */}

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
                marginTop:
                  24,
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
            label="VPT value"
            value={
              vptValue
            }
            onChangeText={
              setVptValue
            }
            prefix="€"
            placeholder="300000"
          />

          <Text
            style={
              styles.helper
            }
          >
            VPT is the Portuguese taxable property value used for some acquisition tax calculations.
          </Text>

          <Field
            label="Loan amount"
            value={
              loanAmount
            }
            onChangeText={
              setLoanAmount
            }
            prefix="€"
            placeholder="280000"
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

          <Field
            label="Legal fees"
            value={
              legalFees
            }
            onChangeText={
              setLegalFees
            }
            prefix="€"
            placeholder="1500"
          />

          <Field
            label="Registration & notary"
            value={
              registrationNotaryFees
            }
            onChangeText={
              setRegistrationNotaryFees
            }
            prefix="€"
            placeholder="1200"
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
                <BadgeEuro
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.calculateButtonText
                  }
                >
                  Calculate True Cost
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* RESULTS */}

        {result ? (
          <>
            <TrueCostResults
              result={
                result
              }
            />

            {/* CREATE REQUEST */}

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
                Ready to plan your purchase?
              </Text>

              <Text
                style={
                  styles.requestDescription
                }
              >
                Create a buyer request from this cost estimate and let Real Estate Lisbon connect you with verified professionals.
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
                      Continue to professional matching
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        ) : null}

        <View
          style={{
            height:
              34,
          }}
        />
      </ScrollView>

      {/* GLOBAL MENU */}

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
   INPUT FIELD
============================================================ */

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

/* ============================================================
   RESULTS
============================================================ */

function TrueCostResults({
  result,
}: {
  result:
    BankTrueCostResult;
}) {
  return (
    <View
      style={
        styles.resultsSection
      }
    >
      {/* RESULT HEADER */}

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
            color="#DC2D2D"
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
            Acquisition Cost Estimate
          </Text>
        </View>
      </View>

      {/* MAIN RESULT */}

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
          Estimated cash required
        </Text>

        <Text
          style={
            styles.primaryResultValue
          }
        >
          {formatEuro(
            result.estimatedCashRequired,
          )}
        </Text>

        <Text
          style={
            styles.primaryResultSub
          }
        >
          Purchase equity + estimated acquisition costs
        </Text>
      </View>

      {/* METRICS */}

      <View
        style={
          styles.metricsGrid
        }
      >
        <MetricCard
          label="Extra costs"
          value={formatEuro(
            result.totalExtraCosts,
          )}
        />

        <MetricCard
          label="Total acquisition"
          value={formatEuro(
            result.estimatedTotalAcquisitionCost,
          )}
        />

        <MetricCard
          label="Government taxes"
          value={formatEuro(
            result.governmentTaxes,
          )}
        />

        <MetricCard
          label="Bank fees"
          value={formatEuro(
            result.bankFees.total,
          )}
        />

        <MetricCard
          label="Purchase equity"
          value={formatEuro(
            result.purchaseEquity,
          )}
        />

        <MetricCard
          label="Extra cost"
          value={`${formatPercent(
            result.extraCostPercentage,
          )}%`}
        />
      </View>

      {/* TAXES */}

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
          Government taxes
        </Text>

        <ResultRow
          label="Property price"
          value={formatEuro(
            result.propertyPrice,
          )}
        />

        <ResultRow
          label="VPT"
          value={formatEuro(
            result.vptValue,
          )}
        />

        <ResultRow
          label="Taxable property value"
          value={formatEuro(
            result.taxablePropertyValue,
          )}
        />

        <ResultRow
          label="IMT"
          value={formatEuro(
            result.imtTax,
          )}
        />

        <ResultRow
          label="Acquisition stamp duty"
          value={`${formatEuro(
            result.acquisitionStampDuty,
          )} · ${formatPercent(
            result.acquisitionStampDutyRate,
          )}%`}
        />

        <ResultRow
          label="Mortgage stamp duty"
          value={`${formatEuro(
            result.mortgageStampDuty,
          )} · ${formatPercent(
            result.mortgageStampDutyRate,
          )}%`}
        />

        <ResultRow
          label="Government taxes"
          value={formatEuro(
            result.governmentTaxes,
          )}
        />
      </View>

      {/* BANK FEES */}

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
          Bank fees
        </Text>

        <ResultRow
          label="Dossier / study"
          value={formatEuro(
            result.bankFees
              .dossierOrStudyFee,
          )}
        />

        <ResultRow
          label="Appraisal"
          value={formatEuro(
            result.bankFees
              .appraisalFee,
          )}
        />

        <ResultRow
          label="Formalization"
          value={formatEuro(
            result.bankFees
              .formalizationFee,
          )}
        />

        <ResultRow
          label="Fees before tax"
          value={formatEuro(
            result.bankFees
              .feesBeforeTax,
          )}
        />

        <ResultRow
          label="Commission stamp duty"
          value={`${formatEuro(
            result.bankFees
              .commissionStampDuty,
          )} · ${formatPercent(
            result.bankFees
              .commissionStampDutyRate,
          )}%`}
        />

        <ResultRow
          label="Total bank fees"
          value={formatEuro(
            result.bankFees.total,
          )}
        />
      </View>

      {/* OTHER COSTS */}

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
          Other acquisition costs
        </Text>

        <ResultRow
          label="Loan amount"
          value={formatEuro(
            result.loanAmount,
          )}
        />

        <ResultRow
          label="Purchase equity"
          value={formatEuro(
            result.purchaseEquity,
          )}
        />

        <ResultRow
          label="Legal fees"
          value={formatEuro(
            result.legalFees,
          )}
        />

        <ResultRow
          label="Registration & notary"
          value={formatEuro(
            result.registrationNotaryFees,
          )}
        />

        <ResultRow
          label="Total extra costs"
          value={formatEuro(
            result.totalExtraCosts,
          )}
        />
      </View>

      {/* SUMMARY */}

      <View
        style={
          styles.summaryCard
        }
      >
        <WalletCards
          size={21}
          color="#DC2D2D"
        />

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.summaryTitle
            }
          >
            Cost summary
          </Text>

          <Text
            style={
              styles.summaryText
            }
          >
            A property priced at{" "}
            {formatEuro(
              result.propertyPrice,
            )}{" "}
            is estimated to require{" "}
            {formatEuro(
              result.estimatedCashRequired,
            )}{" "}
            in available cash for this financing scenario.
          </Text>
        </View>
      </View>

      {/* CONDITIONS */}

      <View
        style={
          styles.conditionsCard
        }
      >
        <Landmark
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
            Calculation conditions
          </Text>

          <Text
            style={
              styles.conditionsText
            }
          >
            {
              result.conditions
                .bankSourceLabel
            }
          </Text>

          <Text
            style={
              styles.conditionsDate
            }
          >
            Bank effective from{" "}
            {
              result.conditions
                .bankEffectiveFrom
            }
          </Text>

          <Text
            style={
              styles.conditionsMeta
            }
          >
            Tax year{" "}
            {
              result.conditions
                .taxYear
            }
            {" · "}
            {
              result.conditions
                .jurisdiction
            }
          </Text>
        </View>
      </View>

      {/* DISCLAIMER */}

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
            Indicative acquisition estimate
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

/* ============================================================
   SMALL COMPONENTS
============================================================ */

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

/* ============================================================
   FORMATTERS
============================================================ */

function formatEuro(
  value: number,
) {
  return new Intl.NumberFormat(
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

    content: {
      paddingHorizontal:
        18,

      paddingTop:
        14,
    },

    topBar: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",
    },

    iconButton: {
      width:
        46,

      height:
        46,

      borderRadius:
        16,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#EAECF0",
    },

    menuButton: {
      minHeight:
        44,

      paddingHorizontal:
        15,

      borderRadius:
        14,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#EAECF0",
    },

    menuText: {
      color:
        Colors.navy,

      fontSize:
        12,

      fontWeight:
        "800",
    },

    hero: {
      marginTop:
        26,
    },

    heroIcon: {
      width:
        50,

      height:
        50,

      borderRadius:
        17,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#FEF2F2",
    },

    eyebrow: {
      marginTop:
        16,

      color:
        "#DC2D2D",

      fontSize:
        10,

      fontWeight:
        "900",

      letterSpacing:
        1.2,
    },

    title: {
      marginTop:
        7,

      color:
        Colors.navyDark,

      fontSize:
        34,

      lineHeight:
        40,

      fontWeight:
        "900",

      letterSpacing:
        -1,
    },

    subtitle: {
      marginTop:
        9,

      color:
        Colors.textSecondary,

      fontSize:
        14,

      lineHeight:
        22,
    },

    formCard: {
      marginTop:
        25,

      borderRadius:
        24,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#EAECF0",

      padding:
        18,
    },

    sectionTitle: {
      color:
        Colors.navyDark,

      fontSize:
        13,

      fontWeight:
        "900",
    },

    segmentRow: {
      marginTop:
        10,

      flexDirection:
        "row",

      gap:
        8,
    },

    segmentButton: {
      flex:
        1,

      minHeight:
        46,

      borderRadius:
        14,

      borderWidth:
        1,

      borderColor:
        "#D0D5DD",

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#FFFFFF",
    },

    segmentButtonActive: {
      borderColor:
        "#DC2D2D",

      backgroundColor:
        "#DC2D2D",
    },

    segmentText: {
      color:
        Colors.textSecondary,

      fontSize:
        12,

      fontWeight:
        "800",
    },

    segmentTextActive: {
      color:
        "#FFFFFF",
    },

    purposeGrid: {
      marginTop:
        10,

      gap:
        8,
    },

    purposeButton: {
      minHeight:
        47,

      borderRadius:
        14,

      borderWidth:
        1,

      borderColor:
        "#D0D5DD",

      justifyContent:
        "center",

      paddingHorizontal:
        14,

      backgroundColor:
        "#FFFFFF",
    },

    purposeButtonActive: {
      borderColor:
        "#DC2D2D",

      backgroundColor:
        "#FEF2F2",
    },

    purposeText: {
      color:
        Colors.textSecondary,

      fontSize:
        12,

      fontWeight:
        "700",
    },

    purposeTextActive: {
      color:
        "#DC2D2D",

      fontWeight:
        "900",
    },

    field: {
      marginTop:
        20,
    },

    fieldLabel: {
      color:
        Colors.navyDark,

      fontSize:
        12,

      fontWeight:
        "800",
    },

    helper: {
      marginTop:
        7,

      color:
        "#98A2B3",

      fontSize:
        9,

      lineHeight:
        14,
    },

    inputWrapper: {
      marginTop:
        8,

      minHeight:
        54,

      borderRadius:
        15,

      borderWidth:
        1,

      borderColor:
        "#D0D5DD",

      backgroundColor:
        "#FFFFFF",

      flexDirection:
        "row",

      alignItems:
        "center",

      paddingHorizontal:
        14,
    },

    inputAffix: {
      color:
        Colors.textSecondary,

      fontSize:
        14,

      fontWeight:
        "700",
    },

    input: {
      flex:
        1,

      minHeight:
        52,

      paddingHorizontal:
        9,

      color:
        Colors.navyDark,

      fontSize:
        15,

      fontWeight:
        "700",
    },

    errorBox: {
      marginTop:
        18,

      borderRadius:
        14,

      backgroundColor:
        "#FEF2F2",

      padding:
        13,
    },

    errorText: {
      color:
        "#B42318",

      fontSize:
        11,

      lineHeight:
        17,
    },

    calculateButton: {
      marginTop:
        22,

      minHeight:
        54,

      borderRadius:
        16,

      backgroundColor:
        "#DC2D2D",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        8,
    },

    calculateButtonDisabled: {
      opacity:
        0.65,
    },

    calculateButtonText: {
      color:
        "#FFFFFF",

      fontSize:
        13,

      fontWeight:
        "900",
    },

    resultsSection: {
      marginTop:
        24,
    },

    resultHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,

      marginBottom:
        14,
    },

    resultHeaderIcon: {
      width:
        47,

      height:
        47,

      borderRadius:
        15,

      backgroundColor:
        "#FEF2F2",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    resultEyebrow: {
      color:
        "#DC2D2D",

      fontSize:
        10,

      fontWeight:
        "900",

      letterSpacing:
        0.8,
    },

    resultTitle: {
      marginTop:
        2,

      color:
        Colors.navyDark,

      fontSize:
        20,

      fontWeight:
        "900",
    },

    primaryResult: {
      borderRadius:
        24,

      backgroundColor:
        "#8B1E1E",

      padding:
        21,
    },

    primaryResultLabel: {
      color:
        "#FECACA",

      fontSize:
        11,
    },

    primaryResultValue: {
      marginTop:
        8,

      color:
        "#FFFFFF",

      fontSize:
        34,

      fontWeight:
        "900",

      letterSpacing:
        -1,
    },

    primaryResultSub: {
      marginTop:
        5,

      color:
        "#FECACA",

      fontSize:
        10,

      fontWeight:
        "700",
    },

    metricsGrid: {
      marginTop:
        12,

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        10,
    },

    metricCard: {
      width:
        "48%",

      minHeight:
        94,

      borderRadius:
        18,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#EAECF0",

      padding:
        14,

      justifyContent:
        "center",
    },

    metricLabel: {
      color:
        Colors.textSecondary,

      fontSize:
        10,
    },

    metricValue: {
      marginTop:
        6,

      color:
        Colors.navyDark,

      fontSize:
        16,

      fontWeight:
        "900",
    },

    detailCard: {
      marginTop:
        12,

      borderRadius:
        22,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#EAECF0",

      padding:
        17,
    },

    detailTitle: {
      marginBottom:
        7,

      color:
        Colors.navyDark,

      fontSize:
        16,

      fontWeight:
        "900",
    },

    resultRow: {
      minHeight:
        47,

      borderBottomWidth:
        1,

      borderBottomColor:
        "#F2F4F7",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        12,
    },

    resultRowLabel: {
      flex:
        1,

      color:
        Colors.textSecondary,

      fontSize:
        11,
    },

    resultRowValue: {
      maxWidth:
        "55%",

      textAlign:
        "right",

      color:
        Colors.navyDark,

      fontSize:
        11,

      fontWeight:
        "800",
    },

    summaryCard: {
      marginTop:
        12,

      borderRadius:
        20,

      borderWidth:
        1,

      borderColor:
        "#FECDCA",

      backgroundColor:
        "#FEF3F2",

      padding:
        16,

      flexDirection:
        "row",

      gap:
        11,
    },

    summaryTitle: {
      color:
        "#B42318",

      fontSize:
        13,

      fontWeight:
        "900",
    },

    summaryText: {
      marginTop:
        5,

      color:
        "#475467",

      fontSize:
        10,

      lineHeight:
        17,
    },

    conditionsCard: {
      marginTop:
        12,

      borderRadius:
        20,

      borderWidth:
        1,

      borderColor:
        "#EAECF0",

      backgroundColor:
        "#FFFFFF",

      padding:
        16,

      flexDirection:
        "row",

      gap:
        11,
    },

    conditionsTitle: {
      color:
        Colors.navyDark,

      fontSize:
        13,

      fontWeight:
        "900",
    },

    conditionsText: {
      marginTop:
        4,

      color:
        Colors.textSecondary,

      fontSize:
        10,

      lineHeight:
        16,
    },

    conditionsDate: {
      marginTop:
        5,

      color:
        Colors.gold,

      fontSize:
        9,

      fontWeight:
        "700",
    },

    conditionsMeta: {
      marginTop:
        4,

      color:
        Colors.textSecondary,

      fontSize:
        9,
    },

    notice: {
      marginTop:
        12,

      borderRadius:
        20,

      borderWidth:
        1,

      borderColor:
        "#F3E6AD",

      backgroundColor:
        "#FFFBEB",

      padding:
        15,

      flexDirection:
        "row",

      gap:
        10,
    },

    noticeTitle: {
      color:
        Colors.navyDark,

      fontSize:
        12,

      fontWeight:
        "900",
    },

    noticeText: {
      marginTop:
        4,

      color:
        Colors.textSecondary,

      fontSize:
        10,

      lineHeight:
        17,
    },

    requestCard: {
      marginTop:
        14,

      borderRadius:
        22,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#EAECF0",

      padding:
        18,
    },

    requestEyebrow: {
      color:
        "#DC2D2D",

      fontSize:
        9,

      fontWeight:
        "900",

      letterSpacing:
        1.1,
    },

    requestTitle: {
      marginTop:
        7,

      color:
        Colors.navyDark,

      fontSize:
        18,

      fontWeight:
        "900",
    },

    requestDescription: {
      marginTop:
        7,

      color:
        Colors.textSecondary,

      fontSize:
        11,

      lineHeight:
        18,
    },

    requestButton: {
      marginTop:
        15,

      minHeight:
        62,

      borderRadius:
        17,

      backgroundColor:
        Colors.navy,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        16,
    },

    requestButtonDisabled: {
      opacity:
        0.65,
    },

    requestButtonText: {
      color:
        "#FFFFFF",

      fontSize:
        13,

      fontWeight:
        "900",
    },

    requestButtonSubtext: {
      marginTop:
        3,

      color:
        "#D0D5DD",

      fontSize:
        9,

      fontWeight:
        "600",

      textAlign:
        "center",
    },
  });