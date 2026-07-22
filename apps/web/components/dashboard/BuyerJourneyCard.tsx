import Link from "next/link";
import { CheckCircle2, Circle, Route } from "lucide-react";
import type { BuyerProfileSummary } from "@/lib/profile-api";

type JourneyKey = keyof BuyerProfileSummary["journey"];

const steps: {
  key: JourneyKey;
  title: string;
  description: string;
  href?: string;
}[] = [
  {
    key: "accountCreated",
    title: "Account created",
    description: "Your buyer account is active.",
  },
  {
    key: "profileCompleted",
    title: "Profile completed",
    description: "Add phone, country and buyer information.",
    href: "/dashboard/settings",
  },
  {
    key: "firstToolCompleted",
    title: "First buyer tool used",
    description: "Use a tool to generate your first request.",
    href: "/tools/property-search-assistant",
  },
  {
    key: "matchedWithProfessional",
    title: "Professional matched",
    description: "Admin has matched you with a professional.",
    href: "/dashboard/my-matches",
  },
  {
    key: "contactedProfessional",
    title: "Professional contacted",
    description: "A professional has started the conversation.",
    href: "/dashboard/messages",
  },
  {
    key: "completedJourney",
    title: "Journey completed",
    description: "Your match has been completed.",
    href: "/dashboard/my-matches",
  },
];

export default function BuyerJourneyCard({
  profile,
}: {
  profile: BuyerProfileSummary;
}) {
  const completedCount = steps.filter((step) => profile.journey[step.key]).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_6px_22px_rgba(16,24,40,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#C9A227]">
            Buyer Journey
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#0F2340]">
            Your buying progress
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#667085]">
            Follow the key steps from profile creation to professional support.
          </p>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF3F8] text-[#1B365D]">
          <Route size={24} />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-[#0F2340]">
            Journey completion
          </span>
          <span className="font-bold text-[#1B365D]">
            {completedCount}/{steps.length}
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className="h-full rounded-full bg-[#1B365D]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {steps.map((step) => {
          const done = profile.journey[step.key];

          const content = (
            <div
              className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                done
                  ? "border-green-100 bg-green-50"
                  : "border-[#E5E7EB] bg-[#F8F9FA] hover:bg-white"
              }`}
            >
              {done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 text-[#98A2B3]" />
              )}

              <div>
                <p className="font-semibold text-[#0F2340]">{step.title}</p>
                <p className="mt-1 text-sm leading-5 text-[#667085]">
                  {step.description}
                </p>
              </div>
            </div>
          );

          if (!done && step.href) {
            return (
              <Link key={step.key} href={step.href}>
                {content}
              </Link>
            );
          }

          return <div key={step.key}>{content}</div>;
        })}
      </div>
    </div>
  );
}