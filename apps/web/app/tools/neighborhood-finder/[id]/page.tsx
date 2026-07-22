"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { getNeighborhood, type Neighborhood } from "@/lib/neighborhoods-api";
import {
  ArrowLeft,
  MapPin,
  School,
  TramFront,
  ShoppingCart,
  Coffee,
  Star,
  TrendingUp,
  BadgeEuro,
  ShieldCheck,
  Sparkles,
  Database,
} from "lucide-react";

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

function scoreLabel(value: number) {
  if (value >= 4.7) return "Excellent";
  if (value >= 4.2) return "Strong";
  if (value >= 3.7) return "Good";
  return "Moderate";
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-[24px] shadow-[0_2px_6px_rgba(8,26,51,0.04)]">
      <div className="mb-[14px] flex h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-[#F7F3E8] text-[#C9A227]">
        {icon}
      </div>
      <p className="text-[14px] text-[#6B7280]">{label}</p>
      <p className="mt-[4px] text-[24px] font-bold text-[#0F2340]">{value}</p>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-[22px]">
      <div className="mb-[12px] flex items-center justify-between">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[14px] bg-[#F7F3E8] text-[#C9A227]">
          {icon}
        </div>
        <div className="flex items-center gap-1 text-[15px] font-semibold text-[#0F2340]">
          <Star size={14} fill="#C9A227" className="text-[#C9A227]" />
          {value.toFixed(1)}
        </div>
      </div>
      <p className="text-[16px] font-semibold text-[#0F2340]">{label}</p>
      <p className="mt-[4px] text-[13px] text-[#6B7280]">{scoreLabel(value)}</p>
    </div>
  );
}

