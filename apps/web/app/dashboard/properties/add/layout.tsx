"use client";

import type { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";

export default function AddPropertyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["PROFESSIONAL"]}>
      {children}
    </RoleGuard>
  );
}