import type { DashboardStats } from "@/lib/dashboard-api";

function percent(value: number, base: number) {
  if (base <= 0) return 0;
  return Math.round((value / base) * 100);
}

function width(value: number) {
  if (value <= 0) return "0%";
  return `${Math.min(value, 100)}%`;
}

export default function ConversionFunnel({
  stats,
}: {
  stats: DashboardStats | null;
}) {
  const users = stats?.users.total ?? 0;
  const leads = stats?.leads.total ?? 0;
  const baseLeads = Math.max(leads, 1);

  const items = [
    {
      label: "Registered Users",
      value: users,
      percent: null,
      color: "bg-[#2563EB]",
      description: "Platform users",
      bar: 100,
    },
    {
      label: "Leads Created",
      value: leads,
      percent: 100,
      color: "bg-[#9333EA]",
      description: "Lead funnel base",
      bar: leads > 0 ? 100 : 0,
    },
    {
      label: "Pending Matches",
      value: stats?.matching.pending ?? 0,
      percent: percent(stats?.matching.pending ?? 0, baseLeads),
      color: "bg-[#EAB308]",
      description: "Waiting admin approval",
      bar: percent(stats?.matching.pending ?? 0, baseLeads),
    },
    {
      label: "Active Matches",
      value: stats?.matching.active ?? 0,
      percent: percent(stats?.matching.active ?? 0, baseLeads),
      color: "bg-[#16A34A]",
      description: "Approved matches",
      bar: percent(stats?.matching.active ?? 0, baseLeads),
    },
    {
      label: "Contacted Buyers",
      value: stats?.matching.contacted ?? 0,
      percent: percent(stats?.matching.contacted ?? 0, baseLeads),
      color: "bg-[#0284C7]",
      description: "Professional contacted buyer",
      bar: percent(stats?.matching.contacted ?? 0, baseLeads),
    },
    {
      label: "Completed Deals",
      value: stats?.matching.completed ?? 0,
      percent: percent(stats?.matching.completed ?? 0, baseLeads),
      color: "bg-[#7C3AED]",
      description: "Closed successful matches",
      bar: percent(stats?.matching.completed ?? 0, baseLeads),
    },
  ];

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E9EDF3] bg-white p-7 shadow-[0_8px_24px_rgba(15,35,64,0.05)]">
      <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[#0F2340]">
        Conversion Funnel
      </h3>

      <p className="mt-1 text-[15px] text-gray-500">
        Lead-based workflow from creation to completed deal
      </p>

      <div className="mt-10 space-y-6">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <div>
                <span className="text-[17px] font-medium text-[#0F2340]">
                  {item.label}
                </span>
                <p className="mt-1 text-[13px] text-[#667085]">
                  {item.description}
                </p>
              </div>

              <div className="flex min-w-[120px] items-center justify-end gap-6">
                <span className="text-[17px] font-semibold text-[#0F2340]">
                  {item.value}
                </span>

                <span className="w-12 text-right text-[15px] text-gray-500">
                  {item.percent === null ? "Info" : `${item.percent}%`}
                </span>
              </div>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-[#EEF2F6]">
              <div
                className={`h-full rounded-full ${item.color}`}
                style={{ width: width(item.bar) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}