"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  MapPin,
  DollarSign,
  Shield,
  TrendingUp,
  Users,
  CheckCircle,
  Star,
  BadgeCheck,
  Globe,
  Heart,
} from "lucide-react";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { getPublicProfessionals, Professional } from "@/lib/professionals-api";
import { getPublicProperties, Property } from "@/lib/properties-api";

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [propertiesData, professionalsData] = await Promise.all([
          getPublicProperties(),
          getPublicProfessionals(),
        ]);

        setProperties(propertiesData);
        setProfessionals(professionalsData);
      } catch {
        setProperties([]);
        setProfessionals([]);
      }
    }

    loadHomeData();
  }, []);

  const featuredProperty = properties[0];

  const featuredProfessionals = useMemo(() => {
    return professionals.slice(0, 4);
  }, [professionals]);

  const averageRating = useMemo(() => {
    if (professionals.length === 0) return "4.9";
    const total = professionals.reduce(
      (sum, item) => sum + Number(item.rating || 0),
      0
    );
    return (total / professionals.length).toFixed(1);
  }, [professionals]);

  return (
    <main className="bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-[#1B365D] text-white">
        <div className="absolute inset-0">
          <img
            src="/images/hero2.jpg"
            alt="Portugal cityscape"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B365D]/95 via-[#1B365D]/85 to-[#1B365D]/70" />
        </div>

        <div className="container-page relative z-10 py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.02em] lg:text-7xl">
              Buy Property in Portugal
              <span className="mt-2 block text-[#C9A227]">
                With Complete Confidence
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-gray-200">
              The trusted platform for foreign buyers. Get free tools, expert
              education, and matched with verified professionals to make your
              Portugal property journey safe and successful.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/tools" className="btn-primary">
                Explore Free Tools
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>

              <Link href="/register" className="btn-white">
                Create Free Account
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-10">
              <TrustStat
                number={`${properties.length}+`}
                label="Published Properties"
              />
              <TrustStat
                number={`${professionals.length}+`}
                label="Verified Professionals"
              />
              <TrustStat number={`${averageRating}/5`} label="User Rating" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-white">
        <div className="container-page py-8">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <TrustMetric
              icon={<Shield className="h-6 w-6" />}
              value="100%"
              label="Verified Professionals"
            />
            <TrustMetric
              icon={<Users className="h-6 w-6" />}
              value={`${professionals.length}+`}
              label="Active Experts"
            />
            <TrustMetric
              icon={<BadgeCheck className="h-6 w-6" />}
              value={`${properties.length}+`}
              label="Published Listings"
            />
            <TrustMetric
              icon={<Heart className="h-6 w-6" />}
              value={`${averageRating}/5`}
              label="Average Rating"
            />
          </div>
        </div>
      </section>

      <section className="section-space bg-gradient-to-b from-white to-gray-50">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-2 text-4xl font-semibold text-[#0F2340]">
              Featured Properties
            </h2>
            <p className="mb-8 text-lg text-gray-600">
              Browse our curated selection of premium listings
            </p>

            <div className="card overflow-hidden rounded-3xl">
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={featuredProperty?.imageUrls?.[0] || "/images/home.jpg"}
                  alt={featuredProperty?.title || "Featured property"}
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                />
              </div>

              <div className="p-6">
                <span className="badge-gold">
                  {featuredProperty?.propertyType || "Featured"}
                </span>

                <h3 className="mt-4 text-2xl font-semibold text-[#0F2340]">
                  {featuredProperty?.title || "Luxury Apartment in Príncipe Real"}
                </h3>

                <div className="mt-2 flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    {featuredProperty
                      ? [
                          featuredProperty.city,
                          featuredProperty.region,
                          featuredProperty.location,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Portugal"
                      : "Lisbon, Portugal"}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="text-3xl font-bold text-[#1B365D]">
                    €{Number(featuredProperty?.price || 850000).toLocaleString()}
                  </div>
                  <Link href="/properties" className="btn-navy h-12 px-5 text-base">
                    View All Properties
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-4xl font-semibold text-[#0F2340]">
              Market Insights
            </h2>
            <p className="mb-8 text-lg text-gray-600">Real-time platform data</p>

            <div className="card rounded-3xl p-6">
              <div className="rounded-2xl bg-gradient-to-br from-[#1B365D]/5 to-[#C9A227]/5 p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Published listings</span>
                  <div className="flex items-center gap-1 text-[#2E7D32]">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-semibold">Live</span>
                  </div>
                </div>
                <div className="text-4xl font-bold text-[#0F2340]">
                  {properties.length}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <MetricRow
                  label="Verified Professionals"
                  value={`${professionals.length}`}
                />
                <MetricRow
                  label="Featured Properties"
                  value={`${properties.filter((item) => item.featured).length}`}
                />
                <MetricRow
                  label="Average Rating"
                  value={`${averageRating}/5`}
                />
              </div>

              <Link href="/properties" className="btn-navy mt-6 w-full">
                View Properties
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space bg-gradient-to-b from-white to-gray-50">
        <div className="container-page">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-semibold text-[#0F2340]">
              Your Three Critical Questions, Answered
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-xl text-gray-600">
              Every foreign buyer asks these. We provide the tools and expertise
              to answer them clearly.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <QuestionCard
              number="01"
              question="What can I afford?"
              answer="Use our mortgage and affordability calculators to understand your exact budget, including all costs and taxes."
              items={[
                "Mortgage Calculator",
                "Affordability Calculator",
                "True Cost Calculator",
              ]}
              href="/tools"
            />

            <QuestionCard
              number="02"
              question="Is it worth it?"
              answer="Analyze neighborhood data, price trends, and ROI potential to make data-driven investment decisions."
              items={[
                "Price Checker",
                "Neighborhood Finder",
                "Property Valuation",
              ]}
              href="/tools"
            />

            <QuestionCard
              number="03"
              question="How do I close safely?"
              answer="Get matched with verified English-speaking lawyers, brokers, and agents who specialize in foreign buyers."
              items={[
                "Professional Directory",
                "Verified Lawyers",
                "Expert Brokers",
              ]}
              href="/find-professionals"
            />
          </div>
        </div>
      </section>

      <section className="section-space bg-white">
        <div className="container-page">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#1B365D]/10 px-4 py-2 font-medium text-[#1B365D]">
              <Calculator className="h-4 w-4" />
              Free Tools - No Login Required
            </div>

            <h2 className="text-4xl font-semibold text-[#0F2340]">
              Professional-Grade Tools for Buyers
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-xl text-gray-600">
              Make informed decisions with our suite of financial calculators
              and market analysis tools.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ToolCard
              icon={<Calculator className="h-7 w-7" />}
              title="Mortgage Calculator"
              description="Calculate monthly payments, total interest, and amortization schedules."
              href="/tools"
              gradient="from-[#1B365D] to-[#0F2340]"
            />

            <ToolCard
              icon={<DollarSign className="h-7 w-7" />}
              title="Affordability Calculator"
              description="Understand your true buying power based on income and expenses."
              href="/tools"
              gradient="from-[#2E7D32] to-[#1B5E20]"
            />

            <ToolCard
              icon={<MapPin className="h-7 w-7" />}
              title="Neighborhood Finder"
              description="Explore neighborhoods with data on schools, transport, and amenities."
              href="/tools"
              gradient="from-[#C9A227] to-[#F9A825]"
            />

            <ToolCard
              icon={<TrendingUp className="h-7 w-7" />}
              title="Price Checker"
              description="Compare property prices and identify fair market values."
              href="/tools"
              gradient="from-[#1976D2] to-[#1565C0]"
            />

            <ToolCard
              icon={<Shield className="h-7 w-7" />}
              title="True Cost Calculator"
              description="Calculate all costs: taxes, fees, notary, and hidden expenses."
              href="/tools"
              gradient="from-[#D32F2F] to-[#C62828]"
            />

            <ToolCard
              icon={<CheckCircle className="h-7 w-7" />}
              title="Property Valuation"
              description="Get instant property valuations based on market data."
              href="/tools"
              gradient="from-[#7B1FA2] to-[#6A1B9A]"
            />
          </div>

          <div className="mt-12 text-center">
            <Link href="/tools" className="btn-navy">
              View All Tools
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50/30 py-24">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#C9A227]/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-[#1B365D]/5 blur-3xl" />

        <div className="container-page relative z-10 grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C9A227]/30 bg-gradient-to-r from-[#C9A227]/20 to-[#C9A227]/10 px-5 py-2.5 font-semibold text-[#C9A227]">
              <BadgeCheck className="h-5 w-5" />
              <span className="text-sm">100% Verified Professionals</span>
            </div>

            <h2 className="text-5xl font-semibold leading-tight text-[#0F2340]">
              Get Matched with <span className="text-[#C9A227]">Trusted</span>{" "}
              Professionals
            </h2>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              As you use our tools, your buyer profile builds automatically.
              Unlock personalized matches with English-speaking lawyers,
              brokers, and agents who specialize in helping foreign buyers.
            </p>

            <div className="mt-10 space-y-5">
              <FeatureBox
                icon={<BadgeCheck className="h-6 w-6 text-green-600" />}
                title="Verified & Background-Checked"
                text="Only admin-approved professionals appear publicly."
                bg="from-green-50 to-emerald-50"
              />

              <FeatureBox
                icon={<Globe className="h-6 w-6 text-blue-600" />}
                title="International Expertise"
                text="Professionals can support buyers in different languages."
                bg="from-blue-50 to-indigo-50"
              />

              <FeatureBox
                icon={<Star className="h-6 w-6 text-amber-500" />}
                title="Buyer Reviews"
                text="Ratings and reviews are stored in the platform."
                bg="from-amber-50 to-yellow-50"
              />

              <FeatureBox
                icon={<Shield className="h-6 w-6 text-purple-600" />}
                title="Fully Protected"
                text="Professional profiles are verified before visibility."
                bg="from-purple-50 to-violet-50"
              />
            </div>

            <Link href="/find-professionals" className="btn-navy mt-8">
              Browse Professionals
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {featuredProfessionals.length > 0 ? (
              featuredProfessionals.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  name={professional.user.fullName || "Verified Professional"}
                  role={professional.professionalType.replaceAll("_", " ")}
                  rating={String(professional.rating || 0)}
                  reviews={String(professional.reviewsCount || 0)}
                  languages={
                    professional.languages?.length
                      ? professional.languages
                      : ["EN"]
                  }
                  image={professional.user.avatarUrl || "/images/hero2.jpg"}
                  topColor="from-[#C9A227] to-amber-400"
                />
              ))
            ) : (
              <>
                <ProfessionalCard
                  name="Verified Professional"
                  role="PROPERTY AGENT"
                  rating="0"
                  reviews="0"
                  languages={["EN"]}
                  image="/images/hero2.jpg"
                  topColor="from-[#C9A227] to-amber-400"
                />
                <ProfessionalCard
                  name="Verified Professional"
                  role="MORTGAGE BROKER"
                  rating="0"
                  reviews="0"
                  languages={["EN"]}
                  image="/images/hero2.jpg"
                  topColor="from-blue-500 to-indigo-400"
                />
              </>
            )}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#1B365D] to-[#0F2340] py-24 text-white">
        <div className="container-page mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-semibold">
            Ready to Start Your Portugal Property Journey?
          </h2>
          <p className="mt-6 text-xl text-gray-200">
            Join international buyers who trust Real Estate Lisbon for their
            property purchase.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/register" className="btn-primary">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>

            <Link href="/tools" className="btn-white">
              Explore Tools First
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-300">
            No credit card required • Free forever • Start using tools
            immediately
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function TrustStat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-semibold text-[#C9A227]">{number}</div>
      <div className="text-sm text-gray-300">{label}</div>
    </div>
  );
}

function TrustMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B365D]/10 text-[#1B365D]">
        {icon}
      </div>
      <div className="text-2xl font-semibold text-[#0F2340]">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
      <span className="text-sm text-gray-700">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function QuestionCard({
  number,
  question,
  answer,
  items,
  href,
}: {
  number: string;
  question: string;
  answer: string;
  items: string[];
  href: string;
}) {
  return (
    <div className="question-card">
      <div className="mb-4 text-6xl font-bold text-[#C9A227]/20">{number}</div>

      <h3 className="text-2xl font-semibold text-[#0F2340]">{question}</h3>

      <p className="mt-4 text-gray-600">{answer}</p>

      <div className="mt-6 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle className="h-4 w-4 text-[#2E7D32]" />
            {item}
          </div>
        ))}
      </div>

      <Link href={href} className="btn-outline mt-6 w-full">
        Explore Tools
      </Link>
    </div>
  );
}

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
    <Link href={href}>
      <div className="tool-card group cursor-pointer">
        <div
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white transition group-hover:scale-110`}
        >
          {icon}
        </div>

        <h3 className="text-xl font-semibold text-[#0F2340]">{title}</h3>

        <p className="mt-3 text-sm leading-7 text-gray-600">{description}</p>

        <div className="mt-4 inline-flex items-center text-sm font-medium text-[#1B365D]">
          Try it free
          <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

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
        <p className="mb-1 font-semibold text-[#0F2340]">{title}</p>
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    </div>
  );
}

function ProfessionalCard({
  name,
  role,
  rating,
  reviews,
  languages,
  image,
  topColor,
}: {
  name: string;
  role: string;
  rating: string;
  reviews: string;
  languages: string[];
  image: string;
  topColor: string;
}) {
  return (
    <div className="professional-card group">
      <div className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${topColor}`} />

      <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-4 ring-white shadow-lg">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-[#0F2340]">{name}</h3>
      <p className="mb-3 text-sm text-gray-600">{role}</p>

      <div className="mb-3 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold text-[#0F2340]">{rating}</span>
        </div>
        <span className="text-xs text-gray-500">({reviews})</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {languages.map((lang) => (
          <span key={lang} className="badge-language">
            {lang}
          </span>
        ))}
      </div>
    </div>
  );
}