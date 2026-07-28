import { CheckCircle, Sparkles } from "lucide-react";
import type { BuyerProfileSummary } from "@/lib/profile-api";

function formatTier(tier: BuyerProfileSummary["profileTier"]) {
  const labels = {
    REGISTERED: "Registered",
    EXPLORER: "Explorer",
    ACTIVE_BUYER: "Active Buyer",
    QUALIFIED: "Qualified Buyer",
    PRIORITY: "Priority Buyer",
  };

  return labels[tier];
}

export default function ProfileProgressCard({
  profile,
}: {
  profile: BuyerProfileSummary;
}) {
  return (
    <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#C9A227]">
            Buyer Profile
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#0F2340]">
            {formatTier(profile.profileTier)}
          </h2>

          <p className="mt-2 text-sm text-[#667085]">
            Your profile improves automatically as you use tools and interact
            with professionals.
          </p>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F3E8] text-[#C9A227]">
          <Sparkles size={24} />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-[#0F2340]">Profile completion</span>
          <span className="font-bold text-[#1B365D]">
            {profile.profileCompletion}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className="h-full rounded-full bg-[#C9A227]"
            style={{ width: `${profile.profileCompletion}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-[#F8F9FA] p-4">
          <p className="text-sm text-[#667085]">Requests</p>
          <p className="mt-1 text-2xl font-bold text-[#0F2340]">
            {profile.totalRequests}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F8F9FA] p-4">
          <p className="text-sm text-[#667085]">Matches</p>
          <p className="mt-1 text-2xl font-bold text-[#0F2340]">
            {profile.totalMatches}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F8F9FA] p-4">
          <p className="text-sm text-[#667085]">Tools used</p>
          <p className="mt-1 text-2xl font-bold text-[#0F2340]">
            {profile.usedTools.length}
          </p>
        </div>
      </div>

      {profile.nextSteps.length > 0 && (
        <div className="mt-6 rounded-2xl bg-[#FFFBEB] p-5">
          <p className="font-semibold text-[#0F2340]">Next best actions</p>

          <div className="mt-3 space-y-2">
            {profile.nextSteps.map((step) => (
              <div key={step} className="flex items-center gap-2 text-sm text-[#4B5563]">
                <CheckCircle size={16} className="text-[#C9A227]" />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  ); 
}