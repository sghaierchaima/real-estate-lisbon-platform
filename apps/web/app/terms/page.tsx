import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  CheckCircle2,
  FileCheck2,
  FileText,
  Handshake,
  Home,
  MessageSquare,
  Scale,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ReactNode } from "react";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";

const sections = [
  ["platform", "About the platform"],
  ["accounts", "User accounts"],
  ["roles", "Account roles"],
  ["matching", "Professional matching"],
  ["services", "Professional services"],
  ["properties", "Property information"],
  ["tools", "Calculators & tools"],
  ["communications", "Communications"],
  ["reviews", "Reviews"],
  ["acceptable-use", "Acceptable use"],
  ["availability", "Platform availability"],
  ["privacy", "Privacy"],
  ["changes", "Changes to terms"],
  ["contact", "Contact"],
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-[#0F2340]">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#E7ECF1] bg-[#0F2340] text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full border-[80px] border-white/[0.025]" />

        <div className="pointer-events-none absolute -bottom-40 left-[20%] h-[420px] w-[420px] rounded-full bg-[#C9A227]/[0.08] blur-3xl" />

        <div className="container-page relative py-20 lg:py-24">
          <div className="max-w-[850px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[12px] font-semibold text-[#E6EDF5]">
              <FileText
                size={14}
                className="text-[#E4BC37]"
              />
              Platform terms
            </div>

            <h1 className="text-[43px] font-bold leading-[1.08] tracking-[-0.04em] sm:text-[54px] lg:text-[62px]">
              Terms of Service
              <span className="text-[#E4BC37]">.</span>
            </h1>

            <p className="mt-6 max-w-[720px] text-[17px] leading-8 text-[#C5D0DC]">
              Understand the general conditions,
              responsibilities and rules governing
              access to the Real Estate Lisbon
              platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-5 text-[12px] font-medium text-[#C8D2DD]">
              <HeroPoint text="Clear responsibilities" />
              <HeroPoint text="Responsible platform use" />
              <HeroPoint text="Transparent expectations" />
            </div>
          </div>
        </div>
      </section>

      {/* SUMMARY */}
      <section className="relative z-10">
        <div className="container-page">
          <div className="-mt-7 grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={<Handshake size={20} />}
              title="Fair use"
              text="Use the platform and its communication features responsibly."
            />

            <SummaryCard
              icon={<Scale size={20} />}
              title="Clear responsibilities"
              text="Buyers, professionals and the platform have different roles."
            />

            <SummaryCard
              icon={<ShieldCheck size={20} />}
              title="Informed decisions"
              text="Tools and matches support decisions but do not replace specialist advice."
            />
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-20 lg:py-24">
        <div className="container-page">
          <div className="grid items-start gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">

            <aside className="hidden lg:sticky lg:top-28 lg:block">
              <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.17em] text-[#9AA4B1]">
                On this page
              </div>

              <nav className="border-l border-[#E1E7ED]">
                {sections.map(
                  ([id, label], index) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="group flex items-center gap-3 border-l-2 border-transparent py-2.5 pl-4 text-[12px] font-medium text-[#778493] transition hover:border-[#C9A227] hover:text-[#0F2340]"
                    >
                      <span className="text-[10px] text-[#B2BBC4] group-hover:text-[#C9A227]">
                        {String(
                          index + 1,
                        ).padStart(2, "0")}
                      </span>

                      {label}
                    </a>
                  ),
                )}
              </nav>
            </aside>

            <article className="min-w-0 max-w-[850px]">
              <div className="mb-10 flex items-center justify-between gap-4 border-b border-[#E7ECF1] pb-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C9A227]">
                    Terms of Service
                  </p>

                  <p className="mt-2 text-[12px] text-[#8995A2]">
                    Real Estate Lisbon
                  </p>
                </div>

                <div className="rounded-full bg-[#F4F6F8] px-4 py-2 text-[11px] font-medium text-[#718090]">
                  Platform conditions
                </div>
              </div>

              <Section
                id="platform"
                number="01"
                title="About the platform"
                icon={<Building2 size={18} />}
              >
                <p>
                  Real Estate Lisbon provides
                  digital tools and features intended
                  to assist users exploring property
                  opportunities and property-related
                  services in Portugal.
                </p>

                <p>
                  Platform functionality may include
                  property listings, saved
                  properties, calculators,
                  neighbourhood information, property
                  search tools, buyer requests,
                  professional matching, messaging,
                  notifications, and reviews.
                </p>
              </Section>

              <Section
                id="accounts"
                number="02"
                title="User accounts"
                icon={<UserRound size={18} />}
              >
                <p>
                  Certain features require a
                  registered account. Users are
                  responsible for providing accurate
                  information and maintaining the
                  confidentiality of their account
                  credentials.
                </p>

                <p>
                  Users should notify the platform if
                  they believe their account has been
                  accessed or used without
                  authorisation.
                </p>
              </Section>

              <Section
                id="roles"
                number="03"
                title="Buyer and professional accounts"
              >
                <p>
                  The platform may provide different
                  functionality according to account
                  role. Buyer accounts may access
                  buyer-oriented functionality, while
                  professional accounts may access
                  professional profiles, assigned
                  matches, leads, messaging, and
                  other relevant functionality.
                </p>
              </Section>

              <Section
                id="matching"
                number="04"
                title="Professional matching"
                icon={<BadgeCheck size={18} />}
              >
                <p>
                  Matching functionality is designed
                  to help connect buyers with
                  potentially relevant property
                  professionals based on available
                  request and profile information.
                </p>

                <p>
                  A match or match score does not
                  constitute a guarantee,
                  endorsement, certification, or
                  promise that a particular
                  professional will be appropriate
                  for every user's individual
                  circumstances.
                </p>
              </Section>

              <Section
                id="services"
                number="05"
                title="Professional services"
              >
                <p>
                  Professionals are responsible for
                  the services they provide, the
                  information they communicate, and
                  any separate engagement or
                  agreement they enter into with
                  users.
                </p>

                <p>
                  Users should independently assess a
                  professional's qualifications,
                  authorisations, experience, scope
                  of service, fees, and suitability.
                </p>
              </Section>

              <Section
                id="properties"
                number="06"
                title="Property information"
                icon={<Home size={18} />}
              >
                <p>
                  Property information may be
                  supplied by professionals or other
                  data sources. Availability,
                  descriptions, prices, dimensions,
                  images, characteristics, and other
                  information may change.
                </p>

                <p>
                  Users should verify material
                  property information before making
                  decisions or entering into
                  transactions.
                </p>
              </Section>

              <Section
                id="tools"
                number="07"
                title="Calculators, estimates and tools"
                icon={<Calculator size={18} />}
              >
                <p>
                  Calculators, price-checking
                  features, affordability tools,
                  valuation-related functionality,
                  neighbourhood information, search
                  assistance, and similar tools are
                  intended to provide informational
                  or decision-support outputs.
                </p>

                <p>
                  Their outputs should not be treated
                  as guaranteed property values, loan
                  offers, financial advice, legal
                  advice, tax advice, insurance
                  advice, or other regulated
                  professional advice.
                </p>
              </Section>

              <Section
                id="communications"
                number="08"
                title="Messages and communications"
                icon={<MessageSquare size={18} />}
              >
                <p>
                  Users must use messaging and
                  communication features responsibly
                  and must not use them for unlawful,
                  fraudulent, abusive, threatening,
                  misleading, or unsolicited
                  activity.
                </p>
              </Section>

              <Section
                id="reviews"
                number="09"
                title="Reviews"
              >
                <p>
                  Eligible users may be able to
                  submit ratings or comments about
                  their experience with a
                  professional. Reviews should
                  reflect genuine experiences and
                  must not contain unlawful, abusive,
                  fraudulent, or intentionally
                  misleading content.
                </p>

                <p>
                  Reviews may be moderated before or
                  after publication in accordance
                  with platform rules.
                </p>
              </Section>

              <Section
                id="acceptable-use"
                number="10"
                title="Acceptable use"
              >
                <p>
                  Users must not attempt to interfere
                  with platform security, gain
                  unauthorised access, misuse another
                  user's account, introduce malicious
                  software, or use the platform for
                  unlawful purposes.
                </p>
              </Section>

              <Section
                id="availability"
                number="11"
                title="Availability and changes"
              >
                <p>
                  Platform functionality may be
                  changed, improved, restricted,
                  suspended, or discontinued as the
                  service evolves. Temporary
                  interruptions may occur because of
                  maintenance, technical issues,
                  security measures, or third-party
                  dependencies.
                </p>
              </Section>

              <Section
                id="privacy"
                number="12"
                title="Privacy"
              >
                <p>
                  Information relating to privacy and
                  the processing of personal data is
                  described in our Privacy Policy.
                </p>

                <Link
                  href="/privacy"
                  className="mt-3 inline-flex items-center gap-2 font-semibold text-[#1B365D] transition hover:text-[#C9A227]"
                >
                  Read Privacy Policy
                  <ArrowRight size={14} />
                </Link>
              </Section>

              <Section
                id="changes"
                number="13"
                title="Changes to these terms"
              >
                <p>
                  These Terms of Service may be
                  updated as platform functionality
                  or applicable requirements evolve.
                  The current version should remain
                  available through this page.
                </p>
              </Section>

              <Section
                id="contact"
                number="14"
                title="Contact"
              >
                <p>
                  Questions about these terms or the
                  platform can be submitted through
                  our Contact page.
                </p>

                <Link
                  href="/contact"
                  className="mt-3 inline-flex items-center gap-2 font-semibold text-[#1B365D] transition hover:text-[#C9A227]"
                >
                  Contact support
                  <ArrowRight size={14} />
                </Link>
              </Section>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-[26px] bg-[#0F2340] p-8 text-white sm:flex sm:items-center sm:justify-between sm:gap-10 sm:p-10">
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border-[40px] border-white/[0.025]" />

            <div className="relative flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-[#E4BC37]">
                <FileCheck2 size={21} />
              </div>

              <div>
                <h2 className="text-[19px] font-bold">
                  Questions about the platform?
                </h2>

                <p className="mt-1 max-w-lg text-[13px] leading-6 text-[#C7D1DD]">
                  Visit our help centre or contact
                  the support team.
                </p>
              </div>
            </div>

            <Link
              href="/contact"
              className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-[#C9A227] px-5 py-3 text-[12px] font-bold transition hover:bg-[#B79321] sm:mt-0"
            >
              Contact us
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function HeroPoint({
  text,
}: {
  text: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <CheckCircle2
        size={15}
        className="text-[#E4BC37]"
      />
      {text}
    </span>
  );
}

function SummaryCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#E2E8EE] bg-white p-5 shadow-[0_10px_30px_rgba(15,35,64,0.08)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF8E1] text-[#C9A227]">
        {icon}
      </div>

      <h3 className="text-[14px] font-bold">
        {title}
      </h3>

      <p className="mt-1.5 text-[12px] leading-5 text-[#778493]">
        {text}
      </p>
    </div>
  );
}

function Section({
  id,
  number,
  title,
  icon,
  children,
}: {
  id: string;
  number: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-b border-[#E9EDF1] py-9 first:pt-0"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="text-[11px] font-bold tracking-[0.12em] text-[#C9A227]">
          {number}
        </span>

        {icon && (
          <span className="text-[#1B365D]">
            {icon}
          </span>
        )}

        <h2 className="text-[20px] font-bold tracking-[-0.015em]">
          {title}
        </h2>
      </div>

      <div className="space-y-4 text-[14px] leading-7 text-[#647281]">
        {children}
      </div>
    </section>
  );
}