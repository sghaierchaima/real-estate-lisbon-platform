"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import Link from "next/link";
import { getPublicProfessionals } from "@/lib/professionals-api";
import { createCalculatorLead } from "@/lib/calculator-leads-api";
import {
  BadgeCheck,
  Banknote,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Globe2,
  HandCoins,
  Mail,
  PhoneCall,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
type Broker = {
  id: string;
  name: string;
  title: string;
  company: string;
  rating: number;
  reviews: number;
  experience: string;
  languages: string;
  response: string;
  speciality: string;
  image: string;
};

const benefits = [
  {
    icon: Calculator,
    title: "Loan comparison made simple",
    text: "Compare multiple lenders, rates, and financing structures with expert guidance.",
  },
  {
    icon: Globe2,
    title: "Support for international buyers",
    text: "Specialized help for expats and overseas investors buying property in Portugal.",
  },
  {
    icon: ShieldCheck,
    title: "Safer financial decisions",
    text: "Understand eligibility, hidden costs, and repayment plans before you commit.",
  },
  {
    icon: HandCoins,
    title: "Better negotiation power",
    text: "Experienced brokers help you secure stronger loan conditions and smoother approvals.",
  },
];

export default function MortgageBrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [savingLead, setSavingLead] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  useEffect(() => {
    async function loadBrokers() {
      try {
        const data = await getPublicProfessionals("MORTGAGE_BROKER");

        const formatted: Broker[] = data.map((item) => ({
          id: item.id,
          name: item.user?.fullName ?? "Unnamed Broker",
          title: "Mortgage Broker",
          company: item.companyName ?? "Independent Broker",
          rating: Number(item.rating || 0),
          reviews: Number(item.reviewsCount || 0),
          experience: "Experienced Professional",
          languages: item.languages?.length ? item.languages.join(", ") : "EN, PT",
          response: "Fast response",
          speciality: item.bio ?? "Mortgage support and financing advice.",
          image:
            item.user?.avatarUrl ||
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
        }));

        setBrokers(formatted);
      } catch (error) {
        toast.error(
          "Unable to load mortgage brokers",
          error instanceof Error
            ? error.message
            : "Failed to load mortgage brokers"
        );
        setBrokers([]);
      } finally {
        setLoading(false);
      }
    }

    loadBrokers();
  }, []);

  async function handleRequestBrokerHelp() {
    if (!leadEmail.trim()) {
     toast.warning(
  "Email required",
  "Please enter your email before sending your request."
);
      return;
    }

    setSavingLead(true);

    try {
      await createCalculatorLead({
        fullName: leadName.trim() || undefined,
        email: leadEmail.trim().toLowerCase(),
        phone: leadPhone.trim() || undefined,
        source: "Mortgage Broker Help Request",
        interest: "Mortgage Broker / Financing Support",
        location: "Portugal",
        budget: "Not specified yet",
      });

      setLeadSaved(true);
      toast.success(
        "Request saved",
        "We can now match you with a verified mortgage broker."
      );
    } catch (error) {
      toast.error(
  "Failed to create request",
  error instanceof Error
    ? error.message
    : "An unknown error occurred"
);
    } finally {
      setSavingLead(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="bg-[#F8F9FA] text-[#0F2340]">
        <section className="relative overflow-hidden border-b border-[#E6EAF0] bg-[linear-gradient(135deg,#F8F9FA_0%,#EEF3F8_45%,#F9F6EE_100%)]">
          <div className="absolute inset-0 opacity-40">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(201,162,39,0.10),transparent_28%),radial-gradient(circle_at_left,rgba(27,54,93,0.08),transparent_30%)]" />
          </div>

          <div className="relative mx-auto flex max-w-[1440px] flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-24">
            <div className="max-w-[720px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E0EA] bg-white/80 px-4 py-2 text-sm font-medium text-[#1B365D] backdrop-blur">
                <BadgeCheck className="h-4 w-4 text-[#C9A227]" />
                Trusted Mortgage Experts
              </div>

              <h1 className="mt-6 max-w-[760px] text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#0F2340] md:text-5xl lg:text-6xl">
                Find premium mortgage brokers for your property journey
              </h1>

              <p className="mt-6 max-w-[650px] text-lg leading-8 text-[#667085]">
                Connect with experienced mortgage brokers who help buyers,
                investors, and expats secure the right financing with clarity,
                speed, and confidence.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="#broker-help"
                  className="inline-flex h-14 items-center rounded-2xl bg-[#1B365D] px-7 text-base font-semibold text-white shadow-[0_12px_30px_rgba(27,54,93,0.20)] transition hover:bg-[#10284D]"
                >
                  Get matched now
                </Link>

                <Link
                  href="/tools/mortgage-calculator"
                  className="inline-flex h-14 items-center rounded-2xl border border-[#D5DDE8] bg-white px-7 text-base font-semibold text-[#1B365D] transition hover:bg-[#F5F8FB]"
                >
                  Use mortgage calculator
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-6 text-sm text-[#475467]">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#C9A227]" />
                  Verified professionals
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#C9A227]" />
                  Fast response times
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#C9A227]" />
                  Better financing insights
                </div>
              </div>
            </div>

            <div className="w-full max-w-[480px] rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,35,64,0.10)] backdrop-blur">
              <div className="rounded-[28px] bg-[linear-gradient(180deg,#1B365D_0%,#10284D_100%)] p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Financing support</p>
                    <h2 className="mt-2 text-4xl font-semibold">
                      Mortgage
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Banknote className="h-7 w-7 text-[#F4D77B]" />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-white/70">Loan support</p>
                    <p className="mt-2 text-lg font-semibold">Residential</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-white/70">Buyer profile</p>
                    <p className="mt-2 text-lg font-semibold">Expats & locals</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  "Tailored lender comparison",
                  "Document preparation support",
                  "Financing advice for foreigners",
                  "Negotiation of loan conditions",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-[#E8EDF3] bg-[#FBFCFD] px-4 py-4"
                  >
                    <CheckCircle2 className="h-5 w-5 text-[#2E7D32]" />
                    <span className="text-sm font-medium text-[#344054]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
                Why choose a broker
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#0F2340] md:text-4xl">
                Smarter financing, less stress
              </h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_8px_24px_rgba(15,35,64,0.04)] transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,35,64,0.08)]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(27,54,93,0.10),rgba(201,162,39,0.16))] text-[#1B365D]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-[#0F2340]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#667085]">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 py-6 lg:px-10 lg:py-10">
          <div className="rounded-[36px] border border-[#E4E7EC] bg-white p-6 shadow-[0_10px_30px_rgba(15,35,64,0.04)] md:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
                  Top mortgage brokers
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#0F2340] md:text-4xl">
                  Professionals ready to guide your financing
                </h2>
              </div>

              <Link
                href="#broker-help"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B365D]"
              >
                Request help
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="mt-10 text-[#667085]">Loading brokers...</div>
            ) : brokers.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-[#E4E7EC] bg-[#F8F9FA] p-8 text-center text-[#667085]">
                No active mortgage brokers available yet.
              </div>
            ) : (
              <div className="mt-10 grid gap-6 lg:grid-cols-3">
                {brokers.map((broker) => (
                  <div
                    key={broker.id}
                    className="overflow-hidden rounded-[30px] border border-[#E7EBF1] bg-[#FCFCFD] shadow-[0_10px_26px_rgba(15,35,64,0.04)]"
                  >
                    <div className="relative h-[260px] overflow-hidden">
                      <img
                        src={broker.image}
                        alt={broker.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
                      <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#1B365D] backdrop-blur">
                        {broker.company}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-semibold text-[#0F2340]">
                            {broker.name}
                          </h3>
                          <p className="mt-2 text-[15px] text-[#667085]">
                            {broker.title}
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-1 rounded-full bg-[#FFF7E2] px-3 py-2 text-sm font-semibold text-[#B78103]">
                          <Star className="h-4 w-4 fill-current" />
                          {broker.rating.toFixed(1)}
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-[#E7EBF1] bg-white p-4">
                          <p className="text-xs text-[#98A2B3]">Reviews</p>
                          <p className="mt-2 text-base font-semibold text-[#0F2340]">
                            {broker.reviews}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#E7EBF1] bg-white p-4">
                          <p className="text-xs text-[#98A2B3]">Experience</p>
                          <p className="mt-2 text-base font-semibold text-[#0F2340]">
                            {broker.experience}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3 text-sm text-[#475467]">
                        <div className="flex items-center gap-2">
                          <Globe2 className="h-4 w-4 text-[#1B365D]" />
                          {broker.languages}
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-[#1B365D]" />
                          Response time: {broker.response}
                        </div>

                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-[#1B365D]" />
                          {broker.speciality}
                        </div>
                      </div>

                      <div className="mt-6 flex gap-3">
                        <Link
                          href={`/find-professionals/${broker.id}`}
                          className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-[#D5DDE8] bg-white text-sm font-semibold text-[#1B365D] transition hover:bg-[#F6F8FB]"
                        >
                          View profile
                        </Link>

                        <Link
                          href="#broker-help"
                          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1B365D] text-sm font-semibold text-white transition hover:bg-[#10284D]"
                        >
                          <PhoneCall className="h-4 w-4" />
                          Contact
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          id="broker-help"
          className="mx-auto max-w-[1440px] px-6 pb-20 lg:px-10"
        >
          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="flex items-center gap-2 text-3xl font-semibold text-[#0F2340]">
              <Mail className="h-7 w-7 text-[#1B365D]" />
              Need mortgage help?
            </h2>

            <p className="mt-3 text-[#667085]">
              Leave your contact details and we will prepare a request for a
              verified mortgage broker.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <input
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Full name"
                className="h-14 rounded-2xl border px-5 outline-none focus:border-[#1B365D]"
              />

              <input
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="Email address"
                type="email"
                className="h-14 rounded-2xl border px-5 outline-none focus:border-[#1B365D]"
              />

              <input
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                placeholder="Phone optional"
                className="h-14 rounded-2xl border px-5 outline-none focus:border-[#1B365D]"
              />
            </div>

            <button
              onClick={handleRequestBrokerHelp}
              disabled={savingLead || leadSaved}
              className="mt-6 h-14 rounded-2xl bg-[#1B365D] px-8 font-semibold text-white disabled:opacity-60"
            >
              {leadSaved
                ? "Request saved"
                : savingLead
                ? "Saving request..."
                : "Request mortgage help"}
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}