"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  Loader2,
  Mail,
  Search,
  ShieldAlert,
  Star,
  XCircle,
} from "lucide-react";

import {
  approveProfessional,
  getProfessionals,
  Professional,
  rejectProfessional,
} from "@/lib/professionals-api";
import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import type { AuthUser } from "@/lib/auth-api";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

const ITEMS_PER_PAGE = 3;

type StatusFilter =
  | "ALL"
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED";

function getImageSrc(
  url?: string | null,
) {
  if (!url) {
    return "";
  }

  if (url.startsWith("http")) {
    return url;
  }

  return `${API_URL}${url}`;
}

function getInitials(
  name?: string | null,
  email?: string | null,
) {
  if (name?.trim()) {
    return name
      .trim()
      .charAt(0)
      .toUpperCase();
  }

  if (email?.trim()) {
    return email
      .trim()
      .charAt(0)
      .toUpperCase();
  }

  return "P";
}

function formatType(type: string) {
  return type.replaceAll("_", " ");
}

function statusBadge(status: string) {
  if (status === "ACTIVE") {
    return "bg-[#DCFCE7] text-[#16A34A]";
  }

  if (status === "PENDING") {
    return "bg-[#FEF3C7] text-[#B54708]";
  }

  if (
    status === "REJECTED" ||
    status === "SUSPENDED"
  ) {
    return "bg-[#FEE2E2] text-[#DC2626]";
  }

  return "bg-[#F3F4F6] text-[#475467]";
}

