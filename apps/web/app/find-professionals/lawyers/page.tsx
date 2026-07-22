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
  Scale,
  ShieldCheck,
  FileCheck,
  Globe2,
  PhoneCall,
  Star,
  Mail,
} from "lucide-react";

type Lawyer = {
  id: string;
  name: string;
  title: string;
  firm: string;
  rating: number;
  reviews: number;
  experience: string;
  languages: string;
  speciality: string;
  image: string;
};

const benefits = [
  {
    icon: Scale,
    title: "Legal protection",
    text: "Ensure all contracts and transactions are legally secure.",
  },
  {
    icon: FileCheck,
    title: "Due diligence",
    text: "Verify property ownership, debts, and legal risks before buying.",
  },
  {
    icon: ShieldCheck,
    title: "Secure transactions",
    text: "Avoid legal issues during and after the purchase.",
  },
  {
    icon: Globe2,
    title: "Support for expats",
    text: "Specialized legal help for foreign buyers in Portugal.",
  },
];

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [savingLead, setSavingLead] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  useEffect(() => {
    async function loadLawyers() {
      try {
        const data = await getPublicProfessionals("PROPERTY_LAWYER");

        const formatted: Lawyer[] = data.map((item) => ({
          id: item.id,
          name: item.user?.fullName ?? "Unnamed Lawyer",
          title: "Real Estate Lawyer",
          firm: item.companyName ?? "Independent Legal Practice",
          rating: Number(item.rating || 0),
          reviews: Number(item.reviewsCount || 0),
          experience: "Experienced Professional",
          languages: item.languages?.length
            ? item.languages.join(", ")
            : "EN, PT",
          speciality: item.bio ?? "Property law and transaction security.",
          image:
            item.user?.avatarUrl ||
            "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=900&q=80",
        }));

        setLawyers(formatted);
      } catch (error) {
  toast.error(
    "Unable to load lawyers",
    error instanceof Error
      ? error.message
      : "Failed to load lawyers"
  );

  setLawyers([]);
} finally {
        setLoading(false);
      }
    }

    loadLawyers();
  }, []);

  async function handleRequestLegalHelp() {
    if (!leadEmail.trim()) {
      toast.warning("Email required", "Please enter your email before sending.");
      return;
    }

    setSavingLead(true);

    try {
      await createCalculatorLead({
        fullName: leadName.trim() || undefined,
        email: leadEmail.trim().toLowerCase(),
        phone: leadPhone.trim() || undefined,
        source: "Legal Help Request",
        interest: "Property Lawyer / Legal Support",
        location: "Portugal",
        budget: "Not specified yet",
      });

      setLeadSaved(true);
      toast.success(
  "Request saved",
  "We can now match you with a verified property lawyer."
);
    } catch (error) {
      toast.error("Failed to create request", error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setSavingLead(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="bg-[#F8F9FA] text-[#0F2340]">
        <section className="border-b bg-gradient-to-br from-[#F8F9FA] to-[#EEF3F8] px-6 py-20 lg:px-10">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-10 lg:flex-row">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm text-[#1B365D]">
                <BadgeCheck className="h-4 w-4 text-[#C9A227]" />
                Trusted Legal Experts
              </div>

              <h1 className="mt-6 text-5xl font-semibold leading-tight">
                Secure your property with expert legal guidance
              </h1>

              <p className="mt-6 max-w-xl text-lg text-[#667085]">
                Work with verified real estate lawyers to ensure safe,
                transparent, and legally compliant property transactions.
              </p>

              <div className="mt-8 flex gap-4">
                <Link
                  href="#legal-help"
                  className="rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white"
                >
                  Get legal help
                </Link>

                <Link
                  href="/tools/true-cost-calculator"
                  className="rounded-xl border px-6 py-3 font-semibold text-[#1B365D]"
                >
                  Calculate buying costs
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-[#1B365D] p-8 text-white shadow-xl">
              <Scale className="mb-4 h-10 w-10 text-[#F4D77B]" />
              <h2 className="text-3xl font-bold">Legal Security</h2>
              <p className="mt-2 text-sm text-white/70">
                Verified lawyers for safe property transactions
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1400px] gap-6 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <Icon className="h-6 w-6 text-[#1B365D]" />
                <h3 className="mt-4 text-lg font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{benefit.text}</p>
              </div>
            );
          })}
        </section>

        <section id="lawyers" className="mx-auto max-w-[1400px] px-6 pb-12">
          <h2 className="mb-10 text-3xl font-semibold">
            Top Real Estate Lawyers
          </h2>

          {loading ? (
            <div className="text-[#667085]">Loading lawyers...</div>
          ) : lawyers.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-[#667085]">
              No active lawyers available yet.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {lawyers.map((lawyer) => (
                <div
                  key={lawyer.id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <img
                    src={lawyer.image}
                    alt={lawyer.name}
                    className="h-60 w-full object-cover"
                  />

                  <div className="p-6">
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {lawyer.name}
                        </h3>
                        <p className="text-sm text-gray-500">{lawyer.title}</p>
                      </div>

                      <div className="flex items-center gap-1 text-[#B78103]">
                        <Star className="h-4 w-4 fill-current" />
                        {lawyer.rating.toFixed(1)}
                      </div>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-gray-500">
                      <p>🏢 {lawyer.firm}</p>
                      <p>🌍 {lawyer.languages}</p>
                      <p>📈 {lawyer.experience}</p>
                      <p>🛡️ {lawyer.speciality}</p>
                      <p>⭐ {lawyer.reviews} reviews</p>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Link
                        href={`/find-professionals/${lawyer.id}`}
                        className="flex-1 rounded-xl border py-2 text-center font-medium text-[#1B365D]"
                      >
                        View
                      </Link>

                      <Link
                        href="#legal-help"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B365D] py-2 font-medium text-white"
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
        </section>

        <section id="legal-help" className="mx-auto max-w-[1400px] px-6 pb-20">
          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="flex items-center gap-2 text-3xl font-semibold text-[#0F2340]">
              <Mail className="h-7 w-7 text-[#1B365D]" />
              Need legal help?
            </h2>

            <p className="mt-3 text-[#667085]">
              Leave your contact details and we will prepare a request for a
              verified property lawyer.
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
              onClick={handleRequestLegalHelp}
              disabled={savingLead || leadSaved}
              className="mt-6 h-14 rounded-2xl bg-[#1B365D] px-8 font-semibold text-white disabled:opacity-60"
            >
              {leadSaved
                ? "Request saved"
                : savingLead
                ? "Saving request..."
                : "Request legal help"}
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}