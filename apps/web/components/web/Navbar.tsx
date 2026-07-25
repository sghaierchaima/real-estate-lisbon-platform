"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getStoredUser } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";

const toolsLinks = [
   { title: "Property Search Assistant", href: "/tools/property-search-assistant", desc: "Describe your needs and find suitable properties", },
  { title: "Mortgage Calculator", href: "/tools/mortgage-calculator", desc: "Estimate monthly payments" },
  { title: "Affordability Calculator", href: "/tools/affordability-calculator", desc: "Know your buying power" },
  { title: "Neighborhood Finder", href: "/tools/neighborhood-finder", desc: "Explore Portugal neighborhoods" },
  { title: "Price Checker", href: "/tools/price-checker", desc: "Compare property prices" },
  { title: "True Cost Calculator", href: "/tools/true-cost-calculator", desc: "Calculate real ownership cost" },
  { title: "Property Valuation", href: "/tools/property-valuation", desc: "Estimate property value" },
];

const professionalsLinks = [
  { title: "Mortgage Brokers", href: "/find-professionals/mortgage-brokers", desc: "Find trusted financing experts" },
  { title: "Real Estate Agents", href: "/find-professionals/real-estate-agents", desc: "Connect with verified agents" },
  { title: "Property Lawyers", href: "/find-professionals/lawyers", desc: "Get legal property support" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  setUser(getStoredUser<AuthUser>());
}, []);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [professionalsOpen, setProfessionalsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function closeAll() {
    setMobileOpen(false);
    setToolsOpen(false);
    setProfessionalsOpen(false);
  }

  return (
    <header
      className={`sticky top-0 z-[9999] border-b border-[rgba(27,54,93,0.10)] bg-white transition-shadow ${
        scrolled ? "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10)]" : ""
      }`}
    >
      <div className="container-page">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" onClick={closeAll} className="flex items-center">
            <img
              src="/images/pfelogo.png"
              alt="Real Estate Lisbon"
              className="h-20 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <NavLink href="/properties" active={isActive("/properties")} onClick={closeAll}>
              Properties
            </NavLink>

            <Dropdown
              title="Professionals"
              href="/find-professionals"
              active={isActive("/find-professionals")}
              open={professionalsOpen}
              onToggle={() => {
                setProfessionalsOpen((prev) => !prev);
                setToolsOpen(false);
              }}
              items={professionalsLinks}
              onClose={closeAll}
            />

            <Dropdown
              title="Tools"
              href="/tools"
              active={isActive("/tools")}
              open={toolsOpen}
              onToggle={() => {
                setToolsOpen((prev) => !prev);
                setProfessionalsOpen(false);
              }}
              items={toolsLinks}
              onClose={closeAll}
            />

            <NavLink href="/stories" active={isActive("/stories")} onClick={closeAll}>
              Stories
            </NavLink>

            {user && (
              <NavLink href="/dashboard" active={isActive("/dashboard")} onClick={closeAll}>
                Dashboard
              </NavLink>
            )}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-base font-medium text-[#1B365D] transition hover:bg-[rgba(27,54,93,0.10)]"
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-lg bg-[#1B365D] px-6 py-2 text-base font-medium text-white transition hover:bg-[#0F2340]"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg bg-[#1B365D] px-6 py-2 text-base font-medium text-white transition hover:bg-[#0F2340]"
              >
                Go to Dashboard
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-lg p-2 transition hover:bg-[#F3F4F6] lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[rgba(27,54,93,0.10)] bg-white lg:hidden">
          <div className="flex flex-col gap-4 px-4 py-6">
            <MobileLink href="/properties" onClick={closeAll}>Properties</MobileLink>

            <MobileDropdown
              title="Professionals"
              open={professionalsOpen}
              onToggle={() => {
                setProfessionalsOpen((prev) => !prev);
                setToolsOpen(false);
              }}
              items={professionalsLinks}
              onClose={closeAll}
            />

            <MobileDropdown
              title="Tools"
              open={toolsOpen}
              onToggle={() => {
                setToolsOpen((prev) => !prev);
                setProfessionalsOpen(false);
              }}
              items={toolsLinks}
              onClose={closeAll}
            />

            <MobileLink href="/stories" onClick={closeAll}>Stories</MobileLink>

            {user && <MobileLink href="/dashboard" onClick={closeAll}>Dashboard</MobileLink>}

            <div className="flex flex-col gap-3 border-t border-[rgba(27,54,93,0.10)] pt-4">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    onClick={closeAll}
                    className="w-full rounded-lg border border-[rgba(27,54,93,0.10)] px-4 py-3 text-center font-medium text-[#1B365D]"
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/register"
                    onClick={closeAll}
                    className="w-full rounded-lg bg-[#1B365D] px-4 py-3 text-center font-medium text-white"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  onClick={closeAll}
                  className="w-full rounded-lg bg-[#1B365D] px-4 py-3 text-center font-medium text-white"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center text-base font-medium transition-colors ${
        active ? "text-[#1B365D]" : "text-[#6C757D] hover:text-[#1B365D]"
      }`}
    >
      {children}
    </Link>
  );
}

function Dropdown({
  title,
  href,
  active,
  open,
  onToggle,
  items,
  onClose,
}: {
  title: string;
  href: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  items: { title: string; href: string; desc: string }[];
  onClose: () => void;
}) {
  return (
    <div className="relative flex items-center gap-1">
      <Link
        href={href}
        onClick={onClose}
        className={`text-base font-medium transition-colors ${
          active ? "text-[#1B365D]" : "text-[#6C757D] hover:text-[#1B365D]"
        }`}
      >
        {title}
      </Link>

      <button type="button" onClick={onToggle} className="p-1">
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 pt-3">
          <div className="w-72 overflow-hidden rounded-xl border border-[rgba(27,54,93,0.10)] bg-white shadow-[0_12px_30px_rgba(15,35,64,0.12)]">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="block px-4 py-3 transition hover:bg-[#F8FAFC]"
              >
                <p className="text-sm font-semibold text-[#0F2340]">{item.title}</p>
                <p className="mt-1 text-xs text-[#6C757D]">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-lg font-medium text-[#0F2340] transition hover:text-[#1B365D]"
    >
      {children}
    </Link>
  );
}

function MobileDropdown({
  title,
  open,
  onToggle,
  items,
  onClose,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  items: { title: string; href: string; desc: string }[];
  onClose: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center text-lg font-medium text-[#0F2340] transition hover:text-[#1B365D]"
      >
        {title}
        <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-xl border border-[rgba(27,54,93,0.10)] bg-white">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="block px-4 py-3 transition hover:bg-[#F8FAFC]"
            >
              <p className="text-sm font-semibold text-[#0F2340]">{item.title}</p>
              <p className="mt-1 text-xs text-[#6C757D]">{item.desc}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}