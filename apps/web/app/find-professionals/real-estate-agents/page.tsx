"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import Link from "next/link";
import { getPublicProfessionals } from "@/lib/professionals-api";
import { createCalculatorLead } from "@/lib/calculator-leads-api";
import { useToast } from "@/components/ui/ToastProvider";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Compass,
  Globe2,
  HeartHandshake,
  Home,
  MapPinned,
  PhoneCall,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

type Agent = {
  id: string;
  name: string;
  title: string;
  agency: string;
  rating: number;
  reviews: number;
  experience: string;
  languages: string;
  speciality: string;
  deals: string;
  area: string;
  image: string;
};

const benefits = [
  {
    icon: Compass,
    title: "Expert local guidance",
    text: "Work with agents who know the best neighborhoods, pricing patterns, and market opportunities.",
  },
  {
    icon: TrendingUp,
    title: "Smarter property decisions",
    text: "Get insights on valuation, resale potential, and long-term investment performance.",
  },
  {
    icon: HeartHandshake,
    title: "Negotiation with confidence",
    text: "Experienced agents help you negotiate better terms and navigate the buying process smoothly.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted and verified support",
    text: "Find professionals with proven track records and strong experience helping buyers in Portugal.",
  },
];

const steps = [
  "Tell us what kind of property you want and where you want to buy.",
  "Get matched with trusted real estate agents suited to your needs.",
  "Compare profiles, speak with experts, and shortlist the best fit.",
  "Move forward confidently with a professional guiding every step.",
];

