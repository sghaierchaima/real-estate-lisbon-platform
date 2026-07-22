import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

type ToolCardProps = {
  title: string;
  description: string;
  features: string[];
  href: string;
  iconBg: string;
  icon: React.ReactNode;
};

export default function ToolCard({
  title,
  description,
  features,
  href,
  iconBg,
  icon,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-[24px] border border-[#e5e7eb] bg-white p-[30px] shadow-[0_8px_24px_rgba(15,35,64,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,35,64,0.10)]"
    >
      <div
        className="mb-[24px] flex h-[56px] w-[56px] items-center justify-center rounded-[18px] text-white"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>

      <h3 className="mb-[12px] text-[24px] font-semibold tracking-[-0.02em] text-[#0F2340]">
        {title}
      </h3>

      <p className="mb-[22px] text-[16px] leading-[1.7] text-[#667085]">
        {description}
      </p>

      <div className="space-y-3">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-3 text-[#475467]">
            <CheckCircle className="h-4 w-4 text-[#2E7D32]" />
            <span className="text-[15px]">{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-[28px] flex items-center gap-2 text-[16px] font-semibold text-[#1B365D]">
        Open Tool
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}