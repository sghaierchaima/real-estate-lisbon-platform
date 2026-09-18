"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import type { AuthUser } from "@/lib/auth-api";
import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import {
  getSavedPropertyStatus,
  toggleSavedProperty,
} from "@/lib/saved-properties-api";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Calculator,
  Calendar,
  CheckCircle,
  
  FileText,
  Home,
  MapPin,
  Maximize,
  
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";
import { getPublicProperties, getPublicProperty, Property } from "@/lib/properties-api";
import PropertyHero from "@/components/property/PropertyHero";
import PropertyGallery from "@/components/property/PropertyGallery";
import { useToast } from "@/components/ui/ToastProvider";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return API_URL.replace(/\/api\/?$/, "");
  }
})();

type PublicProperty = Property & {
  professionalProfile?: {
    id: string;
    companyName: string | null;
    professionalType: string;
    user: {
      id: string;
      fullName: string | null;
      email: string;
      phone?: string | null;
      avatarUrl?: string | null;
      city?: string | null;
      country?: string | null;
    };
  };
};

type TabType = "overview" | "features" | "location" | "financials";

function imageUrl(url?: string | null) {
  if (!url) return "/images/prop3.png";

  const value = url.trim();

  if (!value) return "/images/prop3.png";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("/images/") || value.startsWith("/assets/")) {
    return value;
  }

  return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
}

function normalizeLocationParts(
  ...values: Array<string | null | undefined>
) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!value) continue;

    for (const rawPart of value.split(",")) {
      const part = rawPart.trim();

      if (!part) continue;

      const key = part.toLocaleLowerCase();

      if (seen.has(key)) continue;

      seen.add(key);
      result.push(part);
    }
  }

  return result;
}

function formatPropertyLocation(property: {
  city?: string | null;
  region?: string | null;
  location?: string | null;
}) {
  const parts = normalizeLocationParts(
    property.city,
    property.region,
    property.location,
  );

  return parts.length
    ? parts.join(", ")
    : "Portugal";
}

function getSimilarityScore(
  base: Property,
  candidate: Property,
) {
  let score = 0;

  if (
    base.city &&
    candidate.city &&
    base.city.toLocaleLowerCase() ===
      candidate.city.toLocaleLowerCase()
  ) {
    score += 4;
  }

  if (
    base.region &&
    candidate.region &&
    base.region.toLocaleLowerCase() ===
      candidate.region.toLocaleLowerCase()
  ) {
    score += 3;
  }

  if (
    base.propertyType &&
    candidate.propertyType &&
    base.propertyType.toLocaleLowerCase() ===
      candidate.propertyType.toLocaleLowerCase()
  ) {
    score += 2;
  }

  if (
    base.bedrooms != null &&
    candidate.bedrooms != null
  ) {
    score += Math.max(
      0,
      2 -
        Math.abs(
          base.bedrooms -
            candidate.bedrooms,
        ),
    );
  }

  if (
    base.price > 0 &&
    candidate.price > 0
  ) {
    const ratio =
      Math.abs(
        base.price -
          candidate.price,
      ) / base.price;

    if (ratio <= 0.2) {
      score += 2;
    } else if (ratio <= 0.4) {
      score += 1;
    }
  }

  return score;
}

function formatPrice(price: number) {
  return `€${Number(price || 0).toLocaleString()}`;
}

function estimateTaxes(price: number) {
  return Math.round(price * 0.06);
}

function estimateFees(price: number) {
  return Math.round(price * 0.01);
}

function estimateMortgage(price: number) {
  return `€${Math.round((price * 0.8) / 360).toLocaleString()}/mo`;
}

