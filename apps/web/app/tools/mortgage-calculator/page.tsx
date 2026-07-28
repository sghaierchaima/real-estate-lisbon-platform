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
import { calculateMortgage } from "@/lib/calculators-api";
import { createCalculatorLead } from "@/lib/calculator-leads-api";
import { getStoredUser, getToken } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { useToast } from "@/components/ui/ToastProvider";
function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

type MortgageResult = {
  propertyPrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
};

function MortgageCalculatorPageContent() {
  const searchParams = useSearchParams();
  const priceFromUrl = searchParams.get("price");
  const toast = useToast();
  const [propertyPrice, setPropertyPrice] = useState(300000);
  const [downPayment, setDownPayment] = useState(60000);
  const [interestRate, setInterestRate] = useState(3.5);
  const [loanTerm, setLoanTerm] = useState(30);

  const [result, setResult] = useState<MortgageResult | null>(null);
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
      setDownPayment(Math.round(parsed * 0.2));
    }
  }, [priceFromUrl]);

  async function handleCalculate() {
  setCalculating(true);

  try {
    const data = await calculateMortgage({
      propertyPrice,
      downPayment,
      interestRate,
      loanTermYears: loanTerm,
    });

    setResult(data);
    setLeadSaved(false);

    toast.success(
      "Mortgage calculated",
      "Your mortgage simulation has been calculated successfully."
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

  async function handleCreateLead() {
    const token = getToken();
    const user = getStoredUser<AuthUser>();
    const cleanEmail = leadEmail.trim().toLowerCase();

    if (!token || !user) {
      toast.warning(
        "Login required",
        "Please sign in as a buyer before submitting your request."
      );
      return;
    }

    if (user.role !== "BUYER") {
      toast.warning(
        "Buyer account required",
        "Only buyers can submit a mortgage request."
      );
      return;
    }

    if (!cleanEmail) {
      toast.warning("Email required", "Please enter your email address.");
      return;
    }

    if (!result) {
      toast.warning(
        "Calculation required",
        "Please calculate your mortgage before submitting a request."
      );
      return;
    }

    setSavingLead(true);

    try {
      const createdLead =
  await createCalculatorLead({
    fullName:
      leadName.trim() ||
      user.fullName ||
      undefined,
    email: cleanEmail,
    phone:
      leadPhone.trim() ||
      undefined,
    source: "Mortgage Calculator",
    interest:
      "Mortgage / Property Purchase",
    location: "Portugal",
    budget:
      `${formatEuro(propertyPrice)} property`,
  });

      setLeadSaved(true);

      if (createdLead.alreadyExists) {
        toast.warning(
          "Request already exists",
          "You already have a similar request. Please check My Requests."
        );
      } else {
        toast.success(
          "Request submitted",
          "Your request has been saved. We can now match you with a mortgage broker."
        );
      }
    } catch (error) {
      toast.error(
        "Request failed",
        error instanceof Error
          ? error.message
          : "Unable to save your request. Please try again later."
      );
    } finally {
      setSavingLead(false);
    }
  }

  const displayResult = result;

  const chartData = useMemo(() => {
    const loanAmount =
      displayResult?.loanAmount ?? Math.max(propertyPrice - downPayment, 0);
    const totalInterest = displayResult?.totalInterest ?? 0;

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
        <section className="px-[140px] py-[56px]">
          <div className="mx-auto max-w-[1680px]">
            <div className="mb-[36px] flex items-center gap-[16px]">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px] bg-[#1B365D] text-white">
                <Calculator size={24} strokeWidth={2.2} />
              </div>

              <div>
                <h1 className="text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F2340]">
                  Mortgage Calculator
                </h1>
                <p className="mt-[6px] text-[18px] text-[#4B5563]">
                  Calculate your mortgage using our backend engine.
                </p>
              </div>
            </div>

            <div className="grid gap-[28px] lg:grid-cols-[470px_1fr]">
              <div>
                <div className="sticky top-[105px] rounded-[20px] border border-[#E5E7EB] bg-white p-[28px]">
                  <h2 className="mb-[28px] text-[22px] font-semibold text-[#0F2340]">
                    Loan Details
                  </h2>

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
                        Interest Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={interestRate}
                        onChange={(e) =>
                          setInterestRate(Number(e.target.value))
                        }
                        className="w-full rounded-[14px] border border-[#D1D5DB] px-[16px] py-[14px] text-[18px] font-semibold outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                      />
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
                    {calculating ? "Calculating..." : "Calculate Mortgage"}
                  </button>

                  {displayResult && (
                    <div className="mt-[24px] rounded-[18px] bg-[#F7F3E8] p-5">
                      <h3 className="mb-4 flex items-center gap-2 text-[18px] font-semibold text-[#0F2340]">
                        <Mail size={18} />
                        Get matched with a broker
                      </h3>

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
                            ? "Request saved"
                            : savingLead
                            ? "Saving..."
                            : "Request broker help"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-[24px]">
                <div className="grid gap-[20px] md:grid-cols-3">
                  <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-[28px]">
                    <div className="mb-[16px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#1B365D] text-white">
                      <Calculator size={20} />
                    </div>
                    <div className="mb-[8px] text-[15px] text-[#4B5563]">
                      Monthly Payment
                    </div>
                    <div className="text-[32px] font-bold tracking-[-0.03em] text-[#0F2340]">
                      {displayResult
                        ? formatEuro(displayResult.monthlyPayment)
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-[28px]">
                    <div className="mb-[16px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#C9A227] text-white">
                      <TrendingUp size={20} />
                    </div>
                    <div className="mb-[8px] text-[15px] text-[#4B5563]">
                      Total Interest
                    </div>
                    <div className="text-[32px] font-bold tracking-[-0.03em] text-[#0F2340]">
                      {displayResult
                        ? formatEuro(displayResult.totalInterest)
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-[28px]">
                    <div className="mb-[16px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#2E7D32] text-white">
                      <PiggyBank size={20} />
                    </div>
                    <div className="mb-[8px] text-[15px] text-[#4B5563]">
                      Total Cost
                    </div>
                    <div className="text-[32px] font-bold tracking-[-0.03em] text-[#0F2340]">
                      {displayResult
                        ? formatEuro(displayResult.totalCost)
                        : "—"}
                    </div>
                  </div>
                </div>

                {displayResult && (
                  <>
                    <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-[28px]">
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
                              Total Interest
                            </span>
                            <span className="text-[18px] font-semibold text-[#C9A227]">
                              {formatEuro(displayResult.totalInterest)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-[28px]">
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

                <div className="rounded-[22px] bg-[#10284d] px-[34px] py-[28px] text-white">
                  <div className="flex flex-col items-start justify-between gap-[20px] md:flex-row md:items-center">
                    <div>
                      <h3 className="mb-[8px] text-[28px] font-bold tracking-[-0.02em]">
                        Ready to get pre-approved?
                      </h3>
                      <p className="text-[17px] text-white/90">
                        Connect with verified mortgage brokers who specialize in
                        foreign buyers.
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