"use client";

import { useEffect, useMemo, useState ,Suspense} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { getToken, getStoredUser } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { createLeadFromAffordabilityCalculator } from "@/lib/leads-api";
import {
  calculateBankAffordability,
  type BankAffordabilityResult,
  type MortgageBank,
  type PropertyPurpose,
} from "@/lib/calculators-api";
import { useToast } from "@/components/ui/ToastProvider";
import {
  DollarSign,
  Heart,
  TriangleAlert,
  ArrowRight,
  CircleCheck,
  Shield,
  FileText,
  Sparkles,
  Search,
  Landmark,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
} from "recharts";

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatMonthly(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getQueryString(params: Record<string, string | undefined | null>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });

  return search.toString();
}

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(15,35,64,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

function InputLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[14px] font-medium text-[#0F2340]">
      {children}
    </label>
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
    <div
      className={`flex items-center justify-between gap-4 ${
        strong
          ? "text-[17px] font-semibold text-[#0F2340]"
          : "text-[15px] text-[#4B5563]"
      }`}
    >
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
 function AffordabilityCalculatorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [monthlyNetIncome, setMonthlyNetIncome] =
    useState<number | "">("");
  const [existingMonthlyDebts, setExistingMonthlyDebts] =
    useState<number | "">("");
  const [availableDownPayment, setAvailableDownPayment] =
    useState<number | "">("");
  const [loanTermYears, setLoanTermYears] =
    useState<number | "">(30);

  const [selectedBank, setSelectedBank] =
    useState<MortgageBank>("SANTANDER");

  const [purpose, setPurpose] =
    useState<PropertyPurpose>("PRIMARY_RESIDENCE");

  const [result, setResult] =
    useState<BankAffordabilityResult | null>(null);

  const [calculating, setCalculating] = useState(false);
  const [savingRequest, setSavingRequest] = useState(false);

  useEffect(() => {
    const urlMonthlyNetIncome = searchParams.get("monthlyNetIncome");
    const urlExistingMonthlyDebts = searchParams.get("existingMonthlyDebts");
    const urlAvailableDownPayment = searchParams.get("availableDownPayment");
    const urlLoanTermYears = searchParams.get("loanTermYears");
    const urlBank = searchParams.get("bank") as MortgageBank | null;
    const urlPurpose = searchParams.get("purpose") as PropertyPurpose | null;

    if (urlMonthlyNetIncome) {
      setMonthlyNetIncome(Number(urlMonthlyNetIncome));
    }

    if (urlExistingMonthlyDebts) {
      setExistingMonthlyDebts(Number(urlExistingMonthlyDebts));
    }

    if (urlAvailableDownPayment) {
      setAvailableDownPayment(Number(urlAvailableDownPayment));
    }

    if (urlLoanTermYears) {
      setLoanTermYears(Number(urlLoanTermYears));
    }

    if (urlBank === "SANTANDER" || urlBank === "CGD") {
      setSelectedBank(urlBank);
    }

    if (
      urlPurpose === "PRIMARY_RESIDENCE" ||
      urlPurpose === "SECOND_HOME" ||
      urlPurpose === "INVESTMENT"
    ) {
      setPurpose(urlPurpose);
    }
  }, [searchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const nextQuery = getQueryString({
        monthlyNetIncome:
          monthlyNetIncome === "" ? undefined : String(monthlyNetIncome),
        existingMonthlyDebts:
          existingMonthlyDebts === "" ? undefined : String(existingMonthlyDebts),
        availableDownPayment:
          availableDownPayment === "" ? undefined : String(availableDownPayment),
        loanTermYears:
          loanTermYears === "" ? undefined : String(loanTermYears),
        bank: selectedBank,
        purpose,
      });

      router.replace(
        nextQuery
          ? `/tools/affordability-calculator?${nextQuery}`
          : "/tools/affordability-calculator",
        { scroll: false },
      );
    }, 300);

    return () => clearTimeout(timeout);
  }, [
    monthlyNetIncome,
    existingMonthlyDebts,
    availableDownPayment,
    loanTermYears,
    selectedBank,
    purpose,
    router,
  ]);

  const hasUserInput =
    monthlyNetIncome !== "" ||
    existingMonthlyDebts !== "" ||
    availableDownPayment !== "";

  const allocationData = useMemo(() => {
    const income = Number(monthlyNetIncome) || 0;
    const debts = Number(existingMonthlyDebts) || 0;
    const mortgage = result?.estimatedMortgagePayment ?? 0;

    const debtPercent =
      income > 0 ? Math.min((debts / income) * 100, 100) : 0;

    const mortgagePercent =
      income > 0 ? Math.min((mortgage / income) * 100, 100) : 0;

    const otherPercent = Math.max(
      100 - debtPercent - mortgagePercent,
      0,
    );

    return [
      {
        name: "Mortgage",
        value: Math.round(mortgagePercent),
        color: "#1B365D",
      },
      {
        name: "Debt",
        value: Math.round(debtPercent),
        color: "#C9A227",
      },
      {
        name: "Other",
        value: Math.round(otherPercent),
        color: "#6B7280",
      },
    ];
  }, [monthlyNetIncome, existingMonthlyDebts, result]);

  const budgetChart = useMemo(
    () => [
      {
        name: "Recommended",
        value: Math.round(result?.recommendedPropertyBudget ?? 0),
        fill: "#2E7D32",
      },
      {
        name: "Maximum",
        value: Math.round(result?.maximumPropertyBudget ?? 0),
        fill: "#F5A623",
      },
    ],
    [result],
  );

  const riskStyle = useMemo(() => {
    if (!result) {
      return {
        bg: "#F3F4F6",
        color: "#6B7280",
        label: "Waiting for your data",
        text: "Fill in your finances to see your affordability profile.",
      };
    }

    if (result.riskLevel === "COMFORTABLE") {
      return {
        bg: "#EEF6EF",
        color: "#2E7D32",
        label: result.riskLabel,
        text: "Your estimated debt-service level is within a comfortable internal range.",
      };
    }

    if (result.riskLevel === "MODERATE") {
      return {
        bg: "#FFF7E8",
        color: "#F5A623",
        label: result.riskLabel,
        text: "Your affordability is still manageable, but your debt-service margin is narrower.",
      };
    }

    return {
      bg: "#FDEEEE",
      color: "#D32F2F",
      label: result.riskLabel,
      text:
        result.riskLevel === "ABOVE_REFERENCE"
          ? "The estimated DSTI is above the reference ceiling."
          : "Your estimated debt-service level is high and may materially constrain borrowing capacity.",
    };
  }, [result]);

  async function handleCalculateAffordability() {
    if (monthlyNetIncome === "" || Number(monthlyNetIncome) <= 0) {
      toast.warning(
        "Monthly net income required",
        "Please enter your monthly net household income.",
      );
      return;
    }

    if (
      existingMonthlyDebts === "" ||
      Number(existingMonthlyDebts) < 0
    ) {
      toast.warning(
        "Monthly debts required",
        "Please enter your existing monthly debt payments.",
      );
      return;
    }

    if (
      availableDownPayment === "" ||
      Number(availableDownPayment) < 0
    ) {
      toast.warning(
        "Down payment required",
        "Please enter your available down payment.",
      );
      return;
    }

    if (
      loanTermYears === "" ||
      Number(loanTermYears) < 5 ||
      Number(loanTermYears) > 40
    ) {
      toast.warning(
        "Invalid loan term",
        "Please choose a loan term between 5 and 40 years.",
      );
      return;
    }

    try {
      setCalculating(true);

      const data = await calculateBankAffordability({
        bank: selectedBank,
        monthlyNetIncome: Number(monthlyNetIncome),
        existingMonthlyDebts: Number(existingMonthlyDebts),
        availableDownPayment: Number(availableDownPayment),
        loanTermYears: Number(loanTermYears),
        purpose,
      });

      setResult(data);

      toast.success(
        "Affordability assessment ready",
        `${data.bankName} scenario calculated successfully.`,
      );
    } catch (error) {
      toast.error(
        "Unable to calculate affordability",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setCalculating(false);
    }
  }

  async function handleCreateBuyerRequest() {
  const token = getToken();
  const user = getStoredUser<AuthUser>();

  if (!token || !user) {
    toast.warning(
      "Login required",
      "Please sign in with a Buyer account to create a request.",
    );
    return;
  }

  if (user.role !== "BUYER") {
    toast.warning(
      "Buyer account required",
      "Only Buyer accounts can create property requests.",
    );
    return;
  }

  if (
    monthlyNetIncome === "" ||
    existingMonthlyDebts === "" ||
    availableDownPayment === "" ||
    !result
  ) {
    toast.warning(
      "Complete your financial details",
      "Please complete your bank affordability assessment before creating a request.",
    );
    return;
  }

  try {
    setSavingRequest(true);

    const lead =
      await createLeadFromAffordabilityCalculator(
        token,
        {
          annualIncome: String(
            Math.round(Number(monthlyNetIncome) * 12),
          ),

          monthlyDebts: String(existingMonthlyDebts),

          downPayment: String(availableDownPayment),

          interestRate: String(result.initialTan),

          recommendedBudget: String(
            Math.round(result.recommendedPropertyBudget),
          ),

          maximumBudget: String(
            Math.round(result.maximumPropertyBudget),
          ),

          debtToIncome: result.finalDsti.toFixed(1),

          riskLabel: result.riskLabel,
        },
      );

    /*
     * ==========================================================
     * EXISTING REQUEST
     * ==========================================================
     */

    if (lead.alreadyExists) {
      /*
       * Existing request may have been automatically
       * re-processed by the Smart Matching Engine.
       */
      if (
        lead.status === "MATCHED" ||
        lead.autoMatching?.matched
      ) {
        const matchCount =
          lead.autoMatching?.matched
            ? lead.autoMatching.count
            : lead.matches?.length ?? 1;

        toast.success(
          "Professional match found",
          `${matchCount} compatible professional${
            matchCount > 1 ? "s were" : " was"
          } automatically matched to your request.`,
        );

        return;
      }

      toast.info(
        "Request already active",
        "This affordability request already exists. Smart Matching will automatically connect you when a compatible professional is available.",
      );

      return;
    }

    /*
     * ==========================================================
     * NEW REQUEST + AUTOMATIC MATCH FOUND
     * ==========================================================
     */

    if (
      lead.status === "MATCHED" ||
      lead.autoMatching?.matched
    ) {
      const matchCount =
        lead.autoMatching?.matched
          ? lead.autoMatching.count
          : lead.matches?.length ?? 1;

      const bestMatch =
        lead.matches?.[0];

      const professionalName =
        bestMatch?.professional?.user?.fullName;

      const score =
        bestMatch?.score;

      if (
        professionalName &&
        typeof score === "number"
      ) {
        toast.success(
          "Smart match found",
          `${professionalName} has been automatically matched to your request with a ${score}% compatibility score.`,
        );
      } else {
        toast.success(
          "Smart match found",
          `${matchCount} compatible professional${
            matchCount > 1 ? "s have" : " has"
          } been automatically assigned to your request.`,
        );
      }

      return;
    }

    /*
     * ==========================================================
     * NEW REQUEST — NO PROFESSIONAL >= THRESHOLD YET
     * ==========================================================
     */

    toast.success(
      "Request created successfully",
      "Your request is active. Smart Matching will automatically connect you with a compatible mortgage broker when one meets the required score.",
    );
  } catch (error) {
    toast.error(
      "Unable to create request",
      error instanceof Error
        ? error.message
        : "Something went wrong while creating your request. Please try again.",
    );
  } finally {
    setSavingRequest(false);
  }
}

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F8F9FA]">
        <section className="border-b border-[#E9ECEF] bg-[#1B365D] px-6 py-3 text-center text-white md:px-12">
          <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-2 text-sm font-medium">
            <Shield size={18} />
            <span>We help foreign buyers navigate Portugal.</span>
          </div>
        </section>

        <section className="px-5 py-10 sm:px-6 sm:py-12 md:px-12 md:py-16">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                  <DollarSign size={15} />
                  Affordability Calculator
                </div>

                <h1 className="max-w-[760px] text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F2340] sm:text-[42px] md:text-[54px]">
                  Discover Your True Buying Power
                </h1>

                <p className="mt-5 max-w-[760px] text-[18px] leading-8 text-[#4B5563]">
                  Understand your estimated borrowing capacity using your income, existing debt, available deposit and the selected Portuguese bank scenario.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="#calculator"
                    className="inline-flex items-center justify-center rounded-[16px] bg-[#C9A227] px-6 py-3.5 text-[15px] font-semibold text-[#0F2340] transition hover:bg-[#E5C766]"
                  >
                    Check My Budget
                  </a>

                  <button
                    onClick={handleCreateBuyerRequest}
                    disabled={savingRequest}
                    className="inline-flex items-center justify-center rounded-[16px] border border-[#D7DCE2] bg-white px-6 py-3.5 text-[15px] font-semibold text-[#1B365D] transition hover:border-[#1B365D] disabled:opacity-70"
                  >
                    {savingRequest ? "Creating request..." : "Create Buyer Request"}
                  </button>
                </div>

                <div className="mt-8 flex flex-col gap-3 text-[15px] text-[#4B5563] md:flex-row md:flex-wrap md:gap-6">
                  <div className="flex items-center gap-2">
                    <CircleCheck size={18} className="text-[#2E7D32]" />
                    <span>Connected to NestJS/Prisma</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleCheck size={18} className="text-[#2E7D32]" />
                    <span>Creates a real Buyer Request</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleCheck size={18} className="text-[#2E7D32]" />
                    <span>Automatic Smart Matching</span>
                  </div>
                </div>
              </div>

              <SectionCard className="overflow-hidden">
                <div className="bg-gradient-to-br from-[#1B365D] via-[#163050] to-[#0F2340] px-6 py-6 text-white md:px-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/10 text-white">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#E5C766]">
                        Live estimate
                      </p>
                      <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
                        Your affordability snapshot
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-[14px] text-white/75">
                        Recommended budget
                      </p>
                      <p className="mt-1 text-[34px] font-bold tracking-[-0.03em]">
                        {result
                          ? formatEuro(result.recommendedPropertyBudget)
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[14px] text-white/75">
                        Maximum budget
                      </p>
                      <p className="mt-1 text-[34px] font-bold tracking-[-0.03em]">
                        {result ? formatEuro(result.maximumPropertyBudget) : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 md:p-7">
                  <div className="space-y-4">
                    <ResultRow
                      label="Monthly income"
                      value={result ? formatMonthly(result.monthlyNetIncome) : "—"}
                    />
                    <ResultRow
                      label="Estimated DSTI"
                      value={
                        result ? `${result.finalDsti.toFixed(1)}%` : "—"
                      }
                    />
                    <div className="h-px bg-[#E9ECEF]" />
                    <ResultRow
                      label="Recommended budget"
                      value={
                        result ? formatEuro(result.recommendedPropertyBudget) : "—"
                      }
                    />
                    <ResultRow
                      label="Maximum budget"
                      value={result ? formatEuro(result.maximumPropertyBudget) : "—"}
                      strong
                    />
                  </div>

                  <div className="mt-6 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                    <p className="text-[14px] leading-6 text-[#4B5563]">
                      This indicative bank affordability assessment can be converted into a real Buyer Request and automatically matched with a compatible verified mortgage broker.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </section>

        <section id="calculator" className="px-5 pb-10 sm:px-6 sm:pb-14 md:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-8 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard className="p-5 sm:p-7 md:p-8">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                Inputs
              </p>

              <h2 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0F2340]">
                Your finances
              </h2>

              <p className="mt-3 text-[14px] text-[#6B7280]">
                Enter your real financial data to get a more accurate estimate.
              </p>

              <div className="mt-6">
                <InputLabel>Choose a bank</InputLabel>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBank("SANTANDER")}
                    className={`rounded-[16px] border p-4 text-left transition ${
                      selectedBank === "SANTANDER"
                        ? "border-[#1B365D] bg-[#F4F7FB]"
                        : "border-[#D7DCE2] bg-white hover:border-[#AAB4C3]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#0F2340]">
                          Santander Portugal
                        </p>
                        <p className="mt-1 text-[13px] text-[#667085]">
                          Mixed mortgage scenario
                        </p>
                      </div>

                      {selectedBank === "SANTANDER" && (
                        <CheckCircle2 size={19} className="text-[#2E7D32]" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedBank("CGD")}
                    className={`rounded-[16px] border p-4 text-left transition ${
                      selectedBank === "CGD"
                        ? "border-[#1B365D] bg-[#F4F7FB]"
                        : "border-[#D7DCE2] bg-white hover:border-[#AAB4C3]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#0F2340]">
                          Caixa Geral de Depósitos
                        </p>
                        <p className="mt-1 text-[13px] text-[#667085]">
                          Mixed mortgage scenario
                        </p>
                      </div>

                      {selectedBank === "CGD" && (
                        <CheckCircle2 size={19} className="text-[#2E7D32]" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InputLabel>Monthly net household income</InputLabel>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Example: 4500"
                      value={monthlyNetIncome}
                      onChange={(e) =>
                        setMonthlyNetIncome(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="min-w-0 w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#1B365D]"
                    />
                    <span className="shrink-0 text-[16px] font-medium text-[#6B7280]">
                      €
                    </span>
                  </div>
                </div>

                <div>
                  <InputLabel>Existing monthly debt payments</InputLabel>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Example: 500"
                      value={existingMonthlyDebts}
                      onChange={(e) =>
                        setExistingMonthlyDebts(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="min-w-0 w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#1B365D]"
                    />
                    <span className="shrink-0 text-[16px] font-medium text-[#6B7280]">
                      €
                    </span>
                  </div>
                </div>

                <div>
                  <InputLabel>Available down payment</InputLabel>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Example: 100000"
                      value={availableDownPayment}
                      onChange={(e) =>
                        setAvailableDownPayment(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="min-w-0 w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#1B365D]"
                    />
                    <span className="shrink-0 text-[16px] font-medium text-[#6B7280]">
                      €
                    </span>
                  </div>
                </div>

                <div>
                  <InputLabel>Loan term</InputLabel>

                  <input
                    type="number"
                    min={5}
                    max={40}
                    value={loanTermYears}
                    onChange={(e) =>
                      setLoanTermYears(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] outline-none transition focus:border-[#1B365D]"
                  />
                </div>

                <div>
                  <InputLabel>Property purpose</InputLabel>

                  <select
                    value={purpose}
                    onChange={(e) =>
                      setPurpose(e.target.value as PropertyPurpose)
                    }
                    className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] text-[#0F2340] outline-none transition focus:border-[#1B365D]"
                  >
                    <option value="PRIMARY_RESIDENCE">
                      Primary residence
                    </option>
                    <option value="SECOND_HOME">
                      Second home
                    </option>
                    <option value="INVESTMENT">
                      Investment
                    </option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCalculateAffordability}
                disabled={calculating}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#C9A227] px-5 py-3.5 text-[15px] font-semibold text-[#0F2340] transition hover:bg-[#E5C766] disabled:opacity-70"
              >
                <Landmark size={16} />
                {calculating ? "Calculating..." : "Calculate Bank Affordability"}
              </button>

              <button
                onClick={handleCreateBuyerRequest}
                disabled={savingRequest}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#1B365D] px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#163050] disabled:opacity-70"
              >
                <Search size={16} />
                {savingRequest ? "Creating request..." : "Create Buyer Request"}
              </button>

              <div className="mt-6 rounded-[18px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-[#1B365D]" />
                  <div>
                    <p className="text-[14px] font-semibold text-[#0F2340]">
                      Smart URL
                    </p>
                    <p className="mt-1 text-[13px] leading-6 text-[#4B5563]">
                      The URL updates automatically with your affordability
                      scenario, so you can reload it or share it easily.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="space-y-8">
              <SectionCard className="p-5 sm:p-7 md:p-8">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                  Financial health
                </p>

                <h2 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0F2340]">
                  DSTI affordability overview
                </h2>

                <div className="mt-6 grid gap-8 md:grid-cols-[1.05fr_0.95fr]">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[15px] text-[#374151]">
                        Estimated DSTI
                      </span>
                      <span className="text-[16px] font-semibold text-[#1B365D]">
                        {result ? `${result.finalDsti.toFixed(1)}%` : "—"}
                      </span>
                    </div>

                    <div className="h-[10px] overflow-hidden rounded-full bg-[#E5E7EB]">
                      <div
                        className="h-full rounded-full bg-[#1B365D]"
                        style={{
                          width: result
                            ? `${Math.min(result.finalDsti, 100)}%`
                            : "0%",
                        }}
                      />
                    </div>

                    <div
                      className="mt-5 rounded-[16px] px-[20px] py-[18px]"
                      style={{
                        backgroundColor: riskStyle.bg,
                      }}
                    >
                      <h4
                        className="mb-[6px] text-[17px] font-semibold"
                        style={{
                          color: riskStyle.color,
                        }}
                      >
                        {riskStyle.label}
                      </h4>

                      <p className="text-[15px] text-[#4B5563]">
                        {riskStyle.text}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-[15px] text-[#374151]">
                      Monthly budget allocation
                    </h4>

                    <div className="h-[230px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={allocationData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={70}
                            outerRadius={95}
                            stroke="#ffffff"
                            strokeWidth={3}
                          >
                            {allocationData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard className="p-5 sm:p-7 md:p-8">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                  Budget range
                </p>

                <h2 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0F2340]">
                  Your property budget range
                </h2>

                <div className="mt-6 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" />
                      <YAxis
                        tickFormatter={(value) => `€${Math.round(value / 1000)}k`}
                      />
                      <Tooltip formatter={(value) => formatEuro(Number(value))} />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                        {budgetChart.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[16px] bg-[#EEF6EF] px-[20px] py-[18px]">
                    <div className="mb-[8px] flex items-center gap-2 text-[16px] font-semibold text-[#2E7D32]">
                      <Heart size={16} fill="#2E7D32" />
                      We Recommend
                    </div>
                    <p className="text-[15px] leading-[1.55] text-[#4B5563]">
                      {hasUserInput
                        ? `Stay around ${formatEuro(
                            result?.recommendedPropertyBudget ?? 0
                          )} for a more conservative purchase scenario.`
                        : "Enter your finances to see your recommended budget."}
                    </p>
                  </div>

                  <div className="rounded-[16px] bg-[#FFF7E8] px-[20px] py-[18px]">
                    <div className="mb-[8px] flex items-center gap-2 text-[16px] font-semibold text-[#F5A623]">
                      <TriangleAlert size={16} />
                      Maximum Budget
                    </div>
                    <p className="text-[15px] leading-[1.55] text-[#4B5563]">
                      {hasUserInput
                        ? `${formatEuro(
                            result?.maximumPropertyBudget ?? 0
                          )} is the indicative upper budget for this bank scenario.`
                        : "Fill in your finances to see your maximum budget range."}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <div className="rounded-[28px] bg-gradient-to-br from-[#1B365D] via-[#163050] to-[#0F2340] p-8 text-white shadow-[0_14px_40px_rgba(15,35,64,0.20)] md:p-10">
                <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#E5C766]">
                      Next step
                    </p>
                    <h3 className="mt-3 text-[30px] font-bold tracking-[-0.03em]">
                      Ready to explore properties?
                    </h3>
                    <p className="mt-4 max-w-[760px] text-[16px] leading-8 text-white/85">
                      Create a Buyer Request and let Smart Matching automatically connect
                      you with a compatible verified mortgage broker, or use
                      Neighborhood Finder to discover areas within your budget.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/tools/neighborhood-finder"
                      className="rounded-[16px] bg-white px-[24px] py-[14px] text-[15px] font-semibold text-[#1B365D] transition hover:bg-[#F3F4F6]"
                    >
                      Find Neighborhoods
                    </Link>

                    <button
                      onClick={handleCreateBuyerRequest}
                      disabled={savingRequest}
                      className="inline-flex items-center gap-2 rounded-[16px] bg-[#C9A227] px-[24px] py-[14px] text-[15px] font-semibold text-white transition hover:bg-[#D9AF2C] disabled:opacity-70"
                    >
                      Create Buyer Request
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default function AffordabilityCalculatorPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8F9FA]">
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-[#1B365D]">
              Loading calculator...
            </p>
          </div>
        </main>
      }
    >
      <AffordabilityCalculatorPageContent />
    </Suspense>
  );
}