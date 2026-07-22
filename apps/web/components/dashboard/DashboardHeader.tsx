"use client";

import { Bell, ChevronDown, Search } from "lucide-react";
import { getStoredUser, getToken } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getUnreadNotificationCount } from "@/lib/notifications-api";

export default function DashboardHeader() {
  const user = getStoredUser<AuthUser>();
  const [unreadCount, setUnreadCount] = useState(0);
  const userInitial =
    user?.fullName?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    "U";
useEffect(() => {
  async function loadUnreadCount() {
    const token = getToken();

    if (!token) return;

    try {
      const data = await getUnreadNotificationCount(token);
      setUnreadCount(data.count);
    } catch {
      setUnreadCount(0);
    }
  }

  loadUnreadCount();

  const interval = window.setInterval(loadUnreadCount, 30000);

  return () => window.clearInterval(interval);
}, []);
  return (
    <header className="flex h-[80px] shrink-0 items-center justify-between border-b border-[#E9EDF3] bg-white px-6 lg:px-8">
      <div className="relative w-full max-w-[560px]">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
        <input
          type="text"
          placeholder="Search anything..."
          className="h-14 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-14 pr-4 text-[17px] text-[#0F2340] outline-none placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
        />
      </div>

      <div className="ml-6 flex items-center gap-5">
        <Link
  href="/dashboard/notifications"
  className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-[#0F2340] hover:bg-[#F6F8FB]"
>
  <Bell className="h-5 w-5" />

  {unreadCount > 0 && (
    <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  )}
</Link>

        <div className="h-10 w-px bg-[#E9EDF3]" />

        <button className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(to_bottom_right,#1B365D,#C9A227)] text-[18px] font-semibold text-white">
            {userInitial}
          </div>

          <div className="hidden text-left md:block">
            <p className="max-w-[160px] truncate text-[16px] font-semibold text-[#0F2340]">
              {user?.fullName || user?.email || "User"}
            </p>
            <p className="text-sm capitalize text-[#667085]">{user?.role}</p>
          </div>

          <ChevronDown className="h-5 w-5 text-[#667085]" />
        </button>
      </div>
    </header>
  );
}