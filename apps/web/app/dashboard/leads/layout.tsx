"use client";

import { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";

export default function LeadsLayout({
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