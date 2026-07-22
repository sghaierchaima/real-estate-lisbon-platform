"use client";

import { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";

type AuditLayoutProps = {
  children: ReactNode;
};

export default function AuditLayout({
  children,
}: AuditLayoutProps) {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      {children}
    </RoleGuard>
  );
}