export default function PropertyDetailsPage() {
  const user = getStoredUser<AuthUser>();
  const toast = useToast();

  const [isSaved, setIsSaved] =
   useState(false);

  const [savingFavorite, setSavingFavorite] =
   useState(false);
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [property, setProperty] = useState<PublicProperty | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  useEffect(() => {
  let cancelled = false;

  async function loadProperty() {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [propertyData, publicProperties] =
        await Promise.all([
          getPublicProperty(id),
          getPublicProperties(),
        ]);

      if (cancelled) {
        return;
      }

      setProperty(propertyData);
      setCurrentImage(0);

      setSimilar(
        publicProperties
          .filter((item) => item.id !== id)
          .map((item) => ({
            item,
            score: getSimilarityScore(
              propertyData,
              item,
            ),
          }))
          .sort(
            (a, b) =>
              b.score - a.score,
          )
          .slice(0, 3)
          .map(({ item }) => item),
      );
    } catch {
      if (!cancelled) {
        setProperty(null);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void loadProperty();

  return () => {
    cancelled = true;
  };
}, [id]);
  useEffect(() => {
  let cancelled = false;

  async function loadSavedStatus() {
    if (
      !property ||
      user?.role !== "BUYER"
    ) {
      if (!cancelled) {
        setIsSaved(false);
      }

      return;
    }

    const token = getToken();

    if (!token) {
      if (!cancelled) {
        setIsSaved(false);
      }

      return;
    }

    try {
      const result =
        await getSavedPropertyStatus(
          token,
          property.id,
        );

      if (!cancelled) {
        setIsSaved(result.isSaved);
      }
    } catch {
      if (!cancelled) {
        setIsSaved(false);
      }
    }
  }

  void loadSavedStatus();

  return () => {
    cancelled = true;
  };
}, [property?.id, user?.role]);

  const images = useMemo(() => {
    if (!property?.imageUrls?.length) return ["/images/prop3.png"];
    return property.imageUrls.map(imageUrl);
  }, [property]);

  const totalImages = Math.max(
  1,
  images.length,
);

  function prevImage() {
  setCurrentImage((previous) =>
    previous === 0
      ? totalImages - 1
      : previous - 1,
  );
}

function nextImage() {
  setCurrentImage((previous) =>
    previous === totalImages - 1
      ? 0
      : previous + 1,
  );
}
async function handleToggleSave() {
  if (!property || savingFavorite) {
    return;
  }

  if (!user) {
    window.location.href = `/login?redirect=${encodeURIComponent(
      window.location.pathname,
    )}`;

    return;
  }

  if (user.role !== "BUYER") {
    toast.warning(
      "Buyer account required",
      "Only buyers can save properties.",
    );

    return;
  }

  const token = getToken();

  if (!token) {
    toast.warning(
      "Session required",
      "Please sign in again.",
    );

    window.location.href = `/login?redirect=${encodeURIComponent(
      window.location.pathname,
    )}`;

    return;
  }

  const previousValue = isSaved;

  setSavingFavorite(true);
  setIsSaved(!previousValue);

  try {
    const result = await toggleSavedProperty(
      token,
      property.id,
    );

    setIsSaved(result.isSaved);

    window.dispatchEvent(
      new Event("saved-properties-changed"),
    );

    if (result.isSaved) {
      toast.success(
        "Property saved",
        "The property was added to your saved properties.",
      );
    } else {
      toast.success(
        "Property removed",
        "The property was removed from your saved properties.",
      );
    }
  } catch (error) {
    setIsSaved(previousValue);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update saved property.";

    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes("401") ||
      normalizedMessage.includes("unauthorized")
    ) {
      toast.warning(
        "Session expired",
        "Please sign in again.",
      );

      window.location.href = `/login?redirect=${encodeURIComponent(
        window.location.pathname,
      )}`;

      return;
    }

    if (
      normalizedMessage.includes("403") ||
      normalizedMessage.includes("forbidden") ||
      normalizedMessage.includes("permission")
    ) {
      toast.error(
        "Access denied",
        "You do not have permission to perform this action.",
      );

      return;
    }

    toast.error(
      "Unable to update saved property",
      message,
    );
  } finally {
    setSavingFavorite(false);
  }
}
  
  async function handleShare() {
  if (!property) {
    return;
  }

  const shareData = {
    title: property.title,
    text:
      property.description ||
      "Discover this property in Portugal.",
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);

      toast.success(
        "Property shared",
        "The property was shared successfully.",
      );

      return;
    }

    await navigator.clipboard.writeText(
      window.location.href,
    );

    toast.success(
      "Link copied",
      "The property link was copied to your clipboard.",
    );
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      return;
    }

    toast.error(
      "Unable to share property",
      "The property link could not be shared or copied.",
    );
  }
}

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F9FA] text-[#0F2340]">
        <Navbar />
        <div className="container-page py-20 text-center text-gray-600">
          Loading property...
        </div>
        <Footer />
      </main>
    );
  }

  if (!property) {
    return (
      <main className="min-h-screen bg-[#F8F9FA] text-[#0F2340]">
        <Navbar />
        <div className="container-page py-20 text-center">
          <h2 className="mb-3 text-2xl font-bold text-gray-900">
            Property not found
          </h2>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1B365D] px-5 py-3 font-medium text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Properties
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const location =
    formatPropertyLocation(property);

  const taxes = estimateTaxes(property.price);
  const fees = estimateFees(property.price);
  const totalCost = property.price + taxes + fees;

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-[#0F2340]">
      <Navbar />

      <PropertyHero
  title={property.title}
  location={location}
  price={formatPrice(property.price)}
  image={images[currentImage] || "/images/prop3.png"}
  currentImage={currentImage}
  totalImages={totalImages}
  featured={property.featured}
  savingFavorite={savingFavorite}
  isSaved={isSaved}
  onPrevious={prevImage}
  onNext={nextImage}
  onShare={handleShare}
  onToggleSave={handleToggleSave}
/>

<PropertyGallery
  images={images}
  currentImage={currentImage}
  title={property.title}
  onSelect={setCurrentImage}
/>

      <section className="container-page py-12">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[#1B365D] hover:bg-[#1B365D]/5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Properties
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold text-gray-900 lg:text-4xl">
                  {property.title}
                </h1>

                <div className="flex items-center gap-2 text-lg text-gray-600">
                  <MapPin className="h-5 w-5" />
                  <span>{location}</span>
                </div>
              </div>

              <div className="text-left lg:text-right">
                <div className="mb-1 text-4xl font-bold text-[#1B365D]">
                  {formatPrice(property.price)}
                </div>

                <div className="text-sm text-gray-500">
                  {property.area
                    ? `€${Math.round(property.price / property.area).toLocaleString()}/m²`
                    : "Price per m² unavailable"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 border-y border-gray-200 py-4">
              <QuickStat
                icon={
                  <BedDouble className="h-5 w-5 text-gray-400" />
                }
                text={
                  property.bedrooms != null
                    ? `${property.bedrooms} Bedrooms`
                    : "Bedrooms unavailable"
                }
              />
              <QuickStat
                icon={
                  <Bath className="h-5 w-5 text-gray-400" />
                }
                text={
                  property.bathrooms != null
                    ? `${property.bathrooms} Bathrooms`
                    : "Bathrooms unavailable"
                }
              />
              <QuickStat
                icon={
                  <Maximize className="h-5 w-5 text-gray-400" />
                }
                text={
                  property.area
                    ? `${property.area}m²`
                    : "Surface unavailable"
                }
              />
              <QuickStat icon={<Home className="h-5 w-5 text-gray-400" />} text={property.propertyType || "Property"} />
            </div>

            <div className="overflow-hidden rounded-xl bg-white">
              <div className="flex overflow-x-auto border-b border-gray-200">
                <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} label="Overview" />
                <TabButton active={activeTab === "features"} onClick={() => setActiveTab("features")} label="Features" />
                <TabButton active={activeTab === "location"} onClick={() => setActiveTab("location")} label="Location" />
                <TabButton active={activeTab === "financials"} onClick={() => setActiveTab("financials")} label="Financials" />
              </div>

              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-xl font-semibold text-gray-900">
                        Description
                      </h3>
                      <p className="leading-8 text-gray-700">
                        {property.description ||
                          "No description provided for this property."}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <InfoCard label="Property Type" value={property.propertyType || "Property"} />
                      <InfoCard label="Construction Year" value={property.constructionYear ? String(property.constructionYear) : "N/A"} />
                      <InfoCard label="City" value={property.city || "N/A"} />
                      <InfoCard label="Region" value={property.region || "N/A"} />
                    </div>
                  </div>
                )}

                {activeTab === "features" && (
                  <div>
                    <h3 className="mb-4 text-xl font-semibold text-gray-900">
                      Property Features
                    </h3>

                    {property.equipments?.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {property.equipments.map((feature) => (
                          <div key={feature} className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-[#2E7D32]" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No features listed.</p>
                    )}
                  </div>
                )}

                {activeTab === "location" && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Property Location
                    </h3>

                    <div className="flex h-96 items-center justify-center rounded-lg bg-gray-200 text-center">
                      <div>
                        <MapPin className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                        <p className="font-medium text-gray-700">{location}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "financials" && (
                  <div className="space-y-6">
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                      <h3 className="mb-4 text-xl font-semibold text-gray-900">
                        Cost Breakdown
                      </h3>

                      <div className="space-y-4">
                        <CostRow label="Property Price" value={formatPrice(property.price)} />
                        <CostRow label="Estimated Taxes" value={formatPrice(taxes)} />
                        <CostRow label="Legal & Notary Fees" value={formatPrice(fees)} />

                        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                          <span className="text-lg font-semibold text-gray-900">
                            Total Estimated Cost
                          </span>
                          <span className="text-2xl font-bold text-[#1B365D]">
                            {formatPrice(totalCost)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-gradient-to-br from-[#1B365D] to-[#0F2340] p-6 text-white">
                      <h3 className="mb-2 text-xl font-semibold">
                        Mortgage Estimate
                      </h3>

                      <div className="mb-2 text-5xl font-bold">
                        {estimateMortgage(property.price)}
                      </div>

                      <p className="mb-6 text-gray-300">
                        Estimated monthly payment based on 30-year mortgage and 20% deposit.
                      </p>

                      <Link
                        href={`/tools/mortgage-calculator?price=${property.price}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#C9A227] px-6 py-3 font-medium text-white hover:bg-[#F9A825]"
                      >
                        <Calculator className="h-5 w-5" />
                        Use Mortgage Calculator
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {similar.length > 0 && (
              <section className="mt-16">
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Similar Properties
                  </h2>

                  <Link
                    href="/properties"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 font-medium text-[#1B365D] hover:bg-gray-50"
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {similar.map((item) => (
                    <Link
                      key={item.id}
                      href={`/properties/${item.id}`}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-[2px] hover:shadow-lg"
                    >
                      <img
                        src={imageUrl(
                          item.imageUrls?.[0],
                        )}
                        alt={item.title}
                        className="aspect-[4/3] w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror =
                            null;
                          event.currentTarget.src =
                            "/images/prop3.png";
                        }}
                      />
                      <div className="p-4">
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        <div className="mb-3 flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {formatPropertyLocation(item)}
                        </div>
                        <div className="text-2xl font-bold text-[#1B365D]">
                          {formatPrice(item.price)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Interested in this property?
              </h3>

              <div className="mb-6 space-y-3">
                <Link
                  href="/register"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B365D] px-4 py-3 font-medium text-white hover:bg-[#0F2340]"
                >
                  <Calendar className="h-5 w-5" />
                  Start Buyer Journey
                </Link>

                <Link
                  href="/find-professionals"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 font-medium text-[#1B365D] hover:bg-gray-50"
                >
                  <Users className="h-5 w-5" />
                  Find Professionals
                </Link>

                <Link
                  href="/tools"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 font-medium text-[#1B365D] hover:bg-gray-50"
                >
                  <FileText className="h-5 w-5" />
                  Use Buyer Tools
                </Link>
              </div>

              {property.professionalProfile && (
                <div className="mb-6 rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Listed by</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {property.professionalProfile.user.fullName ||
                      property.professionalProfile.companyName ||
                      "Verified Property Agent"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {property.professionalProfile.professionalType.replaceAll("_", " ")}
                  </p>
                </div>
              )}

              <div className="space-y-4 border-t border-gray-200 pt-6">
                <SidebarToolLink
                  href={`/tools/mortgage-calculator?price=${property.price}`}
                  icon={<Calculator className="h-5 w-5 text-[#1B365D]" />}
                  label="Mortgage Calculator"
                />
                <SidebarToolLink
                  href={`/tools/price-checker?askingPrice=${property.price}&size=${property.area || ""}&location=${encodeURIComponent(location)}`}
                  icon={<TrendingUp className="h-5 w-5 text-[#1B365D]" />}
                  label="Price Checker"
                />
                <SidebarToolLink
                  href={`/tools/property-valuation?propertyId=${property.id}&askingPrice=${property.price}`}
                  icon={<BarChart3 className="h-5 w-5 text-[#1B365D]" />}
                  label="Property Valuation"
                />
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function QuickStat({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 font-medium text-gray-700">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 whitespace-nowrap px-6 py-4 text-sm font-medium transition ${
        active
          ? "border-b-2 border-[#1B365D] text-[#1B365D]"
          : "border-b-2 border-transparent text-gray-500 hover:bg-[#1B365D]/5 hover:text-[#1B365D]"
      }`}
    >
      {label}
    </button>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="mb-1 text-sm text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function SidebarToolLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition hover:bg-gray-100"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <ArrowRight className="h-5 w-5 text-gray-400" />
    </Link>
  );
}