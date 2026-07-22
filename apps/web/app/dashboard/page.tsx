"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  GitBranch,
  Home,
  Settings,
  ShieldCheck,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import ProfessionalApplicationCard from "@/components/dashboard/ProfessionalApplicationCard";
import StatCard from "@/components/dashboard/StatCard";
import NeedsAttention from "@/components/dashboard/NeedsAttention";
import ConversionFunnel from "@/components/dashboard/ConversionFunnel";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LatestLeads from "@/components/dashboard/LatestLeads";
import ProfileProgressCard from "@/components/dashboard/ProfileProgressCard";
import BuyerJourneyCard from "@/components/dashboard/BuyerJourneyCard";

import {
  getBuyerDashboardStats,
  getDashboardStats,
  getProfessionalDashboardStats,
  type BuyerDashboardStats,
  type DashboardStats,
  type ProfessionalDashboardStats,
} from "@/lib/dashboard-api";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import type { AuthUser } from "@/lib/auth-api";

import {
  getMyProfile,
  type BuyerProfileSummary,
} from "@/lib/profile-api";

import { useToast } from "@/components/ui/ToastProvider";

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();

  const user = getStoredUser<AuthUser>();

  const [adminStats, setAdminStats] =
    useState<DashboardStats | null>(null);

  const [
    professionalStats,
    setProfessionalStats,
  ] =
    useState<ProfessionalDashboardStats | null>(
      null,
    );

  const [buyerStats, setBuyerStats] =
    useState<BuyerDashboardStats | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const token = getToken();

      if (!token || !user) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);

        if (user.role === "ADMIN") {
          const data =
            await getDashboardStats(token);

          setAdminStats(data);
          return;
        }

        if (user.role === "PROFESSIONAL") {
          const data =
            await getProfessionalDashboardStats(
              token,
            );

          setProfessionalStats(data);
          return;
        }

        if (user.role === "BUYER") {
          const data =
            await getBuyerDashboardStats(token);

          setBuyerStats(data);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load dashboard.";

        const normalized =
          message.toLowerCase();

        if (
          normalized.includes("401") ||
          normalized.includes("unauthorized")
        ) {
          router.replace("/login");
          return;
        }

        if (
          normalized.includes("403") ||
          normalized.includes("forbidden") ||
          normalized.includes("permission")
        ) {
          router.replace("/access-denied");
          return;
        }

        toast.error(
          "Unable to load dashboard",
          message,
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [router, toast, user?.role]);

  const conversionRate = useMemo(() => {
    if (
      !adminStats ||
      adminStats.leads.total === 0
    ) {
      return 0;
    }

    return Math.round(
      (adminStats.leads.matched /
        adminStats.leads.total) *
        100,
    );
  }, [adminStats]);

  if (loading) {
    return <DashboardLoading />;
  }

  if (user?.role === "PROFESSIONAL") {
    return (
      <ProfessionalDashboard
        stats={professionalStats}
        user={user}
      />
    );
  }

  if (user?.role === "BUYER") {
    return (
      <BuyerDashboard
        stats={buyerStats}
        user={user}
      />
    );
  }

  return (
    <AdminDashboard
      stats={adminStats}
      conversionRate={conversionRate}
      user={user}
    />
  );
}

