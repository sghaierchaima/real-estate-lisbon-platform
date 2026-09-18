"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import {
  getNeighborhoods,
  type Neighborhood as ApiNeighborhood,
} from "@/lib/neighborhoods-api";
import { useToast } from "@/components/ui/ToastProvider";
import {
  MapPin,
  School,
  TramFront,
  ShoppingCart,
  Coffee,
  Star,
  TrendingUp,
  Save,
  RefreshCcw,
  Sparkles,
  Search,
  AlertCircle,
  Trophy,
  BadgeEuro,
  Brain,
  Eye,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getToken, getStoredUser } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { createLeadFromNeighborhoodFinder } from "@/lib/leads-api";

type ProfileType = "all" | "family" | "investor" | "expat";
type GoalType = "all" | "live" | "invest" | "retire";

type Neighborhood = {
  id: string;
  name: string;
  zone: string;
  description: string;
  tags: string[];
  highlights: string[];
  avgPrice: number;
  pricePerSqm: number;
  rentYield: number;
  growth: number;
  latitude: number;
  longitude: number;
  scores: {
    schools: number;
    transport: number;
    amenities: number;
    safety: number;
  };
  icon: "waves" | "tree" | "building" | "sun";
  sourceNotes?: string;
  aiScore?: number | null;
  aiSummary?: string | null;
};

const ITEMS_PER_PAGE = 3;

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return clamp(value, 0, 5);
}

function normalizeAIScore(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return clamp(Math.round(value), 0, 100);
}

function mapApiNeighborhood(row: ApiNeighborhood): Neighborhood {
  const icon =
    row.icon === "waves" ||
    row.icon === "tree" ||
    row.icon === "building" ||
    row.icon === "sun"
      ? row.icon
      : "building";

  return {
    id: row.id,
    name: row.name,
    zone: row.zone || "Lisbon Area",
    description: row.description || "No description available.",
    tags: row.tags || [],
    highlights: row.highlights || [],
    avgPrice: Number(row.avgPrice || 0),
    pricePerSqm: Number(row.pricePerSqm || 0),
    rentYield: Number(row.rentYield || 0),
    growth: Number(row.growthPercent || 0),
    latitude: Number(row.latitude || 38.7223),
    longitude: Number(row.longitude || -9.1393),
    scores: {
      schools: normalizeScore(Number(row.schoolsScore || 0)),
      transport: normalizeScore(Number(row.transportScore || 0)),
      amenities: normalizeScore(Number(row.amenitiesScore || 0)),
      safety: normalizeScore(Number(row.safetyScore || 0)),
    },
    icon,
    sourceNotes: row.sourceNotes || "",
    aiScore: normalizeAIScore(row.aiScore),
    aiSummary: row.aiSummary || null,
  };
}

function getMarketAverage(items: Neighborhood[]) {
  if (items.length === 0) return 0;
  return items.reduce((sum, item) => sum + item.pricePerSqm, 0) / items.length;
}

