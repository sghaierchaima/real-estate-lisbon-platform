"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { getToken } from "@/lib/session";
import { getMe } from "@/lib/auth-api";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await getMe(token);
        setChecking(false);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] text-[#667085]">
        Checking authentication...
      </div>
    );
  }

  return <>{children}</>;
}