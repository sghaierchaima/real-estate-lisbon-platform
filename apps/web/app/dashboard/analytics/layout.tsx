"use client";

import type { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";

export default function AnalyticsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      {children}
    </RoleGuard>
  );
}