import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cookie,
  Database,
  Eye,
  FileLock2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { ReactNode } from "react";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";

const sections = [
  ["information", "Information we collect"],
  ["use", "How we use information"],
  ["matching", "Professional matching"],
  ["messages", "Messages & reviews"],
  ["notifications", "Notifications"],
  ["sharing", "Data sharing"],
  ["security", "Security"],
  ["retention", "Data retention"],
  ["rights", "Your rights"],
  ["cookies", "Cookies"],
  ["changes", "Policy changes"],
  ["contact", "Contact"],
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-[#0F2340]">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#E7ECF1] bg-[#F8FAFC]">
        <div className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-[#1B365D]/[0.06] blur-3xl" />

        <div className="pointer-events-none absolute -left-32 bottom-[-220px] h-[420px] w-[420px] rounded-full bg-[#C9A227]/[0.08] blur-3xl" />

        <div className="container-page relative py-20 lg:py-24">
          <div className="max-w-[850px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C9A227]/25 bg-white px-4 py-2 text-[12px] font-semibold text-[#1B365D] shadow-sm">
              <LockKeyhole
                size={14}
                className="text-[#C9A227]"
              />
              Privacy & data protection
            </div>

            <h1 className="text-[43px] font-bold leading-[1.08] tracking-[-0.04em] sm:text-[54px] lg:text-[62px]">
              Your privacy matters
              <span className="text-[#C9A227]">.</span>
            </h1>

            <p className="mt-6 max-w-[720px] text-[17px] leading-8 text-[#647281]">
              Learn how information may be
              collected, used and protected when
              you interact with Real Estate Lisbon.
            </p>

            <div className="mt-8 flex flex-wrap gap-5 text-[12px] font-medium text-[#687686]">
              <HeroPoint text="Transparent data use" />
              <HeroPoint text="Security focused" />
              <HeroPoint text="User privacy rights" />
            </div>
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="relative z-10">
        <div className="container-page">
          <div className="-mt-7 grid gap-4 md:grid-cols-3">
            <PrincipleCard
              icon={<Eye size={20} />}
              title="Transparency"
              text="Understand what information may be processed and why."
            />

            <PrincipleCard
              icon={<ShieldCheck size={20} />}
              title="Protection"
              text="Security measures should protect information from unauthorised access."
            />

            <PrincipleCard
              icon={<UserRoundCheck size={20} />}
              title="User control"
              text="Privacy rights and preferences should remain understandable and accessible."
            />
          </div>
        </div>
      </section>

      {/* DOCUMENT */}
      <section className="py-20 lg:py-24">
        <div className="container-page">
          <div className="grid items-start gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">

            {/* SIDEBAR */}
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
                      className="
                        group flex items-center gap-3
                        border-l-2 border-transparent
                        py-2.5 pl-4
                        text-[12px] font-medium
                        text-[#778493]
                        transition
                        hover:border-[#C9A227]
                        hover:text-[#0F2340]
                      "
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

            {/* CONTENT */}
            <article className="min-w-0 max-w-[850px]">
              <div className="mb-10 flex items-center justify-between gap-4 border-b border-[#E7ECF1] pb-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C9A227]">
                    Privacy Policy
                  </p>

                  <p className="mt-2 text-[12px] text-[#8995A2]">
                    Real Estate Lisbon
                  </p>
                </div>

                <div className="rounded-full bg-[#F4F6F8] px-4 py-2 text-[11px] font-medium text-[#718090]">
                  Policy information
                </div>
              </div>

              <LegalSection
                id="information"
                number="01"
                title="Information we may collect"
              >
                <p>
                  Depending on how you use the
                  platform, information processed may
                  include account and profile
                  information such as your name, email
                  address, telephone number, country,
                  city, and profile details.
                </p>

                <p>
                  We may also process information
                  associated with property searches
                  and requests, including location,
                  budget, property criteria, saved
                  properties, professional matches,
                  messages, reviews, notification
                  preferences, and other information
                  you choose to provide.
                </p>
              </LegalSection>

              <LegalSection
                id="use"
                number="02"
                title="How information may be used"
              >
                <p>
                  Information may be used to provide
                  and maintain accounts, operate
                  platform features, process
                  property-related requests, generate
                  relevant professional matches,
                  support messaging, manage saved
                  properties, provide notifications,
                  moderate reviews, respond to support
                  requests, and improve platform
                  operation.
                </p>
              </LegalSection>

              <LegalSection
                id="matching"
                number="03"
                title="Professional matching"
              >
                <p>
                  When you submit a request requiring
                  professional support, relevant
                  request information may be used to
                  identify and present suitable
                  professional profiles.
                </p>

                <p>
                  Information necessary to facilitate
                  an active professional relationship
                  may become available to the relevant
                  parties through platform features.
                </p>
              </LegalSection>

              <LegalSection
                id="messages"
                number="04"
                title="Messages and reviews"
              >
                <p>
                  Messages exchanged through platform
                  messaging features may be stored to
                  provide conversation functionality
                  and maintain relevant service
                  history.
                </p>

                <p>
                  Reviews submitted by buyers may be
                  moderated before publication.
                  Approved ratings or comments may
                  become visible in connection with a
                  professional profile.
                </p>
              </LegalSection>

              <LegalSection
                id="notifications"
                number="05"
                title="Notifications"
              >
                <p>
                  Depending on your account settings,
                  the platform may provide account,
                  lead, matching, property, or other
                  service-related notifications.
                  Available preferences can be managed
                  through the platform where
                  supported.
                </p>
              </LegalSection>

              <LegalSection
                id="sharing"
                number="06"
                title="Data sharing"
              >
                <p>
                  Personal information should only be
                  shared where necessary to operate
                  the platform, provide requested
                  functionality, facilitate
                  professional matching, comply with
                  applicable obligations, protect the
                  platform and its users, or work with
                  authorised service providers.
                </p>
              </LegalSection>

              <LegalSection
                id="security"
                number="07"
                title="Data security"
                icon={<FileLock2 size={18} />}
              >
                <p>
                  Appropriate technical and
                  organisational measures should be
                  used to protect information against
                  unauthorised access, alteration,
                  disclosure, or loss. No online
                  service can guarantee absolute
                  security.
                </p>
              </LegalSection>

              <LegalSection
                id="retention"
                number="08"
                title="Data retention"
                icon={<Database size={18} />}
              >
                <p>
                  Information should be retained only
                  for as long as reasonably necessary
                  for the purposes for which it is
                  processed and as required by
                  applicable legal, security,
                  dispute-resolution, and operational
                  requirements.
                </p>
              </LegalSection>

              <LegalSection
                id="rights"
                number="09"
                title="Your privacy rights"
              >
                <p>
                  Depending on applicable law and the
                  circumstances, users may have rights
                  relating to access, correction,
                  deletion, restriction, objection,
                  portability, or withdrawal of
                  consent.
                </p>
              </LegalSection>

              <LegalSection
                id="cookies"
                number="10"
                title="Cookies and similar technologies"
                icon={<Cookie size={18} />}
              >
                <p>
                  The platform may use cookies or
                  similar technologies that are
                  necessary for authentication,
                  security, preferences, analytics, or
                  other platform functionality.
                  Production disclosures should
                  reflect the technologies actually
                  deployed.
                </p>
              </LegalSection>

              <LegalSection
                id="changes"
                number="11"
                title="Changes to this policy"
              >
                <p>
                  This Privacy Policy may be updated
                  as the platform, its features, or
                  applicable requirements evolve. The
                  current version should remain
                  available on this page.
                </p>
              </LegalSection>

              <LegalSection
                id="contact"
                number="12"
                title="Contact"
              >
                <p>
                  For privacy-related questions or
                  requests, please contact our team
                  through the dedicated support page.
                </p>

                <Link
                  href="/contact"
                  className="mt-3 inline-flex items-center gap-2 font-semibold text-[#1B365D] transition hover:text-[#C9A227]"
                >
                  Contact support
                  <ArrowRight size={14} />
                </Link>
              </LegalSection>
            </article>
          </div>
        </div>
      </section>

      {/* PRIVACY CTA */}
      <section className="pb-20">
        <div className="container-page">
          <div className="rounded-[26px] border border-[#E2E8EE] bg-[#F8FAFC] p-8 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#C9A227] shadow-sm">
                <Mail size={20} />
              </div>

              <div>
                <h2 className="text-[18px] font-bold">
                  Have a privacy question?
                </h2>

                <p className="mt-1 text-[13px] leading-6 text-[#718090]">
                  Contact our team for
                  privacy-related enquiries.
                </p>
              </div>
            </div>

            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-[#0F2340] sm:mt-0"
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
        className="text-[#C9A227]"
      />
      {text}
    </span>
  );
}

function PrincipleCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#E2E8EE] bg-white p-5 shadow-[0_10px_30px_rgba(15,35,64,0.07)]">
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

function LegalSection({
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