"use client";

import { useEffect, useMemo, useState,   Suspense,} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { getToken, getStoredUser } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { createLeadFromPropertyValuation } from "@/lib/leads-api";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Search,
  CheckCircle,
  MapPin,
  Home,
  Ruler,
  BedDouble,
  Bath,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Shield,
  ChevronRight,
  AlertTriangle,
  FileText,
  RefreshCcw,
  Sparkles,
} from "lucide-react";

type ConditionType = "renovated" | "good" | "needs_work";
type PropertyType = "apartment" | "house" | "penthouse" | "villa";

function parseNumber(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return `€${Math.round(value || 0).toLocaleString()}`;
}

function formatPercent(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
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

function getConditionMultiplier(condition: ConditionType) {
  if (condition === "renovated") return 1.08;
  if (condition === "good") return 1;
  return 0.9;
}

function getPropertyTypeMultiplier(type: PropertyType) {
  if (type === "penthouse") return 1.12;
  if (type === "villa") return 1.1;
  if (type === "house") return 1.04;
  return 1;
}

function getLocationMultiplier(location: string) {
  const l = location.toLowerCase();

  if (l.includes("cascais")) return 1.12;
  if (l.includes("estoril")) return 1.1;
  if (l.includes("príncipe real") || l.includes("principe real")) return 1.13;
  if (l.includes("estrela")) return 1.09;
  if (l.includes("lisbon") || l.includes("lisboa")) return 1.05;
  if (l.includes("sintra")) return 0.92;
  if (l.includes("amadora")) return 0.88;
  if (l.includes("benfica")) return 0.96;
  if (l.includes("oeiras")) return 1.03;

  return 1;
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

function PropertyValuationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const initialAskingPrice = searchParams.get("askingPrice") || "";
  const initialAddress = searchParams.get("address") || "";
  const initialPropertyType =
    (searchParams.get("propertyType") as PropertyType) || "apartment";
  const initialCondition =
    (searchParams.get("condition") as ConditionType) || "good";
  const initialSize = searchParams.get("size") || "";
  const initialBedrooms = searchParams.get("bedrooms") || "";
  const initialBathrooms = searchParams.get("bathrooms") || "";
  const initialFloor = searchParams.get("floorLevel") || "2";

  const [askingPrice, setAskingPrice] = useState(initialAskingPrice);
  const [address, setAddress] = useState(initialAddress);
  const [propertyType, setPropertyType] =
    useState<PropertyType>(initialPropertyType);
  const [condition, setCondition] = useState<ConditionType>(initialCondition);
  const [sizeInput, setSizeInput] = useState(initialSize);
  const [bedrooms, setBedrooms] = useState(initialBedrooms);
  const [bathrooms, setBathrooms] = useState(initialBathrooms);
  const [floorLevel, setFloorLevel] = useState(initialFloor);
  const [savingRequest, setSavingRequest] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const nextQuery = getQueryString({
        askingPrice: askingPrice || undefined,
        address: address || undefined,
        propertyType,
        condition,
        size: sizeInput || undefined,
        bedrooms: bedrooms || undefined,
        bathrooms: bathrooms || undefined,
        floorLevel: floorLevel || undefined,
      });

      router.replace(`/tools/property-valuation?${nextQuery}`, {
        scroll: false,
      });
    }, 350);

    return () => clearTimeout(timeout);
  }, [
    askingPrice,
    address,
    propertyType,
    condition,
    sizeInput,
    bedrooms,
    bathrooms,
    floorLevel,
    router,
  ]);

  const valuation = useMemo(() => {
    const size = parseNumber(sizeInput);
    const price = parseNumber(askingPrice);
    const beds = parseNumber(bedrooms);
    const baths = parseNumber(bathrooms);
    const floor = parseNumber(floorLevel);

    const basePricePerSqm = 4300;
    const conditionAdj = getConditionMultiplier(condition);
    const typeAdj = getPropertyTypeMultiplier(propertyType);
    const bedroomAdj = beds >= 3 ? 1.03 : 1;
    const bathroomAdj = baths >= 2 ? 1.02 : 1;
    const floorAdj = floor >= 3 ? 1.02 : 1;
    const locationAdj = getLocationMultiplier(address);

    const estimatedPsm =
      basePricePerSqm *
      conditionAdj *
      typeAdj *
      bedroomAdj *
      bathroomAdj *
      floorAdj *
      locationAdj;

    const marketValue = size > 0 ? size * estimatedPsm : 0;
    const lowRange = marketValue * 0.94;
    const highRange = marketValue * 1.04;

    const variancePct =
      marketValue > 0 ? ((price - marketValue) / marketValue) * 100 : 0;

    const averageAreaPsm = basePricePerSqm * locationAdj;
    const comparableLow = averageAreaPsm * 0.96;
    const comparableHigh = averageAreaPsm * 1.03;

    let verdict = "Fairly priced";
    let badgeBg = "bg-[#ECFDF3]";
    let badgeText = "Reasonable";
    let verdictColor = "text-[#2E7D32]";

    if (variancePct > 8) {
      verdict = "Overpriced";
      badgeBg = "bg-[#FFF5F5]";
      badgeText = "Negotiation advised";
      verdictColor = "text-[#B42318]";
    } else if (variancePct < -6) {
      verdict = "Potential opportunity";
      badgeBg = "bg-[#EFF6FF]";
      badgeText = "Below market";
      verdictColor = "text-[#1D4ED8]";
    }

    return {
      size,
      price,
      marketValue,
      lowRange,
      highRange,
      variancePct,
      verdict,
      badgeBg,
      badgeText,
      verdictColor,
      estimatedPsm,
      averageAreaPsm,
      comparableLow,
      comparableHigh,
    };
  }, [
    sizeInput,
    askingPrice,
    condition,
    propertyType,
    bedrooms,
    bathrooms,
    floorLevel,
    address,
  ]);

  async function handleCreateBuyerRequest() {
    const token = getToken();
    const user = getStoredUser<AuthUser>();

    if (!token || !user) {
      toast.warning(
        "Login required",
        "Please sign in as a buyer to create a valuation request."
      );
      return;
    }

    if (user.role !== "BUYER") {
      toast.warning(
        "Buyer account required",
        "Only buyers can create valuation requests."
      );
      return;
    }

    if (!address.trim() || !sizeInput.trim() || !askingPrice.trim()) {
      toast.warning(
        "Missing information",
        "Please enter address, size and asking price before creating a request."
      );
      return;
    }

    if (valuation.marketValue <= 0) {
      toast.warning(
        "Invalid valuation",
        "Please check the property size and asking price."
      );
      return;
    }

    try {
      setSavingRequest(true);

      const lead = await createLeadFromPropertyValuation(token, {
        address,
        propertyType,
        condition,
        size: sizeInput,
        askingPrice,
        bedrooms,
        bathrooms,
        floorLevel,
        estimatedValue: String(Math.round(valuation.marketValue)),
        valuationRange: `${Math.round(valuation.lowRange)} - ${Math.round(
          valuation.highRange
        )}`,
        verdict: valuation.verdict,
      });

      if (lead.alreadyExists) {
        toast.info(
          "Request already exists",
          "This valuation request is already available in My Requests."
        );
        return;
      }

      toast.success(
        "Valuation request created",
        "Your request has been created and is now waiting for admin matching."
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

  function resetForm() {
    setAskingPrice("");
    setAddress("");
    setPropertyType("apartment");
    setCondition("good");
    setSizeInput("");
    setBedrooms("");
    setBathrooms("");
    setFloorLevel("2");
  }

  const trustPoints = [
    "Estimated value range, not just one number",
    "Comparable price-per-square-meter context",
    "Variance between asking price and market estimate",
    "A clearer starting point for negotiation",
  ];

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
                  <Search size={15} />
                  Property Valuation
                </div>

                <h1 className="max-w-[760px] text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F2340] md:text-[54px]">
                  Is This Property Fairly Priced?
                </h1>

                <p className="mt-5 max-w-[760px] text-[18px] leading-8 text-[#4B5563]">
                  Asking prices are not market prices. Get a realistic value
                  range, compare against area benchmarks, and create a buyer
                  request when you want a professional valuation review.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="#valuation-tool"
                    className="inline-flex items-center justify-center rounded-[16px] bg-[#C9A227] px-6 py-3.5 text-[15px] font-semibold text-[#0F2340] transition hover:bg-[#E5C766]"
                  >
                    Get a Valuation
                  </a>

                  <button
                    onClick={handleCreateBuyerRequest}
                    disabled={savingRequest}
                    className="inline-flex items-center justify-center rounded-[16px] border border-[#D7DCE2] bg-white px-6 py-3.5 text-[15px] font-semibold text-[#1B365D] transition hover:border-[#1B365D] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingRequest
                      ? "Creating request..."
                      : "Create Buyer Request"}
                  </button>
                </div>

                <div className="mt-8 flex flex-col gap-3 text-[15px] text-[#4B5563] md:flex-row md:flex-wrap md:gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#2E7D32]" />
                    <span>Connected to NestJS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#2E7D32]" />
                    <span>Creates a real Buyer Request</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#2E7D32]" />
                    <span>Ready for admin matching</span>
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
                        Estimated market value
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-[14px] text-white/70">Estimated range</p>
                    <p className="mt-1 text-[34px] font-bold tracking-[-0.03em] md:text-[38px]">
                      {formatCurrency(valuation.lowRange)} —{" "}
                      {formatCurrency(valuation.highRange)}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 md:p-7">
                  <div
                    className={`mb-5 inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${valuation.badgeBg} ${valuation.verdictColor}`}
                  >
                    {valuation.badgeText}
                  </div>

                  <div className="space-y-4">
                    <ResultRow
                      label="Asking price"
                      value={formatCurrency(valuation.price)}
                    />
                    <ResultRow
                      label="Estimated value"
                      value={formatCurrency(valuation.marketValue)}
                    />
                    <ResultRow
                      label="Variance"
                      value={formatPercent(valuation.variancePct)}
                    />
                    <div className="h-px bg-[#E9ECEF]" />
                    <ResultRow
                      label="Verdict"
                      value={valuation.verdict}
                      strong
                    />
                  </div>

                  <button
                    onClick={handleCreateBuyerRequest}
                    disabled={savingRequest}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-[16px] bg-[#C9A227] px-6 py-3.5 text-[15px] font-semibold text-[#0F2340] transition hover:bg-[#E5C766] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingRequest
                      ? "Creating request..."
                      : "Create Buyer Request"}
                  </button>

                  <div className="mt-6 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                    <p className="text-[14px] leading-6 text-[#4B5563]">
                      This is not a certified appraisal. It is a
                      decision-support estimate designed to help buyers
                      understand market context before negotiating or moving
                      forward.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </section>

        <section id="valuation-tool" className="px-6 pb-14 md:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <SectionCard className="p-7 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                    Inputs
                  </p>
                  <h2 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0F2340]">
                    Tell us about the property
                  </h2>
                </div>

                <button
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-[#D7DCE2] bg-[#F8F9FA] px-4 py-3 text-[14px] font-semibold text-[#1B365D] transition hover:border-[#1B365D] hover:bg-white"
                >
                  <RefreshCcw size={16} />
                  Reset
                </button>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <InputLabel>Address / Location</InputLabel>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Cascais, Lisbon, Oeiras..."
                    className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] outline-none transition focus:border-[#1B365D]"
                  />
                </div>

                <div>
                  <InputLabel>Property type</InputLabel>
                  <select
                    value={propertyType}
                    onChange={(e) =>
                      setPropertyType(e.target.value as PropertyType)
                    }
                    className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] text-[#4B5563] outline-none transition focus:border-[#1B365D]"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="villa">Villa</option>
                  </select>
                </div>

                <div>
                  <InputLabel>Condition</InputLabel>
                  <select
                    value={condition}
                    onChange={(e) =>
                      setCondition(e.target.value as ConditionType)
                    }
                    className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] text-[#4B5563] outline-none transition focus:border-[#1B365D]"
                  >
                    <option value="renovated">Renovated</option>
                    <option value="good">Good</option>
                    <option value="needs_work">Needs work</option>
                  </select>
                </div>

                <div>
                  <InputLabel>Size (m²)</InputLabel>
                  <input
                    type="text"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    placeholder="120"
                    className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] outline-none transition focus:border-[#1B365D]"
                  />
                </div>

                <div>
                  <InputLabel>Asking price</InputLabel>
                  <input
                    type="text"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(e.target.value)}
                    placeholder="595000"
                    className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] outline-none transition focus:border-[#1B365D]"
                  />
                </div>

                <div>
                  <InputLabel>Bedrooms</InputLabel>
                  <input
                    type="text"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="3"
                    className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] outline-none transition focus:border-[#1B365D]"
                  />
                </div>

                <div>
                  <InputLabel>Bathrooms</InputLabel>
                  <input
                    type="text"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    placeholder="2"
                    className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] outline-none transition focus:border-[#1B365D]"
                  />
                </div>

                <div>
                  <InputLabel>Floor level</InputLabel>
                  <input
                    type="text"
                    value={floorLevel}
                    onChange={(e) => setFloorLevel(e.target.value)}
                    placeholder="2"
                    className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] outline-none transition focus:border-[#1B365D]"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-[18px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-[#1B365D]" />
                  <div>
                    <p className="text-[14px] font-semibold text-[#0F2340]">
                      Smart URL
                    </p>
                    <p className="mt-1 text-[13px] leading-6 text-[#4B5563]">
                      The URL updates automatically with the current valuation
                      scenario, so you can reload or share it easily.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard className="p-7 md:p-8">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                Valuation result
              </p>
              <h2 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0F2340]">
                Market context for this property
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[18px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#1B365D] text-white">
                      <BarChart3 size={18} />
                    </div>
                    <div>
                      <p className="text-[13px] text-[#6B7280]">
                        Estimated range
                      </p>
                      <p className="text-[20px] font-semibold text-[#0F2340]">
                        {formatCurrency(valuation.lowRange)} —{" "}
                        {formatCurrency(valuation.highRange)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[18px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#1B365D] text-white">
                      {valuation.variancePct >= 0 ? (
                        <TrendingUp size={18} />
                      ) : (
                        <TrendingDown size={18} />
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] text-[#6B7280]">Variance</p>
                      <p className="text-[20px] font-semibold text-[#0F2340]">
                        {formatPercent(valuation.variancePct)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[18px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#1B365D] text-white">
                      <Ruler size={18} />
                    </div>
                    <div>
                      <p className="text-[13px] text-[#6B7280]">
                        Estimated €/m²
                      </p>
                      <p className="text-[20px] font-semibold text-[#0F2340]">
                        {formatCurrency(valuation.estimatedPsm)}/m²
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[18px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#1B365D] text-white">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[13px] text-[#6B7280]">
                        Area average €/m²
                      </p>
                      <p className="text-[20px] font-semibold text-[#0F2340]">
                        {formatCurrency(valuation.averageAreaPsm)}/m²
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[20px] border border-[#E5E7EB] bg-[#FCFCFD] p-5">
                <div className="space-y-3">
                  <ResultRow label="Address" value={address || "Not provided"} />
                  <ResultRow label="Property type" value={propertyType} />
                  <ResultRow label="Condition" value={condition} />
                  <ResultRow
                    label="Asking price"
                    value={formatCurrency(valuation.price)}
                  />
                  <div className="h-px bg-[#E9ECEF]" />
                  <ResultRow
                    label="Estimated market value"
                    value={formatCurrency(valuation.marketValue)}
                  />
                  <ResultRow
                    label="Estimated value range"
                    value={`${formatCurrency(
                      valuation.lowRange
                    )} — ${formatCurrency(valuation.highRange)}`}
                    strong
                  />
                </div>
              </div>

              <button
                onClick={handleCreateBuyerRequest}
                disabled={savingRequest}
                className="mt-6 inline-flex w-full items-center justify-center rounded-[16px] bg-[#C9A227] px-6 py-3.5 text-[15px] font-semibold text-[#0F2340] transition hover:bg-[#E5C766] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingRequest ? "Creating request..." : "Create Buyer Request"}
              </button>

              <div className="mt-5 rounded-[16px] border border-[#FEF3C7] bg-[#FFFBEB] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-[#B45309]" />
                  <p className="text-[14px] leading-6 text-[#92400E]">
                    If the asking price is meaningfully above this range, that
                    does not automatically mean you should walk away — but it
                    does mean you should ask better questions and negotiate with
                    data.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </section>

        <section className="px-6 pb-14 md:px-12">
          <div className="mx-auto max-w-[1200px]">
            <SectionCard className="p-7 md:p-8">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                What you get
              </p>
              <h2 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0F2340]">
                The data you need before you decide
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {trustPoints.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[18px] border border-[#E9ECEF] bg-[#F8F9FA] p-5"
                  >
                    <CheckCircle className="mt-0.5 h-5 w-5 text-[#2E7D32]" />
                    <p className="text-[15px] leading-7 text-[#4B5563]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </section>

        <section className="px-6 pb-20 md:px-12">
          <div className="mx-auto max-w-[1200px] rounded-[28px] bg-gradient-to-br from-[#1B365D] via-[#163050] to-[#0F2340] p-8 text-white shadow-[0_14px_40px_rgba(15,35,64,0.20)] md:p-10">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#E5C766]">
                  Next step
                </p>
                <h2 className="mt-3 text-[32px] font-bold leading-[1.1] tracking-[-0.03em]">
                  Ready to go deeper?
                </h2>
                <p className="mt-4 max-w-[700px] text-[16px] leading-8 text-white/85">
                  Valuation helps you understand if the number makes sense. The
                  next step is creating a request so an approved professional can
                  help you evaluate the opportunity.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCreateBuyerRequest}
                  disabled={savingRequest}
                  className="inline-flex items-center justify-between rounded-[16px] bg-white px-5 py-4 text-[15px] font-semibold text-[#1B365D] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingRequest ? "Creating request..." : "Create Buyer Request"}
                  <ChevronRight size={18} />
                </button>

                <Link
                  href="/tools/true-cost-calculator"
                  className="inline-flex items-center justify-between rounded-[16px] border border-white/20 bg-white/10 px-5 py-4 text-[15px] font-semibold text-white transition hover:bg-white/15"
                >
                  Calculate total costs
                  <ChevronRight size={18} />
                </Link>

                <Link
                  href="/dashboard/my-leads"
                  className="inline-flex items-center justify-between rounded-[16px] border border-white/20 bg-white/10 px-5 py-4 text-[15px] font-semibold text-white transition hover:bg-white/15"
                >
                  View My Requests
                  <ChevronRight size={18} />
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
export default function PropertyValuationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8F9FA]">
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-lg font-medium text-[#1B365D]">
              Loading...
            </p>
          </div>
        </main>
      }
    >
      <PropertyValuationPageContent />
    </Suspense>
  );
}