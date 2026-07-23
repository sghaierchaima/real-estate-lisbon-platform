"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  CheckCircle,
  CircleAlert,
  DollarSign,
  Globe,
  Heart,
  Home,
  LoaderCircle,
  MapPin,
  Search,
  Shield,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";

import {
  getPublicProfessionals,
  type Professional,
} from "@/lib/professionals-api";

import {
  getPublicProperties,
  type Property,
} from "@/lib/properties-api";

import { getAssetUrl } from "@/lib/api";

/* ============================================================
   Main page
============================================================ */

export default function HomePage() {
  const [properties, setProperties] =
    useState<Property[]>([]);

  const [professionals, setProfessionals] =
    useState<Professional[]>([]);

  const [loadingProperties, setLoadingProperties] =
    useState(true);

  const [
    loadingProfessionals,
    setLoadingProfessionals,
  ] = useState(true);

  const [propertiesError, setPropertiesError] =
    useState("");

  const [
    professionalsError,
    setProfessionalsError,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProperties() {
      try {
        setLoadingProperties(true);
        setPropertiesError("");

        const data =
          await getPublicProperties();

        if (!active) {
          return;
        }

        setProperties(
          Array.isArray(data) ? data : [],
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setProperties([]);

        setPropertiesError(
          error instanceof Error
            ? error.message
            : "Unable to load properties.",
        );
      } finally {
        if (active) {
          setLoadingProperties(false);
        }
      }
    }

    async function loadProfessionals() {
      try {
        setLoadingProfessionals(true);
        setProfessionalsError("");

        const data =
          await getPublicProfessionals();

        if (!active) {
          return;
        }

        setProfessionals(
          Array.isArray(data) ? data : [],
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setProfessionals([]);

        setProfessionalsError(
          error instanceof Error
            ? error.message
            : "Unable to load professionals.",
        );
      } finally {
        if (active) {
          setLoadingProfessionals(false);
        }
      }
    }

    loadProperties();
    loadProfessionals();

    return () => {
      active = false;
    };
  }, []);

  const featuredProperty = useMemo(() => {
    return (
      properties.find(
        (property) => property.featured,
      ) ??
      properties[0] ??
      null
    );
  }, [properties]);

  const featuredPropertiesCount =
    useMemo(() => {
      return properties.filter(
        (property) => property.featured,
      ).length;
    }, [properties]);

  const featuredProfessionals =
    useMemo(() => {
      return professionals.slice(0, 4);
    }, [professionals]);

  const ratingStatistics = useMemo(() => {
    const ratedProfessionals =
      professionals.filter(
        (professional) => {
          const rating = Number(
            professional.rating || 0,
          );

          const reviewsCount = Number(
            professional.reviewsCount || 0,
          );

          return (
            rating > 0 &&
            reviewsCount > 0
          );
        },
      );

    if (
      ratedProfessionals.length === 0
    ) {
      return {
        average: null as number | null,
        reviewsCount: 0,
      };
    }

    const weightedTotal =
      ratedProfessionals.reduce(
        (total, professional) => {
          const rating = Number(
            professional.rating || 0,
          );

          const reviewsCount = Number(
            professional.reviewsCount || 0,
          );

          return (
            total +
            rating * reviewsCount
          );
        },
        0,
      );

    const reviewsCount =
      ratedProfessionals.reduce(
        (total, professional) =>
          total +
          Number(
            professional.reviewsCount || 0,
          ),
        0,
      );

    return {
      average:
        reviewsCount > 0
          ? weightedTotal / reviewsCount
          : null,
      reviewsCount,
    };
  }, [professionals]);

  const averageRatingLabel =
    ratingStatistics.average !== null
      ? `${ratingStatistics.average.toFixed(
          1,
        )}/5`
      : "No ratings yet";

  const isLoading =
    loadingProperties ||
    loadingProfessionals;

  return (
    <main className="bg-white">
      <Navbar />

      {/* ======================================================
          Hero
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#1B365D] text-white">
        <div className="absolute inset-0">
          <img
            src="/images/hero2.jpg"
            alt="Portuguese cityscape"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#1B365D]/95 via-[#1B365D]/85 to-[#1B365D]/70" />
        </div>

        <div className="container-page relative z-10 py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              <Shield className="h-4 w-4 text-[#E5C766]" />
              Independent tools and verified professionals
            </div>

            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.02em] lg:text-7xl">
              Buy Property in Portugal

              <span className="mt-2 block text-[#C9A227]">
                With Complete Confidence
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-gray-200">
              Explore verified listings, use free
              property tools and connect with
              admin-approved professionals who
              understand the needs of international
              buyers.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/tools"
                className="btn-primary"
              >
                Explore Free Tools

                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>

              <Link
                href="/register"
                className="btn-white"
              >
                Create Free Account
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-10">
              <TrustStat
                loading={loadingProperties}
                number={`${properties.length}`}
                label="Published Properties"
              />

              <TrustStat
                loading={
                  loadingProfessionals
                }
                number={`${professionals.length}`}
                label="Verified Professionals"
              />

              <TrustStat
                loading={
                  loadingProfessionals
                }
                number={
                  averageRatingLabel
                }
                label="Average Rating"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          Trust metrics
      ====================================================== */}

      <section className="border-b border-gray-100 bg-white">
        <div className="container-page py-8">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <TrustMetric
              icon={
                <Shield className="h-6 w-6" />
              }
              value="Admin-approved"
              label="Public professionals"
            />

            <TrustMetric
              icon={
                <Users className="h-6 w-6" />
              }
              loading={
                loadingProfessionals
              }
              value={`${professionals.length}`}
              label="Active experts"
            />

            <TrustMetric
              icon={
                <BadgeCheck className="h-6 w-6" />
              }
              loading={loadingProperties}
              value={`${properties.length}`}
              label="Published listings"
            />

            <TrustMetric
              icon={
                <Heart className="h-6 w-6" />
              }
              loading={
                loadingProfessionals
              }
              value={averageRatingLabel}
              label={
                ratingStatistics.reviewsCount >
                0
                  ? `${ratingStatistics.reviewsCount} reviews`
                  : "Buyer reviews"
              }
            />
          </div>
        </div>
      </section>

      {/* ======================================================
          Featured property and market data
      ====================================================== */}

      <section className="section-space bg-gradient-to-b from-white to-gray-50">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#C9A227]">
                Latest opportunity
              </p>

              <h2 className="mt-2 text-4xl font-semibold text-[#0F2340]">
                Featured Property
              </h2>

              <p className="mt-2 text-lg text-gray-600">
                Discover a recently published
                property available on the platform.
              </p>
            </div>

            {loadingProperties ? (
              <PropertySkeleton />
            ) : featuredProperty ? (
              <FeaturedPropertyCard
                property={
                  featuredProperty
                }
              />
            ) : (
              <EmptyState
                icon={
                  <Home className="h-7 w-7" />
                }
                title="No published property yet"
                description="There are currently no public properties available. New approved listings will appear here automatically."
                href="/properties"
                buttonLabel="Browse Properties"
              />
            )}

            {propertiesError && (
              <InlineNotice
                message={
                  propertiesError
                }
              />
            )}
          </div>

          <div>
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#1B365D]">
                Platform activity
              </p>

              <h2 className="mt-2 text-4xl font-semibold text-[#0F2340]">
                Market Insights
              </h2>

              <p className="mt-2 text-lg text-gray-600">
                Live information calculated from
                the platform’s public data.
              </p>
            </div>

            <div className="card rounded-3xl p-6">
              <div className="rounded-2xl bg-gradient-to-br from-[#1B365D]/5 to-[#C9A227]/5 p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Published listings
                  </span>

                  <div className="flex items-center gap-1 text-[#2E7D32]">
                    <TrendingUp className="h-4 w-4" />

                    <span className="text-sm font-semibold">
                      Live
                    </span>
                  </div>
                </div>

                <div className="text-4xl font-bold text-[#0F2340]">
                  {loadingProperties
                    ? "—"
                    : properties.length}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <MetricRow
                  label="Verified professionals"
                  value={
                    loadingProfessionals
                      ? "—"
                      : `${professionals.length}`
                  }
                />

                <MetricRow
                  label="Featured properties"
                  value={
                    loadingProperties
                      ? "—"
                      : `${featuredPropertiesCount}`
                  }
                />

                <MetricRow
                  label="Average rating"
                  value={
                    loadingProfessionals
                      ? "—"
                      : averageRatingLabel
                  }
                />

                <MetricRow
                  label="Published reviews"
                  value={
                    loadingProfessionals
                      ? "—"
                      : `${ratingStatistics.reviewsCount}`
                  }
                />
              </div>

              <Link
                href="/properties"
                className="btn-navy mt-6 w-full"
              >
                View Properties

                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          Three questions
      ====================================================== */}

      <section className="section-space bg-white">
        <div className="container-page">
          <div className="mb-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#C9A227]">
              A clearer buying journey
            </p>

            <h2 className="mt-3 text-4xl font-semibold text-[#0F2340]">
              Your Three Critical Questions,
              Answered
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-xl text-gray-600">
              Use independent tools, market data
              and verified professional support at
              every important stage.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <QuestionCard
              number="01"
              question="What can I afford?"
              answer="Estimate your budget, mortgage payments and full purchase costs before contacting a seller."
              items={[
                "Mortgage Calculator",
                "Affordability Calculator",
                "True Cost Calculator",
              ]}
              href="/tools/affordability-calculator"
              buttonLabel="Check Affordability"
            />

            <QuestionCard
              number="02"
              question="Is it worth it?"
              answer="Compare prices, explore neighborhoods and estimate the value of a property using market context."
              items={[
                "Price Checker",
                "Neighborhood Finder",
                "Property Valuation",
              ]}
              href="/tools/property-valuation"
              buttonLabel="Estimate Property Value"
            />

            <QuestionCard
              number="03"
              question="How do I close safely?"
              answer="Find approved brokers, agents and lawyers who have experience supporting international buyers."
              items={[
                "Professional Directory",
                "Verified Lawyers",
                "Mortgage Brokers",
              ]}
              href="/find-professionals"
              buttonLabel="Find Professionals"
            />
          </div>
        </div>
      </section>

      {/* ======================================================
          Tools
      ====================================================== */}

      <section className="section-space bg-gradient-to-b from-gray-50 to-white">
        <div className="container-page">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#1B365D]/10 px-4 py-2 font-medium text-[#1B365D]">
              <Calculator className="h-4 w-4" />
              Free tools — no login required
            </div>

            <h2 className="text-4xl font-semibold text-[#0F2340]">
              Property Tools for Buyers
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-xl text-gray-600">
              Make better decisions using
              calculators and property-analysis
              tools connected to your platform.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ToolCard
              icon={
                <Calculator className="h-7 w-7" />
              }
              title="Mortgage Calculator"
              description="Calculate monthly payments, total interest and the estimated total cost of your mortgage."
              href="/tools/mortgage-calculator"
              gradient="from-[#1B365D] to-[#0F2340]"
            />

            <ToolCard
              icon={
                <DollarSign className="h-7 w-7" />
              }
              title="Affordability Calculator"
              description="Estimate your buying power based on your income, expenses and financing conditions."
              href="/tools/affordability-calculator"
              gradient="from-[#2E7D32] to-[#1B5E20]"
            />

            <ToolCard
              icon={
                <MapPin className="h-7 w-7" />
              }
              title="Neighborhood Finder"
              description="Explore neighborhoods and compare the areas that best match your property project."
              href="/tools/neighborhood-finder"
              gradient="from-[#C9A227] to-[#F9A825]"
            />

            <ToolCard
              icon={
                <TrendingUp className="h-7 w-7" />
              }
              title="Price Checker"
              description="Compare a property’s asking price with an estimated market value."
              href="/tools/price-checker"
              gradient="from-[#1976D2] to-[#1565C0]"
            />

            <ToolCard
              icon={
                <Shield className="h-7 w-7" />
              }
              title="True Cost Calculator"
              description="Estimate taxes, notary fees and other costs related to a property purchase."
              href="/tools/true-cost-calculator"
              gradient="from-[#D32F2F] to-[#C62828]"
            />

            <ToolCard
              icon={
                <CheckCircle className="h-7 w-7" />
              }
              title="Property Valuation"
              description="Estimate a property value using its location, size, condition and characteristics."
              href="/tools/property-valuation"
              gradient="from-[#7B1FA2] to-[#6A1B9A]"
            />
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/tools"
              className="btn-navy"
            >
              View All Tools

              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================
          Professionals
      ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50/30 py-24">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#C9A227]/5 blur-3xl" />

        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-[#1B365D]/5 blur-3xl" />

        <div className="container-page relative z-10 grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C9A227]/30 bg-gradient-to-r from-[#C9A227]/20 to-[#C9A227]/10 px-5 py-2.5 font-semibold text-[#A78418]">
              <BadgeCheck className="h-5 w-5" />

              <span className="text-sm">
                Admin-approved professionals
              </span>
            </div>

            <h2 className="text-5xl font-semibold leading-tight text-[#0F2340]">
              Get Matched with{" "}

              <span className="text-[#C9A227]">
                Trusted
              </span>{" "}

              Professionals
            </h2>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              Connect with professionals whose
              profiles have been reviewed and
              approved before becoming visible on
              the platform.
            </p>

            <div className="mt-10 space-y-5">
              <FeatureBox
                icon={
                  <BadgeCheck className="h-6 w-6 text-green-600" />
                }
                title="Admin-approved profiles"
                text="Only approved and active professionals are displayed publicly."
                bg="from-green-50 to-emerald-50"
              />

              <FeatureBox
                icon={
                  <Globe className="h-6 w-6 text-blue-600" />
                }
                title="International expertise"
                text="Review languages and professional specializations before making contact."
                bg="from-blue-50 to-indigo-50"
              />

              <FeatureBox
                icon={
                  <Star className="h-6 w-6 text-amber-500" />
                }
                title="Buyer reviews"
                text="Ratings and reviews are calculated from data recorded on the platform."
                bg="from-amber-50 to-yellow-50"
              />

              <FeatureBox
                icon={
                  <Shield className="h-6 w-6 text-purple-600" />
                }
                title="Controlled visibility"
                text="Professional profiles remain private until approval and activation."
                bg="from-purple-50 to-violet-50"
              />
            </div>

            <Link
              href="/find-professionals"
              className="btn-navy mt-8"
            >
              Browse Professionals

              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <div>
            {loadingProfessionals ? (
              <ProfessionalGridSkeleton />
            ) : featuredProfessionals.length >
              0 ? (
              <div className="grid gap-8 md:grid-cols-2">
                {featuredProfessionals.map(
                  (professional) => (
                    <ProfessionalCard
                      key={professional.id}
                      id={professional.id}
                      name={
                        professional.user
                          ?.fullName ||
                        "Professional"
                      }
                      role={professional.professionalType.replaceAll(
                        "_",
                        " ",
                      )}
                      rating={Number(
                        professional.rating ||
                          0,
                      )}
                      reviews={Number(
                        professional.reviewsCount ||
                          0,
                      )}
                      languages={
                        professional.languages
                          ?.length
                          ? professional.languages
                          : []
                      }
                      image={getAssetUrl(
                        professional.user
                          ?.avatarUrl,
                        "/images/avatar-placeholder.png",
                      )}
                    />
                  ),
                )}
              </div>
            ) : (
              <EmptyState
                icon={
                  <Users className="h-7 w-7" />
                }
                title="No verified professionals yet"
                description="Approved professionals will appear here automatically once their profiles are active."
                href="/find-professionals"
                buttonLabel="Open Directory"
              />
            )}

            {professionalsError && (
              <InlineNotice
                message={
                  professionalsError
                }
              />
            )}
          </div>
        </div>
      </section>

      {/* ======================================================
          Final CTA
      ====================================================== */}

      <section className="bg-gradient-to-br from-[#1B365D] to-[#0F2340] py-24 text-white">
        <div className="container-page mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#E5C766]">
            Start your buyer journey
          </p>

          <h2 className="mt-4 text-4xl font-semibold">
            Ready to Start Your Portugal
            Property Journey?
          </h2>

          <p className="mt-6 text-xl text-gray-200">
            Create your buyer profile, save
            properties, submit requests and receive
            professional matches.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="btn-primary"
            >
              Create Free Account

              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>

            <Link
              href="/tools"
              className="btn-white"
            >
              Explore Tools First
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-300">
            No credit card required • Public tools
            available without login
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* ============================================================
   Featured property card
============================================================ */

function FeaturedPropertyCard({
  property,
}: {
  property: Property;
}) {
  const propertyImage =
    property.imageUrls?.[0];

  const location = [
    property.city,
    property.region,
    property.location,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="card overflow-hidden rounded-3xl">
      <Link
        href={`/properties/${property.id}`}
        className="group block"
      >
        <div className="aspect-[16/10] overflow-hidden bg-gray-100">
          <img
            src={getAssetUrl(
              propertyImage,
              "/images/property-placeholder.jpg",
            )}
            alt={property.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          {property.featured && (
            <span className="badge-gold">
              Featured
            </span>
          )}

          {property.propertyType && (
            <span className="rounded-full bg-[#1B365D]/10 px-3 py-1 text-xs font-semibold text-[#1B365D]">
              {property.propertyType.replaceAll(
                "_",
                " ",
              )}
            </span>
          )}
        </div>

        <h3 className="mt-4 text-2xl font-semibold text-[#0F2340]">
          {property.title}
        </h3>

        <div className="mt-3 flex items-start gap-2 text-gray-600">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />

          <span className="text-sm">
            {location || "Portugal"}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-3xl font-bold text-[#1B365D]">
            {formatEuro(
              Number(property.price || 0),
            )}
          </div>

          <Link
            href={`/properties/${property.id}`}
            className="btn-navy h-12 px-5 text-base"
          >
            View Property
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Statistics
============================================================ */

function TrustStat({
  number,
  label,
  loading = false,
}: {
  number: string;
  label: string;
  loading?: boolean;
}) {
  return (
    <div className="min-w-[130px]">
      <div className="text-3xl font-semibold text-[#C9A227]">
        {loading ? "—" : number}
      </div>

      <div className="mt-1 text-sm text-gray-300">
        {label}
      </div>
    </div>
  );
}

function TrustMetric({
  icon,
  value,
  label,
  loading = false,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B365D]/10 text-[#1B365D]">
        {icon}
      </div>

      <div className="text-2xl font-semibold text-[#0F2340]">
        {loading ? "—" : value}
      </div>

      <div className="text-sm text-gray-600">
        {label}
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-3">
      <span className="text-sm text-gray-700">
        {label}
      </span>

      <span className="text-right font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   Question card
============================================================ */

function QuestionCard({
  number,
  question,
  answer,
  items,
  href,
  buttonLabel,
}: {
  number: string;
  question: string;
  answer: string;
  items: string[];
  href: string;
  buttonLabel: string;
}) {
  return (
    <div className="question-card flex h-full flex-col">
      <div className="mb-4 text-6xl font-bold text-[#C9A227]/20">
        {number}
      </div>

      <h3 className="text-2xl font-semibold text-[#0F2340]">
        {question}
      </h3>

      <p className="mt-4 leading-7 text-gray-600">
        {answer}
      </p>

      <div className="mt-6 space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#2E7D32]" />

            {item}
          </div>
        ))}
      </div>

      <Link
        href={href}
        className="btn-outline mt-auto pt-6"
      >
        {buttonLabel}
      </Link>
    </div>
  );
}

/* ============================================================
   Tool card
============================================================ */

function ToolCard({
  icon,
  title,
  description,
  href,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className="block h-full"
    >
      <div className="tool-card group flex h-full cursor-pointer flex-col">
        <div
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white transition group-hover:scale-110`}
        >
          {icon}
        </div>

        <h3 className="text-xl font-semibold text-[#0F2340]">
          {title}
        </h3>

        <p className="mt-3 flex-1 text-sm leading-7 text-gray-600">
          {description}
        </p>

        <div className="mt-4 inline-flex items-center text-sm font-medium text-[#1B365D]">
          Try it free

          <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
   Feature box
============================================================ */

function FeatureBox({
  icon,
  title,
  text,
  bg,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  bg: string;
}) {
  return (
    <div className="group flex items-start gap-4 rounded-xl border border-gray-100 bg-white/80 p-4 shadow-sm transition hover:border-[#C9A227]/30 hover:shadow-md">
      <div
        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${bg}`}
      >
        {icon}
      </div>

      <div>
        <p className="mb-1 font-semibold text-[#0F2340]">
          {title}
        </p>

        <p className="text-sm leading-6 text-gray-600">
          {text}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Professional card
============================================================ */

function ProfessionalCard({
  id,
  name,
  role,
  rating,
  reviews,
  languages,
  image,
}: {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviews: number;
  languages: string[];
  image: string;
}) {
  return (
    <Link
      href={`/find-professionals/${id}`}
      className="professional-card group block"
    >
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#C9A227] to-amber-400" />

      <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-4 ring-white shadow-lg">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-[#0F2340]">
        {name}
      </h3>

      <p className="mb-3 text-sm capitalize text-gray-600">
        {role.toLowerCase()}
      </p>

      <div className="mb-3 flex items-center gap-2">
        {reviews > 0 && rating > 0 ? (
          <>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />

              <span className="text-sm font-semibold text-[#0F2340]">
                {rating.toFixed(1)}
              </span>
            </div>

            <span className="text-xs text-gray-500">
              ({reviews})
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-500">
            No reviews yet
          </span>
        )}
      </div>

      {languages.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {languages.map((language) => (
            <span
              key={language}
              className="badge-language"
            >
              {language}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 inline-flex items-center text-sm font-semibold text-[#1B365D]">
        View profile

        <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

/* ============================================================
   Empty and error states
============================================================ */

function EmptyState({
  icon,
  title,
  description,
  href,
  buttonLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B365D]/10 text-[#1B365D]">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-semibold text-[#0F2340]">
        {title}
      </h3>

      <p className="mt-3 max-w-md leading-7 text-gray-600">
        {description}
      </p>

      <Link
        href={href}
        className="btn-outline mt-6"
      >
        {buttonLabel}
      </Link>
    </div>
  );
}

function InlineNotice({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <CircleAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />

      <p>
        Some live data could not be loaded:
        {" "}
        {message}
      </p>
    </div>
  );
}

/* ============================================================
   Loading states
============================================================ */

function PropertySkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden rounded-3xl">
      <div className="aspect-[16/10] bg-gray-200" />

      <div className="space-y-4 p-6">
        <div className="h-6 w-28 rounded-full bg-gray-200" />

        <div className="h-8 w-3/4 rounded bg-gray-200" />

        <div className="h-5 w-1/2 rounded bg-gray-200" />

        <div className="flex items-center justify-between pt-3">
          <div className="h-9 w-36 rounded bg-gray-200" />

          <div className="h-12 w-40 rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function ProfessionalGridSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="professional-card animate-pulse"
        >
          <LoaderCircle className="h-8 w-8 animate-spin text-[#1B365D]" />

          <div className="mt-5 h-5 w-32 rounded bg-gray-200" />

          <div className="mt-3 h-4 w-24 rounded bg-gray-200" />

          <div className="mt-5 h-4 w-20 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Utilities
============================================================ */

function formatEuro(value: number) {
  return new Intl.NumberFormat(
    "en-IE",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    },
  ).format(value || 0);
}