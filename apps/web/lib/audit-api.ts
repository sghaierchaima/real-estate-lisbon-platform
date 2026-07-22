import { apiFetch } from "./api";

export type AuditLogItem = {
  id: string;
  userId: string | null;
  userRole: "ADMIN" | "BUYER" | "PROFESSIONAL" | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export function getAuditLogs(token: string) {
  return apiFetch<AuditLogItem[]>("/audit", { token });
}