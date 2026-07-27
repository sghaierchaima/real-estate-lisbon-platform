"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import {
  Bath,
  BedDouble,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Maximize,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { getPublicProperties, Property } from "@/lib/properties-api";
import PropertyHero from "@/components/property/PropertyHero";
import PropertyGallery from "@/components/property/PropertyGallery";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getImageSrc(url?: string | null) {
  if (!url) return "/images/placeholder-property.png";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

function formatPrice(price: number) {
  if (price >= 1000000) return `€${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `€${Math.round(price / 1000)}K`;
  return `€${price}`;
}

export default function PublicPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [propertyType, setPropertyType] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getPublicProperties();
        setProperties(data);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  function toggleBedroom(bed: number) {
    setSelectedBedrooms((prev) =>
      prev.includes(bed) ? prev.filter((item) => item !== bed) : [...prev, bed]
    );
  }

  function clearFilters() {
    setSearch("");
    setPropertyType("all");
    setSelectedBedrooms([]);
    setSortBy("featured");
    setCurrentPage(1);
  }

  const filteredProperties = useMemo(() => {
    const q = search.toLowerCase().trim();

    const result = properties.filter((property) => {
      const matchesSearch =
        !q ||
        property.title.toLowerCase().includes(q) ||
        property.city?.toLowerCase().includes(q) ||
        property.region?.toLowerCase().includes(q) ||
        property.location?.toLowerCase().includes(q);

      const matchesType =
        propertyType === "all" || property.propertyType === propertyType;

      const matchesBedrooms =
        selectedBedrooms.length === 0 ||
        selectedBedrooms.some((bed) =>
          bed === 5 ? Number(property.bedrooms || 0) >= 5 : property.bedrooms === bed
        );

      return matchesSearch && matchesType && matchesBedrooms;
    });

    if (sortBy === "price-asc") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") result.sort((a, b) => b.price - a.price);
    if (sortBy === "featured") {
      result.sort(
        (a, b) =>
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [properties, search, propertyType, selectedBedrooms, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, propertyType, selectedBedrooms, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProperties.length / itemsPerPage)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProperties = filteredProperties.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <main className="min-h-screen bg-white text-[#0F2340]">
      <Navbar />

      <section className="relative bg-gradient-to-br from-[#1B365D] to-[#0F2340] py-16 text-white">
        <div className="absolute inset-0 opacity-40">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <div className="container-page relative">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold lg:text-5xl">
              Find Your Dream Property in Portugal
            </h1>

            <p className="mx-auto max-w-2xl text-xl text-gray-200">
              Browse published properties from verified property agents
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by location, city, region or property name..."
                  className="h-14 w-full rounded-lg border border-gray-300 bg-white pl-12 pr-4 text-base text-gray-900 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                />
              </div>

              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className={`flex h-14 items-center justify-center gap-2 rounded-lg border px-6 text-base font-medium transition ${
                  showFilters
                    ? "border-[#C9A227] bg-[#C9A227] text-white"
                    : "border-gray-300 bg-white text-[#1B365D] hover:bg-gray-50"
                }`}
              >
                <SlidersHorizontal className="h-5 w-5" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {showFilters && (
        <section className="border-b border-gray-200 bg-white">
          <div className="container-page py-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Property Type
                </label>

                <div className="relative">
                  <select
                    value={propertyType}
                    onChange={(event) => setPropertyType(event.target.value)}
                    className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                  >
                    <option value="all">All Types</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Villa">Villa</option>
                    <option value="Penthouse">Penthouse</option>
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Bedrooms
                </label>

                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((bed) => {
                    const active = selectedBedrooms.includes(bed);

                    return (
                      <button
                        key={bed}
                        onClick={() => toggleBedroom(bed)}
                        className={`h-9 rounded-lg border px-4 text-sm font-medium transition ${
                          active
                            ? "border-[#1B365D] bg-[#1B365D] text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {bed === 5 ? "5+" : bed}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-[#1B365D] transition hover:bg-[#1B365D]/5"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="container-page py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="mb-1 text-2xl font-bold text-gray-900">
              {loading ? "Loading..." : `${filteredProperties.length} Properties Found`}
            </h2>

            <p className="text-base text-gray-600">
              Showing published listings matching your criteria
            </p>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-10 w-48 appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-600">Loading properties...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-12 w-12 text-gray-400" />
            </div>

            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              No properties found
            </h3>

            <p className="mb-6 text-gray-600">
              Try adjusting your filters or search criteria
            </p>

            <button onClick={clearFilters} className="btn-navy">
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedProperties.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  style={{ animationDelay: `${index * 0.05}s` }}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-
                  {Math.min(startIndex + itemsPerPage, filteredProperties.length)} of{" "}
                  {filteredProperties.length} properties
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-[#1B365D] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
                          currentPage === page
                            ? "bg-[#1B365D] text-white"
                            : "border border-gray-300 bg-white text-[#1B365D] hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-[#1B365D] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}

function PropertyCard({
  property,
  style,
}: {
  property: Property;
  style?: React.CSSProperties;
}) {
  const [imgSrc, setImgSrc] = useState(
    getImageSrc(property.imageUrls?.[0] || null)
  );

  useEffect(() => {
    setImgSrc(getImageSrc(property.imageUrls?.[0] || null));
  }, [property.imageUrls]);

  const location =
    [property.city, property.region, property.location].filter(Boolean).join(", ") ||
    "Portugal";

  return (
    <div
      style={style}
      className="animate-[fadeInUp_.3s_ease-out] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-[2px] hover:shadow-xl"
    >
      <Link href={`/properties/${property.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imgSrc}
            alt={property.title}
            className="h-full w-full object-cover transition duration-500 hover:scale-110"
            onError={() => setImgSrc("/images/placeholder-property.png")}
          />

          <div className="absolute left-3 top-3 flex gap-2">
            {property.featured && (
              <span className="inline-flex rounded-md bg-[#C9A227] px-3 py-1 text-xs font-semibold text-white">
                Featured
              </span>
            )}

            <span className="inline-flex rounded-md bg-white/95 px-3 py-1 text-xs font-semibold text-[#1B365D]">
              Published
            </span>
          </div>

          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
            <TrendingUp className="h-3 w-3" />
            New
          </span>
        </div>
      </Link>

      <div className="p-5">
        <Link href={`/properties/${property.id}`}>
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900 transition hover:text-[#1B365D]">
            {property.title}
          </h3>
        </Link>

        <div className="mb-3 flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>

        <div className="mb-4 border-b border-gray-100 pb-4">
          <div className="flex gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <BedDouble className="h-4 w-4" />
              <span>{property.bedrooms ?? 0}</span>
            </div>

            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms ?? 0}</span>
            </div>

            <div className="flex items-center gap-1">
              <Maximize className="h-4 w-4" />
              <span>{property.area ?? 0}m²</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 text-4xl font-bold text-[#1B365D]">
              {formatPrice(property.price)}
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Eye className="h-3 w-3" />
              Public listing
            </div>
          </div>

          <Link
            href={`/properties/${property.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-[#1B365D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0F2340]"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}