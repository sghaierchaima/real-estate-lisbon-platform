"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import Link from "next/link";
import {
  Calculator,
  TrendingUp,
  PiggyBank,
  ArrowRight,
  Mail,
  Landmark,
  ShieldCheck,
  AlertTriangle,
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
  Legend,
} from "recharts";
import {
  calculateBankMortgage,
  type BankMortgageResult,
  type MortgageBank,
  type PropertyPurpose,
} from "@/lib/calculators-api";
import { getStoredUser, getToken } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { useToast } from "@/components/ui/ToastProvider";

import {
  createLeadFromMortgageCalculator,
} from "@/lib/leads-api";

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function MortgageCalculatorPageContent() {
  const searchParams = useSearchParams();
  const priceFromUrl = searchParams.get("price");
  const toast = useToast();
  const [propertyPrice, setPropertyPrice] = useState(300000);
  const [appraisalValue, setAppraisalValue] = useState(300000);
  const [downPayment, setDownPayment] = useState(60000);
  const [loanTerm, setLoanTerm] = useState(30);
  const [selectedBank, setSelectedBank] = useState<MortgageBank>("SANTANDER");
  const [purpose, setPurpose] = useState<PropertyPurpose>("PRIMARY_RESIDENCE");

  const [result, setResult] = useState<BankMortgageResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSaved, setLeadSaved] = useState(false);
  const [savingLead, setSavingLead] = useState(false);

  useEffect(() => {
    const user = getStoredUser<AuthUser>();

    if (!user) return;

    setLeadName(user.fullName || "");
    setLeadEmail(user.email || "");
  }, []);

  useEffect(() => {
    if (!priceFromUrl) return;

    const parsed = Number(priceFromUrl);

    if (!isNaN(parsed) && parsed > 0) {
      setPropertyPrice(parsed);
      setAppraisalValue(parsed);
      setDownPayment(Math.round(parsed * 0.2));
      setResult(null);
      setLeadSaved(false);
    }
  }, [priceFromUrl]);

  async function handleCalculate() {
    if (!propertyPrice || propertyPrice <= 0) {
      toast.warning("Invalid property price", "Please enter a valid property price.");
      return;
    }

    if (!appraisalValue || appraisalValue <= 0) {
      toast.warning("Invalid appraisal value", "Please enter a valid appraisal value.");
      return;
    }

    if (downPayment < 0 || downPayment >= propertyPrice) {
      toast.warning(
        "Invalid down payment",
        "The down payment must be lower than the property price.",
      );
      return;
    }

    if (!loanTerm || loanTerm < 5 || loanTerm > 40) {
      toast.warning("Invalid loan term", "Please choose a term between 5 and 40 years.");
      return;
    }

    setCalculating(true);

    try {
      const data = await calculateBankMortgage({
        bank: selectedBank,
        propertyPrice,
        appraisalValue,
        downPayment,
        loanTermYears: loanTerm,
        purpose,
      });

      setResult(data);
      setLeadSaved(false);

      if (!data.ltvEligible) {
        toast.warning(
          "Financing level above reference limit",
          `Your LTV is ${data.ltv.toFixed(2)}%, above the ${data.maxLtv}% reference limit. Consider increasing your down payment by approximately ${formatEuro(
            data.additionalDownPaymentNeeded,
          )}.`,
        );
        return;
      }

      toast.success(
        "Bank mortgage simulation ready",
        `${data.bankName} simulation calculated successfully.`,
      );
    } catch (error) {
      toast.error(
        "Calculation failed",
        error instanceof Error ? error.message : "Please try again later.",
      );
    } finally {
      setCalculating(false);
    }
  }

  async function handleCreateLead() {
  const token = getToken();
  const user = getStoredUser<AuthUser>();

  const cleanEmail =
    leadEmail
      .trim()
      .toLowerCase();

  if (
    !token ||
    !user
  ) {
    toast.warning(
      "Login required",
      "Please sign in as a Buyer before creating a mortgage request.",
    );

    return;
  }

  if (
    user.role !==
    "BUYER"
  ) {
    toast.warning(
      "Buyer account required",
      "Only Buyer accounts can create mortgage requests.",
    );

    return;
  }

  if (!cleanEmail) {
    toast.warning(
      "Email required",
      "Please enter your email address.",
    );

    return;
  }

  if (!result) {
    toast.warning(
      "Calculation required",
      "Please calculate your mortgage before creating a request.",
    );

    return;
  }

  setSavingLead(true);

  try {
    const createdLead =
      await createLeadFromMortgageCalculator(
        token,
        {
          fullName:
            leadName.trim() ||
            user.fullName ||
            undefined,

          email:
            cleanEmail,

          phone:
            leadPhone.trim() ||
            undefined,

          source:
            "Mortgage Calculator",

          interest:
            `Mortgage / Property Purchase - ${result.bankName} simulation - Initial payment: ${formatEuro(
              result.initialMonthlyPayment,
            )} - Initial TAN: ${result.initialTan.toFixed(3)}%`,

          location:
            "Portugal",

          budget:
            `${formatEuro(
              propertyPrice,
            )} property`,
        },
      );

    setLeadSaved(true);

    /*
     * ==========================================================
     * MATCH FOUND AUTOMATICALLY
     * ==========================================================
     */

    if (
      createdLead.status ===
        "MATCHED" ||
      createdLead
        .autoMatching
        ?.matched
    ) {
      const bestMatch =
        createdLead
          .matches?.[0];

      const professionalName =
        bestMatch
          ?.professional
          ?.user
          ?.fullName;

      const score =
        bestMatch?.score;

      /*
       * Existing request that has just been
       * reprocessed and matched.
       */
      if (
        createdLead
          .alreadyExists
      ) {
        if (
          professionalName &&
          typeof score ===
            "number"
        ) {
          toast.success(
            "Smart match found",
            `${professionalName} is already matched to your mortgage request with a ${score}% compatibility score.`,
          );
        } else {
          toast.success(
            "Mortgage request matched",
            "Your existing mortgage request has been automatically matched with a compatible verified mortgage broker.",
          );
        }

        return;
      }

      /*
       * Brand-new request automatically matched.
       */
      if (
        professionalName &&
        typeof score ===
          "number"
      ) {
        toast.success(
          "Smart match found",
          `${professionalName} has been automatically matched to your mortgage request with a ${score}% compatibility score.`,
        );
      } else {
        toast.success(
          "Mortgage broker matched",
          "A compatible verified mortgage broker has been automatically assigned to your request.",
        );
      }

      return;
    }

    /*
     * ==========================================================
     * EXISTING REQUEST — NO MATCH YET
     * ==========================================================
     */

    if (
      createdLead
        .alreadyExists
    ) {
      toast.info(
        "Request already active",
        "This mortgage request already exists. Smart Matching will continue looking automatically for a compatible verified mortgage broker.",
      );

      return;
    }

    /*
     * ==========================================================
     * NEW REQUEST — NO PROFESSIONAL >= THRESHOLD YET
     * ==========================================================
     */

    toast.success(
      "Mortgage request created",
      "Your request is now active. Smart Matching will automatically connect you with a compatible verified mortgage broker when one meets the required score.",
    );
  } catch (error) {
    toast.error(
      "Unable to create request",
      error instanceof Error
        ? error.message
        : "Something went wrong while creating your mortgage request. Please try again.",
    );
  } finally {
    setSavingLead(false);
  }
}

  const displayResult = result;

  const chartData = useMemo(() => {
    const loanAmount =
      displayResult?.loanAmount ?? Math.max(propertyPrice - downPayment, 0);
    const totalInterest = displayResult?.estimatedInterest ?? 0;

    const pieData = [
      { name: "Principal", value: loanAmount, color: "#1B365D" },
      { name: "Interest", value: totalInterest, color: "#C9A227" },
    ];

    const barData = Array.from({ length: 5 }, (_, index) => {
      const year = index + 1;
      const principalPart = loanAmount * (0.18 + index * 0.01);
      const interestPart = totalInterest / 5 - index * 400;

      return {
        year: `Year ${year}`,
        principal: Math.round(principalPart),
        interest: Math.round(Math.max(interestPart, 0)),
      };
    });

    return { pieData, barData };
  }, [displayResult, propertyPrice, downPayment]);

  const downPaymentPercent =
    propertyPrice > 0 ? (downPayment / propertyPrice) * 100 : 0;

  return (
    <>
      <Navbar />

      <main className="bg-[#F8F9FA]">
        <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12 xl:px-20 xl:py-[56px] 2xl:px-[140px]">
          <div className="mx-auto max-w-[1680px]">
            <div className="mb-[36px] flex items-center gap-[16px]">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px] bg-[#1B365D] text-white">
                <Calculator size={24} strokeWidth={2.2} />
              </div>

              <div>
                <h1 className="text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F2340] sm:text-[42px] lg:text-[48px]">
                  Mortgage Calculator
                </h1>
                <p className="mt-[6px] text-[18px] text-[#4B5563]">
                  Compare an indicative mortgage scenario using configured public conditions from Santander Portugal or Caixa Geral de Depósitos.
                </p>
              </div>
            </div>

            <div className="grid gap-[28px] xl:grid-cols-[470px_1fr]">
              <div>
                <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 sm:p-[28px] xl:sticky xl:top-[105px]">
                  <h2 className="mb-[28px] text-[22px] font-semibold text-[#0F2340]">
                    Loan Details
                  </h2>

                  <div className="mb-[26px]">
                    <label className="mb-[10px] block text-[16px] font-medium text-[#374151]">
                      Choose a Bank
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <button
                        type="button"
                        onClick={() => setSelectedBank("SANTANDER")}
                        className={`rounded-[16px] border p-4 text-left transition ${
                          selectedBank === "SANTANDER"
                            ? "border-[#1B365D] bg-[#F4F7FB] shadow-[0_0_0_3px_rgba(27,54,93,0.07)]"
                            : "border-[#E5E7EB] bg-white hover:border-[#AAB4C3]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#0F2340]">Santander Portugal</p>
                            <p className="mt-1 text-[13px] text-[#667085]">Mixed rate · 2 years fixed</p>
                          </div>
                          {selectedBank === "SANTANDER" && (
                            <CheckCircle2 size={19} className="text-[#2E7D32]" />
                          )}
                        </div>
                        <p className="mt-3 text-[19px] font-bold text-[#1B365D]">
                          2.80% <span className="text-[12px] font-medium text-[#667085]">initial TAN</span>
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedBank("CGD")}
                        className={`rounded-[16px] border p-4 text-left transition ${
                          selectedBank === "CGD"
                            ? "border-[#1B365D] bg-[#F4F7FB] shadow-[0_0_0_3px_rgba(27,54,93,0.07)]"
                            : "border-[#E5E7EB] bg-white hover:border-[#AAB4C3]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#0F2340]">Caixa Geral de Depósitos</p>
                            <p className="mt-1 text-[13px] text-[#667085]">Mixed rate · 2 years fixed</p>
                          </div>
                          {selectedBank === "CGD" && (
                            <CheckCircle2 size={19} className="text-[#2E7D32]" />
                          )}
                        </div>
                        <p className="mt-3 text-[19px] font-bold text-[#1B365D]">
                          2.60% <span className="text-[12px] font-medium text-[#667085]">initial TAN</span>
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-[26px]">
                    <div>
                      <label className="mb-[10px] block text-[16px] font-medium text-[#374151]">
                        Property Price
                      </label>
                      <div className="mb-[12px] flex items-center gap-[12px]">
                        <input
                          type="number"
                          value={propertyPrice}
                          onChange={(e) =>
                            setPropertyPrice(Number(e.target.value))
                          }
                          className="w-full rounded-[14px] border border-[#D1D5DB] px-[16px] py-[14px] text-[18px] font-semibold outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                        />
                        <span className="text-[18px] font-medium text-[#6B7280]">
                          €
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-[10px] block text-[16px] font-medium text-[#374151]">
                        Down Payment
                      </label>
                      <div className="mb-[12px] flex items-center gap-[12px]">
                        <input
                          type="number"
                          value={downPayment}
                          onChange={(e) =>
                            setDownPayment(Number(e.target.value))
                          }
                          className="w-full rounded-[14px] border border-[#D1D5DB] px-[16px] py-[14px] text-[18px] font-semibold outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                        />
                        <span className="text-[18px] font-medium text-[#6B7280]">
                          €
                        </span>
                      </div>
                      <p className="mt-[10px] text-[14px] text-[#6B7280]">
                        {downPaymentPercent.toFixed(1)}% of property price
                      </p>
                    </div>

                    <div>
                      <label className="mb-[10px] block text-[16px] font-medium text-[#374151]">
                        Appraisal Value
                      </label>
                      <div className="flex items-center gap-[12px]">
                        <input
                          type="number"
                          value={appraisalValue}
                          onChange={(e) => setAppraisalValue(Number(e.target.value))}
                          className="w-full rounded-[14px] border border-[#D1D5DB] px-[16px] py-[14px] text-[18px] font-semibold outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                        />
                        <span className="text-[18px] font-medium text-[#6B7280]">€</span>
                      </div>
                      <p className="mt-[8px] text-[13px] leading-5 text-[#6B7280]">
                        LTV uses the lower of purchase price and appraisal value.
                      </p>
                    </div>

                    <div>
                      <label className="mb-[10px] block text-[16px] font-medium text-[#374151]">
                        Property Purpose
                      </label>
                      <select
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value as PropertyPurpose)}
                        className="w-full rounded-[14px] border border-[#D1D5DB] bg-white px-[16px] py-[14px] text-[16px] font-semibold text-[#374151] outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                      >
                        <option value="PRIMARY_RESIDENCE">Primary residence</option>
                        <option value="SECOND_HOME">Second home</option>
                        <option value="INVESTMENT">Investment</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-[10px] block text-[16px] font-medium text-[#374151]">
                        Loan Term Years
                      </label>
                      <input
                        type="number"
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                        className="w-full rounded-[14px] border border-[#D1D5DB] px-[16px] py-[14px] text-[18px] font-semibold outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCalculate}
                    disabled={calculating}
                    className="mt-[34px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#1B365D] px-[20px] py-[14px] text-[17px] font-semibold text-white transition hover:bg-[#10284d] disabled:opacity-60"
                  >
                    <Calculator size={16} />
                    {calculating ? "Calculating..." : "Calculate Bank Mortgage"}
                  </button>

                  {displayResult && (
                    <div className="mt-[24px] rounded-[18px] bg-[#F7F3E8] p-5">
                      <h3 className="mb-4 flex items-center gap-2 text-[18px] font-semibold text-[#0F2340]">
                        <Mail size={18} />
                        Smart Mortgage Matching
                      </h3>

                      <p className="mb-4 text-[13px] leading-6 text-[#667085]">
                        Create a Buyer Request and let Smart Matching automatically
                        connect you with compatible verified mortgage brokers.
                      </p>

                      <div className="space-y-3">
                        <input
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          placeholder="Full name"
                          className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 outline-none"
                        />
                        <input
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder="Email address"
                          type="email"
                          className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 outline-none"
                        />
                        <input
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          placeholder="Phone optional"
                          className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 outline-none"
                        />

                        <button
                          type="button"
                          onClick={handleCreateLead}
                          disabled={savingLead || leadSaved}
                          className="h-12 w-full rounded-xl bg-[#C9A227] font-semibold text-white disabled:opacity-60"
                        >
                          {leadSaved
                            ? "Request Created"
                            : savingLead
                            ? "Creating Request..."
                            : "Create Buyer Request"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-[24px]">
                <div className="grid gap-[20px] md:grid-cols-3">
                  <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 sm:p-[28px]">
                    <div className="mb-[16px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#1B365D] text-white">
                      <Calculator size={20} />
                    </div>
                    <div className="mb-[8px] text-[15px] text-[#4B5563]">
                      Initial Monthly Payment
                    </div>
                    <div className="text-[32px] font-bold tracking-[-0.03em] text-[#0F2340]">
                      {displayResult
                        ? formatEuro(displayResult.initialMonthlyPayment)
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 sm:p-[28px]">
                    <div className="mb-[16px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#C9A227] text-white">
                      <TrendingUp size={20} />
                    </div>
                    <div className="mb-[8px] text-[15px] text-[#4B5563]">
                      Estimated Interest
                    </div>
                    <div className="text-[32px] font-bold tracking-[-0.03em] text-[#0F2340]">
                      {displayResult
                        ? formatEuro(displayResult.estimatedInterest)
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 sm:p-[28px]">
                    <div className="mb-[16px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#2E7D32] text-white">
                      <PiggyBank size={20} />
                    </div>
                    <div className="mb-[8px] text-[15px] text-[#4B5563]">
                      Estimated Total Payments
                    </div>
                    <div className="text-[32px] font-bold tracking-[-0.03em] text-[#0F2340]">
                      {displayResult
                        ? formatEuro(displayResult.estimatedTotalPayments)
                        : "—"}
                    </div>
                  </div>
                </div>

                {displayResult && (
                  <>
                    <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 sm:p-[28px]">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C9A227]">
                            <Landmark size={16} />
                            Bank Mortgage Scenario
                          </div>
                          <h3 className="text-[24px] font-semibold text-[#0F2340]">
                            {displayResult.bankName}
                          </h3>
                          <p className="mt-2 text-[14px] leading-6 text-[#667085]">
                            Indicative mixed-rate simulation based on the configured public bank scenario.
                          </p>
                        </div>

                        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold ${
                          displayResult.ltvEligible
                            ? "bg-[#ECFDF3] text-[#15803D]"
                            : "bg-[#FEF2F2] text-[#B42318]"
                        }`}>
                          {displayResult.ltvEligible ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                          {displayResult.ltvEligible ? "LTV within reference limit" : "LTV above reference limit"}
                        </span>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                          ["Loan amount", formatEuro(displayResult.loanAmount)],
                          ["LTV", `${displayResult.ltv.toFixed(2)}%`],
                          ["Reference max LTV", `${displayResult.maxLtv}%`],
                          ["Initial TAN", `${displayResult.initialTan.toFixed(3)}%`],
                          ["Fixed period", `${displayResult.fixedPeriodMonths} months`],
                          ["Reference TAEG", displayResult.referenceTaeg !== undefined ? `${displayResult.referenceTaeg.toFixed(1)}%` : "—"],
                          ["Euribor reference", displayResult.euriborRate !== undefined ? `${displayResult.euriborType ?? ""} · ${displayResult.euriborRate.toFixed(3)}%` : "—"],
                          ["Spread", displayResult.spread !== undefined ? `${displayResult.spread.toFixed(2)}%` : "—"],
                          ["Variable reference TAN", `${displayResult.variableTan.toFixed(3)}%`],
                          ["Payment after fixed period", formatEuro(displayResult.estimatedVariablePayment)],
                          ["Balance after fixed period", formatEuro(displayResult.balanceAfterFixedPeriod)],
                          ["Reference property value", formatEuro(displayResult.referencePropertyValue)],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-[16px] bg-[#F8F9FA] p-4">
                            <p className="text-[12px] leading-5 text-[#667085]">{label}</p>
                            <p className="mt-1 break-words text-[16px] font-semibold text-[#0F2340]">{value}</p>
                          </div>
                        ))}
                      </div>

                      {!displayResult.ltvEligible && (
                        <div className="mt-5 rounded-[16px] border border-[#FECACA] bg-[#FEF2F2] p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[#B42318]" />
                            <div>
                              <p className="font-semibold text-[#B42318]">
                                Financing level above the reference LTV limit
                              </p>
                              <p className="mt-2 text-[14px] leading-6 text-[#667085]">
                                Suggested minimum down payment: <strong>{formatEuro(displayResult.suggestedMinimumDownPayment)}</strong>.
                                {" "}Additional amount needed: <strong>{formatEuro(displayResult.additionalDownPaymentNeeded)}</strong>.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 rounded-[16px] border border-[#E5E7EB] bg-[#FCFCFD] p-4">
                        <p className="text-[13px] font-semibold text-[#0F2340]">
                          Reference TAEG — not your personalized TAEG
                        </p>
                        <p className="mt-2 text-[13px] leading-6 text-[#667085]">
                          The displayed TAEG refers to the representative bank scenario configured in the backend.
                          Final pricing, spread, insurance, commissions, approval and the official FINE depend on the bank assessment.
                        </p>
                      </div>

                      <p className="mt-4 text-[12px] leading-5 text-[#98A2B3]">
                        {displayResult.disclaimer}
                      </p>
                    </div>

                    <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 sm:p-[28px]">
                      <h3 className="mb-[26px] text-[24px] font-semibold text-[#0F2340]">
                        Payment Breakdown
                      </h3>

                      <div className="grid gap-[24px] md:grid-cols-[1.1fr_0.9fr]">
                        <div className="h-[320px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData.pieData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={96}
                                stroke="#ffffff"
                                strokeWidth={2}
                              >
                                {chartData.pieData.map((entry, index) => (
                                  <Cell key={index} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) =>
                                  formatEuro(Number(value))
                                }
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="flex flex-col justify-center gap-[18px]">
                          <div className="flex items-center justify-between rounded-[16px] bg-[#F3F4F6] px-[20px] py-[18px]">
                            <span className="text-[16px] text-[#374151]">
                              Loan Amount
                            </span>
                            <span className="text-[18px] font-semibold text-[#0F2340]">
                              {formatEuro(displayResult.loanAmount)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between rounded-[16px] bg-[#F7F3E8] px-[20px] py-[18px]">
                            <span className="text-[16px] text-[#374151]">
                              Estimated Interest
                            </span>
                            <span className="text-[18px] font-semibold text-[#C9A227]">
                              {formatEuro(displayResult.estimatedInterest)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 sm:p-[28px]">
                      <h3 className="mb-[26px] text-[24px] font-semibold text-[#0F2340]">
                        Amortization Preview
                      </h3>

                      <div className="h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.barData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#E5E7EB"
                            />
                            <XAxis dataKey="year" />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => formatEuro(Number(value))}
                            />
                            <Legend />
                            <Bar
                              dataKey="principal"
                              stackId="a"
                              fill="#1B365D"
                              name="Principal"
                            />
                            <Bar
                              dataKey="interest"
                              stackId="a"
                              fill="#C9A227"
                              name="Interest"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}

                <div className="rounded-[22px] bg-[#10284d] px-5 py-6 text-white sm:px-[34px] sm:py-[28px]">
                  <div className="flex flex-col items-start justify-between gap-[20px] md:flex-row md:items-center">
                    <div>
                      <h3 className="mb-[8px] text-[28px] font-bold tracking-[-0.02em]">
                        Ready to speak with a mortgage professional?
                      </h3>
                      <p className="text-[17px] text-white/90">
                        Use Smart Matching to connect with verified mortgage brokers who
                        work with buyers in Portugal. Final bank approval always
                        depends on the lender.
                      </p>
                    </div>

                    <Link
                      href="/professionals/brokers"
                      className="inline-flex items-center gap-2 rounded-[16px] bg-[#C9A227] px-[26px] py-[14px] text-[16px] font-semibold text-white transition hover:bg-[#D9AF2C]"
                    >
                      Find Brokers
                      <ArrowRight size={16} />
                    </Link>
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

export default function MortgageCalculatorPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8F9FA]">
          <Navbar />

          <div className="flex min-h-[80vh] items-center justify-center">
            <p className="text-lg font-medium text-[#1B365D]">
              Loading mortgage calculator...
            </p>
          </div>

          <Footer />
        </main>
      }
    >
      <MortgageCalculatorPageContent />
    </Suspense>
  );
}