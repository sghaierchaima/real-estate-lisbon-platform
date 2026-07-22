import { ArrowUpRight, AlertCircle } from "lucide-react";
import type { DashboardStats } from "@/lib/dashboard-api";
import Link from "next/link";

export default function NeedsAttention({
  stats,
}: {
  stats: DashboardStats | null;
}) {
  const alerts = [
    {
      title: `${stats?.stories.pending ?? 0} Pending Stories`,
      text: "Success stories waiting for admin review.",
      cta: "Review Stories",
      href: "/dashboard/stories",
      tone: "orange",
      count: stats?.stories.pending ?? 0,
    },
    {
      title: `${stats?.leads.hot ?? 0} Hot Leads`,
      text: "High-priority buyer leads need fast follow-up.",
      cta: "View Leads",
      href: "/dashboard/leads",
      tone: "red",
      count: stats?.leads.hot ?? 0,
    },
    {
      title: `${stats?.matching.pending ?? 0} Pending Matches`,
      text: "Matches waiting for admin approval.",
      cta: "Review Matching",
      href: "/dashboard/matching",
      tone: "orange",
      count: stats?.matching.pending ?? 0,
    },
  ];

  const activeAlerts = alerts.filter((item) => item.count > 0);

  return (
    <div className="h-full rounded-[28px] border border-[#E9EDF3] bg-white p-6 shadow-[0_8px_24px_rgba(15,35,64,0.05)]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[#0F2340]">
          Needs Attention
        </h3>

        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-[14px] font-semibold text-red-500">
          {activeAlerts.length}
        </span>
      </div>

      <div className="space-y-4">
        {activeAlerts.length === 0 ? (
          <div className="rounded-[24px] bg-green-50 p-6 text-[#166534]">
            Everything looks good.
          </div>
        ) : (
          activeAlerts.map((alert) => (
            <div
              key={alert.title}
              className={`rounded-[24px] border-l-4 p-6 ${
                alert.tone === "orange"
                  ? "border-orange-500 bg-orange-50/60"
                  : "border-red-500 bg-red-50/60"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0 text-[#EF4444]" />

                <div className="min-w-0 flex-1">
                  <p className="text-[18px] font-semibold leading-6 text-[#0F2340]">
                    {alert.title}
                  </p>

                  <p className="mt-2 text-[15px] leading-6 text-gray-600">
                    {alert.text}
                  </p>

                  <Link
                    href={alert.href}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#E5EAF1] bg-white px-4 py-2.5 text-[15px] font-medium text-[#1B365D] transition hover:bg-[#F8FAFC]"
                  >
                    {alert.cta}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}