function AdminDashboard({
  stats,
  conversionRate,
  user,
}: {
  stats: DashboardStats | null;
  conversionRate: number;
  user: AuthUser | null;
}) {
  const firstName =
    user?.fullName?.trim().split(" ")[0] ||
    "Admin";

  return (
    <div className="space-y-8">
      <WelcomeBanner
        title={`Welcome back, ${firstName}`}
        subtitle="Monitor your platform performance, review pending actions and manage your real estate workflow."
        badge="Admin workspace"
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Total Users"
          value={String(
            stats?.users.total ?? 0,
          )}
          subtext={`${
            stats?.users.buyers ?? 0
          } buyers`}
          growth="Live"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />

        <StatCard
          title="Professionals"
          value={String(
            stats?.users.professionals ?? 0,
          )}
          subtext="Registered professionals"
          growth="Live"
          icon={BriefcaseBusiness}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />

        <StatCard
          title="Properties"
          value={String(
            stats?.properties.total ?? 0,
          )}
          subtext="Platform listings"
          growth="Live"
          icon={Building2}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-600"
        />

        <StatCard
          title="Total Leads"
          value={String(
            stats?.leads.total ?? 0,
          )}
          subtext={`${
            stats?.leads.hot ?? 0
          } hot leads`}
          growth="Live"
          icon={Target}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />

        <StatCard
          title="Matches"
          value={String(
            stats?.matching.total ?? 0,
          )}
          subtext={`${
            stats?.matching.active ?? 0
          } active`}
          growth="Live"
          icon={GitBranch}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />

        <StatCard
          title="Conversion"
          value={`${conversionRate}%`}
          subtext="Matched leads / leads"
          growth="Live"
          icon={Activity}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />
      </div>

      <AdminQuickActions />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <ConversionFunnel stats={stats} />
        <NeedsAttention stats={stats} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <LatestLeads />
        <RecentActivity />
        
      </div>

      

      <AdminContentSummary stats={stats} />
    </div>
    
    

  );
}