export default function NeighborhoodDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<Neighborhood | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchNeighborhood() {
      try {
        setLoading(true);
        const data = await getNeighborhood(id);
        setItem(data);
      } catch (error) {
        console.error("Neighborhood detail error:", error);
        setErrorMessage("Unable to load this neighborhood.");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchNeighborhood();
  }, [id]);

  const aiInsight = useMemo(() => {
    if (!item) return "";

    const name = item.name || "This neighborhood";
    const growth = Number(item.growthPercent || 0);
    const yieldValue = Number(item.rentYield || 0);
    const safety = Number(item.safetyScore || 0);
    const schools = Number(item.schoolsScore || 0);

    if (item.aiSummary) return item.aiSummary;

    if (growth >= 10 && yieldValue >= 4.2) {
      return `${name} is attractive for investors because it combines growth potential with a strong rental yield.`;
    }

    if (schools >= 4.5 && safety >= 4.7) {
      return `${name} is well suited for families thanks to strong safety and school indicators.`;
    }

    if (safety >= 4.7) {
      return `${name} is a strong lifestyle option for buyers prioritizing safety and stability.`;
    }

    return `${name} offers a balanced profile based on market price, accessibility, amenities, and lifestyle indicators.`;
  }, [item]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#F8F9FA] px-5 py-[80px] lg:px-[140px]">
          <div className="rounded-[22px] bg-white p-[40px] text-center text-[#4B5563]">
            Loading neighborhood details...
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (errorMessage || !item) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#F8F9FA] px-5 py-[80px] lg:px-[140px]">
          <div className="rounded-[22px] bg-white p-[40px] text-center text-red-600">
            {errorMessage || "Neighborhood not found."}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F8F9FA]">
        <section className="px-5 py-[56px] lg:px-[80px] xl:px-[140px]">
          <div className="mx-auto max-w-[1680px]">
            <Link
              href="/tools/neighborhood-finder"
              className="mb-[28px] inline-flex items-center gap-2 text-[15px] font-semibold text-[#1B365D]"
            >
              <ArrowLeft size={18} />
              Back to Neighborhood Finder
            </Link>

            <div className="mb-[34px] flex items-center gap-[14px]">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px] bg-[#E5A623] text-white">
                <MapPin size={24} strokeWidth={2.2} />
              </div>

              <div>
                <p className="text-[13px] font-semibold uppercase tracking-widest text-[#C9A227]">
                  {item.zone || "Lisbon Area"}
                </p>
                <h1 className="text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F2340]">
                  {item.name}
                </h1>
                <p className="mt-[6px] max-w-[900px] text-[18px] text-[#4B5563]">
                  {item.description || "No description available."}
                </p>
              </div>
            </div>

            <div className="mb-[30px] grid gap-[20px] md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Average Price"
                value={formatEuro(Number(item.avgPrice || 0))}
                icon={<BadgeEuro size={20} />}
              />
              <StatCard
                label="Price per m²"
                value={`€${formatNumber(Number(item.pricePerSqm || 0))}/m²`}
                icon={<MapPin size={20} />}
              />
              <StatCard
                label="Growth"
                value={`+${Number(item.growthPercent || 0).toFixed(1)}%`}
                icon={<TrendingUp size={20} />}
              />
              <StatCard
                label="Rental Yield"
                value={`${Number(item.rentYield || 0).toFixed(1)}%`}
                icon={<ShieldCheck size={20} />}
              />
            </div>

            <div className="mb-[30px] rounded-[22px] border border-[#F3D98B] bg-[#FFF8E1] px-[28px] py-[24px]">
              <div className="flex items-start gap-3">
                <div className="mt-[2px] flex h-[42px] w-[42px] items-center justify-center rounded-[12px] bg-[#C9A227] text-white">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#A66B00]">
                    AI Insight
                  </p>
                  <p className="mt-[6px] text-[16px] leading-[1.7] text-[#4B5563]">
                    {aiInsight}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-[30px] lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded-[22px] border border-[#E5E7EB] bg-white p-[30px]">
                <h2 className="mb-[22px] text-[28px] font-bold text-[#0F2340]">
                  Neighborhood Scores
                </h2>

                <div className="grid gap-[18px] md:grid-cols-2">
                  <ScoreCard
                    label="Schools"
                    value={Number(item.schoolsScore || 0)}
                    icon={<School size={20} />}
                  />
                  <ScoreCard
                    label="Transport"
                    value={Number(item.transportScore || 0)}
                    icon={<TramFront size={20} />}
                  />
                  <ScoreCard
                    label="Amenities"
                    value={Number(item.amenitiesScore || 0)}
                    icon={<ShoppingCart size={20} />}
                  />
                  <ScoreCard
                    label="Safety"
                    value={Number(item.safetyScore || 0)}
                    icon={<Coffee size={20} />}
                  />
                </div>
              </div>

              <div className="space-y-[20px]">
                <div className="rounded-[22px] border border-[#E5E7EB] bg-white p-[30px]">
                  <h2 className="mb-[18px] text-[24px] font-bold text-[#0F2340]">
                    Highlights
                  </h2>

                  <ul className="space-y-[10px]">
                    {(item.highlights || []).map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-2 text-[15px] text-[#374151]"
                      >
                        <span className="mt-[3px] text-[#C9A227]">✦</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[22px] border border-[#E5E7EB] bg-white p-[30px]">
                  <h2 className="mb-[18px] text-[24px] font-bold text-[#0F2340]">
                    Tags
                  </h2>

                  <div className="flex flex-wrap gap-[10px]">
                    {(item.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#EEF1F4] px-[14px] py-[6px] text-[14px] font-medium text-[#1B365D]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#E5E7EB] bg-white p-[30px]">
                  <div className="mb-[12px] flex items-center gap-2 text-[#1B365D]">
                    <Database size={18} />
                    <h2 className="text-[22px] font-bold">Data Sources</h2>
                  </div>

                  <p className="text-[14px] leading-[1.7] text-[#4B5563]">
                    {item.sourceNotes ||
                      "OpenStreetMap Overpass API + market data pipeline."}
                  </p>

                  <div className="mt-[16px] grid gap-[10px] text-[14px] text-[#4B5563]">
                    <p>OSM schools: {item.schoolsCount}</p>
                    <p>OSM transport: {item.transportCount}</p>
                    <p>OSM amenities: {item.amenitiesCount}</p>
                    <p>AI score: {item.aiScore ?? "—"}/100</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-[30px] rounded-[28px] bg-[#1B365D] p-[32px] text-white">
              <h2 className="text-[28px] font-bold">Next step</h2>
              <p className="mt-[8px] max-w-[780px] text-white/80">
                Explore properties in this area or compare this neighborhood
                with other Lisbon zones before making a buying decision.
              </p>

              <div className="mt-[22px] flex flex-wrap gap-[14px]">
                <Link
                  href={`/properties?location=${encodeURIComponent(item.name || "")}`}
                  className="rounded-[16px] bg-[#C9A227] px-[22px] py-[12px] text-[15px] font-semibold text-white"
                >
                  View Properties
                </Link>

                <Link
                  href="/tools/neighborhood-finder"
                  className="rounded-[16px] bg-white px-[22px] py-[12px] text-[15px] font-semibold text-[#1B365D]"
                >
                  Compare Neighborhoods
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