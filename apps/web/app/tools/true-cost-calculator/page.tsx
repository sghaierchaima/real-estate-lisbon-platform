"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { getToken, getStoredUser } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { useToast } from "@/components/ui/ToastProvider";
import {
  calculateBankTrueCost,
  type BankTrueCostResult,
  type MortgageBank,
  type PropertyPurpose,
} from "@/lib/calculators-api";
import { createLeadFromTrueCostCalculator } from "@/lib/leads-api";
import {
  Shield,
  Calculator,
  Landmark,
  FileText,
  Scale,
  Banknote,
  ArrowRight,
  Search,
  CircleCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}


export default function TrueCostCalculatorPage() {
  const toast = useToast();

  const [propertyPrice, setPropertyPrice] = useState(500000);
  const [vptValue, setVptValue] = useState(450000);
  const [loanAmount, setLoanAmount] = useState(400000);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [legalFees, setLegalFees] = useState(2000);
  const [registrationNotaryFees, setRegistrationNotaryFees] = useState(800);

  const [selectedBank, setSelectedBank] =
    useState<MortgageBank>("SANTANDER");

  const [purpose, setPurpose] =
    useState<PropertyPurpose>("PRIMARY_RESIDENCE");

  const [result, setResult] =
    useState<BankTrueCostResult | null>(null);

  const [calculating, setCalculating] = useState(false);
  const [savingRequest, setSavingRequest] = useState(false);

  async function handleCalculate() {
    if (!propertyPrice || propertyPrice <= 0) {
      toast.warning(
        "Invalid price",
        "Please enter a valid property price before calculating.",
      );
      return;
    }

    if (vptValue < 0) {
      toast.warning(
        "Invalid VPT",
        "The VPT value cannot be negative.",
      );
      return;
    }

    if (loanAmount < 0 || loanAmount > propertyPrice) {
      toast.warning(
        "Invalid loan amount",
        "The loan amount must be between €0 and the property price.",
      );
      return;
    }

    if (loanTermYears < 1 || loanTermYears > 40) {
      toast.warning(
        "Invalid loan term",
        "Please choose a loan term between 1 and 40 years.",
      );
      return;
    }

    try {
      setCalculating(true);

      const data = await calculateBankTrueCost({
        propertyPrice,
        vptValue,
        purpose,
        region: "MAINLAND",
        bank: selectedBank,
        loanAmount,
        loanTermYears,
        legalFees,
        registrationNotaryFees,
      });

      setResult(data);

      toast.success(
        "True acquisition cost ready",
        `${data.bankName} financing costs and 2026 Portuguese acquisition taxes have been included.`,
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

  async function handleCreateBuyerRequest() {
    const token = getToken();
    const user = getStoredUser<AuthUser>();

    if (!token || !user) {
      toast.warning(
        "Login required",
        "Please sign in as a Buyer to create a true cost request.",
      );

      return;
    }

    if (user.role !== "BUYER") {
      toast.warning(
        "Buyer account required",
        "Only Buyer accounts can create purchase cost requests.",
      );

      return;
    }

    if (!result) {
      toast.warning(
        "Calculation required",
        "Please calculate the true cost before creating a Buyer Request.",
      );

      return;
    }

    try {
      setSavingRequest(true);

      const lead =
        await createLeadFromTrueCostCalculator(
          token,
          {
            propertyPrice:
              String(result.propertyPrice),

            imtTax:
              String(result.imtTax),

            stampDuty:
              String(
                result.acquisitionStampDuty +
                result.mortgageStampDuty,
              ),

            notaryFees:
              String(result.registrationNotaryFees),

            legalFees:
              String(result.legalFees),

            bankFees:
              String(result.bankFees.total),

            totalExtraCosts:
              String(result.totalExtraCosts),

            totalCost:
              String(result.estimatedTotalAcquisitionCost),
          },
        );

      /*
       * ==========================================================
       * SMART MATCH FOUND
       * ==========================================================
       */

      if (
        lead.status === "MATCHED" ||
        lead.autoMatching?.matched
      ) {
        const bestMatch =
          lead.matches?.[0];

        const professionalName =
          bestMatch
            ?.professional
            ?.user
            ?.fullName;

        const professionalType =
          bestMatch
            ?.professional
            ?.professionalType;

        const score =
          bestMatch?.score;

        const professionalLabel =
          professionalType === "TAX_ADVISOR"
            ? "tax advisor"
            : professionalType === "PROPERTY_LAWYER"
              ? "property lawyer"
              : "property professional";

        /*
         * Existing request reprocessed automatically.
         */
        if (lead.alreadyExists) {
          if (
            professionalName &&
            typeof score === "number"
          ) {
            toast.success(
              "Smart match found",
              `${professionalName} is matched to your purchase cost request with a ${score}% compatibility score.`,
            );
          } else {
            toast.success(
              "True cost request matched",
              `Your existing request has been automatically matched with a compatible verified ${professionalLabel}.`,
            );
          }

          return;
        }

        /*
         * Brand-new request automatically matched.
         */
        if (
          professionalName &&
          typeof score === "number"
        ) {
          toast.success(
            "Smart match found",
            `${professionalName} has been automatically matched to your purchase cost request with a ${score}% compatibility score.`,
          );
        } else {
          toast.success(
            "Professional matched",
            `A compatible verified ${professionalLabel} has been automatically assigned to your request.`,
          );
        }

        return;
      }

      /*
       * ==========================================================
       * EXISTING REQUEST — NO MATCH YET
       * ==========================================================
       */

      if (lead.alreadyExists) {
        toast.info(
          "Request already active",
          "This true cost request already exists. Smart Matching will continue looking automatically for a compatible verified tax professional.",
        );

        return;
      }

      /*
       * ==========================================================
       * NEW REQUEST — NO PROFESSIONAL >= THRESHOLD YET
       * ==========================================================
       */

      toast.success(
        "True cost request created",
        "Your request is now active. Smart Matching will automatically connect you with a compatible verified tax professional when one meets the required score.",
      );
    } catch (error) {
      toast.error(
        "Unable to create request",
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your purchase cost request. Please try again.",
      );
    } finally {
      setSavingRequest(false);
    }
  }

  const costRows = result
    ? [
        {
          label: "Property Price",
          value: result.propertyPrice,
          icon: Shield,
        },
        {
          label: "IMT Tax",
          value: result.imtTax,
          icon: Landmark,
        },
        {
          label: "Acquisition Stamp Duty",
          value: result.acquisitionStampDuty,
          icon: FileText,
        },
        {
          label: "Mortgage Stamp Duty",
          value: result.mortgageStampDuty,
          icon: FileText,
        },
        {
          label: "Bank Fees",
          value: result.bankFees.total,
          icon: Banknote,
        },
        {
          label: "Legal Fees",
          value: result.legalFees,
          icon: FileText,
        },
        {
          label: "Registration / Notary",
          value: result.registrationNotaryFees,
          icon: Scale,
        },
      ]
    : [];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F8F9FA]">
        <section className="bg-gradient-to-br from-[#1B365D] to-[#0F2340] px-5 py-12 text-white sm:px-6 sm:py-14 lg:px-12 xl:px-20 2xl:px-[140px]">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold">
              <Shield size={18} />
              True Cost Calculator
            </div>

            <h1 className="max-w-[850px] text-[34px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[44px] lg:text-[58px]">
              Understand the Real Cost of Buying Property in Portugal
            </h1>

            <p className="mt-6 max-w-[760px] text-[18px] leading-8 text-white/85">
              Estimate the real acquisition cost using 2026 Portuguese taxes,
              mortgage-related stamp duty and the selected Santander or CGD fee scenario.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#calculator"
                className="inline-flex items-center justify-center rounded-2xl bg-[#C9A227] px-6 py-3.5 font-semibold text-white"
              >
                Calculate costs
              </a>

              <button
                onClick={handleCreateBuyerRequest}
                disabled={savingRequest || !result}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white px-6 py-3.5 font-semibold text-[#1B365D] disabled:opacity-60"
              >
                <Search size={17} />
                {savingRequest ? "Creating request..." : "Create Buyer Request"}
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-3 text-[15px] text-white/85 md:flex-row md:flex-wrap md:gap-6">
              <div className="flex items-center gap-2">
                <CircleCheck size={18} className="text-[#C9A227]" />
                <span>Connected to NestJS/Prisma</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleCheck size={18} className="text-[#C9A227]" />
                <span>Creates a real Buyer Request</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleCheck size={18} className="text-[#C9A227]" />
                <span>Automatic Smart Matching</span>
              </div>
            </div>
          </div>
        </section>

        <section id="calculator" className="px-5 py-10 sm:px-6 sm:py-14 lg:px-12 xl:px-20 2xl:px-[140px]">
          <div className="mx-auto grid max-w-[1200px] gap-8 xl:grid-cols-[430px_1fr]">
            <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(15,35,64,0.05)] sm:p-7">
              <h2 className="text-[26px] font-bold text-[#0F2340]">
                Property Details
              </h2>

              <p className="mt-2 text-[15px] leading-6 text-[#667085]">
                Enter the property, financing and transaction details to estimate the full acquisition cost.
              </p>

              <div className="mt-7">
                <label className="mb-3 block text-[15px] font-semibold text-[#0F2340]">
                  Choose a Bank
                </label>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <button
                    type="button"
                    onClick={() => setSelectedBank("SANTANDER")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedBank === "SANTANDER"
                        ? "border-[#1B365D] bg-[#F4F7FB]"
                        : "border-[#D0D5DD] bg-white hover:border-[#AAB4C3]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#0F2340]">
                          Santander Portugal
                        </p>
                        <p className="mt-1 text-[13px] text-[#667085]">
                          Current configured acquisition-fee scenario
                        </p>
                      </div>

                      {selectedBank === "SANTANDER" && (
                        <CheckCircle2
                          size={19}
                          className="shrink-0 text-[#2E7D32]"
                        />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedBank("CGD")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedBank === "CGD"
                        ? "border-[#1B365D] bg-[#F4F7FB]"
                        : "border-[#D0D5DD] bg-white hover:border-[#AAB4C3]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#0F2340]">
                          Caixa Geral de Depósitos
                        </p>
                        <p className="mt-1 text-[13px] text-[#667085]">
                          Current configured acquisition-fee scenario
                        </p>
                      </div>

                      {selectedBank === "CGD" && (
                        <CheckCircle2
                          size={19}
                          className="shrink-0 text-[#2E7D32]"
                        />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-3 block text-[15px] font-semibold text-[#0F2340]">
                    Property Price
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={propertyPrice}
                      onChange={(e) => setPropertyPrice(Number(e.target.value))}
                      className="min-w-0 h-14 w-full rounded-2xl border border-[#D0D5DD] px-4 text-[18px] font-semibold outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                    />

                    <span className="shrink-0 text-[18px] font-semibold text-[#667085]">
                      €
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[15px] font-semibold text-[#0F2340]">
                    VPT
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={vptValue}
                      onChange={(e) => setVptValue(Number(e.target.value))}
                      className="min-w-0 h-14 w-full rounded-2xl border border-[#D0D5DD] px-4 text-[16px] font-semibold outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                    />

                    <span className="shrink-0 text-[16px] font-semibold text-[#667085]">
                      €
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[15px] font-semibold text-[#0F2340]">
                    Loan Amount
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="min-w-0 h-14 w-full rounded-2xl border border-[#D0D5DD] px-4 text-[16px] font-semibold outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                    />

                    <span className="shrink-0 text-[16px] font-semibold text-[#667085]">
                      €
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[15px] font-semibold text-[#0F2340]">
                    Loan Term
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={loanTermYears}
                    onChange={(e) => setLoanTermYears(Number(e.target.value))}
                    className="h-14 w-full rounded-2xl border border-[#D0D5DD] px-4 text-[16px] font-semibold outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-[15px] font-semibold text-[#0F2340]">
                    Property Purpose
                  </label>

                  <select
                    value={purpose}
                    onChange={(e) =>
                      setPurpose(e.target.value as PropertyPurpose)
                    }
                    className="h-14 w-full rounded-2xl border border-[#D0D5DD] bg-white px-4 text-[15px] font-semibold text-[#0F2340] outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
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

                <div>
                  <label className="mb-3 block text-[15px] font-semibold text-[#0F2340]">
                    Legal Fees
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={legalFees}
                      onChange={(e) => setLegalFees(Number(e.target.value))}
                      className="min-w-0 h-14 w-full rounded-2xl border border-[#D0D5DD] px-4 text-[16px] font-semibold outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                    />

                    <span className="shrink-0 text-[16px] font-semibold text-[#667085]">
                      €
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[15px] font-semibold text-[#0F2340]">
                    Registration / Notary
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={registrationNotaryFees}
                      onChange={(e) =>
                        setRegistrationNotaryFees(Number(e.target.value))
                      }
                      className="min-w-0 h-14 w-full rounded-2xl border border-[#D0D5DD] px-4 text-[16px] font-semibold outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                    />

                    <span className="shrink-0 text-[16px] font-semibold text-[#667085]">
                      €
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCalculate}
                disabled={calculating}
                className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1B365D] text-[17px] font-semibold text-white transition hover:bg-[#10284d] disabled:opacity-60"
              >
                <Calculator size={18} />
                {calculating ? "Calculating..." : "Calculate True Cost"}
              </button>

              <button
                onClick={handleCreateBuyerRequest}
                disabled={savingRequest || !result}
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#D0D5DD] bg-white text-[17px] font-semibold text-[#1B365D] transition hover:bg-[#F8F9FA] disabled:opacity-60"
              >
                <Search size={18} />
                {savingRequest ? "Creating request..." : "Create Buyer Request"}
              </button>

              <div className="mt-6 rounded-2xl bg-[#F7F3E8] p-5">
                <h3 className="text-[18px] font-semibold text-[#0F2340]">
                  Smart professional matching
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  Create a Buyer Request and our Smart Matching system will
                  automatically connect you with compatible verified professionals
                  for tax and purchase cost guidance.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_24px_rgba(15,35,64,0.05)]">
                  <p className="text-[15px] text-[#667085]">Property Price</p>
                  <p className="mt-5 text-[34px] font-bold text-[#0F2340]">
                    {result ? formatEuro(result.propertyPrice) : "—"}
                  </p>
                </div>

                <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_24px_rgba(15,35,64,0.05)]">
                  <p className="text-[15px] text-[#667085]">Extra Costs</p>
                  <p className="mt-5 text-[34px] font-bold text-[#C9A227]">
                    {result ? formatEuro(result.totalExtraCosts) : "—"}
                  </p>
                </div>

                <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_24px_rgba(15,35,64,0.05)]">
                  <p className="text-[15px] text-[#667085]">Total Acquisition Cost</p>
                  <p className="mt-5 text-[34px] font-bold text-[#2E7D32]">
                    {result ? formatEuro(result.estimatedTotalAcquisitionCost) : "—"}
                  </p>
                </div>

                <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_24px_rgba(15,35,64,0.05)]">
                  <p className="text-[15px] text-[#667085]">Estimated Cash Required</p>
                  <p className="mt-5 text-[34px] font-bold text-[#1B365D]">
                    {result ? formatEuro(result.estimatedCashRequired) : "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(15,35,64,0.05)] sm:p-7">
                <h2 className="text-[26px] font-bold text-[#0F2340]">
                  Cost Breakdown
                </h2>

                {!result ? (
                  <div className="mt-6 rounded-2xl bg-[#F8F9FA] p-6 text-[#667085]">
                    Enter a property price and calculate to see the full cost
                    breakdown.
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {costRows.map((row) => {
                      const Icon = row.icon;

                      return (
                        <div
                          key={row.label}
                          className="flex flex-col gap-3 rounded-2xl bg-[#F8F9FA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1B365D]">
                              <Icon size={18} />
                            </div>

                            <span className="font-medium text-[#0F2340]">
                              {row.label}
                            </span>
                          </div>

                          <span className="font-semibold text-[#0F2340]">
                            {formatEuro(row.value)}
                          </span>
                        </div>
                      );
                    })}

                    <div className="mt-5 rounded-2xl border border-[#E5E7EB] bg-white p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C9A227]">
                            Selected Bank Costs
                          </p>
                          <h3 className="mt-1 text-[20px] font-semibold text-[#0F2340]">
                            {result.bankName}
                          </h3>
                        </div>

                        <div className="text-left text-[13px] text-[#667085] sm:text-right">
                          <p>
                            Tax base: {formatEuro(result.taxablePropertyValue)}
                          </p>
                          <p className="mt-1">
                            Extra costs: {result.extraCostPercentage.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          ["Dossier / Study", result.bankFees.dossierOrStudyFee],
                          ["Appraisal", result.bankFees.appraisalFee],
                          ["Formalization", result.bankFees.formalizationFee],
                          ["Tax on bank commissions", result.bankFees.commissionStampDuty],
                        ].map(([label, value]) => (
                          <div
                            key={String(label)}
                            className="rounded-xl bg-[#F8F9FA] p-4"
                          >
                            <p className="text-[12px] text-[#667085]">
                              {label}
                            </p>
                            <p className="mt-1 font-semibold text-[#0F2340]">
                              {formatEuro(Number(value))}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-[#C9A227]/30 bg-[#F7F3E8] p-5">
                      <p className="text-sm leading-6 text-[#667085]">
                        {result.disclaimer}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-[24px] bg-[#10284d] p-6 text-white sm:p-8">
                <h3 className="text-[28px] font-bold">
                  Need a tax advisor or legal expert?
                </h3>

                <p className="mt-3 max-w-[700px] text-[16px] leading-7 text-white/85">
                  Buying costs can vary depending on your profile, property use
                  and legal situation. Create a Buyer Request and let Smart Matching
                  automatically connect you with the most suitable verified tax
                  professional.
                </p>

                <button
                  onClick={handleCreateBuyerRequest}
                  disabled={savingRequest || !result}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#C9A227] px-6 py-3.5 font-semibold text-white disabled:opacity-60"
                >
                  {savingRequest ? "Creating request..." : "Create Buyer Request"}
                  <ArrowRight size={16} />
                </button>

                <Link
                  href="/tools/property-search-assistant"
                  className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3.5 font-semibold text-white sm:ml-3 sm:mt-6"
                >
                  Property Search
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}