function computeAIScore(
  item: Neighborhood,
  profile: ProfileType,
  goal: GoalType,
  marketAvg: number
) {
  const { schools, transport, amenities, safety } = item.scores;

  const lifestyleScore =
    (schools * 0.2 + transport * 0.25 + amenities * 0.25 + safety * 0.3) * 20;

  const priceScore =
    marketAvg > 0 && item.pricePerSqm > 0
      ? clamp((marketAvg / item.pricePerSqm) * 70, 35, 90)
      : 60;

  const yieldScore = clamp(item.rentYield * 16, 35, 85);
  const growthScore = clamp(item.growth * 5, 35, 90);

  let finalScore =
    lifestyleScore * 0.45 +
    priceScore * 0.2 +
    yieldScore * 0.15 +
    growthScore * 0.2;

  if (profile === "family") {
    finalScore =
      lifestyleScore * 0.6 +
      priceScore * 0.15 +
      yieldScore * 0.05 +
      growthScore * 0.2;
  }

  if (profile === "investor") {
    finalScore =
      lifestyleScore * 0.25 +
      priceScore * 0.25 +
      yieldScore * 0.25 +
      growthScore * 0.25;
  }

  if (profile === "expat") {
    finalScore =
      lifestyleScore * 0.55 +
      priceScore * 0.15 +
      yieldScore * 0.1 +
      growthScore * 0.2;
  }

  if (goal === "invest") {
    finalScore += item.rentYield >= 4.5 ? 5 : -4;
    finalScore += item.growth >= 10 ? 5 : -2;
  }

  if (goal === "live") {
    finalScore += safety >= 4.6 ? 4 : -3;
    finalScore += amenities >= 4.5 ? 3 : -2;
  }

  if (goal === "retire") {
    finalScore += safety >= 4.6 ? 5 : -4;
    finalScore -= item.growth > 14 ? 4 : 0;
  }

  if (marketAvg > 0 && item.pricePerSqm > marketAvg * 1.25) {
    finalScore -= 6;
  }

  if (marketAvg > 0 && item.pricePerSqm < marketAvg * 0.85 && item.growth >= 8) {
    finalScore += 5;
  }

  return clamp(Math.round(finalScore), 45, 92);
}

function getDisplayScore(
  item: Neighborhood,
  profile: ProfileType,
  goal: GoalType,
  marketAvg: number
) {
  const localScore = computeAIScore(item, profile, goal, marketAvg);

  if (item.aiScore !== null && item.aiScore !== undefined) {
    return clamp(Math.round(item.aiScore * 0.25 + localScore * 0.75), 45, 92);
  }

  return localScore;
}

function getScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Good";
  return "Moderate";
}

function getSmartBadges(item: Neighborhood, marketAvg: number) {
  const badges: string[] = [];

  if (item.growth >= 10) badges.push("High growth");
  if (item.rentYield >= 4.5) badges.push("Good ROI");
  if (item.scores.schools >= 4.5 && item.scores.safety >= 4.7) {
    badges.push("Family friendly");
  }
  if (marketAvg > 0 && item.pricePerSqm < marketAvg && item.growth >= 8) {
    badges.push("Undervalued");
  }
  if (marketAvg > 0 && item.pricePerSqm > marketAvg * 1.15) {
    badges.push("Premium area");
  }
  if (item.scores.transport >= 4.7) badges.push("Strong access");

  return badges.slice(0, 4);
}

function getRecommendationReason(
  item: Neighborhood,
  profile: ProfileType,
  goal: GoalType,
  marketAvg: number
) {
  if (item.aiSummary) return item.aiSummary;

  const badges = getSmartBadges(item, marketAvg);

  if (profile === "family") {
    return `${item.name} is recommended because it performs well for families, especially on safety, schools, and daily amenities.`;
  }

  if (profile === "investor") {
    return `${item.name} is recommended for investors because it combines rental yield, growth potential, and market demand signals.`;
  }

  if (profile === "expat") {
    return `${item.name} is recommended for expats because it combines accessibility, safety, and lifestyle quality.`;
  }

  if (goal === "retire") {
    return `${item.name} is a strong option for retirement due to safety, lifestyle quality, and neighborhood stability.`;
  }

  if (badges.length > 0) {
    return `${item.name} is the strongest match based on your current filters. Key signals: ${badges.join(
      ", "
    )}.`;
  }

  return `${item.name} is the strongest all-around option based on your budget, profile, and weighted neighborhood score.`;
}

function ScoreItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-[10px] flex h-[48px] w-[48px] items-center justify-center rounded-[14px] bg-[#F7F3E8] text-[#C9A227]">
        {icon}
      </div>
      <p className="text-[15px] text-[#4B5563]">{label}</p>
      <div className="mt-[4px] flex items-center gap-1 text-[15px] font-semibold text-[#0F2340]">
        <Star size={14} fill="#C9A227" className="text-[#C9A227]" />
        {value.toFixed(1)}
      </div>
    </div>
  );
}

