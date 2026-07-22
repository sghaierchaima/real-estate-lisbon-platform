"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getSessionUser,
  type SessionUser,
} from "@/lib/session";

type RoleGuardProps = {
  children: ReactNode;
  allowedRoles: SessionUser["role"][];
};

export default function RoleGuard({
  children,
  allowedRoles,
}: RoleGuardProps) {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const user = getSessionUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace("/access-denied");
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }, [allowedRoles, router]);

  if (checking || !authorized) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D0D5DD] border-t-[#1B365D]" />

          <p className="mt-4 text-sm text-[#667085]">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}