export default function ProfessionalsPage() {
  const toast = useToast();
  const router = useRouter();

  const [
    professionals,
    setProfessionals,
  ] = useState<Professional[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>("ALL");

  const [
    processingId,
    setProcessingId,
  ] = useState<string | null>(null);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  useEffect(() => {
  let isMounted = true;

  async function loadProfessionals() {
    /*
     * ============================================================
     * FRONTEND ACCESS CONTROL
     * ============================================================
     *
     * This page is strictly reserved for administrators.
     *
     * IMPORTANT:
     * The role is checked BEFORE calling the professionals API.
     * Therefore a BUYER or PROFESSIONAL:
     *
     * - cannot see the admin interface,
     * - cannot trigger getProfessionals(),
     * - is immediately redirected to /access-denied.
     */

    const user = getStoredUser<AuthUser>();

    if (!user) {
      if (isMounted) {
        router.replace("/login");
      }

      return;
    }

    if (user.role !== "ADMIN") {
      if (isMounted) {
        router.replace("/access-denied");
      }

      return;
    }

    /*
     * ============================================================
     * TOKEN CHECK
     * ============================================================
     */

    const token = getToken();

    if (!token) {
      if (isMounted) {
        toast.warning(
          "Session required",
          "Please sign in again.",
        );

        router.replace("/login");
      }

      return;
    }

    /*
     * ============================================================
     * ADMIN DATA
     * ============================================================
     */

    try {
      const data = await getProfessionals(token);

      if (isMounted) {
        setProfessionals(data);
      }
    } catch (error) {
      if (isMounted) {
        toast.error(
          "Unable to load professionals",
          error instanceof Error
            ? error.message
            : "Failed to load professionals.",
        );
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }

  void loadProfessionals();

  return () => {
    isMounted = false;
  };
}, [router, toast]);

  const filteredProfessionals =
    useMemo(() => {
      const query = search
        .toLowerCase()
        .trim();

      return professionals.filter(
        (professional) => {
          const matchesSearch =
            !query ||
            professional.user.fullName
              ?.toLowerCase()
              .includes(query) ||
            professional.user.email
              .toLowerCase()
              .includes(query) ||
            professional.professionalType
              .toLowerCase()
              .includes(query) ||
            professional.companyName
              ?.toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "ALL" ||
            professional.verificationStatus ===
              statusFilter;

          return Boolean(
            matchesSearch &&
              matchesStatus,
          );
        },
      );
    }, [
      professionals,
      search,
      statusFilter,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredProfessionals.length /
        ITEMS_PER_PAGE,
    ),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProfessionals =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredProfessionals.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE,
      );
    }, [
      filteredProfessionals,
      currentPage,
    ]);

  const stats = useMemo(() => {
    return {
      total: professionals.length,

      pending: professionals.filter(
        (professional) =>
          professional.verificationStatus ===
          "PENDING",
      ).length,

      active: professionals.filter(
        (professional) =>
          professional.verificationStatus ===
          "ACTIVE",
      ).length,

      rejected: professionals.filter(
        (professional) =>
          professional.verificationStatus ===
          "REJECTED",
      ).length,
    };
  }, [professionals]);

  async function handleApprove(
    id: string,
  ) {
    const token = getToken();

    if (!token) {
      toast.warning(
        "Session required",
        "Please sign in again.",
      );
      return;
    }

    if (processingId !== null) {
      return;
    }

    setProcessingId(id);

    try {
      await approveProfessional(
        token,
        id,
      );

      /*
       * Mise à jour immédiate de l'état React.
       * Aucun second appel getProfessionals()
       * n'est nécessaire avant le toast.
       */
      setProfessionals(
        (previousProfessionals) =>
          previousProfessionals.map(
            (professional) =>
              professional.id === id
                ? {
                    ...professional,
                    verificationStatus:
                      "ACTIVE",
                  }
                : professional,
          ),
      );

      toast.success(
        "Professional approved",
        "The profile is now active.",
      );
    } catch (error) {
      toast.error(
        "Approval failed",
        error instanceof Error
          ? error.message
          : "Unable to approve professional.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(
    id: string,
  ) {
    const token = getToken();

    if (!token) {
      toast.warning(
        "Session required",
        "Please sign in again.",
      );
      return;
    }

    if (processingId !== null) {
      return;
    }

    setProcessingId(id);

    try {
      const updated =
        await rejectProfessional(
          token,
          id,
        );

      setProfessionals(
        (previousProfessionals) =>
          previousProfessionals.map(
            (professional) =>
              professional.id === id
                ? {
                    ...professional,
                    ...updated,
                  }
                : professional,
          ),
      );

      toast.success(
        "Professional rejected",
        "The profile has been rejected.",
      );
    } catch (error) {
      toast.error(
        "Reject failed",
        error instanceof Error
          ? error.message
          : "Unable to reject professional.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-3 text-[#667085]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading professionals...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[52px] font-semibold leading-[1] tracking-[-0.02em] text-[#0F2340]">
            Professional Management
          </h1>

          <p className="mt-3 text-[18px] text-[#667085]">
            Review, approve and manage
            professionals in your real
            estate network
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Professionals"
          value={stats.total}
          icon={
            <BriefcaseBusiness className="h-6 w-6" />
          }
        />

        <StatCard
          title="Pending Approval"
          value={stats.pending}
          icon={
            <ShieldAlert className="h-6 w-6" />
          }
        />

        <StatCard
          title="Active Professionals"
          value={stats.active}
          icon={
            <BadgeCheck className="h-6 w-6" />
          }
        />

        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={
            <XCircle className="h-6 w-6" />
          }
        />
      </div>

      <div className="rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
        <div className="border-b border-[#E4E7EC] p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-[720px]">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />

              <input
                type="text"
                placeholder="Search by name, email, company or type..."
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value,
                  );
                  setCurrentPage(1);
                }}
                className="h-14 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-14 pr-4 text-[17px] text-[#0F2340] outline-none placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  "ALL",
                  "PENDING",
                  "ACTIVE",
                  "REJECTED",
                ] as const
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`rounded-2xl px-5 py-3 text-[15px] font-semibold transition ${
                    statusFilter === status
                      ? "bg-[#1B365D] text-white"
                      : "bg-[#F8FAFC] text-[#344054] hover:bg-[#EEF3F8]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-[14px] font-semibold uppercase tracking-[0.04em] text-[#475467]">
                <th className="px-7 py-5">
                  Professional
                </th>

                <th className="px-7 py-5">
                  Type
                </th>

                <th className="px-7 py-5">
                  Company
                </th>

                <th className="px-7 py-5">
                  Rating
                </th>

                <th className="px-7 py-5">
                  Clients
                </th>

                <th className="px-7 py-5">
                  Status
                </th>

                <th className="px-7 py-5">
                  Created
                </th>

                <th className="px-7 py-5 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedProfessionals.map(
                (professional) => {
                  const avatar =
                    getImageSrc(
                      professional.user
                        .avatarUrl,
                    );

                  const initials =
                    getInitials(
                      professional.user
                        .fullName,
                      professional.user.email,
                    );

                  const isProcessing =
                    processingId ===
                    professional.id;

                  const isAnyProcessing =
                    processingId !== null;

                  return (
                    <tr
                      key={professional.id}
                      className="border-t border-[#EAECF0]"
                    >
                      <td className="px-7 py-5">
                        <div className="flex items-center gap-4">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={
                                professional.user
                                  .fullName ||
                                "Professional"
                              }
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#475467_0%,#D4AF37_100%)] text-[18px] font-semibold text-white">
                              {initials}
                            </div>
                          )}

                          <div>
                            <p className="text-[18px] font-semibold text-[#0F2340]">
                              {professional.user
                                .fullName ||
                                "Unnamed professional"}
                            </p>

                            <p className="text-[15px] text-[#667085]">
                              {
                                professional.user
                                  .email
                              }
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-7 py-5 text-[16px] text-[#0F2340]">
                        {formatType(
                          professional.professionalType,
                        )}
                      </td>

                      <td className="px-7 py-5 text-[16px] text-[#667085]">
                        {professional.companyName ||
                          "Independent"}
                      </td>

                      <td className="px-7 py-5">
                        <div className="flex items-center gap-2 text-[16px] text-[#0F2340]">
                          <Star className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />

                          {Number(
                            professional.rating ||
                              0,
                          ).toFixed(1)}
                        </div>
                      </td>

                      <td className="px-7 py-5 text-[16px] text-[#0F2340]">
                        {
                          professional.clientsCount
                        }
                      </td>

                      <td className="px-7 py-5">
                        <span
                          className={`rounded-full px-4 py-1.5 text-[15px] font-semibold ${statusBadge(
                            professional.verificationStatus,
                          )}`}
                        >
                          {
                            professional.verificationStatus
                          }
                        </span>
                      </td>

                      <td className="px-7 py-5 text-[15px] text-[#667085]">
                        {new Date(
                          professional.createdAt,
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-7 py-5">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/dashboard/professionals/${professional.id}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D0D5DD] text-[#344054] transition hover:bg-[#F8FAFC]"
                            title="View professional details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          <Link
                            href={`mailto:${professional.user.email}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D0D5DD] text-[#344054] transition hover:bg-[#F8FAFC]"
                            title="Email"
                          >
                            <Mail className="h-4 w-4" />
                          </Link>

                          {professional.verificationStatus ===
                            "PENDING" && (
                            <>
                              <button
                                type="button"
                                disabled={
                                  isAnyProcessing
                                }
                                onClick={() =>
                                  void handleApprove(
                                    professional.id,
                                  )
                                }
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#DCFCE7] px-4 text-sm font-semibold text-[#16A34A] transition hover:bg-[#BBF7D0] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}

                                {isProcessing
                                  ? "Approving..."
                                  : "Approve"}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  isAnyProcessing
                                }
                                onClick={() =>
                                  void handleReject(
                                    professional.id,
                                  )
                                }
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FEE2E2] px-4 text-sm font-semibold text-[#DC2626] transition hover:bg-[#FECACA] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>

          {filteredProfessionals.length ===
            0 && (
            <div className="p-8 text-center text-[#667085]">
              No professionals found.
            </div>
          )}

          {filteredProfessionals.length >
            0 && (
            <div className="flex flex-col gap-4 border-t border-[#E4E7EC] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#667085]">
                Showing{" "}
                <span className="font-semibold text-[#0F2340]">
                  {(currentPage - 1) *
                    ITEMS_PER_PAGE +
                    1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-[#0F2340]">
                  {Math.min(
                    currentPage *
                      ITEMS_PER_PAGE,
                    filteredProfessionals.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#0F2340]">
                  {
                    filteredProfessionals.length
                  }
                </span>{" "}
                professionals
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (previousPage) =>
                        Math.max(
                          1,
                          previousPage - 1,
                        ),
                    )
                  }
                  className="h-10 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) =>
                    index + 1,
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      setCurrentPage(page)
                    }
                    className={`h-10 min-w-10 rounded-xl ${
                      currentPage === page
                        ? "bg-[#1B365D] text-white"
                        : "border border-[#D0D5DD] text-[#344054]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (previousPage) =>
                        Math.min(
                          totalPages,
                          previousPage + 1,
                        ),
                    )
                  }
                  className="h-10 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF3F8] text-[#1B365D]">
        {icon}
      </div>

      <p className="mt-10 text-[48px] font-semibold leading-none text-[#0F2340]">
        {value}
      </p>

      <p className="mt-3 text-[18px] text-[#344054]">
        {title}
      </p>
    </div>
  );
}