import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import ToolCard from "@/components/tools/ToolCard";
import {
  Calculator,
  DollarSign,
  MapPin,
  TrendingUp,
  Shield,
  BadgeCheck,
} from "lucide-react";

const tools = [
  {
    title: "Mortgage Calculator",
    description:
      "Calculate monthly payments, total interest, and understand your property loan.",
    features: ["Monthly payments", "Interest breakdown", "Loan amount"],
    href: "/tools/mortgage-calculator",
    iconBg: "#10284d",
    icon: <Calculator size={22} strokeWidth={2.3} />,
  },
  {
    title: "Affordability Calculator",
    description:
      "Understand your buying power based on income, debts, and down payment.",
    features: ["Income analysis", "Debt-to-income ratio", "Budget estimate"],
    href: "/tools/affordability-calculator",
    iconBg: "#287b2b",
    icon: <DollarSign size={22} strokeWidth={2.3} />,
  },
  {
    title: "True Cost Calculator",
    description:
      "See the complete estimated cost of buying property in Portugal.",
    features: ["IMT estimate", "Stamp duty", "Legal and bank fees"],
    href: "/tools/true-cost-calculator",
    iconBg: "#dc2d2d",
    icon: <Shield size={22} strokeWidth={2.3} />,
  },
  {
    title: "Neighborhood Finder",
    description:
      "Explore neighborhoods and compare lifestyle, transport, and amenities.",
    features: ["Area insights", "Transport access", "Amenities"],
    href: "/tools/neighborhood-finder",
    iconBg: "#e1a820",
    icon: <MapPin size={22} strokeWidth={2.3} />,
  },
  {
    title: "Price Checker",
    description:
      "Compare property prices and understand whether a listing is fairly priced.",
    features: ["Price comparisons", "Market trends", "Value analysis"],
    href: "/tools/price-checker",
    iconBg: "#2b77d8",
    icon: <TrendingUp size={22} strokeWidth={2.3} />,
  },
  {
    title: "Property Valuation",
    description:
      "Estimate property value based on location, size, condition, and market data.",
    features: ["Instant valuation", "Market estimate", "Investment potential"],
    href: "/tools/property-valuation",
    iconBg: "#7b26b8",
    icon: <BadgeCheck size={22} strokeWidth={2.3} />,
  },
];

export default function ToolsPage() {
  return (
    <>
      <Navbar />

      <main className="bg-[#f8f9fa]">
        <section className="px-6 pb-[34px] pt-[54px] lg:px-[140px]">
          <div className="mx-auto max-w-[1680px] text-center">
            <div className="mb-[28px] inline-flex items-center rounded-full bg-[#dfe5eb] px-[22px] py-[14px] text-[17px] font-medium text-[#10284d]">
              <Calculator size={18} className="mr-2" />
              All Tools Free • No Login Required
            </div>

            <h1 className="mx-auto mb-[24px] max-w-[1120px] text-[44px] font-bold leading-[1.08] tracking-[-0.03em] text-[#081a33] lg:text-[56px]">
              Professional-Grade Property Tools
            </h1>

            <p className="mx-auto max-w-[820px] text-[20px] font-normal leading-[1.85] tracking-[0.015em] text-[#6f7c91]">
              Make informed decisions with our calculators and analysis tools,
              designed for foreign buyers purchasing property in Portugal.
            </p>
          </div>
        </section>

        <section className="px-6 py-[34px] lg:px-[140px]">
          <div className="mx-auto grid max-w-[1680px] gap-[22px] lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.title} {...tool} />
            ))}
          </div>
        </section>

        <section className="px-6 pb-[60px] pt-[10px] lg:px-[140px]">
          <div className="mx-auto max-w-[1680px] rounded-[26px] bg-[#10284d] px-[42px] py-[44px] text-white">
            <h2 className="text-center text-[32px] font-semibold tracking-[-0.02em]">
              How Our Tools Work for You
            </h2>

            <p className="mx-auto mb-[50px] mt-[12px] max-w-[780px] text-center text-[18px] leading-[1.6] text-white/85">
              Use tools freely, understand your buying power, then request help
              from verified professionals.
            </p>

            <div className="grid gap-[28px] md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Use Free Tools",
                  text: "Start with any calculator. No login required. Get instant results.",
                },
                {
                  number: "02",
                  title: "Create a Lead",
                  text: "After using a tool, you can request professional help with your email.",
                },
                {
                  number: "03",
                  title: "Get Matched",
                  text: "The platform connects you with verified professionals based on your needs.",
                },
              ].map((step) => (
                <div key={step.number} className="text-center">
                  <div className="mx-auto mb-[18px] flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#d4a91f] text-[20px] font-semibold text-white">
                    {step.number}
                  </div>

                  <h3 className="mb-[10px] text-[20px] font-semibold">
                    {step.title}
                  </h3>

                  <p className="mx-auto max-w-[320px] text-[15px] leading-[1.6] text-white/85">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}