"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { getNeighborhoods, type Neighborhood } from "@/lib/neighborhoods-api";
import { getToken, getStoredUser } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { createLeadFromPriceChecker } from "@/lib/leads-api";
import { useToast } from "@/components/ui/ToastProvider";
import {
  TrendingUp,
  Shield,
  CircleCheck,
  AlertTriangle,
  BarChart3,
  MapPin,
  Ruler,
  ArrowRight,
  FileText,
  Search,
} from "lucide-react";

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function parseNumber(value: string) {
  const cleaned = value
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  if (!cleaned) {
    return 0;
  }

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
}
function isPositiveNumberInput(value: string) {
  if (value === "") {
    return true;
  }

  // Autorise uniquement des chiffres
  if (!/^\d+$/.test(value)) {
    return false;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0;
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

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\blisbon\b/g, "lisboa")
    .replace(/\boporto\b/g, "porto");
}

function getMedian(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function matchesLocation(
  neighborhood: Neighborhood,
  location: string,
) {
  const query = normalize(location);

  if (!query) {
    return false;
  }

  const name = normalize(neighborhood.name || "");
  const zone = normalize(neighborhood.zone || "");

  const nameMatches =
    name.length > 0 &&
    (name === query ||
      name.includes(query) ||
      query.includes(name));

  const zoneMatches =
    zone.length > 0 &&
    (zone === query ||
      zone.includes(query) ||
      query.includes(zone));

  return nameMatches || zoneMatches;
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
      className={`flex items-center justify-between gap-4 ${strong
        ? "text-[17px] font-semibold text-[#0F2340]"
        : "text-[15px] text-[#4B5563]"
        }`}
    >
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function PriceCheckerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const askingPriceParam = searchParams.get("askingPrice") || "";
  const marketPriceParam = searchParams.get("marketPrice") || "";
  const sizeParam = searchParams.get("size") || "";
  const initialLocation = searchParams.get("location") || "";

  const initialAskingPrice =
    askingPriceParam && isPositiveNumberInput(askingPriceParam)
      ? askingPriceParam
      : "";

  const initialMarketPrice =
    marketPriceParam && isPositiveNumberInput(marketPriceParam)
      ? marketPriceParam
      : "";

  const initialSize =
    sizeParam && isPositiveNumberInput(sizeParam)
      ? sizeParam
      : "";

  const [askingPrice, setAskingPrice] = useState(initialAskingPrice);
  const [marketPrice, setMarketPrice] = useState(initialMarketPrice);
  const [sizeInput, setSizeInput] = useState(initialSize);
  const [location, setLocation] = useState(initialLocation);

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [detectedNeighborhood, setDetectedNeighborhood] = useState("");
  const [loadingMarketPrice, setLoadingMarketPrice] = useState(false);
  const [marketDataLocked, setMarketDataLocked] = useState(initialMarketPrice !== "");
  const [savingRequest, setSavingRequest] = useState(false);

  useEffect(() => {
    async function loadNeighborhoods() {
      try {
        const data = await getNeighborhoods();
        setNeighborhoods(data);
      } catch (error) {
        toast.error(
          "Unable to load market data",
          error instanceof Error ? error.message : "Please try again later."
        );
      }
    }

    loadNeighborhoods();
  }, [toast]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const nextQuery = getQueryString({
        askingPrice: askingPrice || undefined,
        marketPrice: marketPrice || undefined,
        size: sizeInput || undefined,
        location: location || undefined,
      });

      router.replace(
        nextQuery ? `/tools/price-checker?${nextQuery}` : "/tools/price-checker",
        { scroll: false }
      );
    }, 300);

    return () => clearTimeout(timeout);
  }, [askingPrice, marketPrice, sizeInput, location, router]);

  useEffect(() => {
    if (
      !location.trim() ||
      !sizeInput.trim() ||
      marketDataLocked
    ) {
      return;
    }

    const size = parseNumber(sizeInput);

    if (size <= 0) {
      setMarketPrice("");
      setDetectedNeighborhood("");
      return;
    }

    if (!neighborhoods.length) {
      return;
    }

    setLoadingMarketPrice(true);

    try {
      const matchingNeighborhoods = neighborhoods.filter(
        (item) =>
          matchesLocation(item, location) &&
          item.pricePerSqm != null &&
          Number(item.pricePerSqm) > 0,
      );

      if (!matchingNeighborhoods.length) {
        setMarketPrice("");
        setDetectedNeighborhood("");
        return;
      }

      const query = normalize(location);

      const exactNeighborhood = matchingNeighborhoods.find(
        (item) => normalize(item.name || "") === query,
      );

      let referencePricePerSqm: number;
      let referenceLabel: string;

      if (
        exactNeighborhood?.pricePerSqm != null &&
        Number(exactNeighborhood.pricePerSqm) > 0
      ) {
        referencePricePerSqm = Number(
          exactNeighborhood.pricePerSqm,
        );
        referenceLabel = exactNeighborhood.name;
      } else {
        const prices = matchingNeighborhoods
          .map((item) => Number(item.pricePerSqm))
          .filter((value) => Number.isFinite(value) && value > 0);

        referencePricePerSqm = getMedian(prices);

        const exactZone = matchingNeighborhoods.find(
          (item) => normalize(item.zone || "") === query,
        )?.zone;

        referenceLabel =
          exactZone?.trim() ||
          location.trim();
      }

      if (referencePricePerSqm <= 0) {
        setMarketPrice("");
        setDetectedNeighborhood("");
        return;
      }

      const computedMarketPrice = Math.round(
        referencePricePerSqm * size,
      );

      setMarketPrice(String(computedMarketPrice));
      setDetectedNeighborhood(referenceLabel);
    } finally {
      setLoadingMarketPrice(false);
    }
  }, [
    location,
    sizeInput,
    neighborhoods,
    marketDataLocked,
  ]);

  const hasUserInput =
    askingPrice !== "" || marketPrice !== "" || sizeInput !== "" || location !== "";

  const results = useMemo(() => {
    const asking = parseNumber(askingPrice);
    const market = parseNumber(marketPrice);
    const size = parseNumber(sizeInput);

    const hasValidAsking = asking > 0;
    const hasValidMarket = market > 0;
    const hasValidSize = size > 0;

    const canCompare =
      hasValidAsking &&
      hasValidMarket &&
      hasValidSize;

    const askingPerSqm =
      hasValidAsking && hasValidSize
        ? asking / size
        : 0;

    const marketPerSqm =
      hasValidMarket && hasValidSize
        ? market / size
        : 0;

    const difference =
      canCompare
        ? asking - market
        : 0;

    const variancePct =
      canCompare
        ? (difference / market) * 100
        : 0;

    let verdict = "Waiting for valid data";
    let badgeText = "Incomplete";
    let badgeBg = "bg-[#F3F4F6]";
    let verdictColor = "text-[#6B7280]";
    let explanation =
      "Enter a valid asking price, market value and property size greater than zero.";

    if (canCompare) {
      verdict = "Fairly priced";
      badgeText = "Reasonable";
      badgeBg = "bg-[#ECFDF3]";
      verdictColor = "text-[#2E7D32]";
      explanation =
        "The asking price is close to the estimated market value.";

      if (variancePct > 8) {
        verdict = "Overpriced";
        badgeText = "Negotiation advised";
        badgeBg = "bg-[#FFF5F5]";
        verdictColor = "text-[#B42318]";
        explanation =
          "The asking price is meaningfully above the estimated market value.";
      } else if (variancePct < -6) {
        verdict = "Below market";
        badgeText = "Potential opportunity";
        badgeBg = "bg-[#EFF6FF]";
        verdictColor = "text-[#1D4ED8]";
        explanation =
          "The asking price is below the estimated market value and may be attractive.";
      }
    }

    return {
      asking,
      market,
      size,
      askingPerSqm,
      marketPerSqm,
      difference,
      variancePct,
      verdict,
      badgeText,
      badgeBg,
      verdictColor,
      explanation,
      canCompare,
    };
  }, [askingPrice, marketPrice, sizeInput]);

  async function handleCreateBuyerRequest() {
    const token = getToken();
    const user = getStoredUser<AuthUser>();

    if (!token || !user) {
      toast.warning(
        "Login required",
        "Please sign in as a Buyer to create a price review request.",
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

    if (!location.trim() || !results.canCompare) {
      toast.warning(
        "Invalid information",
        "Please enter a valid location, asking price, estimated market value and property size greater than zero.",
      );

      return;
    }

    try {
      setSavingRequest(true);

      const lead =
        await createLeadFromPriceChecker(
          token,
          {
            location:
              location.trim(),

            askingPrice,

            marketPrice,

            size:
              sizeInput,

            verdict:
              results.verdict,

            variancePct:
              results.variancePct.toFixed(1),
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

        const score =
          bestMatch?.score;

        /*
         * Existing request automatically reprocessed.
         */
        if (lead.alreadyExists) {
          if (
            professionalName &&
            typeof score === "number"
          ) {
            toast.success(
              "Smart match found",
              `${professionalName} is matched to your price review request with a ${score}% compatibility score.`,
            );
          } else {
            toast.success(
              "Price review matched",
              "Your existing request has been automatically matched with a compatible verified property valuer.",
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
            `${professionalName} has been automatically matched to your price review request with a ${score}% compatibility score.`,
          );
        } else {
          toast.success(
            "Property valuer matched",
            "A compatible verified property valuer has been automatically assigned to your request.",
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
          "This price review request already exists. Smart Matching will continue looking automatically for a compatible verified property valuer.",
        );

        return;
      }

      /*
       * ==========================================================
       * NEW REQUEST — NO PROFESSIONAL >= THRESHOLD YET
       * ==========================================================
       */

      toast.success(
        "Price review request created",
        "Your request is now active. Smart Matching will automatically connect you with a compatible verified property valuer when one meets the required score.",
      );
    } catch (error) {
      toast.error(
        "Unable to create request",
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your price review request. Please try again.",
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
                  <TrendingUp size={15} />
                  Price Checker
                </div>

                <h1 className="max-w-[760px] text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F2340] md:text-[54px]">
                  Compare Asking Price vs Market Value
                </h1>

                <p className="mt-5 max-w-[760px] text-[18px] leading-8 text-[#4B5563]">
                  Check whether a property looks fairly priced using neighborhood
                  market data from the platform neighborhood dataset.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="#checker"
                    className="inline-flex items-center justify-center rounded-[16px] bg-[#C9A227] px-6 py-3.5 text-[15px] font-semibold text-[#0F2340] transition hover:bg-[#E5C766]"
                  >
                    Check Price
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
                    <span>Live market-data comparison</span>
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
                <div className="bg-gradient-to-br from-[#1976D2] via-[#1565C0] to-[#0D47A1] px-6 py-6 text-white md:px-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/10 text-white">
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#E3F2FD]">
                        Live snapshot
                      </p>
                      <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
                        Price verdict
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-[14px] text-white/75">Asking price</p>
                      <p className="mt-1 text-[34px] font-bold tracking-[-0.03em]">
                        {results.asking > 0
                          ? formatEuro(results.asking)
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[14px] text-white/75">Market value</p>
                      <p className="mt-1 text-[34px] font-bold tracking-[-0.03em]">
                        {results.market > 0
                          ? formatEuro(results.market)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 md:p-7">
                  <div
                    className={`mb-5 inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${results.badgeBg} ${results.verdictColor}`}
                  >
                    {results.canCompare
                      ? results.badgeText
                      : "Waiting for your data"}
                  </div>

                  <div className="space-y-4">
                    <ResultRow
                      label="Difference"
                      value={
                        results.canCompare
                          ? formatEuro(results.difference)
                          : "—"
                      }
                    />
                    <ResultRow
                      label="Variance"
                      value={
                        results.canCompare
                          ? `${results.variancePct > 0 ? "+" : ""}${results.variancePct.toFixed(1)}%`
                          : "—"
                      }
                    />
                    <div className="h-px bg-[#E9ECEF]" />
                    <ResultRow
                      label="Verdict"
                      value={
                        results.canCompare
                          ? results.verdict
                          : "—"
                      }
                      strong
                    />
                  </div>

                  <div className="mt-6 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                    <p className="text-[14px] leading-6 text-[#4B5563]">
                      {results.canCompare
                        ? results.explanation
                        : "Enter a valid asking price, estimated market value and property size to compare them."}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </section>

        <section id="checker" className="px-6 pb-14 md:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <SectionCard className="p-7 md:p-8">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                Inputs
              </p>
              <h2 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0F2340]">
                Compare the numbers
              </h2>

              <p className="mt-3 text-[14px] text-[#6B7280]">
                The market value can be automatically estimated from your
                Neighborhood Finder dataset.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <InputLabel>Location</InputLabel>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Example: Cascais"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setMarketDataLocked(false);
                        setDetectedNeighborhood("");
                        setMarketPrice("");
                      }}
                      className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#1976D2]"
                    />
                    <MapPin className="text-[#6B7280]" size={18} />
                  </div>

                  {loadingMarketPrice && (
                    <p className="mt-2 text-[13px] text-[#6B7280]">
                      Loading market data...
                    </p>
                  )}

                  {detectedNeighborhood && !loadingMarketPrice && (
                    <p className="mt-2 text-[13px] text-[#2E7D32]">
                      Market value automatically estimated using data for{" "}
                      <strong>{detectedNeighborhood}</strong>.
                    </p>
                  )}

                  {location.trim() &&
                    sizeInput.trim() &&
                    !loadingMarketPrice &&
                    !detectedNeighborhood &&
                    !marketPrice && (
                      <p className="mt-2 text-[13px] text-[#B45309]">
                        No matching market data found for this location. You can
                        enter an estimated market value manually.
                      </p>
                    )}
                </div>

                <div>
                  <InputLabel>Asking price</InputLabel>

                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Example: 595000"
                    value={askingPrice}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (isPositiveNumberInput(value)) {
                        setAskingPrice(value);
                      }
                    }}
                    onPaste={(e) => {
                      const pastedValue = e.clipboardData.getData("text").trim();

                      if (!isPositiveNumberInput(pastedValue)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#1976D2]"
                  />
                </div>

                <div>
                  <InputLabel>Estimated market value</InputLabel>

                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Example: 545000"
                    value={marketPrice}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (isPositiveNumberInput(value)) {
                        setMarketPrice(value);
                        setMarketDataLocked(true);
                      }
                    }}
                    onPaste={(e) => {
                      const pastedValue = e.clipboardData.getData("text").trim();

                      if (!isPositiveNumberInput(pastedValue)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#1976D2]"
                  />
                </div>

                <div className="md:col-span-2">
                  <InputLabel>Property size (m²)</InputLabel>

                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Example: 120"
                      value={sizeInput}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (isPositiveNumberInput(value)) {
                          setSizeInput(value);
                          setMarketDataLocked(false);
                          setDetectedNeighborhood("");
                          setMarketPrice("");
                        }
                      }}
                      onPaste={(e) => {
                        const pastedValue = e.clipboardData.getData("text").trim();

                        if (!isPositiveNumberInput(pastedValue)) {
                          e.preventDefault();
                        }
                      }}
                      className="w-full rounded-[16px] border border-[#D7DCE2] bg-[#FCFCFD] px-4 py-3.5 text-[15px] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#1976D2]"
                    />

                    <Ruler className="text-[#6B7280]" size={18} />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateBuyerRequest}
                disabled={savingRequest}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#1B365D] px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#10284D] disabled:opacity-70"
              >
                <Search size={17} />
                {savingRequest ? "Creating request..." : "Create Buyer Request"}
              </button>

              <div className="mt-6 rounded-[18px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-[#1976D2]" />
                  <div>
                    <p className="text-[14px] font-semibold text-[#0F2340]">
                      Smart URL
                    </p>
                    <p className="mt-1 text-[13px] leading-6 text-[#4B5563]">
                      The URL updates automatically with the current comparison
                      so you can reload or share it.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="space-y-8">
              <SectionCard className="p-7 md:p-8">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
                  Comparison
                </p>

                <h2 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0F2340]">
                  Price comparison summary
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
                    <div className="mb-2 text-[13px] text-[#6B7280]">
                      Asking price / m²
                    </div>
                    <div className="text-[24px] font-semibold text-[#0F2340]">
                      {results.asking > 0 && results.size > 0
                        ? `${formatEuro(results.askingPerSqm)}/m²`
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
                    <div className="mb-2 text-[13px] text-[#6B7280]">
                      Market value / m²
                    </div>
                    <div className="text-[24px] font-semibold text-[#0F2340]">
                      {results.market > 0 && results.size > 0
                        ? `${formatEuro(results.marketPerSqm)}/m²`
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-[20px] border border-[#E5E7EB] bg-[#FCFCFD] p-5">
                  <div className="space-y-3">
                    <ResultRow label="Location" value={location || "Not provided"} />
                    <ResultRow
                      label="Asking price"
                      value={
                        results.asking > 0
                          ? formatEuro(results.asking)
                          : "—"
                      }
                    />
                    <ResultRow
                      label="Estimated market value"
                      value={
                        results.market > 0
                          ? formatEuro(results.market)
                          : "—"
                      }
                    />
                    <ResultRow
                      label="Difference"
                      value={
                        results.canCompare
                          ? formatEuro(results.difference)
                          : "—"
                      }
                    />
                    <div className="h-px bg-[#E9ECEF]" />
                    <ResultRow
                      label="Verdict"
                      value={
                        results.canCompare
                          ? results.verdict
                          : "—"
                      }
                      strong
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-[16px] border border-[#FEF3C7] bg-[#FFFBEB] p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-[#B45309]" />
                    <p className="text-[14px] leading-6 text-[#92400E]">
                      This tool creates a real buyer request when you want a
                      professional to review the price signal.
                    </p>
                  </div>
                </div>
              </SectionCard>

              <div className="rounded-[28px] bg-gradient-to-br from-[#1976D2] via-[#1565C0] to-[#0D47A1] p-8 text-white shadow-[0_14px_40px_rgba(15,35,64,0.20)] md:p-10">
                <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#E3F2FD]">
                      Next step
                    </p>
                    <h3 className="mt-3 text-[30px] font-bold tracking-[-0.03em]">
                      Want a deeper analysis?
                    </h3>
                    <p className="mt-4 max-w-[760px] text-[16px] leading-8 text-white/85">
                      Continue with Property Valuation or create a request so a
                      professional can review this price signal.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/tools/property-valuation"
                      className="rounded-[16px] bg-white px-[24px] py-[14px] text-[15px] font-semibold text-[#1976D2] transition hover:bg-[#F3F4F6]"
                    >
                      Property Valuation
                    </Link>

                    <Link
                      href="/tools/affordability-calculator"
                      className="inline-flex items-center gap-2 rounded-[16px] bg-[#C9A227] px-[24px] py-[14px] text-[15px] font-semibold text-white transition hover:bg-[#D9AF2C]"
                    >
                      Check Affordability
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

export default function PriceCheckerPage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />

          <main className="min-h-screen bg-[#F8F9FA]">
            <div className="flex min-h-[80vh] items-center justify-center">
              <p className="text-lg font-medium text-[#1B365D]">
                Loading price checker...
              </p>
            </div>
          </main>

          <Footer />
        </>
      }
    >
      <PriceCheckerPageContent />
    </Suspense>
  );
}