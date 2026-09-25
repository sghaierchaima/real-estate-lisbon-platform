"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  HelpCircle,
  Home,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { ReactNode, useMemo, useState } from "react";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";

const faqGroups = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn how the platform works.",
    icon: <Sparkles size={21} />,
    questions: [
      {
        q: "What is Real Estate Lisbon?",
        a: "Real Estate Lisbon is a property platform designed to help buyers explore properties, use decision-support tools, and connect with property professionals in Portugal.",
      },
      {
        q: "Do I need an account to use the platform?",
        a: "Public pages and selected tools can be explored without an account. An account is required for personalised features such as saved properties, requests, matches, messages, and notifications.",
      },
      {
        q: "Who can use the platform?",
        a: "The platform supports property buyers and registered professionals. Administrative accounts are used to manage platform operations and content.",
      },
    ],
  },
  {
    id: "professionals",
    title: "Professionals & Matching",
    description: "Understand matching and communication.",
    icon: <UserRoundCheck size={21} />,
    questions: [
      {
        q: "What types of professionals can I find?",
        a: "The platform supports mortgage brokers, real estate agents, property lawyers, property valuers, home inspectors, tax advisors, and insurance brokers.",
      },
      {
        q: "How does professional matching work?",
        a: "Buyer requests can be matched with relevant professional profiles according to the information associated with the request and the professional's service type. A match score may help indicate the relevance of the match.",
      },
      {
        q: "Can I communicate with a matched professional?",
        a: "Yes. When messaging is available for a match, buyers and professionals can communicate through the platform's messaging area.",
      },
      {
        q: "Does a match guarantee the quality of a professional?",
        a: "No. Matching helps identify potentially relevant professional profiles. Users should independently evaluate qualifications, services, experience, fees, and suitability before making a decision.",
      },
    ],
  },
  {
    id: "properties",
    title: "Properties & Tools",
    description: "Explore properties and buyer tools.",
    icon: <Home size={21} />,
    questions: [
      {
        q: "Can I save properties?",
        a: "Yes. Signed-in buyer accounts can save properties and return to them later from their dashboard.",
      },
      {
        q: "What property tools are available?",
        a: "The platform includes property search assistance, mortgage calculations, affordability tools, neighbourhood exploration, price checking, true-cost calculations, and property valuation support.",
      },
      {
        q: "Are calculator results financial advice?",
        a: "No. Calculations and estimates are informational and depend on the information entered or available. They should not replace professional financial, legal, tax, valuation, insurance, or other specialist advice.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & Trust",
    description: "Accounts, reviews and platform support.",
    icon: <ShieldCheck size={21} />,
    questions: [
      {
        q: "How do professional reviews work?",
        a: "After an eligible completed match, a buyer may submit a rating and comment. Reviews may be subject to platform moderation before becoming publicly visible.",
      },
      {
        q: "Can I change my account information?",
        a: "Available account and profile information can be managed from the relevant settings area for your account type.",
      },
      {
        q: "How can I contact support?",
        a: "Use the Contact page for platform, account, professional, matching, technical, or privacy-related enquiries.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openItem, setOpenItem] =
    useState<string | null>("getting-started-0");

  const [search, setSearch] =
    useState("");

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    return faqGroups
      .map((group) => ({
        ...group,
        questions: group.questions.filter((item) => {
          if (!normalizedSearch) {
            return true;
          }

          return (
            item.q
              .toLowerCase()
              .includes(normalizedSearch) ||
            item.a
              .toLowerCase()
              .includes(normalizedSearch)
          );
        }),
      }))
      .filter(
        (group) =>
          group.questions.length > 0,
      );
  }, [normalizedSearch]);

  const resultCount =
    filteredGroups.reduce(
      (total, group) =>
        total + group.questions.length,
      0,
    );

  function scrollToCategory(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  return (
    <main className="min-h-screen bg-white text-[#0F2340]">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#E8EDF2] bg-[#F8FAFC]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#C9A227]/[0.07] blur-3xl" />

          <div className="absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-[#1B365D]/[0.07] blur-3xl" />

          <div
            className="
              absolute inset-0 opacity-[0.025]
              [background-image:linear-gradient(#0F2340_1px,transparent_1px),linear-gradient(90deg,#0F2340_1px,transparent_1px)]
              [background-size:42px_42px]
            "
          />
        </div>

        <div className="container-page relative py-20 sm:py-24 lg:py-[105px]">
          <div className="mx-auto max-w-[850px] text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C9A227]/25 bg-white px-4 py-2 text-[13px] font-semibold text-[#1B365D] shadow-sm">
              <HelpCircle
                size={15}
                className="text-[#C9A227]"
              />
              Help Center
            </div>

            <h1 className="text-[42px] font-bold leading-[1.06] tracking-[-0.04em] text-[#0F2340] sm:text-[52px] lg:text-[62px]">
              How can we{" "}
              <span className="relative text-[#1B365D]">
                help you?
                <span className="absolute -bottom-2 left-1/2 h-[3px] w-[75%] -translate-x-1/2 rounded-full bg-[#C9A227]" />
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-[670px] text-[17px] leading-7 text-[#657382]">
              Find clear answers about properties,
              professional matching, accounts, reviews,
              tools and your experience on the platform.
            </p>

            <div className="relative mx-auto mt-9 max-w-[650px]">
              <Search
                size={20}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-[#82909F]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search for a question..."
                className="
                  w-full rounded-[18px]
                  border border-[#DDE4EA]
                  bg-white py-[17px]
                  pl-14 pr-5
                  text-[14px] text-[#0F2340]
                  shadow-[0_12px_35px_rgba(15,35,64,0.08)]
                  outline-none transition
                  placeholder:text-[#9AA4B1]
                  focus:border-[#C9A227]
                  focus:ring-4 focus:ring-[#C9A227]/10
                "
              />
            </div>

            {normalizedSearch && (
              <p className="mt-4 text-[12px] font-medium text-[#778493]">
                {resultCount}{" "}
                {resultCount === 1
                  ? "answer"
                  : "answers"}{" "}
                found
              </p>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORY CARDS */}
      {!normalizedSearch && (
        <section className="relative z-10">
          <div className="container-page">
            <div className="-mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {faqGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() =>
                    scrollToCategory(group.id)
                  }
                  className="
                    group rounded-[18px]
                    border border-[#E2E8EE]
                    bg-white p-5 text-left
                    shadow-[0_10px_30px_rgba(15,35,64,0.07)]
                    transition-all
                    hover:-translate-y-1
                    hover:border-[#C9A227]/40
                    hover:shadow-[0_16px_36px_rgba(15,35,64,0.11)]
                  "
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F7FA] text-[#1B365D] transition group-hover:bg-[#FFF8E1] group-hover:text-[#C9A227]">
                    {group.icon}
                  </div>

                  <h2 className="text-[14px] font-bold text-[#0F2340]">
                    {group.title}
                  </h2>

                  <p className="mt-1.5 text-[12px] leading-5 text-[#7A8795]">
                    {group.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* QUESTIONS */}
      <section className="py-20 lg:py-28">
        <div className="container-page">
          <div className="mx-auto max-w-[900px]">
            {filteredGroups.length === 0 ? (
              <div className="rounded-[24px] border border-[#E2E8EE] bg-[#FBFCFD] px-6 py-16 text-center">
                <CircleHelp
                  size={34}
                  className="mx-auto text-[#C9A227]"
                />

                <h2 className="mt-5 text-[22px] font-bold">
                  No answer found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-[#718090]">
                  Try another search or contact our
                  support team for help.
                </p>
              </div>
            ) : (
              <div className="space-y-14">
                {filteredGroups.map(
                  (group) => (
                    <div
                      key={group.id}
                      id={group.id}
                      className="scroll-mt-28"
                    >
                      <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF8E1] text-[#C9A227]">
                          {group.icon}
                        </div>

                        <div>
                          <h2 className="text-[23px] font-bold tracking-[-0.02em]">
                            {group.title}
                          </h2>

                          <p className="mt-1 text-[12px] text-[#82909E]">
                            {
                              group.questions
                                .length
                            }{" "}
                            questions
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {group.questions.map(
                          (item) => {
                            const originalIndex =
                              faqGroups
                                .find(
                                  (entry) =>
                                    entry.id ===
                                    group.id,
                                )
                                ?.questions.indexOf(
                                  item,
                                ) ?? 0;

                            const itemId =
                              `${group.id}-${originalIndex}`;

                            const opened =
                              openItem ===
                              itemId;

                            return (
                              <div
                                key={itemId}
                                className={`
                                  overflow-hidden rounded-[17px]
                                  border bg-white transition-all
                                  ${
                                    opened
                                      ? "border-[#C9A227]/40 shadow-[0_10px_30px_rgba(15,35,64,0.07)]"
                                      : "border-[#E2E8EE] hover:border-[#CBD4DD]"
                                  }
                                `}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenItem(
                                      opened
                                        ? null
                                        : itemId,
                                    )
                                  }
                                  className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left sm:px-6"
                                >
                                  <span className="text-[14px] font-semibold text-[#172F4D]">
                                    {item.q}
                                  </span>

                                  <span
                                    className={`
                                      flex h-8 w-8 shrink-0
                                      items-center justify-center
                                      rounded-full transition
                                      ${
                                        opened
                                          ? "bg-[#FFF8E1] text-[#C9A227]"
                                          : "bg-[#F4F6F8] text-[#718090]"
                                      }
                                    `}
                                  >
                                    <ChevronDown
                                      size={17}
                                      className={`transition-transform duration-200 ${
                                        opened
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                  </span>
                                </button>

                                {opened && (
                                  <div className="border-t border-[#EEF1F4] bg-[#FCFDFE] px-5 py-5 text-[13px] leading-7 text-[#647281] sm:px-6">
                                    {item.a}
                                  </div>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="container-page">
          <div className="relative mx-auto max-w-[1000px] overflow-hidden rounded-[28px] bg-[#0F2340] px-6 py-12 text-center text-white shadow-[0_20px_55px_rgba(15,35,64,0.16)]">
            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#C9A227]/10" />

            <div className="relative">
              <MessageCircle
                size={28}
                className="mx-auto text-[#E4BC37]"
              />

              <h2 className="mt-5 text-[29px] font-bold">
                Still need help?
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-[14px] leading-7 text-[#C9D3DF]">
                Tell us what you need and our
                support experience will point you
                in the right direction.
              </p>

              <Link
                href="/contact"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#C9A227] px-6 py-3.5 text-[13px] font-bold transition hover:bg-[#B79321]"
              >
                Contact us
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}