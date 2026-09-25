"use client";

import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  FormEvent,
  ReactNode,
  useState,
} from "react";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";

import {
  createContactMessage,
} from "@/lib/contact";

/*
 * ============================================================
 * CONTACT SUBJECTS
 * ============================================================
 */

const CONTACT_SUBJECTS = [
  "General enquiry",
  "Buyer support",
  "Professional support",
  "Property or matching question",
  "Account support",
  "Technical issue",
  "Privacy question",
] as const;


/*
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function ContactPage() {
  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [subject, setSubject] =
    useState("General enquiry");

  const [message, setMessage] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    /*
     * Prevent duplicate requests.
     */
    if (isSubmitting) {
      return;
    }

    setError("");

    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanMessage =
      message.trim();

    /*
     * Client-side validation.
     */
    if (!cleanName) {
      setError(
        "Please enter your full name.",
      );

      return;
    }

    if (!cleanEmail) {
      setError(
        "Please enter your email address.",
      );

      return;
    }

    /*
     * Simple email format validation.
     */
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      setError(
        "Please enter a valid email address.",
      );

      return;
    }

    if (!subject) {
      setError(
        "Please select a subject.",
      );

      return;
    }

    if (cleanMessage.length < 10) {
      setError(
        "Please provide at least 10 characters in your message.",
      );

      return;
    }

    if (cleanMessage.length > 2000) {
      setError(
        "Your message cannot exceed 2,000 characters.",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      await createContactMessage({
        name:
          cleanName,

        email:
          cleanEmail,

        subject,

        message:
          cleanMessage,
      });

      /*
       * Show success only when
       * the backend accepted the request.
       */
      setSubmitted(true);
    } catch (error) {
      console.error(
        "Unable to send contact message:",
        error,
      );

      setError(
        "We couldn't send your message. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
   * ==========================================================
   * RESET
   * ==========================================================
   */

  function resetForm() {
    setName("");
    setEmail("");
    setSubject(
      "General enquiry",
    );
    setMessage("");

    setError("");
    setSubmitted(false);
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      <Navbar />

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#0F2340]">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-40 h-[420px] w-[420px] rounded-full bg-[#C9A227]/10 blur-[100px]" />

          <div className="absolute -right-32 top-10 h-[460px] w-[460px] rounded-full bg-blue-400/10 blur-[120px]" />

          <div
            className="
              absolute inset-0 opacity-[0.035]
              [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]
              [background-size:42px_42px]
            "
          />
        </div>

        <div className="container-page relative py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-[780px] text-center">
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[12px] font-semibold text-white/90 backdrop-blur">
              <Sparkles
                size={14}
                className="text-[#E0BF55]"
              />

              Real Estate Lisbon Support
            </div>

            <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.035em] text-white sm:text-[48px] lg:text-[56px]">
              How can we help?
            </h1>

            <p className="mx-auto mt-5 max-w-[650px] text-[15px] leading-7 text-[#C8D1DE] sm:text-[16px]">
              Whether you&apos;re buying property in Portugal,
              looking for a trusted professional, or need help
              with your account, our team is here to guide you.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12px] font-medium text-white/70">
              <HeroTrustItem
                icon={
                  <ShieldCheck size={15} />
                }
              >
                Secure enquiries
              </HeroTrustItem>

              <HeroTrustItem
                icon={
                  <Clock3 size={15} />
                }
              >
                Clear support process
              </HeroTrustItem>

              <HeroTrustItem
                icon={
                  <Headphones size={15} />
                }
              >
                Buyer & professional support
              </HeroTrustItem>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </section>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <section className="container-page py-12 sm:py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-10">
          {/* =================================================
              LEFT COLUMN
          ================================================== */}

          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C9A227]">
                Contact us
              </span>

              <h2 className="mt-3 max-w-[420px] text-[30px] font-bold leading-[1.15] tracking-[-0.025em] text-[#0F2340]">
                Support for every step of your property journey.
              </h2>

              <p className="mt-4 max-w-[470px] text-[14px] leading-7 text-[#6E7B89]">
                Send us your question and provide as much
                relevant detail as possible. This helps our
                team understand your request and direct it
                appropriately.
              </p>
            </div>

            {/* Contact information */}
            <div className="overflow-hidden rounded-[22px] border border-[#E5EAF0] bg-white shadow-[0_14px_40px_rgba(15,35,64,0.06)]">
              <ContactInfoItem
                icon={
                  <Mail size={19} />
                }
                title="Email support"
                description="Questions about your account, property journey or professional matching."
              />

              <Divider />

              <ContactInfoItem
                icon={
                  <MessageCircle size={19} />
                }
                title="Platform support"
                description="Report technical issues or ask for help using Real Estate Lisbon."
              />

              <Divider />

              <ContactInfoItem
                icon={
                  <MapPin size={19} />
                }
                title="Portugal property journey"
                description="Support designed around buyers navigating the Portuguese real-estate market."
              />
            </div>

            {/* Trust card */}
            <div className="relative overflow-hidden rounded-[22px] bg-[#0F2340] p-6 text-white shadow-[0_18px_40px_rgba(15,35,64,0.14)]">
              <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#C9A227]/15 blur-3xl" />

              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck
                    size={20}
                    className="text-[#E0BF55]"
                  />
                </div>

                <h3 className="mt-5 text-[17px] font-semibold">
                  Your enquiry matters
                </h3>

                <p className="mt-2 text-[13px] leading-6 text-[#C8D1DE]">
                  Your contact request is stored securely in
                  our support system so it can be reviewed by
                  the appropriate team.
                </p>

                <Link
                  href="/privacy"
                  className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold text-[#E0BF55] transition hover:text-white"
                >
                  View our Privacy Policy

                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* =================================================
              FORM CARD
          ================================================== */}

          <div
            className="
              overflow-hidden
              rounded-[26px]
              border border-[#E3E8EF]
              bg-white
              shadow-[0_20px_60px_rgba(15,35,64,0.08)]
            "
          >
            {submitted ? (
              <SuccessState
                onReset={resetForm}
              />
            ) : (
              <>
                {/* Form header */}
                <div className="border-b border-[#EDF0F4] px-6 py-6 sm:px-8 lg:px-10">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#C9A227]">
                        Send a message
                      </p>

                      <h2 className="mt-2 text-[24px] font-bold tracking-[-0.02em] text-[#0F2340]">
                        Tell us how we can help
                      </h2>

                      <p className="mt-2 max-w-[530px] text-[13px] leading-6 text-[#7A8795]">
                        Complete the form below and your
                        enquiry will be submitted directly
                        to our support system.
                      </p>
                    </div>

                    <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F7FB] text-[#1B365D] sm:flex">
                      <Send size={20} />
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5 px-6 py-7 sm:px-8 lg:px-10 lg:py-9"
                >
                  {/* Name + email */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      label="Full name"
                      required
                    >
                      <input
                        type="text"
                        value={name}
                        onChange={(event) => {
                          setName(
                            event.target.value,
                          );

                          if (error) {
                            setError("");
                          }
                        }}
                        autoComplete="name"
                        maxLength={100}
                        required
                        disabled={isSubmitting}
                        placeholder="Your full name"
                        className={inputClassName}
                      />
                    </FormField>

                    <FormField
                      label="Email address"
                      required
                    >
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(
                            event.target.value,
                          );

                          if (error) {
                            setError("");
                          }
                        }}
                        autoComplete="email"
                        maxLength={254}
                        required
                        disabled={isSubmitting}
                        placeholder="you@example.com"
                        className={inputClassName}
                      />
                    </FormField>
                  </div>

                  {/* Subject */}
                  <FormField
                    label="How can we help?"
                    required
                  >
                    <div className="relative">
                      <select
                        value={subject}
                        onChange={(event) => {
                          setSubject(
                            event.target.value,
                          );

                          if (error) {
                            setError("");
                          }
                        }}
                        required
                        disabled={isSubmitting}
                        className={`${inputClassName} appearance-none pr-11`}
                      >
                        {CONTACT_SUBJECTS.map(
                          (item) => (
                            <option
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          ),
                        )}
                      </select>

                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8290A0]">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6 9L12 15L18 9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </FormField>

                  {/* Message */}
                  <FormField
                    label="Message"
                    required
                  >
                    <textarea
                      value={message}
                      onChange={(event) => {
                        setMessage(
                          event.target.value,
                        );

                        if (error) {
                          setError("");
                        }
                      }}
                      minLength={10}
                      maxLength={2000}
                      required
                      disabled={isSubmitting}
                      rows={7}
                      placeholder="Tell us what you need help with. Include any useful details about your property search, account, professional match or technical issue."
                      className={`${inputClassName} min-h-[170px] resize-y leading-6`}
                    />

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-[#9AA5B1]">
                        Please avoid sharing passwords or sensitive financial information.
                      </p>

                      <span
                        className={`
                          shrink-0 text-[11px] font-medium
                          ${
                            message.length > 1800
                              ? "text-amber-600"
                              : "text-[#9AA5B1]"
                          }
                        `}
                      >
                        {message.length}/2000
                      </span>
                    </div>
                  </FormField>

                  {/* Error */}
                  {error && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="
                        flex items-start gap-3
                        rounded-[14px]
                        border border-red-200
                        bg-red-50
                        px-4 py-3.5
                        text-[12px]
                        font-medium
                        leading-5
                        text-red-700
                      "
                    >
                      <span className="mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold">
                        !
                      </span>

                      <span>
                        {error}
                      </span>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="
                      group
                      flex w-full
                      items-center
                      justify-center
                      gap-2.5
                      rounded-[14px]
                      bg-[#1B365D]
                      px-6 py-[15px]
                      text-[14px]
                      font-semibold
                      text-white
                      shadow-[0_8px_20px_rgba(27,54,93,0.16)]
                      transition-all
                      duration-200

                      hover:-translate-y-0.5
                      hover:bg-[#0F2340]
                      hover:shadow-[0_12px_28px_rgba(15,35,64,0.22)]

                      disabled:pointer-events-none
                      disabled:translate-y-0
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        Sending message...
                      </>
                    ) : (
                      <>
                        Send message

                        <Send
                          size={16}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </>
                    )}
                  </button>

                  {/* Footer note */}
                  <div className="flex items-center justify-center gap-2 pt-1 text-center text-[11px] leading-5 text-[#8B97A5]">
                    <ShieldCheck
                      size={13}
                      className="shrink-0 text-[#7B8B9C]"
                    />

                    By submitting this form, you agree that we
                    may use the information provided to respond
                    to your enquiry.
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          BOTTOM SUPPORT CTA
      ====================================================== */}

      <section className="border-t border-[#E8ECF1] bg-white">
        <div className="container-page py-12">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[24px] border border-[#E4E9EF] bg-[#F8FAFC] px-6 py-7 sm:px-8 md:flex-row md:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C9A227]">
                Explore the platform
              </p>

              <h3 className="mt-2 text-[20px] font-bold text-[#0F2340]">
                Looking for a trusted property professional?
              </h3>

              <p className="mt-2 text-[13px] leading-6 text-[#748190]">
                Browse verified professionals across the services
                needed during your property journey.
              </p>
            </div>

            <Link
              href="/professionals"
              className="
                inline-flex shrink-0
                items-center gap-2
                rounded-xl
                bg-[#0F2340]
                px-5 py-3
                text-[13px]
                font-semibold
                text-white
                transition
                hover:bg-[#1B365D]
              "
            >
              Find professionals

              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}


/*
 * ============================================================
 * SHARED INPUT STYLE
 * ============================================================
 */

const inputClassName = `
  w-full
  rounded-[13px]
  border border-[#DCE2E9]
  bg-white
  px-4 py-[13px]
  text-[13px]
  text-[#172A45]
  outline-none
  transition-all
  duration-200

  placeholder:text-[#A4ADB8]

  hover:border-[#C8D0DA]

  focus:border-[#1B365D]
  focus:ring-4
  focus:ring-[#1B365D]/[0.07]

  disabled:cursor-not-allowed
  disabled:bg-[#F7F8FA]
  disabled:opacity-70
`;


/*
 * ============================================================
 * FORM FIELD
 * ============================================================
 */

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[12px] font-semibold text-[#243B5A]">
        {label}

        {required && (
          <span className="ml-1 text-[#C9A227]">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}


/*
 * ============================================================
 * HERO TRUST ITEM
 * ============================================================
 */

function HeroTrustItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#E0BF55]">
        {icon}
      </span>

      {children}
    </div>
  );
}


/*
 * ============================================================
 * CONTACT INFORMATION ITEM
 * ============================================================
 */

function ContactInfoItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-5 sm:p-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#F2F5F9] text-[#1B365D]">
        {icon}
      </div>

      <div>
        <h3 className="text-[14px] font-semibold text-[#0F2340]">
          {title}
        </h3>

        <p className="mt-1.5 text-[12px] leading-6 text-[#778493]">
          {description}
        </p>
      </div>
    </div>
  );
}


/*
 * ============================================================
 * DIVIDER
 * ============================================================
 */

function Divider() {
  return (
    <div className="mx-5 h-px bg-[#EDF0F3] sm:mx-6" />
  );
}


/*
 * ============================================================
 * SUCCESS STATE
 * ============================================================
 */

function SuccessState({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <div className="relative flex min-h-[610px] flex-col items-center justify-center overflow-hidden px-6 py-12 text-center sm:px-10">
      {/* Decoration */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/[0.07] blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#C9A227]/[0.06] blur-3xl" />

      <div className="relative">
        {/* Icon */}
        <div className="relative mx-auto">
          <div className="absolute inset-0 scale-[1.55] rounded-full bg-emerald-500/10 blur-xl" />

          <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 shadow-[0_8px_25px_rgba(16,185,129,0.10)]">
            <CheckCircle2
              size={34}
              className="text-emerald-600"
            />
          </div>
        </div>

        {/* Badge */}
        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">
          <CheckCircle2 size={13} />

          Successfully submitted
        </div>

        {/* Heading */}
        <h2 className="mt-5 text-[28px] font-bold tracking-[-0.025em] text-[#0F2340]">
          Message received
        </h2>

        <p className="mx-auto mt-3 max-w-[460px] text-[14px] leading-7 text-[#6E7B89]">
          Thank you for contacting Real Estate Lisbon.
          Your enquiry has been submitted successfully and
          is now available to our support team.
        </p>

        {/* What happens next */}
        <div className="mx-auto mt-8 max-w-[460px] rounded-[18px] border border-[#E5EAF0] bg-[#F8FAFC] p-5 text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8290A0]">
            What happens next?
          </p>

          <div className="mt-4 space-y-3">
            <SuccessStep
              number="1"
              text="Your message is securely stored in our support system."
            />

            <SuccessStep
              number="2"
              text="Our team can review the subject and details of your enquiry."
            />

            <SuccessStep
              number="3"
              text="The appropriate support process can then follow."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onReset}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#1B365D]
              px-5 py-3
              text-[13px]
              font-semibold
              text-white
              transition
              hover:bg-[#0F2340]
            "
          >
            Send another message

            <Send size={14} />
          </button>

          <Link
            href="/"
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border border-[#DDE3EA]
              bg-white
              px-5 py-3
              text-[13px]
              font-semibold
              text-[#1B365D]
              transition
              hover:bg-[#F7F9FB]
            "
          >
            Back to home

            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}


/*
 * ============================================================
 * SUCCESS STEP
 * ============================================================
 */

function SuccessStep({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E9EEF5] text-[10px] font-bold text-[#1B365D]">
        {number}
      </span>

      <p className="pt-[2px] text-[12px] leading-5 text-[#667585]">
        {text}
      </p>
    </div>
  );
}