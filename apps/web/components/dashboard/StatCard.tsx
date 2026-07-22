import { LucideIcon, TrendingUp } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  subtext: string;
  growth: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
};

export default function StatCard({
  title,
  value,
  subtext,
  growth,
  icon: Icon,
  iconBg = "bg-[#EEF2F6]",
  iconColor = "text-[#1B365D]",
}: StatCardProps) {
  return (
    <div className="rounded-[28px] border border-[#E9EDF3] bg-white px-6 py-6 shadow-[0_8px_24px_rgba(15,35,64,0.05)]">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-[#DCFCE7] px-3.5 py-1.5 text-[14px] font-semibold text-[#15803D]">
          <TrendingUp className="h-3.5 w-3.5" />
          {growth}
        </div>
      </div>

      <div className="mt-10 text-[38px] font-semibold leading-none text-[#0F2340]">
        {value}
      </div>

      <p className="mt-7 text-[17px] text-[#475467]">{title}</p>
      <p className="mt-2 text-[14px] text-[#667085]">{subtext}</p>
    </div>
  );
}