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
      <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
        {/* Sidebar reste toujours fixe */}
        <DashboardSidebar />

        {/* Partie droite */}
        <div className="flex min-w-0 flex-1 flex-col h-screen">
          <DashboardHeader />

          {/* Seul le contenu du dashboard scroll */}
          <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}