function AdminQuickActions() {
  const actions = [
    {
      title: "Review Leads",
      description:
        "Manage incoming buyer requests.",
      href: "/dashboard/leads",
      icon: UserPlus,
    },
    {
      title: "Generate Matches",
      description:
        "Connect buyers with professionals.",
      href: "/dashboard/matching",
      icon: GitBranch,
    },
    {
      title: "Moderate Stories",
      description:
        "Approve or reject submitted stories.",
      href: "/dashboard/stories",
      icon: FileText,
    },
    {
      title: "View Audit Logs",
      description:
        "Review sensitive platform activity.",
      href: "/dashboard/audit",
      icon: ShieldCheck,
    },
  ];

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-semibold text-[#0F2340]">
            Quick Actions
          </h2>

          <p className="mt-1 text-[#667085]">
            Access the most important
            administration workflows.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-[24px] border border-[#E4E7EC] bg-white p-6 shadow-[0_5px_18px_rgba(15,35,64,0.04)] transition hover:-translate-y-1 hover:border-[#C7D2E1] hover:shadow-[0_14px_34px_rgba(15,35,64,0.08)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF3F8] text-[#1B365D] transition group-hover:bg-[#1B365D] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>

                <ArrowRight className="h-5 w-5 text-[#98A2B3] transition group-hover:translate-x-1 group-hover:text-[#1B365D]" />
              </div>

              <h3 className="mt-6 text-[18px] font-semibold text-[#0F2340]">
                {action.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#667085]">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function AdminContentSummary({
  stats,
}: {
  stats: DashboardStats | null;
}) {
  const items = [
    {
      title: "Pending stories",
      value: stats?.stories.pending ?? 0,
      description:
        "Stories waiting for moderation",
      href: "/dashboard/stories",
      icon: FileText,
    },
    {
      title: "Approved stories",
      value: stats?.stories.approved ?? 0,
      description:
        "Stories currently published",
      href: "/stories",
      icon: CheckCircle2,
    },
    {
      title: "Pending matches",
      value: stats?.matching.pending ?? 0,
      description:
        "Matches waiting for approval",
      href: "/dashboard/matching",
      icon: GitBranch,
    },
    {
      title: "Cancelled matches",
      value: stats?.matching.cancelled ?? 0,
      description:
        "Rejected or cancelled matches",
      href: "/dashboard/matching",
      icon: Activity,
    },
  ];

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_5px_20px_rgba(15,35,64,0.04)]">
      <div className="border-b border-[#EAECF0] px-7 py-6">
        <h2 className="text-[24px] font-semibold text-[#0F2340]">
          Platform Summary
        </h2>

        <p className="mt-1 text-[#667085]">
          Important moderation and workflow
          indicators.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`group p-7 transition hover:bg-[#F8FAFC] ${
                index > 0
                  ? "border-t border-[#EAECF0] md:border-l md:border-t-0"
                  : ""
              }`}
            >
              <Icon className="h-6 w-6 text-[#1B365D]" />

              <p className="mt-6 text-[34px] font-semibold text-[#0F2340]">
                {item.value}
              </p>

              <p className="mt-2 font-semibold text-[#344054]">
                {item.title}
              </p>

              <p className="mt-1 text-sm leading-6 text-[#667085]">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ProfessionalDashboard({
  stats,
  user,
}: {
  stats: ProfessionalDashboardStats | null;
  user: AuthUser | null;
}) {
  const isPropertyAgent =
    stats?.profile?.isPropertyAgent;

  const firstName =
    user?.fullName?.trim().split(" ")[0] ||
    "Professional";

  return (
    <div className="space-y-8">
      <WelcomeBanner
        title={`Welcome back, ${firstName}`}
        subtitle="Manage your profile, assigned matches and professional activity."
        badge="Professional workspace"
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="My Matches"
          value={String(
            stats?.matches.total ?? 0,
          )}
          subtext={`${
            stats?.matches.active ?? 0
          } active matches`}
          growth="Live"
          icon={GitBranch}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />

        <StatCard
          title="Contacted"
          value={String(
            stats?.matches.contacted ?? 0,
          )}
          subtext="Buyers contacted"
          growth="Live"
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />

        <StatCard
          title="Profile Status"
          value={
            stats?.profile
              ?.verificationStatus ??
            "NO PROFILE"
          }
          subtext={`${
            stats?.profile
              ?.profileCompletion ?? 0
          }% completed`}
          growth="Live"
          icon={BriefcaseBusiness}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />

        <StatCard
          title="Notifications"
          value={String(
            stats?.notifications.unread ?? 0,
          )}
          subtext="Unread notifications"
          growth="Live"
          icon={Bell}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />
      </div>

      {isPropertyAgent && (
        <div className="grid gap-6 md:grid-cols-3">
          <QuickCard
            title="My Properties"
            text={`${
              stats?.properties.total ?? 0
            } total listings`}
            href="/dashboard/properties"
            icon={
              <Building2 className="h-6 w-6" />
            }
          />

          <QuickCard
            title="Published"
            text={`${
              stats?.properties.published ?? 0
            } published listings`}
            href="/dashboard/properties"
            icon={
              <Home className="h-6 w-6" />
            }
          />

          <QuickCard
            title="Drafts"
            text={`${
              stats?.properties.draft ?? 0
            } draft listings`}
            href="/dashboard/properties"
            icon={
              <Activity className="h-6 w-6" />
            }
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <QuickCard
          title="My Matches"
          text="Review buyer leads matched with your profile."
          href="/dashboard/my-matches"
          icon={
            <GitBranch className="h-6 w-6" />
          }
        />

        <QuickCard
          title="Profile Settings"
          text="Complete your professional information."
          href="/dashboard/settings"
          icon={
            <Settings className="h-6 w-6" />
          }
        />

        <QuickCard
          title="Notifications"
          text="Follow important platform updates."
          href="/dashboard/notifications"
          icon={<Bell className="h-6 w-6" />}
        />
      </div>
    </div>
  );
}

function BuyerDashboard({
  stats,
  user,
}: {
  stats: BuyerDashboardStats | null;
  user: AuthUser | null;
}) {
  const toast = useToast();

  const [profile, setProfile] =
    useState<BuyerProfileSummary | null>(
      null,
    );

  useEffect(() => {
    async function loadProfile() {
      const token = getToken();

      if (!token) {
        return;
      }

      try {
        const data =
          await getMyProfile(token);

        setProfile(data);
      } catch (error) {
        toast.error(
          "Unable to load profile",
          error instanceof Error
            ? error.message
            : "Please try again.",
        );
      }
    }

    void loadProfile();
  }, [toast]);

  const firstName =
    user?.fullName?.trim().split(" ")[0] ||
    "Buyer";

  return (
    <div className="space-y-8">
      <WelcomeBanner
        title={`Welcome back, ${firstName}`}
        subtitle="Track your requests, matching progress and Portugal property journey."
        badge="Buyer workspace"
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {profile && (
          <ProfileProgressCard
            profile={profile}
          />
        )}

        <StatCard
          title="My Requests"
          value={String(
            profile?.totalRequests ??
              stats?.leads.total ??
              0,
          )}
          subtext={`${
            stats?.leads.hot ?? 0
          } hot requests`}
          growth="Live"
          icon={UserPlus}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />

        <StatCard
          title="My Matches"
          value={String(
            profile?.totalMatches ??
              stats?.matches.total ??
              0,
          )}
          subtext={`${
            stats?.matches.active ?? 0
          } active matches`}
          growth="Live"
          icon={GitBranch}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />

        <StatCard
          title="Contacted"
          value={String(
            stats?.matches.contacted ?? 0,
          )}
          subtext="Professionals contacted"
          growth="Live"
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />

        {!profile && (
          <StatCard
            title="Notifications"
            value={String(
              stats?.notifications.unread ??
                0,
            )}
            subtext="Unread notifications"
            growth="Live"
            icon={Bell}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
        )}
      </div>

      {profile && (
        <BuyerJourneyCard profile={profile} />
      )}
      <ProfessionalApplicationCard />

      <div className="grid gap-6 md:grid-cols-3">
        <QuickCard
          title="My Requests"
          text="Review your real estate requests."
          href="/dashboard/my-leads"
          icon={
            <UserPlus className="h-6 w-6" />
          }
        />

        <QuickCard
          title="My Matches"
          text="View professionals matched to your needs."
          href="/dashboard/my-matches"
          icon={
            <GitBranch className="h-6 w-6" />
          }
        />

        <QuickCard
          title="Settings"
          text="Manage your personal information."
          href="/dashboard/settings"
          icon={
            <Settings className="h-6 w-6" />
          }
        />
      </div>
    </div>
  );
}

function WelcomeBanner({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#1B365D_0%,#0F2340_70%,#102C50_100%)] px-7 py-8 text-white shadow-[0_18px_50px_rgba(15,35,64,0.18)] md:px-10 md:py-10">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />
      <div className="absolute -bottom-32 right-20 h-72 w-72 rounded-full bg-[#C9A227]/10 blur-3xl" />

      <div className="relative max-w-3xl">
        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-[#F6D978]">
          {badge}
        </span>

        <h1 className="mt-5 text-[36px] font-semibold leading-tight tracking-[-0.03em] md:text-[48px]">
          {title}
        </h1>

        <p className="mt-3 max-w-2xl text-[17px] leading-7 text-white/75">
          {subtitle}
        </p>
      </div>
    </section>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="h-52 animate-pulse rounded-[30px] bg-[#E9EDF3]" />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="h-52 animate-pulse rounded-[28px] bg-[#E9EDF3]"
            />
          ),
        )}
      </div>

      <div className="h-96 animate-pulse rounded-[28px] bg-[#E9EDF3]" />
    </div>
  );
}

function QuickCard({
  title,
  text,
  href,
  icon,
}: {
  title: string;
  text: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_6px_22px_rgba(16,24,40,0.05)] transition hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(16,24,40,0.08)]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#EEF3F8] text-[#1B365D] transition group-hover:bg-[#1B365D] group-hover:text-white">
        {icon}
      </div>

      <h3 className="mt-8 text-[22px] font-semibold text-[#0F2340]">
        {title}
      </h3>

      <p className="mt-2 text-[15px] leading-6 text-[#667085]">
        {text}
      </p>
    </Link>
  );
}