"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  GitBranch,
  Star,
  Target,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/dashboard/StatCard";
import {
  getAnalyticsDashboard,
  type AnalyticsDashboard,
} from "@/lib/dashboard-api";
import { getToken } from "@/lib/session";
import { useToast } from "@/components/ui/ToastProvider";

export default function AnalyticsPage() {
  const toast = useToast();
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadAnalytics() {
      const token = getToken();

      if (!token) {
        toast.warning("Session required", "Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        const result = await getAnalyticsDashboard(token);
        setData(result);
      } catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : "Please try again.";

  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("403") ||
    normalizedMessage.includes("forbidden") ||
    normalizedMessage.includes("permission")
  ) {
    router.replace("/access-denied");
    return;
  }

  if (
    normalizedMessage.includes("401") ||
    normalizedMessage.includes("unauthorized")
  ) {
    router.replace("/login");
    return;
  }

  toast.error(
    "Unable to load analytics",
    message,
  );
}finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [router,toast]);

  if (loading) {
    return <div className="text-[#667085]">Loading analytics...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[52px] font-semibold leading-[1] tracking-[-0.02em] text-[#0F2340]">
          Analytics
        </h1>

        <p className="mt-3 text-[18px] text-[#667085]">
          Monitor platform performance, lead quality and matching efficiency.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={String(data?.totals.leads ?? 0)}
          subtext="All buyer requests"
          growth="Live"
          icon={Target}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />

        <StatCard
          title="Total Matches"
          value={String(data?.totals.matches ?? 0)}
          subtext="Generated matches"
          growth="Live"
          icon={GitBranch}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />

        <StatCard
          title="Conversion Rate"
          value={`${data?.totals.conversionRate ?? 0}%`}
          subtext="Matched leads / total leads"
          growth="Live"
          icon={Activity}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />

        <StatCard
          title="Avg Match Score"
          value={`${data?.totals.averageMatchScore ?? 0}%`}
          subtext="Matching quality"
          growth="Live"
          icon={Star}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <BarChart3 className="text-[#1B365D]" />
            <h2 className="text-2xl font-semibold text-[#0F2340]">
              Leads by Source
            </h2>
          </div>

          <div className="space-y-4">
            {(data?.leadsBySource ?? []).map((item) => (
              <div key={item.source}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-[#0F2340]">
                    {item.source}
                  </span>
                  <span className="text-[#667085]">{item.total}</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-[#EEF2F6]">
                  <div
                    className="h-full rounded-full bg-[#1B365D]"
                    style={{
                      width: `${Math.min(
                        100,
                        ((item.total || 0) / (data?.totals.leads || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            {data?.leadsBySource.length === 0 && (
              <p className="text-[#667085]">No lead data yet.</p>
            )}
          </div>
        </section>
        <section className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-sm">
  <div className="mb-6 flex items-center gap-3">
    <Target className="text-[#1B365D]" />

    <h2 className="text-2xl font-semibold text-[#0F2340]">
      Leads by Quality
    </h2>
  </div>

  <div className="grid gap-5 md:grid-cols-3">
    <div className="rounded-2xl bg-red-50 p-6">
      <p className="text-sm font-semibold text-red-700">
        Hot Leads
      </p>

      <p className="mt-4 text-4xl font-semibold text-[#0F2340]">
        {data?.leadsQuality.hot ?? 0}
      </p>

      <p className="mt-2 text-sm text-[#667085]">
        High-priority buyer requests
      </p>
    </div>

    <div className="rounded-2xl bg-orange-50 p-6">
      <p className="text-sm font-semibold text-orange-700">
        Warm Leads
      </p>

      <p className="mt-4 text-4xl font-semibold text-[#0F2340]">
        {data?.leadsQuality.warm ?? 0}
      </p>

      <p className="mt-2 text-sm text-[#667085]">
        Medium-priority buyer requests
      </p>
    </div>

    <div className="rounded-2xl bg-blue-50 p-6">
      <p className="text-sm font-semibold text-blue-700">
        Cold Leads
      </p>

      <p className="mt-4 text-4xl font-semibold text-[#0F2340]">
        {data?.leadsQuality.cold ?? 0}
      </p>

      <p className="mt-2 text-sm text-[#667085]">
        Early-stage buyer requests
      </p>
    </div>
  </div>
</section>

        <section className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <GitBranch className="text-[#1B365D]" />
            <h2 className="text-2xl font-semibold text-[#0F2340]">
              Matches by Status
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
  <MiniStat
    title="Pending"
    value={data?.matchesStatus.pending ?? 0}
  />

  <MiniStat
    title="Active"
    value={data?.matchesStatus.active ?? 0}
  />

  <MiniStat
    title="Contacted"
    value={data?.matchesStatus.contacted ?? 0}
  />

  <MiniStat
    title="Completed"
    value={data?.matchesStatus.completed ?? 0}
  />

  <MiniStat
    title="Cancelled"
    value={data?.matchesStatus.cancelled ?? 0}
  />

  <MiniStat
    title="Completion Rate"
    value={data?.totals.completionRate ?? 0}
    suffix="%"
  />
</div>
        </section>
      </div>

      <section className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Users className="text-[#1B365D]" />
          <h2 className="text-2xl font-semibold text-[#0F2340]">
            Top Professionals
          </h2>
        </div>

        <div className="divide-y divide-[#EAECF0]">
          {(data?.topProfessionals ?? []).map((pro) => (
            <div
              key={pro.id}
              className="grid gap-4 py-5 md:grid-cols-[1.5fr_1fr_1fr_1fr]"
            >
              <div>
                <p className="font-semibold text-[#0F2340]">{pro.name}</p>
                <p className="text-sm text-[#667085]">
                  {pro.companyName || "Independent professional"}
                </p>
              </div>

              <p className="text-sm font-semibold text-[#1B365D]">
                {pro.professionalType}
              </p>

              <p className="text-sm text-[#667085]">
                Rating: {pro.rating.toFixed(1)}
              </p>

              <p className="text-sm text-[#667085]">
                Completed matches: {pro.completedMatches}
              </p>
            </div>
          ))}

          {data?.topProfessionals.length === 0 && (
            <p className="text-[#667085]">No professional data yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function MiniStat({
  title,
  value,
  suffix = "",
}: {
  title: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#F8F9FA] p-5">
      <p className="text-sm text-[#667085]">
        {title}
      </p>

      <p className="mt-3 text-3xl font-semibold text-[#0F2340]">
        {value}
        {suffix}
      </p>
    </div>
  );
}