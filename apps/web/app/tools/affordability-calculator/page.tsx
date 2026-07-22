"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { getToken, getStoredUser } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { createLeadFromAffordabilityCalculator } from "@/lib/leads-api";
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

export default function AffordabilityCalculatorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [annualIncome, setAnnualIncome] = useState<number | "">("");
  const [monthlyDebts, setMonthlyDebts] = useState<number | "">("");
  const [downPayment, setDownPayment] = useState<number | "">("");
  const [interestRate, setInterestRate] = useState<number | "">("");
  const [savingRequest, setSavingRequest] = useState(false);

  useEffect(() => {
    const urlAnnualIncome = searchParams.get("annualIncome");
    const urlMonthlyDebts = searchParams.get("monthlyDebts");
    const urlDownPayment = searchParams.get("downPayment");
    const urlInterestRate = searchParams.get("interestRate");

    if (urlAnnualIncome) setAnnualIncome(Number(urlAnnualIncome));
    if (urlMonthlyDebts) setMonthlyDebts(Number(urlMonthlyDebts));
    if (urlDownPayment) setDownPayment(Number(urlDownPayment));
    if (urlInterestRate) setInterestRate(Number(urlInterestRate));
  }, [searchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const nextQuery = getQueryString({
        annualIncome: annualIncome === "" ? undefined : String(annualIncome),
        monthlyDebts: monthlyDebts === "" ? undefined : String(monthlyDebts),
        downPayment: downPayment === "" ? undefined : String(downPayment),
        interestRate: interestRate === "" ? undefined : String(interestRate),
      });

      router.replace(
        nextQuery
          ? `/tools/affordability-calculator?${nextQuery}`
          : "/tools/affordability-calculator",
        { scroll: false }
      );
    }, 300);

    return () => clearTimeout(timeout);
  }, [annualIncome, monthlyDebts, downPayment, interestRate, router]);

  const hasUserInput =
    annualIncome !== "" ||
    monthlyDebts !== "" ||
    downPayment !== "" ||
    interestRate !== "";

  const results = useMemo(() => {
    const safeAnnualIncome = Number(annualIncome) || 0;
    const safeMonthlyDebts = Number(monthlyDebts) || 0;
    const safeDownPayment = Number(downPayment) || 0;

    const monthlyIncome = safeAnnualIncome / 12;

    const debtToIncome =
      monthlyIncome > 0 ? (safeMonthlyDebts / monthlyIncome) * 100 : 0;

    const comfortableMonthlyHousing = monthlyIncome * 0.3 - safeMonthlyDebts;
    const maximumMonthlyHousing = monthlyIncome * 0.4 - safeMonthlyDebts;

    const safeHousing = Math.max(comfortableMonthlyHousing, 0);
    const maxHousing = Math.max(maximumMonthlyHousing, 0);

    const recommendedBudget = safeHousing * 300 + safeDownPayment;
    const maximumBudget = maxHousing * 300 + safeDownPayment;

    const housingPercent =
      monthlyIncome > 0 ? Math.min((safeHousing / monthlyIncome) * 100, 100) : 0;

    const debtPercent =
      monthlyIncome > 0
        ? Math.min((safeMonthlyDebts / monthlyIncome) * 100, 100)
        : 0;

    const otherPercent = Math.max(100 - housingPercent - debtPercent, 0);

    const allocationData = [
      { name: "Housing", value: Math.round(housingPercent), color: "#1B365D" },
      { name: "Debt", value: Math.round(debtPercent), color: "#C9A227" },
      { name: "Other", value: Math.round(otherPercent), color: "#6B7280" },
    ];

    const budgetChart = [
      {
        name: "Recommended",
        value: Math.round(recommendedBudget),
        fill: "#2E7D32",
      },
      {
        name: "Maximum",
        value: Math.round(maximumBudget),
        fill: "#F5A623",
      },
    ];

    let riskLabel = "Low Risk";
    let riskText = "Excellent financial position for buying.";
    let riskBg = "#EEF6EF";
    let riskColor = "#2E7D32";

    if (debtToIncome >= 20 && debtToIncome < 35) {
      riskLabel = "Moderate Risk";
      riskText = "Manageable, but keep a close eye on your monthly obligations.";
      riskBg = "#FFF7E8";
      riskColor = "#F5A623";
    }

    if (debtToIncome >= 35) {
      riskLabel = "Higher Risk";
      riskText = "Your current debt load may limit comfortable buying capacity.";
      riskBg = "#FDEEEE";
      riskColor = "#D32F2F";
    }

    return {
      monthlyIncome,
      debtToIncome,
      recommendedBudget,
      maximumBudget,
      allocationData,
      budgetChart,
      riskLabel,
      riskText,
      riskBg,
      riskColor,
    };
  }, [annualIncome, monthlyDebts, downPayment]);

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

    if (
      annualIncome === "" ||
      monthlyDebts === "" ||
      downPayment === "" ||
      interestRate === ""
    ) {
      toast.warning(
        "Missing information",
        "Please complete income, debts, down payment and interest rate."
      );
      return;
    }

    try {
      setSavingRequest(true);

      const lead = await createLeadFromAffordabilityCalculator(token, {
        annualIncome: String(annualIncome),
        monthlyDebts: String(monthlyDebts),
        downPayment: String(downPayment),
        interestRate: String(interestRate),
        recommendedBudget: String(Math.round(results.recommendedBudget)),
        maximumBudget: String(Math.round(results.maximumBudget)),
        debtToIncome: results.debtToIncome.toFixed(1),
        riskLabel: results.riskLabel,
      });

      if (lead.alreadyExists) {
        toast.info(
          "Request already exists",
          "This affordability request is already available in My Requests."
        );
        return;
      }

      toast.success(
        "Buyer request created",
        "Your affordability request is now waiting for admin matching."
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

        <section className="px-6 py-14 md:px-12 md:py-16">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                  <DollarSign size={15} />
                  Affordability Calculator
                </div>

                <h1 className="max-w-[760px] text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F2340] md:text-[54px]">
                  Discover Your True Buying Power
                </h1>

                <p className="mt-5 max-w-[760px] text-[18px] leading-8 text-[#4B5563]">
                  Understand how much you can comfortably spend based on your
                  income, debt load, deposit, and expected financing conditions.
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
                    <span>Ready for mortgage broker matching</span>
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
                        {hasUserInput
                          ? formatEuro(results.recommendedBudget)
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[14px] text-white/75">
                        Maximum budget
                      </p>
                      <p className="mt-1 text-[34px] font-bold tracking-[-0.03em]">
                        {hasUserInput ? formatEuro(results.maximumBudget) : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 md:p-7">
                  <div className="space-y-4">
                    <ResultRow
                      label="Monthly income"
                      value={hasUserInput ? formatMonthly(results.monthlyIncome) : "—"}
                    />
                    <ResultRow
                      label="Debt-to-income ratio"
                      value={
                        hasUserInput ? `${results.debtToIncome.toFixed(1)}%` : "—"
                      }
                    />
                    <div className="h-px bg-[#E9ECEF]" />
                    <ResultRow
                      label="Recommended budget"
                      value={
                        hasUserInput ? formatEuro(results.recommendedBudget) : "—"
                      }
                    />
                    <ResultRow
                      label="Maximum budget"
                      value={hasUserInput ? formatEuro(results.maximumBudget) : "—"}
                      strong
                    />
                  </div>

                  <div className="mt-6 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                    <p className="text-[14px] leading-6 text-[#4B5563]">
                      This estimate can be converted into a real buyer request
                      and matched with a mortgage broker after admin approval.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </section>

        <section id="calculator" className="px-6 pb-14 md:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <SectionCard className="p-7 md:p-8">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                Inputs
              </p>

              <h2 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0F2340]">
                Your finances
              </h2>

              <p className="mt-3 text-[14px] text-[#6B7280]">
                Enter your real financial data to get a more accurate estimate.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <InputLabel>Annual gross income</InputLabel>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Example: 75000"
                      value={annualIncome}
                      onChange={(e) =>
                        setAnnualIncome(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#1B365D]"
                    />
                    <span className="text-[16px] font-medium text-[#6B7280]">
                      €
                    </span>
                  </div>
                </div>

                <div>
                  <InputLabel>Monthly debt payments</InputLabel>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Example: 500"
                      value={monthlyDebts}
                      onChange={(e) =>
                        setMonthlyDebts(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#1B365D]"
                    />
                    <span className="text-[16px] font-medium text-[#6B7280]">
                      €
                    </span>
                  </div>
                </div>

                <div>
                  <InputLabel>Available down payment</InputLabel>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Example: 60000"
                      value={downPayment}
                      onChange={(e) =>
                        setDownPayment(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#1B365D]"
                    />
                    <span className="text-[16px] font-medium text-[#6B7280]">
                      €
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <InputLabel>Expected interest rate (%)</InputLabel>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Example: 3.5"
                      value={interestRate}
                      onChange={(e) =>
                        setInterestRate(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#1B365D]"
                    />
                    <span className="text-[16px] font-medium text-[#6B7280]">
                      %
                    </span>
                  </div>
                </div>
              </div>

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
              <SectionCard className="p-7 md:p-8">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                  Financial health
                </p>

                <h2 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0F2340]">
                  Debt-to-income overview
                </h2>

                <div className="mt-6 grid gap-8 md:grid-cols-[1.05fr_0.95fr]">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[15px] text-[#374151]">
                        Debt-to-income ratio
                      </span>
                      <span className="text-[16px] font-semibold text-[#1B365D]">
                        {hasUserInput
                          ? `${results.debtToIncome.toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>

                    <div className="h-[10px] overflow-hidden rounded-full bg-[#E5E7EB]">
                      <div
                        className="h-full rounded-full bg-[#1B365D]"
                        style={{
                          width: hasUserInput
                            ? `${Math.min(results.debtToIncome, 100)}%`
                            : "0%",
                        }}
                      />
                    </div>

                    <div
                      className="mt-5 rounded-[16px] px-[20px] py-[18px]"
                      style={{
                        backgroundColor: hasUserInput ? results.riskBg : "#F3F4F6",
                      }}
                    >
                      <h4
                        className="mb-[6px] text-[17px] font-semibold"
                        style={{
                          color: hasUserInput ? results.riskColor : "#6B7280",
                        }}
                      >
                        {hasUserInput ? results.riskLabel : "Waiting for your data"}
                      </h4>

                      <p className="text-[15px] text-[#4B5563]">
                        {hasUserInput
                          ? results.riskText
                          : "Fill in your finances to see your affordability profile."}
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
                            data={results.allocationData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={70}
                            outerRadius={95}
                            stroke="#ffffff"
                            strokeWidth={3}
                          >
                            {results.allocationData.map((entry, index) => (
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

              <SectionCard className="p-7 md:p-8">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                  Budget range
                </p>

                <h2 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0F2340]">
                  Your property budget range
                </h2>

                <div className="mt-6 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.budgetChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" />
                      <YAxis
                        tickFormatter={(value) => `€${Math.round(value / 1000)}k`}
                      />
                      <Tooltip formatter={(value) => formatEuro(Number(value))} />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                        {results.budgetChart.map((entry, index) => (
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
                            results.recommendedBudget
                          )} for a comfortable purchase with a savings buffer.`
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
                            results.maximumBudget
                          )} is your upper limit. There may be little room for surprises.`
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
                      Create a buyer request to be matched with a mortgage
                      broker, or use Neighborhood Finder to discover areas
                      within your budget.
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