export default function RealEstateAgentsPage() {
  const toast = useToast();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSaved, setLeadSaved] = useState(false);
  const [savingLead, setSavingLead] = useState(false);

  useEffect(() => {
    const loadAgents = async () => {
      setLoading(true);

      try {
        const data = await getPublicProfessionals("PROPERTY_AGENT");

        const formatted: Agent[] = data.map((item) => ({
          id: item.id,
          name: item.user?.fullName ?? "Unnamed Agent",
          title: "Real Estate Agent",
          agency: item.companyName ?? "Independent Agency",
          rating: Number(item.rating || 0),
          reviews: Number(item.reviewsCount || 0),
          experience: "Experienced Professional",
          languages: item.languages?.length ? item.languages.join(", ") : "EN, PT",
          speciality: item.bio ?? "Expert guidance for buying and investing.",
          deals: `${Number(item.clientsCount || 0)} successful deals`,
          area: "Portugal",
          image:
            item.user?.avatarUrl ||
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
        }));

        setAgents(formatted);
      } catch (error) {
        toast.error(
          "Unable to load agents",
          error instanceof Error ? error.message : "Failed to load agents"
        );
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, [toast]);

  async function handleRequestAgentMatch() {
    if (!leadEmail.trim()) {
      toast.warning("Email required", "Please enter your email address.");
      return;
    }

    setSavingLead(true);

    try {
      await createCalculatorLead({
        fullName: leadName.trim() || undefined,
        email: leadEmail.trim().toLowerCase(),
        phone: leadPhone.trim() || undefined,
        source: "Real Estate Agent Match Request",
        interest: "Real Estate Agent / Property Search",
        location: "Portugal",
        budget: "Not specified yet",
      });

      setLeadSaved(true);
      toast.success(
        "Request submitted",
        "We will match you with a real estate agent shortly."
      );
    } catch (error) {
      toast.error(
        "Request failed",
        error instanceof Error ? error.message : "Failed to create request"
      );
    } finally {
      setSavingLead(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="bg-[#F8F9FA] text-[#0F2340]">
        <section className="relative overflow-hidden border-b border-[#E6EAF0] bg-[linear-gradient(135deg,#F8F9FA_0%,#EEF3F8_42%,#F9F6EE_100%)]">
          <div className="absolute inset-0 opacity-40">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(201,162,39,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(27,54,93,0.08),transparent_30%)]" />
          </div>

          <div className="relative mx-auto flex max-w-[1440px] flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-24">
            <div className="max-w-[720px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E0EA] bg-white/80 px-4 py-2 text-sm font-medium text-[#1B365D] backdrop-blur">
                <BadgeCheck className="h-4 w-4 text-[#C9A227]" />
                Trusted Real Estate Agents
              </div>

              <h1 className="mt-6 max-w-[760px] text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#0F2340] md:text-5xl lg:text-6xl">
                Find premium real estate agents for your next property move
              </h1>

              <p className="mt-6 max-w-[650px] text-lg leading-8 text-[#667085]">
                Connect with experienced agents who understand the Portuguese
                market, guide you through every step, and help you buy with
                clarity, confidence, and better opportunities.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="#agent-match"
                  className="inline-flex h-14 items-center rounded-2xl bg-[#1B365D] px-7 text-base font-semibold text-white shadow-[0_12px_30px_rgba(27,54,93,0.20)] transition hover:bg-[#10284D]"
                >
                  Get matched now
                </Link>

                <Link
                  href="/tools/property-valuation"
                  className="inline-flex h-14 items-center rounded-2xl border border-[#D5DDE8] bg-white px-7 text-base font-semibold text-[#1B365D] transition hover:bg-[#F5F8FB]"
                >
                  Explore property tools
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-6 text-sm text-[#475467]">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#C9A227]" />
                  Verified professionals
                </div>
                <div className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-[#C9A227]" />
                  Local area expertise
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#C9A227]" />
                  Strategic market insights
                </div>
              </div>
            </div>

            <div className="w-full max-w-[480px] rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,35,64,0.10)] backdrop-blur">
              <div className="rounded-[28px] bg-[linear-gradient(180deg,#1B365D_0%,#10284D_100%)] p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Top buyer focus</p>
                    <h2 className="mt-2 text-4xl font-semibold">Lisbon</h2>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Building2 className="h-7 w-7 text-[#F4D77B]" />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-white/70">Property support</p>
                    <p className="mt-2 text-lg font-semibold">Buy & invest</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-white/70">Buyer profile</p>
                    <p className="mt-2 text-lg font-semibold">Locals & expats</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  "Neighborhood and lifestyle guidance",
                  "Property search tailored to your budget",
                  "Negotiation and offer support",
                  "Smooth coordination until closing",
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
                Why choose an agent
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#0F2340] md:text-4xl">
                Better guidance, better property outcomes
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
                  Top real estate agents
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#0F2340] md:text-4xl">
                  Professionals ready to guide your search
                </h2>
              </div>

              <Link
                href="#agent-match"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B365D]"
              >
                Request help
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="mt-10 text-[#667085]">Loading agents...</div>
            ) : agents.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-[#E4E7EC] bg-[#F8F9FA] p-8 text-center text-[#667085]">
                No active real estate agents available yet.
              </div>
            ) : (
              <div className="mt-10 grid gap-6 lg:grid-cols-3">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="overflow-hidden rounded-[30px] border border-[#E7EBF1] bg-[#FCFCFD] shadow-[0_10px_26px_rgba(15,35,64,0.04)]"
                  >
                    <div className="relative h-[260px] overflow-hidden">
                      <img
                        src={agent.image}
                        alt={agent.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
                      <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#1B365D] backdrop-blur">
                        {agent.agency}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-semibold text-[#0F2340]">
                            {agent.name}
                          </h3>
                          <p className="mt-2 text-[15px] text-[#667085]">
                            {agent.title}
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-1 rounded-full bg-[#FFF7E2] px-3 py-2 text-sm font-semibold text-[#B78103]">
                          <Star className="h-4 w-4 fill-current" />
                          {agent.rating.toFixed(1)}
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-[#E7EBF1] bg-white p-4">
                          <p className="text-xs text-[#98A2B3]">Reviews</p>
                          <p className="mt-2 text-base font-semibold text-[#0F2340]">
                            {agent.reviews}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#E7EBF1] bg-white p-4">
                          <p className="text-xs text-[#98A2B3]">Experience</p>
                          <p className="mt-2 text-base font-semibold text-[#0F2340]">
                            {agent.experience}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3 text-sm text-[#475467]">
                        <div className="flex items-center gap-2">
                          <Globe2 className="h-4 w-4 text-[#1B365D]" />
                          {agent.languages}
                        </div>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-[#1B365D]" />
                          {agent.deals}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPinned className="h-4 w-4 text-[#1B365D]" />
                          {agent.area}
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-[#1B365D]" />
                          {agent.speciality}
                        </div>
                      </div>

                      <div className="mt-6 flex gap-3">
                        <Link
                          href={`/find-professionals/${agent.id}`}
                          className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-[#D5DDE8] bg-white text-sm font-semibold text-[#1B365D] transition hover:bg-[#F6F8FB]"
                        >
                          View profile
                        </Link>

                        <Link
                          href="#agent-match"
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

        <section className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[32px] bg-[linear-gradient(135deg,#10284D_0%,#1B365D_60%,#0F2340_100%)] p-8 text-white shadow-[0_18px_40px_rgba(15,35,64,0.18)] md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#F1D37A]">
                How it works
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
                A clear path to the right real estate expert
              </h2>

              <div className="mt-8 space-y-5">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-4 rounded-[24px] border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1D37A] text-sm font-bold text-[#10284D]">
                      {index + 1}
                    </div>
                    <p className="text-[15px] leading-7 text-white/85">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              id="agent-match"
              className="rounded-[32px] border border-[#E4E7EC] bg-white p-8 shadow-[0_12px_30px_rgba(15,35,64,0.05)] md:p-10"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
                Need expert guidance?
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#0F2340]">
                Start your property matching today
              </h2>

              <p className="mt-4 text-[16px] leading-7 text-[#667085]">
                Share your needs and we’ll help you connect with trusted real
                estate agents who match your budget, location, and lifestyle
                goals.
              </p>

              <div className="mt-8 space-y-4">
                <input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Full name"
                  className="h-14 w-full rounded-2xl border border-[#E7EBF1] bg-[#FAFBFC] px-5 text-sm text-[#0F2340] outline-none focus:border-[#1B365D]"
                />

                <input
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="Email address"
                  type="email"
                  className="h-14 w-full rounded-2xl border border-[#E7EBF1] bg-[#FAFBFC] px-5 text-sm text-[#0F2340] outline-none focus:border-[#1B365D]"
                />

                <input
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="Phone optional"
                  className="h-14 w-full rounded-2xl border border-[#E7EBF1] bg-[#FAFBFC] px-5 text-sm text-[#0F2340] outline-none focus:border-[#1B365D]"
                />
              </div>

              <button
                onClick={handleRequestAgentMatch}
                disabled={savingLead || leadSaved}
                className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#1B365D] text-base font-semibold text-white transition hover:bg-[#10284D] disabled:opacity-60"
              >
                {leadSaved
                  ? "Request saved"
                  : savingLead
                  ? "Saving request..."
                  : "Request an agent match"}
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}