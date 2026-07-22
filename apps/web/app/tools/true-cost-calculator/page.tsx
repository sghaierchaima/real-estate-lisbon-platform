"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { getToken, getStoredUser } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { useToast } from "@/components/ui/ToastProvider";
import { calculateTrueCost } from "@/lib/calculators-api";
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
} from "lucide-react";

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

type TrueCostResult = {
  propertyPrice: number;
  imtTax: number;
  stampDuty: number;
  notaryFees: number;
  legalFees: number;
  bankFees: number;
  totalExtraCosts: number;
  totalCost: number;
  note: string;
};

export default function TrueCostCalculatorPage() {
  const toast = useToast();

  const [propertyPrice, setPropertyPrice] = useState(500000);
  const [result, setResult] = useState<TrueCostResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [savingRequest, setSavingRequest] = useState(false);

  async function handleCalculate() {
    if (!propertyPrice || propertyPrice <= 0) {
      toast.warning(
        "Invalid price",
        "Please enter a valid property price before calculating."
      );
      return;
    }

    try {
      setCalculating(true);
      const data = await calculateTrueCost({ propertyPrice });
      setResult(data);
      toast.success(
        "Calculation completed",
        "The full purchase cost estimate has been generated."
      );
    } catch (error) {
      toast.error(
        "Calculation failed",
        error instanceof Error ? error.message : "Please try again later."
      );
    } finally {
      setCalculating(false);
    }
  }

  async function handleCreateBuyerRequest() {
    const token = getToken();
    const user = getStoredUser<AuthUser>();

    if (!token || !user) {
      toast.warning("Login required", "Please sign in as a buyer.");
      return;
    }

    if (user.role !== "BUYER") {
      toast.warning("Buyer account required", "Only buyers can create requests.");
      return;
    }

    if (!result) {
      toast.warning(
        "Calculation required",
        "Please calculate the true cost before creating a buyer request."
      );
      return;
    }

    try {
      setSavingRequest(true);

      const lead = await createLeadFromTrueCostCalculator(token, {
        propertyPrice: String(result.propertyPrice),
        imtTax: String(result.imtTax),
        stampDuty: String(result.stampDuty),
        notaryFees: String(result.notaryFees),
        legalFees: String(result.legalFees),
        bankFees: String(result.bankFees),
        totalExtraCosts: String(result.totalExtraCosts),
        totalCost: String(result.totalCost),
      });

      if (lead.alreadyExists) {
        toast.info(
          "Request already exists",
          "This true cost request is already available in My Requests."
        );
        return;
      }

      toast.success(
        "Buyer request created",
        "Your true cost request is now waiting for admin matching."
      );
    } catch (error) {
      toast.error(
        "Unable to create request",
        error instanceof Error ? error.message : "Please try again later."
      );
    } finally {
      setSavingRequest(false);
    }
  }

  const costRows = result
    ? [
        { label: "Property Price", value: result.propertyPrice, icon: Shield },
        { label: "IMT Tax", value: result.imtTax, icon: Landmark },
        { label: "Stamp Duty", value: result.stampDuty, icon: FileText },
        { label: "Notary Fees", value: result.notaryFees, icon: Scale },
        { label: "Legal Fees", value: result.legalFees, icon: FileText },
        { label: "Bank Fees", value: result.bankFees, icon: Banknote },
      ]
    : [];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F8F9FA]">
        <section className="bg-gradient-to-br from-[#1B365D] to-[#0F2340] px-6 py-16 text-white lg:px-[140px]">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold">
              <Shield size={18} />
              True Cost Calculator
            </div>

            <h1 className="max-w-[850px] text-[44px] font-bold leading-[1.05] tracking-[-0.03em] lg:text-[58px]">
              Understand the Real Cost of Buying Property in Portugal
            </h1>

            <p className="mt-6 max-w-[760px] text-[18px] leading-8 text-white/85">
              Estimate property price, IMT tax, stamp duty, notary fees, legal
              fees and bank fees before making a buying decision.
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
                <span>Ready for tax/legal matching</span>
              </div>
            </div>
          </div>
        </section>

        <section id="calculator" className="px-6 py-14 lg:px-[140px]">
          <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[430px_1fr]">
            <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-7 shadow-[0_8px_24px_rgba(15,35,64,0.05)]">
              <h2 className="text-[26px] font-bold text-[#0F2340]">
                Property Details
              </h2>

              <p className="mt-2 text-[15px] leading-6 text-[#667085]">
                Enter the property price to estimate the full acquisition cost.
              </p>

              <div className="mt-7">
                <label className="mb-3 block text-[15px] font-semibold text-[#0F2340]">
                  Property Price
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={propertyPrice}
                    onChange={(e) => setPropertyPrice(Number(e.target.value))}
                    className="h-14 w-full rounded-2xl border border-[#D0D5DD] px-4 text-[18px] font-semibold outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                  />

                  <span className="text-[18px] font-semibold text-[#667085]">
                    €
                  </span>
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
                  Professional workflow
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  After creating a buyer request, the admin can match you with a
                  tax advisor or legal professional for purchase cost guidance.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-3">
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
                  <p className="text-[15px] text-[#667085]">Total Cost</p>
                  <p className="mt-5 text-[34px] font-bold text-[#2E7D32]">
                    {result ? formatEuro(result.totalCost) : "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-7 shadow-[0_8px_24px_rgba(15,35,64,0.05)]">
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
                          className="flex items-center justify-between rounded-2xl bg-[#F8F9FA] px-5 py-4"
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

                    <div className="mt-5 rounded-2xl border border-[#C9A227]/30 bg-[#F7F3E8] p-5">
                      <p className="text-sm leading-6 text-[#667085]">
                        {result.note}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-[24px] bg-[#10284d] p-8 text-white">
                <h3 className="text-[28px] font-bold">
                  Need a tax advisor or legal expert?
                </h3>

                <p className="mt-3 max-w-[700px] text-[16px] leading-7 text-white/85">
                  Buying costs can change depending on your profile, property
                  use and legal situation. Create a buyer request so the admin
                  can match you with the right professional.
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
                  className="ml-3 mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3.5 font-semibold text-white"
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