import AuthGuard from "@/components/auth/AuthGuard";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#F8F9FA]">
        <DashboardSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}