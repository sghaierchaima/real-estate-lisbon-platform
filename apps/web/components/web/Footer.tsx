import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0F2340] text-white">
      <div className="container-page py-16">
        <div className="mb-12 grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 flex items-center">
              <img
                src="/images/logof.png"
                alt="TrustedBuildr"
                className="h-24 w-auto object-contain"
              />
            </Link>

            <p className="mb-6 max-w-sm text-sm leading-6 text-[#D1D5DB]">
              The trusted platform for foreign buyers purchasing property in Portugal.
              We provide tools, education, and professional matching to make your
              journey safe and successful.
            </p>

            <div className="flex gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-[#C9A227]"
              >
                <Mail className="h-5 w-5" />
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-[#C9A227]"
              >
                <Phone className="h-5 w-5" />
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-[#C9A227]"
              >
                <MapPin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-white">Tools</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/tools/mortgage-calculator" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  Mortgage Calculator
                </Link>
              </li>
              <li>
                <Link href="/tools/affordability-calculator" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  Affordability Calculator
                </Link>
              </li>
              <li>
                <Link href="/tools/neighborhood-finder" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  Neighborhood Finder
                </Link>
              </li>
              <li>
                <Link href="/tools/price-checker" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  Price Checker
                </Link>
              </li>
              <li>
                <Link href="/tools/true-cost-calculator" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  True Cost Calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Professionals */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-white">Find Professionals</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/professionals/brokers" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  Mortgage Brokers
                </Link>
              </li>
              <li>
                <Link href="/professionals/agents" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  Real Estate Agents
                </Link>
              </li>
              <li>
                <Link href="/professionals/lawyers" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  Lawyers
                </Link>
              </li>
              <li>
                <Link href="/recruit/brokers" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  Become a Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-white">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/content" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  Success Stories
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-[#D1D5DB] transition hover:text-[#C9A227]">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-4 border-t border-white/10 pt-8 text-sm text-[#9CA3AF] md:flex-row md:justify-between">
          <p>© 2026 Real Estate Lisbon. All rights reserved.</p>
          <p>Made with care for property buyers worldwide 🇵🇹</p>
        </div>
      </div>
    </footer>
  );
}