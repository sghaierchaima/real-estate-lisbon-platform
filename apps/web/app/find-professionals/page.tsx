"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import Link from "next/link";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Users,
  Scale,
  Star,
  ArrowRight,
  Globe,
  Calculator,
  SearchCheck,
  ShieldCheck,
  ReceiptText,
} from "lucide-react";
import { getPublicProfessionals, Professional } from "@/lib/professionals-api";

type ProfessionalCardProps = {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  count: number;
  rating: number;
  buttonLabel: string;
  href: string;
};

function averageRating(
  items: Professional[],
) {
  const totalReviews = items.reduce(
    (sum, item) =>
      sum +
      Number(item.reviewsCount || 0),
    0,
  );

  if (totalReviews === 0) {
    return 0;
  }

  const weightedRatingTotal =
    items.reduce(
      (sum, item) =>
        sum +
        Number(item.rating || 0) *
        Number(
          item.reviewsCount || 0,
        ),
      0,
    );

  return Number(
    (
      weightedRatingTotal /
      totalReviews
    ).toFixed(1),
  );
}

function ProfessionalCard({
  icon,
  iconBg,
  title,
  description,
  count,
  rating,
  buttonLabel,
  href,
}: ProfessionalCardProps) {
  return (
    <div className="rounded-[22px] border border-[#E5E7EB] bg-white px-[38px] py-[38px] shadow-[0_2px_8px_rgba(8,26,51,0.03)] transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_18px_40px_rgba(8,26,51,0.10)]">
      <div
        className="mb-[34px] flex h-[56px] w-[56px] items-center justify-center rounded-[18px] text-white"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>

      <h2 className="mb-[22px] text-[22px] font-bold tracking-[-0.02em] text-[#0F2340]">
        {title}
      </h2>

      <p className="mb-[48px] text-[17px] leading-[1.55] text-[#4B5563]">
        {description}
      </p>

      <div className="mb-[30px] grid grid-cols-2 gap-[20px]">
        <div>
          <div className="text-[22px] font-bold text-[#0F2340]">{count}</div>
          <div className="text-[15px] text-[#4B5563]">
            Verified Professionals
          </div>
        </div>

        <div>
          {rating > 0 ? (
            <>
              <div className="flex items-center gap-2 text-[22px] font-bold text-[#C9A227]">
                <Star
                  size={16}
                  fill="#C9A227"
                />

                {rating.toFixed(1)}
              </div>

              <div className="text-[15px] text-[#4B5563]">
                Avg Rating
              </div>
            </>
          ) : (
            <>
              <div className="text-[17px] font-semibold text-[#667085]">
                No reviews yet
              </div>

              <div className="text-[15px] text-[#4B5563]">
                Avg Rating
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-[26px] h-px bg-[#E5E7EB]" />

      <Link
        href={href}
        className="inline-flex w-full items-center justify-center gap-3 rounded-[16px] bg-[#1B365D] px-[24px] py-[14px] text-[16px] font-semibold text-white !text-white no-underline transition hover:bg-[#10284d] hover:!text-white"
      >
        {buttonLabel}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function WhyItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-[20px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white/10 text-white">
        {icon}
      </div>

      <h3 className="mb-[10px] text-[18px] font-bold text-white">{title}</h3>

      <p className="mx-auto max-w-[260px] text-[15px] text-white/90">
        {text}
      </p>
    </div>
  );
}

export default function FindProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfessionals() {
      try {
        const data = await getPublicProfessionals();
        setProfessionals(data);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Failed to load professionals"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfessionals();
  }, []);

  const stats = useMemo(() => {
    const brokers = professionals.filter(
      (item) =>
        item.professionalType ===
        "MORTGAGE_BROKER"
    );

    const agents = professionals.filter(
      (item) =>
        item.professionalType ===
        "PROPERTY_AGENT"
    );

    const lawyers = professionals.filter(
      (item) =>
        item.professionalType ===
        "PROPERTY_LAWYER"
    );

    const taxAdvisors = professionals.filter(
      (item) =>
        item.professionalType ===
        "TAX_ADVISOR"
    );

    const homeInspectors = professionals.filter(
      (item) =>
        item.professionalType ===
        "HOME_INSPECTOR"
    );

    const propertyValuers = professionals.filter(
      (item) =>
        item.professionalType ===
        "PROPERTY_VALUER"
    );

    const insuranceBrokers = professionals.filter(
      (item) =>
        item.professionalType ===
        "INSURANCE_BROKER"
    );

    return {
      brokers,
      agents,
      lawyers,
      taxAdvisors,
      homeInspectors,
      propertyValuers,
      insuranceBrokers,
      total: professionals.length,
    };
  }, [professionals]);

  return (
    <>
      <Navbar />

      <main className="bg-[#F8F9FA]">
        <section className="px-6 pb-[70px] pt-[56px] lg:px-[140px]">
          <div className="mx-auto max-w-[1680px]">
            <div className="mb-[52px] text-center">
              <div className="mb-[26px] inline-flex items-center gap-2 rounded-full bg-[#E7F2E9] px-[20px] py-[10px] text-[15px] font-medium text-[#2E7D32]">
                <BadgeCheck size={14} />
                {loading
                  ? "Loading verified professionals..."
                  : `${stats.total} Verified Professionals`}
              </div>

              <h1 className="mx-auto mb-[22px] max-w-[1100px] text-[50px] font-bold leading-[1.05] tracking-[-0.04em] text-[#0F2340]">
                Find the Right Professional for Your Property Journey
              </h1>

              <p className="mx-auto max-w-[780px] text-[20px] leading-[1.6] text-[#4B5563]">
                Connect with verified professionals across financing,
                property search, legal support, valuation, inspection,
                taxation, and insurance — all in one place.
              </p>
            </div>

            <div className="grid gap-[36px] md:grid-cols-2 xl:grid-cols-3">

              {/* MORTGAGE BROKERS */}

              <ProfessionalCard
                icon={<BriefcaseBusiness size={24} />}
                iconBg="#1B365D"
                title="Mortgage Brokers"
                description="Get pre-approved and explore mortgage options with verified brokers who understand property financing in Portugal."
                count={stats.brokers.length}
                rating={averageRating(stats.brokers)}
                buttonLabel="Browse Mortgage Brokers"
                href="/find-professionals/mortgage-brokers"
              />

              {/* REAL ESTATE AGENTS */}

              <ProfessionalCard
                icon={<Users size={24} />}
                iconBg="#2E7D32"
                title="Real Estate Agents"
                description="Work with verified agents who understand foreign buyers and can guide you through the Portuguese property market."
                count={stats.agents.length}
                rating={averageRating(stats.agents)}
                buttonLabel="Browse Real Estate Agents"
                href="/find-professionals/real-estate-agents"
              />

              {/* PROPERTY LAWYERS */}

              <ProfessionalCard
                icon={<Scale size={24} />}
                iconBg="#E5A623"
                title="Property Lawyers"
                description="Navigate contracts and property transactions with verified legal professionals experienced in Portuguese real estate."
                count={stats.lawyers.length}
                rating={averageRating(stats.lawyers)}
                buttonLabel="Browse Property Lawyers"
                href="/find-professionals/lawyers"
              />

              {/* PROPERTY VALUERS */}

              <ProfessionalCard
                icon={<Calculator size={24} />}
                iconBg="#7C3AED"
                title="Property Valuers"
                description="Connect with verified property valuation professionals who can help you understand the value of a property before making a decision."
                count={stats.propertyValuers.length}
                rating={averageRating(
                  stats.propertyValuers
                )}
                buttonLabel="Browse Property Valuers"
                href="/find-professionals/property-valuers"
              />

              {/* HOME INSPECTORS */}

              <ProfessionalCard
                icon={<SearchCheck size={24} />}
                iconBg="#0F766E"
                title="Home Inspectors"
                description="Connect with verified inspectors who can help assess a property's condition and identify potential issues before purchase."
                count={stats.homeInspectors.length}
                rating={averageRating(
                  stats.homeInspectors
                )}
                buttonLabel="Browse Home Inspectors"
                href="/find-professionals/home-inspectors"
              />

              {/* TAX ADVISORS */}

              <ProfessionalCard
                icon={<ReceiptText size={24} />}
                iconBg="#B45309"
                title="Tax Advisors"
                description="Understand property-related tax considerations with verified professionals who support buyers, owners, and investors in Portugal."
                count={stats.taxAdvisors.length}
                rating={averageRating(
                  stats.taxAdvisors
                )}
                buttonLabel="Browse Tax Advisors"
                href="/find-professionals/tax-advisors"
              />

              {/* INSURANCE BROKERS */}

              <ProfessionalCard
                icon={<ShieldCheck size={24} />}
                iconBg="#2563EB"
                title="Insurance Brokers"
                description="Explore property insurance options with verified brokers who can help you understand suitable protection for homes and investments."
                count={stats.insuranceBrokers.length}
                rating={averageRating(
                  stats.insuranceBrokers
                )}
                buttonLabel="Browse Insurance Brokers"
                href="/find-professionals/insurance-brokers"
              />

            </div>

            <div className="mt-[78px] rounded-[30px] bg-[#163764] px-[54px] py-[58px] text-white">
              <h2 className="mb-[14px] text-center text-[26px] font-bold">
                Why Choose Our Verified Professionals?
              </h2>

              <p className="mx-auto mb-[50px] max-w-[700px] text-center text-[16px] text-white/90">
                Work with trusted experts selected to support property buyers across Portugal.
              </p>

              <div className="grid gap-[30px] md:grid-cols-2 xl:grid-cols-4">
                <WhyItem
                  icon={<BadgeCheck size={26} />}
                  title="Verified"
                  text="Only approved professionals appear publicly."
                />

                <WhyItem
                  icon={<Globe size={26} />}
                  title="International Support"
                  text="Professionals can support buyers in different languages."
                />

                <WhyItem
                  icon={<Star size={26} />}
                  title="Rated"
                  text="Ratings are based on data stored in the platform."
                />

                <WhyItem
                  icon={<Users size={26} />}
                  title="Buyer Specialists"
                  text="Focused on helping buyers navigate Portugal property."
                />
              </div>
            </div>

            <div className="py-[70px] text-center">
              <h2 className="mb-[18px] text-[36px] font-bold text-[#0F2340]">
                Are you a professional?
              </h2>

              <p className="mx-auto mb-[34px] max-w-[720px] text-[18px] text-[#4B5563]">
                Create a professional account, complete your profile, and wait
                for admin verification.
              </p>

              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-[14px] border border-[#1B365D] px-[22px] py-[12px] text-[15px] font-medium text-[#1B365D] no-underline transition hover:bg-[#F3F4F6]"
              >
                Apply as Professional
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}