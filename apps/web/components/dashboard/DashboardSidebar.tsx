"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  UserPlus,
  GitBranch,
  BarChart3,
  FileText,
  Building2,
  Settings,
  LogOut,
  Bell,
  Heart,
  Star,
} from "lucide-react";
import {
  getUnreadChatCount,
} from "@/lib/chat-api";
import { getStoredUser, clearSession, getToken } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { getMyProfessionalProfile } from "@/lib/settings-api";
import {
  getSavedPropertiesCount,
} from "@/lib/saved-properties-api";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const adminItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Professionals", href: "/dashboard/professionals", icon: BriefcaseBusiness },
  { label: "Reviews",  href: "/dashboard/reviews",  icon: Star,},
  { label: "Properties", href: "/dashboard/properties", icon: Building2 },
  { label: "Leads", href: "/dashboard/leads", icon: UserPlus },
  { label: "Matching", href: "/dashboard/matching", icon: GitBranch },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Stories", href: "/dashboard/stories", icon: FileText },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Audit", href: "/dashboard/audit", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const propertyAgentItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Properties", href: "/dashboard/properties", icon: Building2 },
  { label: "My Matches", href: "/dashboard/my-matches", icon: GitBranch },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Messages",    href: "/dashboard/messages", icon: Bell},
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const otherProfessionalItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Matches", href: "/dashboard/my-matches", icon: GitBranch },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Messages",    href: "/dashboard/messages", icon: Bell},
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const buyerItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Requests", href: "/dashboard/my-leads", icon: UserPlus },
  { label: "My Matches", href: "/dashboard/my-matches", icon: GitBranch },  { label: "Stories", href: "/dashboard/my-stories", icon: FileText },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Messages",    href: "/dashboard/messages", icon: Bell},
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Saved Properties",  href: "/dashboard/saved-properties",  icon: Heart,},
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [
  savedPropertiesCount,
  setSavedPropertiesCount,
] = useState(0); 

  const user = getStoredUser<AuthUser>();
  const [professionalType, setProfessionalType] = useState<string | null>(null);
  const [
  unreadMessagesCount,
  setUnreadMessagesCount,
] = useState(0);

  useEffect(() => {
    async function loadProfessionalType() {
      if (user?.role !== "PROFESSIONAL") return;

      const token = getToken();
      if (!token) return;

      try {
        const profile = await getMyProfessionalProfile(token);
        setProfessionalType(profile.professionalType);
      } catch {
        setProfessionalType(null);
      }
    }

    loadProfessionalType();
  }, [user?.role]);


  useEffect(() => {
  let cancelled = false;

  async function loadUnreadMessages() {
    if (
      user?.role !== "BUYER" &&
      user?.role !== "PROFESSIONAL"
    ) {
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      const data = await getUnreadChatCount(token);

      if (!cancelled) {
        setUnreadMessagesCount(data.count);
      }
    } catch {
      if (!cancelled) {
        setUnreadMessagesCount(0);
      }
    }
  }

  function handleUnreadCountChange() {
    void loadUnreadMessages();
  }

  void loadUnreadMessages();

  const interval = window.setInterval(
    loadUnreadMessages,
    30000,
  );

  window.addEventListener(
    "chat-unread-count-changed",
    handleUnreadCountChange,
  );

  return () => {
    cancelled = true;

    window.clearInterval(interval);

    window.removeEventListener(
      "chat-unread-count-changed",
      handleUnreadCountChange,
    );
  };
}, [user?.role]);
  useEffect(() => {
  let cancelled = false;

  async function loadSavedPropertiesCount() {
    if (user?.role !== "BUYER") {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const result =
        await getSavedPropertiesCount(
          token,
        );

      if (!cancelled) {
        setSavedPropertiesCount(
          result.count,
        );
      }
    } catch {
      if (!cancelled) {
        setSavedPropertiesCount(0);
      }
    }
  }

  function handleSavedPropertiesChange() {
    void loadSavedPropertiesCount();
  }

  void loadSavedPropertiesCount();

  window.addEventListener(
    "saved-properties-changed",
    handleSavedPropertiesChange,
  );

  return () => {
    cancelled = true;

    window.removeEventListener(
      "saved-properties-changed",
      handleSavedPropertiesChange,
    );
  };
}, [user?.role]);


  const navItems = useMemo(() => {
    if (user?.role === "ADMIN") return adminItems;

    if (user?.role === "PROFESSIONAL") {
      return professionalType === "PROPERTY_AGENT"
        ? propertyAgentItems
        : otherProfessionalItems;
    }

    return buyerItems;
  }, [user?.role, professionalType]);

  const userInitial =
    user?.fullName?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    "U";

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
   <aside className="hidden h-screen w-[295px] shrink-0 flex-col overflow-hidden border-r border-[#E9EDF3] bg-white lg:flex">
      <div className="flex h-[76px] shrink-0 items-center border-b border-[#E9EDF3] px-7">
  <Link
    href="/"
    aria-label="Return to home page"
    className="inline-flex items-center"
  >
    <img
      src="/images/pfelogo.png"
      alt="Real Estate Lisbon"
      className="h-14 w-auto object-contain"
    />
  </Link>
</div>

      <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[16px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#1B365D] text-white shadow-[0_8px_20px_rgba(27,54,93,0.18)]"
                    : "text-[#1B365D] hover:bg-[#F6F8FB]"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">
  {item.label}
</span>

{item.href ===
  "/dashboard/saved-properties" &&
  savedPropertiesCount > 0 && (
    <span
      className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
        active
          ? "bg-white text-[#1B365D]"
          : "bg-[#C9A227] text-white"
      }`}
    >
      {savedPropertiesCount > 99
        ? "99+"
        : savedPropertiesCount}
    </span>
  )}

{item.href ===
  "/dashboard/messages" &&
  unreadMessagesCount > 0 && (
    <span
      className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
        active
          ? "bg-white text-[#1B365D]"
          : "bg-red-500 text-white"
      }`}
    >
      {unreadMessagesCount > 99
        ? "99+"
        : unreadMessagesCount}
    </span>
  )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 border-t border-[#E9EDF3] bg-white p-4">
        <div className="mb-4 flex items-center gap-3 rounded-2xl p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(to_bottom_right,#1B365D,#C9A227)] text-[18px] font-semibold text-white">
            {userInitial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[#0F2340]">
              {user?.fullName || user?.email || "User"}
            </p>

            <p className="truncate text-[13px] text-[#667085]">
              {user?.role}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[16px] font-medium text-[#1B365D] transition hover:bg-[#F6F8FB]"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}