function NeighborhoodMap({ items }: { items: Neighborhood[] }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapContainerRef.current) return;

if (!token) {
  console.error("Missing NEXT_PUBLIC_MAPBOX_TOKEN");
  return;
}

    mapboxgl.accessToken = token;

    mapRef.current = new mapboxgl.Map({
  container: mapContainerRef.current,
  style: "mapbox://styles/mapbox/light-v11",
  center: [-9.1393, 38.7223],
  zoom: 9.4,
});

setTimeout(() => {
  mapRef.current?.resize();
}, 300);

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    items.forEach((item) => {
      if (!item.latitude || !item.longitude) return;

      const popupHtml = `
        <div style="font-family: Arial, sans-serif; min-width: 210px; padding: 4px;">
          <strong style="font-size: 15px; color: #0F2340;">${item.name}</strong>
          <p style="margin: 6px 0; color: #4B5563;">${item.zone}</p>
          <p style="margin: 0; color: #1B365D; font-weight: 700;">
            €${item.pricePerSqm.toLocaleString("fr-FR")}/m²
          </p>
          <p style="margin: 4px 0 0; color: #2E7D32; font-weight: 600;">
            +${item.growth}% / yr
          </p>
        </div>
      `;

      const marker = new mapboxgl.Marker({ color: "#1B365D" })
        .setLngLat([item.longitude, item.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML(popupHtml))
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
      bounds.extend([item.longitude, item.latitude]);
    });

    if (items.length > 0 && !bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, {
        padding: 70,
        maxZoom: 12,
        duration: 700,
      });
    }
  }, [items]);

  return (
    <div className="mb-[34px] overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white shadow-[0_10px_35px_rgba(8,26,51,0.08)]">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] px-[28px] py-[22px]">
        <div>
          <h2 className="text-[26px] font-bold tracking-[-0.02em] text-[#0F2340]">
            Lisbon Neighborhood Map
          </h2>
          <p className="mt-[5px] text-[15px] text-[#6B7280]">
            Interactive map with all filtered neighborhoods.
          </p>
        </div>

        <span className="rounded-full bg-[#F7F3E8] px-[14px] py-[7px] text-[13px] font-semibold text-[#8A6400]">
          {items.length} areas
        </span>
      </div>

      <div ref={mapContainerRef} className="h-[460px] w-full" />
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-[30px] flex flex-wrap items-center justify-center gap-3">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="inline-flex items-center gap-2 rounded-[14px] border border-[#D9E0E7] bg-white px-[18px] py-[11px] text-[14px] font-semibold text-[#1B365D] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      {Array.from({ length: totalPages }).map((_, index) => {
        const page = index + 1;

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`h-[44px] w-[44px] rounded-[14px] text-[14px] font-bold transition ${
              currentPage === page
                ? "bg-[#1B365D] text-white shadow-[0_8px_20px_rgba(27,54,93,0.25)]"
                : "border border-[#D9E0E7] bg-white text-[#1B365D] hover:bg-[#F8F9FA]"
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="inline-flex items-center gap-2 rounded-[14px] border border-[#D9E0E7] bg-white px-[18px] py-[11px] text-[14px] font-semibold text-[#1B365D] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function NeighborhoodCard({
  item,
  profile,
  goal,
  marketAvg,
  isBestMatch,
  savingName,
  onSave,
}: {
  item: Neighborhood;
  profile: ProfileType;
  goal: GoalType;
  marketAvg: number;
  isBestMatch: boolean;
  savingName: string | null;
  onSave: (item: Neighborhood) => Promise<void>;
}) {
  const score = getDisplayScore(item, profile, goal, marketAvg);
  const badges = getSmartBadges(item, marketAvg);
  const isSaving = savingName === item.name;

  return (
    <div className="rounded-[24px] border border-[#E5E7EB] bg-white px-[30px] py-[28px] shadow-[0_6px_26px_rgba(8,26,51,0.06)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_16px_45px_rgba(8,26,51,0.12)]">
      <div className="grid gap-[30px] lg:grid-cols-[1.35fr_0.55fr_0.55fr]">
        <div>
          <div className="mb-[8px] flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold uppercase tracking-widest text-[#C9A227]">
              {item.zone}
            </span>

            {isBestMatch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4CC] px-[10px] py-[4px] text-[12px] font-semibold text-[#A66B00]">
                <Sparkles size={13} />
                Recommended
              </span>
            )}
          </div>

          <h2 className="text-[30px] font-bold tracking-[-0.03em] text-[#0F2340]">
            {item.name}
          </h2>

          <p className="mt-[12px] max-w-[720px] text-[17px] leading-[1.6] text-[#4B5563]">
            {item.description}
          </p>

          <div className="mt-[18px] flex flex-wrap gap-[8px]">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-[#FFF8E1] px-[12px] py-[6px] text-[13px] font-semibold text-[#8A6400]"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="mt-[20px] grid gap-[10px] md:grid-cols-2">
            {item.highlights.slice(0, 4).map((highlight) => (
              <div
                key={highlight}
                className="flex items-start gap-2 rounded-[14px] bg-[#F8F9FA] px-[14px] py-[11px] text-[14px] text-[#374151]"
              >
                <ShieldCheck
                  size={16}
                  className="mt-[2px] flex-shrink-0 text-[#C9A227]"
                />
                {highlight}
              </div>
            ))}
          </div>

          <div className="mt-[22px] flex flex-wrap gap-[10px]">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#EEF1F4] px-[14px] py-[6px] text-[14px] font-medium text-[#1B365D]"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-[28px] grid grid-cols-2 gap-y-[24px] md:grid-cols-4">
            <ScoreItem icon={<School size={20} />} label="Schools" value={item.scores.schools} />
            <ScoreItem icon={<TramFront size={20} />} label="Transport" value={item.scores.transport} />
            <ScoreItem icon={<ShoppingCart size={20} />} label="Amenities" value={item.scores.amenities} />
            <ScoreItem icon={<Coffee size={20} />} label="Safety" value={item.scores.safety} />
          </div>
        </div>

        <div className="flex flex-col items-start lg:items-center">
          <p className="mb-[6px] text-[15px] text-[#4B5563]">Avg Price</p>

          <h3 className="text-[28px] font-bold tracking-[-0.03em] text-[#1B365D]">
            {formatEuro(item.avgPrice)}
          </h3>

          <p className="mt-[2px] text-[14px] text-[#6B7280]">
            €{formatNumber(item.pricePerSqm)}/m²
          </p>

          <div className="mt-[18px] flex items-center gap-1 text-[15px] font-semibold text-[#2E7D32]">
            <TrendingUp size={15} />+{item.growth}% / yr
          </div>

          <div className="mt-[12px]">
            <p className="text-[13px] text-[#6B7280]">Gross rental yield</p>
            <p className="text-[17px] font-semibold text-[#1B365D]">
              {item.rentYield.toFixed(1)}%
            </p>
          </div>

          <div className="mt-[18px] rounded-[18px] bg-[#F8F9FA] px-[22px] py-[16px] text-center">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6B7280]">
              AI Score
            </p>
            <p className="mt-[2px] text-[32px] font-bold text-[#0F2340]">
              {score}/100
            </p>
            <p className="text-[13px] font-semibold text-[#C9A227]">
              {getScoreLabel(score)}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-[14px]">
          <div className="rounded-[22px] border border-[#E5E7EB] bg-[#F8F9FA] p-[20px]">
            <div className="mb-[12px] flex h-[48px] w-[48px] items-center justify-center rounded-[16px] bg-white text-[#1B365D] shadow-sm">
              <Brain size={22} />
            </div>

            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
              Smart Insight
            </p>

            <p className="mt-[8px] text-[14px] leading-[1.55] text-[#4B5563]">
              {getRecommendationReason(item, profile, goal, marketAvg)}
            </p>
          </div>

          <Link
            href={`/tools/neighborhood-finder/${item.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#1B365D] px-[24px] py-[14px] text-[16px] font-semibold text-white transition hover:bg-[#10284d]"
          >
            <Eye size={16} />
            View Details
          </Link>

          <button
            onClick={() => onSave(item)}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[#D9E0E7] bg-white px-[24px] py-[14px] text-[16px] font-semibold text-[#1B365D] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save Result"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NeighborhoodFinderPage() {
  const toast = useToast();

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [profile, setProfile] = useState<ProfileType>("all");
  const [goal, setGoal] = useState<GoalType>("all");
  const [search, setSearch] = useState("");
  const [savingName, setSavingName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [budgetMin, budgetMax, profile, goal, search]);

  async function fetchNeighborhoods() {
    try {
      setLoading(true);
      setErrorMessage(null);

      const data = await getNeighborhoods();
      setNeighborhoods(data.map(mapApiNeighborhood));
    } catch (error) {
      console.error("DATA FETCH ERROR:", error);
      setNeighborhoods([]);
      setErrorMessage("Unable to load neighborhood data from API.");
      toast.error(
        "Unable to load neighborhoods",
        error instanceof Error ? error.message : "Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  const marketAvg = useMemo(
    () => getMarketAverage(neighborhoods),
    [neighborhoods]
  );

  const rankedNeighborhoods = useMemo(() => {
    let data = [...neighborhoods];

    const min = Number(budgetMin);
    const max = Number(budgetMax);

    if (budgetMin && !Number.isNaN(min)) {
      data = data.filter((item) => item.avgPrice >= min);
    }

    if (budgetMax && !Number.isNaN(max)) {
      data = data.filter((item) => item.avgPrice <= max);
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.zone.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return data.sort(
      (a, b) =>
        getDisplayScore(b, profile, goal, marketAvg) -
        getDisplayScore(a, profile, goal, marketAvg)
    );
  }, [neighborhoods, budgetMin, budgetMax, search, profile, goal, marketAvg]);

  const bestMatch = rankedNeighborhoods[0] || null;
  const topThree = rankedNeighborhoods.slice(0, 3);
  const totalPages = Math.ceil(rankedNeighborhoods.length / ITEMS_PER_PAGE);

  const paginatedNeighborhoods = rankedNeighborhoods.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  async function handleSaveNeighborhood(
  item: Neighborhood,
) {
  const token = getToken();
  const user =
    getStoredUser<AuthUser>();

  if (
    !token ||
    !user
  ) {
    toast.warning(
      "Login required",
      "Please sign in as a Buyer to create a neighborhood request.",
    );

    return;
  }

  if (
    user.role !==
    "BUYER"
  ) {
    toast.warning(
      "Buyer account required",
      "Only Buyer accounts can create property requests from this tool.",
    );

    return;
  }

  try {
    setSavingName(
      item.name,
    );

    const lead =
      await createLeadFromNeighborhoodFinder(
        token,
        {
          neighborhoodId:
            item.id,

          neighborhoodName:
            item.name,

          budgetMin,

          budgetMax,

          profile,

          goal,
        },
      );

    /*
     * ==========================================================
     * AUTOMATIC MATCH FOUND
     * ==========================================================
     */

    if (
      lead.status ===
        "MATCHED" ||
      lead.autoMatching
        ?.matched
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
       * Existing request that has just been
       * automatically reprocessed.
       */
      if (
        lead.alreadyExists
      ) {
        if (
          professionalName &&
          typeof score ===
            "number"
        ) {
          toast.success(
            "Smart match found",
            `${professionalName} is matched to your ${item.name} request with a ${score}% compatibility score.`,
          );
        } else {
          toast.success(
            "Neighborhood request matched",
            `Your existing ${item.name} request has been automatically matched with a compatible verified property professional.`,
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
          `${professionalName} has been automatically matched to your ${item.name} request with a ${score}% compatibility score.`,
        );
      } else {
        toast.success(
          "Professional matched",
          `A compatible verified professional has been automatically assigned to your ${item.name} request.`,
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
      lead.alreadyExists
    ) {
      toast.info(
        "Request already active",
        `Your ${item.name} request already exists. Smart Matching will continue looking automatically for a compatible verified professional.`,
      );

      return;
    }

    /*
     * ==========================================================
     * NEW REQUEST — NO PROFESSIONAL >= THRESHOLD YET
     * ==========================================================
     */

    toast.success(
      "Neighborhood request created",
      `Your ${item.name} request is now active. Smart Matching will automatically connect you with a compatible verified property professional when one meets the required score.`,
    );
  } catch (error) {
    toast.error(
      "Unable to create request",
      error instanceof Error
        ? error.message
        : "Something went wrong while creating your neighborhood request. Please try again.",
    );
  } finally {
    setSavingName(
      null,
    );
  }
}

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F8F9FA]">
        <section className="px-5 py-[44px] lg:px-[80px] xl:px-[140px]">
          <div className="mx-auto max-w-[1680px]">
            <div className="mb-[34px] flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-[14px]">
                <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[18px] bg-[#E5A623] text-white">
                  <MapPin size={25} strokeWidth={2.2} />
                </div>

                <div>
                  <h1 className="text-[44px] font-bold leading-[1.05] tracking-[-0.04em] text-[#0F2340]">
                    Neighborhood Finder
                  </h1>

                  <p className="mt-[7px] text-[17px] text-[#4B5563]">
                    AI-powered recommendations based on real OSM data, price,
                    lifestyle, yield, growth and location.
                  </p>
                </div>
              </div>

              {!loading && (
                <div className="rounded-[18px] border border-[#E5E7EB] bg-white px-[20px] py-[14px] shadow-sm">
                  <p className="text-[13px] text-[#6B7280]">
                    Showing{" "}
                    <strong className="text-[#0F2340]">
                      {paginatedNeighborhoods.length}
                    </strong>{" "}
                    of{" "}
                    <strong className="text-[#0F2340]">
                      {rankedNeighborhoods.length}
                    </strong>{" "}
                    neighborhoods
                  </p>
                </div>
              )}
            </div>

            <div className="sticky top-4 z-20 mb-[28px] rounded-[24px] border border-[#E5E7EB] bg-white/95 px-[24px] py-[22px] shadow-[0_12px_32px_rgba(15,35,64,0.08)] backdrop-blur">
              <div className="grid gap-[14px] xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr_0.9fr_auto]">
                <div className="relative">
                  <Search className="absolute left-[16px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    type="text"
                    placeholder="Search area, zone, tag..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-[16px] border border-[#D9E0E7] bg-[#FCFCFD] py-[14px] pl-[44px] pr-[16px] text-[15px] outline-none transition focus:border-[#1B365D] focus:bg-white"
                  />
                </div>

                <input
                  type="number"
                  placeholder="Min budget"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="w-full rounded-[16px] border border-[#D9E0E7] bg-[#FCFCFD] px-[16px] py-[14px] text-[15px] outline-none transition focus:border-[#1B365D] focus:bg-white"
                />

                <input
                  type="number"
                  placeholder="Max budget"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="w-full rounded-[16px] border border-[#D9E0E7] bg-[#FCFCFD] px-[16px] py-[14px] text-[15px] outline-none transition focus:border-[#1B365D] focus:bg-white"
                />

                <select
                  value={profile}
                  onChange={(e) => setProfile(e.target.value as ProfileType)}
                  className="w-full rounded-[16px] border border-[#D9E0E7] bg-[#FCFCFD] px-[16px] py-[14px] text-[15px] outline-none transition focus:border-[#1B365D] focus:bg-white"
                >
                  <option value="all">All profiles</option>
                  <option value="family">Family buyer</option>
                  <option value="investor">Investor</option>
                  <option value="expat">Expat buyer</option>
                </select>

                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as GoalType)}
                  className="w-full rounded-[16px] border border-[#D9E0E7] bg-[#FCFCFD] px-[16px] py-[14px] text-[15px] outline-none transition focus:border-[#1B365D] focus:bg-white"
                >
                  <option value="all">All goals</option>
                  <option value="live">Live</option>
                  <option value="invest">Invest</option>
                  <option value="retire">Retire</option>
                </select>

                <button
                  onClick={() => {
                    setBudgetMin("");
                    setBudgetMax("");
                    setProfile("all");
                    setGoal("all");
                    setSearch("");
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[#D9E0E7] bg-white px-[18px] py-[14px] text-[15px] font-semibold text-[#1B365D] transition hover:bg-[#F8F9FA]"
                >
                  <RefreshCcw size={16} />
                  Reset
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-[24px] flex items-center gap-3 rounded-[16px] border border-red-200 bg-red-50 px-[20px] py-[14px] text-[15px] text-red-600">
                <AlertCircle size={18} />
                {errorMessage}
              </div>
            )}

            {bestMatch && !loading && (
              <div className="mb-[30px] rounded-[24px] border border-[#F3D98B] bg-[#FFF8E1] px-[28px] py-[24px] shadow-[0_6px_24px_rgba(166,107,0,0.08)]">
                <div className="flex items-start gap-3">
                  <div className="mt-[2px] flex h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-[#C9A227] text-white">
                    <Sparkles size={20} />
                  </div>

                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#A66B00]">
                      Best Match
                    </p>

                    <h3 className="mt-[3px] text-[27px] font-bold tracking-[-0.03em] text-[#0F2340]">
                      {bestMatch.name}
                    </h3>

                    <p className="mt-[8px] max-w-[900px] text-[15px] leading-[1.6] text-[#4B5563]">
                      {getRecommendationReason(bestMatch, profile, goal, marketAvg)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!loading && rankedNeighborhoods.length > 0 && (
              <NeighborhoodMap items={rankedNeighborhoods} />
            )}

            {topThree.length > 0 && !loading && (
              <div className="mb-[30px] grid gap-[16px] lg:grid-cols-3">
                {topThree.map((item, index) => {
                  const score = getDisplayScore(item, profile, goal, marketAvg);

                  return (
                    <div
                      key={item.id}
                      className="rounded-[22px] border border-[#E5E7EB] bg-white p-[20px] shadow-[0_4px_20px_rgba(8,26,51,0.05)]"
                    >
                      <div className="mb-[10px] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#C9A227]">
                          <Trophy size={18} />
                          <span className="text-[13px] font-semibold uppercase">
                            Top {index + 1}
                          </span>
                        </div>

                        <span className="rounded-full bg-[#F7F3E8] px-[10px] py-[5px] text-[12px] font-bold text-[#8A6400]">
                          {score}/100
                        </span>
                      </div>

                      <h3 className="text-[20px] font-bold text-[#0F2340]">
                        {item.name}
                      </h3>

                      <p className="mt-[6px] flex items-center gap-1 text-[14px] text-[#4B5563]">
                        <BadgeEuro size={15} />
                        {formatEuro(item.avgPrice)} ·{" "}
                        {item.rentYield.toFixed(1)}% yield
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {loading ? (
              <div className="rounded-[24px] border border-[#E5E7EB] bg-white px-[30px] py-[55px] text-center text-[16px] text-[#4B5563]">
                Loading neighborhoods...
              </div>
            ) : rankedNeighborhoods.length === 0 ? (
              <div className="rounded-[24px] border border-[#E5E7EB] bg-white px-[30px] py-[55px] text-center text-[16px] text-[#4B5563]">
                No neighborhoods match your current filters.
              </div>
            ) : (
              <>
                <div className="space-y-[26px]">
                  {paginatedNeighborhoods.map((item) => (
                    <NeighborhoodCard
                      key={item.id}
                      item={item}
                      profile={profile}
                      goal={goal}
                      marketAvg={marketAvg}
                      isBestMatch={bestMatch?.id === item.id}
                      savingName={savingName}
                      onSave={handleSaveNeighborhood}
                    />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}