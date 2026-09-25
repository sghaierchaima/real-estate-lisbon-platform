import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0F2340] text-white">
      <div className="container-page py-16">
        <div className="mb-12 grid gap-12 md:grid-cols-2 lg:grid-cols-4">

          {/* =====================================================
              BRAND
          ===================================================== */}
          <div>
            <Link href="/" className="mb-4 flex items-center">
              <img
                src="/images/logof.png"
                alt="TrustedBuildr"
                className="h-24 w-auto object-contain"
              />
            </Link>

            <p className="mb-6 max-w-sm text-sm leading-6 text-[#D1D5DB]">
              The trusted platform for foreign buyers purchasing property
              in Portugal. We provide tools, education, and professional
              matching to make your journey safe and successful.
            </p>

            <div className="flex gap-4">
              {/* Contact */}
              <Link
                href="/contact"
                aria-label="Contact us"
                title="Contact us"
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-lg bg-white/10 text-white
                  transition hover:bg-[#C9A227]
                "
              >
                <Mail className="h-5 w-5" />
              </Link>

              {/* Professionals */}
              <Link
                href="/find-professionals"
                aria-label="Find professionals"
                title="Find professionals"
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-lg bg-white/10 text-white
                  transition hover:bg-[#C9A227]
                "
              >
                <Phone className="h-5 w-5" />
              </Link>

              {/* Properties */}
              <Link
                href="/properties"
                aria-label="Explore properties"
                title="Explore properties"
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-lg bg-white/10 text-white
                  transition hover:bg-[#C9A227]
                "
              >
                <MapPin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* =====================================================
              TOOLS
          ===================================================== */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-white">
              Tools
            </h3>

            <ul className="space-y-3">
              <li>
                <Link
                  href="/tools/property-search-assistant"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Property Search Assistant
                </Link>
              </li>

              <li>
                <Link
                  href="/tools/mortgage-calculator"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Mortgage Calculator
                </Link>
              </li>

              <li>
                <Link
                  href="/tools/affordability-calculator"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Affordability Calculator
                </Link>
              </li>

              <li>
                <Link
                  href="/tools/neighborhood-finder"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Neighborhood Finder
                </Link>
              </li>

              <li>
                <Link
                  href="/tools/price-checker"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Price Checker
                </Link>
              </li>

              <li>
                <Link
                  href="/tools/true-cost-calculator"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  True Cost Calculator
                </Link>
              </li>

              <li>
                <Link
                  href="/tools/property-valuation"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Property Valuation
                </Link>
              </li>
            </ul>
          </div>

          {/* =====================================================
              PROFESSIONALS
          ===================================================== */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-white">
              Find Professionals
            </h3>

            <ul className="space-y-3">
              <li>
                <Link
                  href="/find-professionals/mortgage-brokers"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Mortgage Brokers
                </Link>
              </li>

              <li>
                <Link
                  href="/find-professionals/real-estate-agents"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Real Estate Agents
                </Link>
              </li>

              <li>
                <Link
                  href="/find-professionals/lawyers"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Property Lawyers
                </Link>
              </li>

              <li>
                <Link
                  href="/find-professionals/property-valuers"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Property Valuers
                </Link>
              </li>

              <li>
                <Link
                  href="/find-professionals/home-inspectors"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Home Inspectors
                </Link>
              </li>

              <li>
                <Link
                  href="/find-professionals/tax-advisors"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Tax Advisors
                </Link>
              </li>

              <li>
                <Link
                  href="/find-professionals/insurance-brokers"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Insurance Brokers
                </Link>
              </li>

              <li>
                <Link
                  href="/find-professionals"
                  className="font-medium text-[#C9A227] transition hover:text-white"
                >
                  View all professionals →
                </Link>
              </li>
            </ul>
          </div>

          {/* =====================================================
              COMPANY
          ===================================================== */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-white">
              Company
            </h3>

            <ul className="space-y-3">
              <li>
                <Link
                  href="/stories"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Success Stories
                </Link>
              </li>

              <li>
                <Link
                  href="/faq"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  FAQ
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Contact
                </Link>
              </li>

              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  href="/terms"
                  className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* =====================================================
            BOTTOM
        ===================================================== */}
        <div
          className="
            flex flex-col items-center gap-4
            border-t border-white/10 pt-8
            text-sm text-[#9CA3AF]
            md:flex-row md:justify-between
          "
        >
          <p>© 2026 Real Estate Lisbon. All rights reserved.</p>

          <p>
            Made with care for property buyers worldwide 🇵🇹
          </p>
        </div>
      </div>
    </footer>
  );
}