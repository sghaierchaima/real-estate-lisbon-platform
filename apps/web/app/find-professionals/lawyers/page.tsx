"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";

import {
  getPublicProfessionals,
} from "@/lib/professionals-api";

import {
  createCalculatorLead,
} from "@/lib/calculator-leads-api";

import {
  useToast,
} from "@/components/ui/ToastProvider";

import {
  BadgeCheck,
  Scale,
  ShieldCheck,
  FileCheck,
  Globe2,
  PhoneCall,
  Star,
  Mail,
  CheckCircle2,
  Users,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return API_URL.replace(/\/api\/?$/, "");
  }
})();

function resolveAvatarUrl(
  avatarUrl?: string | null,
): string | null {
  if (!avatarUrl) return null;

  const value = avatarUrl.trim();

  if (!value) return null;

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"
    }${value}`;
}

type Lawyer = {
  id: string;
  name: string;
  title: string;
  firm: string;
  rating: number;
  reviews: number;
  languages: string;
  speciality: string;
  image: string | null;
};

const benefits = [
  {
    icon: Scale,
    title: "Legal protection",
    text:
      "Ensure contracts, documentation, and property transactions are properly reviewed.",
  },
  {
    icon: FileCheck,
    title: "Due diligence",
    text:
      "Verify property ownership, legal documentation, debts, and potential risks before buying.",
  },
  {
    icon: ShieldCheck,
    title: "Secure transactions",
    text:
      "Get professional legal support throughout the property acquisition process.",
  },
  {
    icon: Globe2,
    title: "International buyer support",
    text:
      "Connect with legal professionals who can assist international buyers in Portugal.",
  },
];

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  const initials = parts
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");

  return initials || "PL";
}

function LawyerImage({
  src,
  name,
}: {
  src: string | null;
  name: string;
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (!src || imageFailed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#E7EDF4_0%,#F8F9FA_55%,#EEE8D8_100%)]">
        <div className="flex flex-col items-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-[#1B365D] text-4xl font-bold text-white shadow-[0_12px_30px_rgba(15,35,64,0.20)]">
            {getInitials(name)}
          </div>

          <span className="mt-4 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-[#667085] shadow-sm backdrop-blur">
            Profile photo unavailable
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
      onError={() =>
        setImageFailed(true)
      }
    />
  );
}

export default function LawyersPage() {
  const [
    lawyers,
    setLawyers,
  ] = useState<Lawyer[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const toast = useToast();

  const [
    leadName,
    setLeadName,
  ] = useState("");

  const [
    leadEmail,
    setLeadEmail,
  ] = useState("");

  const [
    leadPhone,
    setLeadPhone,
  ] = useState("");

  const [
    savingLead,
    setSavingLead,
  ] = useState(false);

  const [
    leadSaved,
    setLeadSaved,
  ] = useState(false);

  useEffect(() => {
    async function loadLawyers() {
      setLoading(true);

      try {
        const data =
          await getPublicProfessionals(
            "PROPERTY_LAWYER",
          );

        const formatted: Lawyer[] =
          data.map((item) => ({
            id: item.id,

            name:
              item.user?.fullName?.trim() ||
              "Property Law Professional",

            title:
              "Real Estate Lawyer",

            firm:
              item.companyName?.trim() ||
              "Independent Legal Practice",

            rating:
              Number(
                item.rating || 0,
              ),

            reviews:
              Number(
                item.reviewsCount || 0,
              ),

            languages:
              item.languages?.length
                ? item.languages.join(", ")
                : "Languages not specified",

            speciality:
              item.bio?.trim() ||
              "Property law and transaction support for buyers in Portugal.",

            image: resolveAvatarUrl(
              item.user?.avatarUrl,
            ),
          }));

        setLawyers(formatted);
      } catch (error) {
        toast.error(
          "Unable to load lawyers",
          error instanceof Error
            ? error.message
            : "Failed to load lawyers",
        );

        setLawyers([]);
      } finally {
        setLoading(false);
      }
    }

    loadLawyers();
  }, [toast]);

  async function handleRequestLegalHelp() {
    if (!leadEmail.trim()) {
      toast.warning(
        "Email required",
        "Please enter your email before sending.",
      );

      return;
    }

    setSavingLead(true);

    try {
      await createCalculatorLead({
        fullName:
          leadName.trim() ||
          undefined,

        email:
          leadEmail
            .trim()
            .toLowerCase(),

        phone:
          leadPhone.trim() ||
          undefined,

        source:
          "Legal Help Request",

        interest:
          "Property Lawyer / Legal Support",

        location:
          "Portugal",

        budget:
          "Not specified yet",
      });

      setLeadSaved(true);

      toast.success(
        "Request saved",
        "We can now match you with a verified property lawyer.",
      );
    } catch (error) {
      toast.error(
        "Failed to create request",
        error instanceof Error
          ? error.message
          : "An unknown error occurred",
      );
    } finally {
      setSavingLead(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="bg-[#F8F9FA] text-[#0F2340]">

        {/* HERO */}

        <section className="relative overflow-hidden border-b border-[#E6EAF0] bg-[linear-gradient(135deg,#F8F9FA_0%,#EEF3F8_45%,#F9F6EE_100%)]">

          <div className="absolute inset-0 opacity-40">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(201,162,39,0.10),transparent_28%),radial-gradient(circle_at_left,rgba(27,54,93,0.08),transparent_30%)]" />
          </div>

          <div className="relative mx-auto flex max-w-[1440px] flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-24">

            <div className="max-w-[720px]">

              <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E0EA] bg-white/80 px-4 py-2 text-sm font-medium text-[#1B365D] backdrop-blur">
                <BadgeCheck className="h-4 w-4 text-[#C9A227]" />
                Verified Property Lawyers
              </div>

              <h1 className="mt-6 max-w-[760px] text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#0F2340] md:text-5xl lg:text-6xl">
                Protect your property purchase with expert legal guidance
              </h1>

              <p className="mt-6 max-w-[650px] text-lg leading-8 text-[#667085]">
                Connect with verified property lawyers who can help review
                documents, perform due diligence, and support a secure property
                transaction in Portugal.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">

                <Link
                  href="#legal-help"
                  className="inline-flex h-14 items-center rounded-2xl bg-[#1B365D] px-7 text-base font-semibold text-white shadow-[0_12px_30px_rgba(27,54,93,0.20)] transition hover:bg-[#10284D]"
                >
                  Get legal help
                </Link>

                <Link
                  href="/tools/true-cost-calculator"
                  className="inline-flex h-14 items-center rounded-2xl border border-[#D5DDE8] bg-white px-7 text-base font-semibold text-[#1B365D] transition hover:bg-[#F5F8FB]"
                >
                  Calculate buying costs
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-6 text-sm text-[#475467]">

                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-[#C9A227]" />
                  Verified professionals
                </div>

                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-[#C9A227]" />
                  Due diligence support
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#C9A227]" />
                  Secure property transactions
                </div>
              </div>
            </div>

            {/* SIDE CARD */}

            <div className="w-full max-w-[480px] rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,35,64,0.10)] backdrop-blur">

              <div className="rounded-[28px] bg-[linear-gradient(180deg,#1B365D_0%,#10284D_100%)] p-6 text-white">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm text-white/70">
                      Legal support
                    </p>

                    <h2 className="mt-2 text-4xl font-semibold">
                      Property Law
                    </h2>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-3">
                    <Scale className="h-7 w-7 text-[#F4D77B]" />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-white/70">
                      Main support
                    </p>

                    <p className="mt-2 text-lg font-semibold">
                      Due diligence
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-white/70">
                      Buyer profile
                    </p>

                    <p className="mt-2 text-lg font-semibold">
                      Local & international
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">

                {[
                  "Property ownership verification",
                  "Contract and documentation review",
                  "Legal due diligence support",
                  "Guidance through the purchase process",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-[#E8EDF3] bg-[#FBFCFD] px-4 py-4"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2E7D32]" />

                    <span className="text-sm font-medium text-[#344054]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS */}

        <section className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">

          <div className="mb-10">

            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
              Why choose a property lawyer
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#0F2340] md:text-4xl">
              Strong legal support for a safer purchase
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

            {benefits.map((benefit) => {
              const Icon =
                benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_8px_24px_rgba(15,35,64,0.04)] transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,35,64,0.08)]"
                >

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(27,54,93,0.10),rgba(201,162,39,0.16))] text-[#1B365D]">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="mt-6 text-xl font-semibold text-[#0F2340]">
                    {benefit.title}
                  </h3>

                  <p className="mt-3 text-[15px] leading-7 text-[#667085]">
                    {benefit.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* LAWYERS */}

        <section
          id="lawyers"
          className="mx-auto max-w-[1440px] px-6 py-6 lg:px-10 lg:py-10"
        >

          <div className="rounded-[36px] border border-[#E4E7EC] bg-white p-6 shadow-[0_10px_30px_rgba(15,35,64,0.04)] md:p-8 lg:p-10">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
                  Verified property lawyers
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#0F2340] md:text-4xl">
                  Legal professionals ready to protect your purchase
                </h2>

                {!loading && (
                  <p className="mt-3 text-sm text-[#667085]">
                    {lawyers.length}{" "}
                    {lawyers.length === 1
                      ? "lawyer available"
                      : "lawyers available"}
                  </p>
                )}
              </div>

              <Link
                href="#legal-help"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B365D]"
              >
                Request legal help
              </Link>
            </div>

            {loading ? (
              <div className="mt-10 grid gap-6 lg:grid-cols-3">

                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-[30px] border border-[#E7EBF1] bg-[#FCFCFD]"
                  >
                    <div className="h-[260px] animate-pulse bg-[#EEF1F4]" />

                    <div className="space-y-4 p-6">
                      <div className="h-7 w-2/3 animate-pulse rounded bg-[#EEF1F4]" />
                      <div className="h-5 w-1/2 animate-pulse rounded bg-[#EEF1F4]" />
                      <div className="h-20 animate-pulse rounded-2xl bg-[#EEF1F4]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : lawyers.length === 0 ? (
              <div className="mt-10 rounded-[24px] border border-[#E4E7EC] bg-[#F8F9FA] p-10 text-center">

                <Users className="mx-auto h-10 w-10 text-[#98A2B3]" />

                <h3 className="mt-4 text-lg font-semibold text-[#0F2340]">
                  No lawyers available
                </h3>

                <p className="mt-2 text-sm text-[#667085]">
                  No active verified property lawyers are currently available.
                </p>
              </div>
            ) : (
              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

                {lawyers.map((lawyer) => (
                  <article
                    key={lawyer.id}
                    className="overflow-hidden rounded-[30px] border border-[#E7EBF1] bg-[#FCFCFD] shadow-[0_10px_26px_rgba(15,35,64,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(15,35,64,0.10)]"
                  >

                    {/* IMAGE */}

                    <div className="group relative h-[260px] overflow-hidden">

                      <LawyerImage
                        src={lawyer.image}
                        name={lawyer.name}
                      />

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

                      <div className="absolute left-5 top-5 max-w-[75%] truncate rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#1B365D] shadow-sm backdrop-blur">
                        {lawyer.firm}
                      </div>

                      <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-[#2E7D32] shadow-sm backdrop-blur">
                        <BadgeCheck className="h-4 w-4" />
                        Verified
                      </div>
                    </div>

                    {/* CONTENT */}

                    <div className="p-6">

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <h3 className="truncate text-2xl font-semibold text-[#0F2340]">
                            {lawyer.name}
                          </h3>

                          <p className="mt-2 text-[15px] font-medium text-[#667085]">
                            {lawyer.title}
                          </p>
                        </div>

                        {lawyer.rating > 0 &&
                          lawyer.reviews > 0 ? (
                          <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF7E2] px-3 py-2 text-sm font-semibold text-[#B78103]">

                            <Star className="h-4 w-4 fill-current" />

                            {lawyer.rating.toFixed(1)}
                          </div>
                        ) : (
                          <div className="shrink-0 rounded-full bg-[#F2F4F7] px-3 py-2 text-xs font-semibold text-[#667085]">
                            New professional
                          </div>
                        )}
                      </div>

                      {/* STATS */}

                      <div className="mt-6 grid grid-cols-2 gap-3">

                        <div className="rounded-2xl border border-[#E7EBF1] bg-white p-4">

                          <p className="text-xs text-[#98A2B3]">
                            Reviews
                          </p>

                          <p className="mt-2 text-base font-semibold text-[#0F2340]">
                            {lawyer.reviews}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#E7EBF1] bg-white p-4">

                          <p className="text-xs text-[#98A2B3]">
                            Status
                          </p>

                          <p className="mt-2 text-base font-semibold text-[#2E7D32]">
                            Verified
                          </p>
                        </div>
                      </div>

                      {/* DETAILS */}

                      <div className="mt-5 space-y-3 text-sm text-[#475467]">

                        <div className="flex items-start gap-2">

                          <Scale className="mt-0.5 h-4 w-4 shrink-0 text-[#1B365D]" />

                          <span>
                            {lawyer.firm}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">

                          <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1B365D]" />

                          <span>
                            {lawyer.languages}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">

                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1B365D]" />

                          <span className="line-clamp-3 leading-6">
                            {lawyer.speciality}
                          </span>
                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div className="mt-6 flex gap-3">

                        <Link
                          href={`/find-professionals/${lawyer.id}`}
                          className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-[#D5DDE8] bg-white px-4 text-center text-sm font-semibold text-[#1B365D] transition hover:bg-[#F6F8FB]"
                        >
                          View profile
                        </Link>

                        <Link
                          href="#legal-help"
                          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1B365D] px-4 text-center text-sm font-semibold text-white transition hover:bg-[#10284D]"
                        >

                          <PhoneCall className="h-4 w-4" />

                          Contact
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* LEGAL HELP */}

        <section
          id="legal-help"
          className="mx-auto max-w-[1440px] scroll-mt-28 px-6 pb-20 pt-16 lg:px-10"
        >

          <div className="rounded-[32px] border border-[#E4E7EC] bg-white p-8 shadow-[0_12px_30px_rgba(15,35,64,0.05)] md:p-10">

            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
              Need expert guidance?
            </p>

            <h2 className="mt-4 flex items-center gap-3 text-3xl font-semibold text-[#0F2340]">

              <Mail className="h-7 w-7 text-[#1B365D]" />

              Need legal help?
            </h2>

            <p className="mt-4 max-w-[760px] text-[16px] leading-7 text-[#667085]">
              Leave your contact details and we will prepare a request so you
              can be matched with a verified property lawyer.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">

              <div>

                <label
                  htmlFor="legal-name"
                  className="mb-2 block text-sm font-medium text-[#344054]"
                >
                  Full name
                </label>

                <input
                  id="legal-name"
                  value={leadName}
                  onChange={(event) =>
                    setLeadName(
                      event.target.value,
                    )
                  }
                  placeholder="Your full name"
                  autoComplete="name"
                  className="h-14 w-full rounded-2xl border border-[#E7EBF1] bg-[#FAFBFC] px-5 text-sm text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/5"
                />
              </div>

              <div>

                <label
                  htmlFor="legal-email"
                  className="mb-2 block text-sm font-medium text-[#344054]"
                >
                  Email address *
                </label>

                <input
                  id="legal-email"
                  value={leadEmail}
                  onChange={(event) =>
                    setLeadEmail(
                      event.target.value,
                    )
                  }
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                  className="h-14 w-full rounded-2xl border border-[#E7EBF1] bg-[#FAFBFC] px-5 text-sm text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/5"
                />
              </div>

              <div>

                <label
                  htmlFor="legal-phone"
                  className="mb-2 block text-sm font-medium text-[#344054]"
                >
                  Phone
                </label>

                <input
                  id="legal-phone"
                  value={leadPhone}
                  onChange={(event) =>
                    setLeadPhone(
                      event.target.value,
                    )
                  }
                  placeholder="+351 ..."
                  type="tel"
                  autoComplete="tel"
                  className="h-14 w-full rounded-2xl border border-[#E7EBF1] bg-[#FAFBFC] px-5 text-sm text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/5"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleRequestLegalHelp
              }
              disabled={
                savingLead ||
                leadSaved
              }
              className="mt-8 inline-flex h-14 items-center justify-center rounded-2xl bg-[#1B365D] px-8 text-base font-semibold text-white transition hover:bg-[#10284D] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {leadSaved
                ? "Request submitted"
                : savingLead
                  ? "Submitting request..."
                  : "Request legal help"}
            </button>

            {leadSaved && (
              <div className="mt-5 flex max-w-[720px] items-start gap-3 rounded-2xl border border-[#CFE8D2] bg-[#F0F9F1] p-4 text-sm text-[#2E7D32]">

                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                <span>
                  Your request has been saved successfully. You can now be
                  matched with a suitable property lawyer.
                </span>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}