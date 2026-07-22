"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";
import type { AuthUser } from "@/lib/auth-api";
import { getStoredUser, getToken } from "@/lib/session";
import {
  deleteUser,
  getUsers,
  type UserItem,
} from "@/lib/users-api";

const ITEMS_PER_PAGE = 3;

function roleBadge(role: string) {
  if (role === "ADMIN") {
    return "bg-[#EDE9FE] text-[#7C3AED]";
  }

  if (role === "PROFESSIONAL") {
    return "bg-[#DBEAFE] text-[#2563EB]";
  }

  if (role === "BUYER") {
    return "bg-[#DCFCE7] text-[#16A34A]";
  }

  return "bg-[#F3F4F6] text-[#475467]";
}

function initials(
  name?: string | null,
  email?: string | null,
) {
  return (
    name?.trim().charAt(0).toUpperCase() ||
    email?.trim().charAt(0).toUpperCase() ||
    "U"
  );
}

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString();
}

export default function UsersPage() {
  const router = useRouter();
  const toast = useToast();
  const user = getStoredUser<AuthUser>();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadUsers() {
      const token = getToken();

      if (!token || !user) {
        router.replace("/login");
        return;
      }

      if (user.role !== "ADMIN") {
        router.replace("/access-denied");
        return;
      }

      try {
        setLoading(true);

        const data = await getUsers(token);
        setUsers(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load users.";

        const normalizedMessage =
          message.toLowerCase();

        if (
          normalizedMessage.includes("401") ||
          normalizedMessage.includes("unauthorized")
        ) {
          router.replace("/login");
          return;
        }

        if (
          normalizedMessage.includes("403") ||
          normalizedMessage.includes("forbidden") ||
          normalizedMessage.includes("permission")
        ) {
          router.replace("/access-denied");
          return;
        }

        toast.error(
          "Unable to load users",
          message,
        );
      } finally {
        setLoading(false);
      }
    }

    void loadUsers();
  }, [router, toast, user?.role]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredUsers = useMemo(() => {
    const query = search
      .toLowerCase()
      .trim();

    if (!query) {
      return users;
    }

    return users.filter((item) =>
      [
        item.fullName,
        item.email,
        item.role,
        item.city,
        item.country,
        item.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [users, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUsers.length / ITEMS_PER_PAGE,
    ),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const startIndex =
      (currentPage - 1) * ITEMS_PER_PAGE;

    const endIndex =
      startIndex + ITEMS_PER_PAGE;

    return filteredUsers.slice(
      startIndex,
      endIndex,
    );
  }, [filteredUsers, currentPage]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];

    const startPage = Math.max(
      1,
      currentPage - 2,
    );

    const endPage = Math.min(
      totalPages,
      currentPage + 2,
    );

    for (
      let page = startPage;
      page <= endPage;
      page += 1
    ) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const stats = useMemo(
    () => [
      {
        label: "Total Users",
        value: users.length,
        sub: "All registered accounts",
        icon: Users,
      },
      {
        label: "Admins",
        value: users.filter(
          (item) => item.role === "ADMIN",
        ).length,
        sub: "Platform managers",
        icon: ShieldCheck,
      },
      {
        label: "Professionals",
        value: users.filter(
          (item) =>
            item.role === "PROFESSIONAL",
        ).length,
        sub: "Service providers",
        icon: UserRound,
      },
      {
        label: "Buyers",
        value: users.filter(
          (item) => item.role === "BUYER",
        ).length,
        sub: "Property seekers",
        icon: Users,
      },
    ],
    [users],
  );

  const firstVisibleUser =
    filteredUsers.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleUser = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredUsers.length,
  );

  async function handleDelete(
    userItem: UserItem,
  ) {
    const confirmed = window.confirm(
      `Delete ${
        userItem.fullName ||
        userItem.email
      }? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setDeletingId(userItem.id);

    try {
      await deleteUser(
        token,
        userItem.id,
      );

      setUsers((currentUsers) =>
        currentUsers.filter(
          (item) =>
            item.id !== userItem.id,
        ),
      );

      toast.success(
        "User deleted",
        "The user account was removed successfully.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete user.";

      toast.error(
        "Delete failed",
        message,
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <UsersPageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[42px] font-semibold leading-none tracking-[-0.02em] text-[#0F2340] md:text-[52px]">
          Users Management
        </h1>

        <p className="mt-3 text-[18px] text-[#667085]">
          Manage all platform users and
          account roles.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF3F8] text-[#1B365D]">
                <Icon className="h-6 w-6" />
              </div>

              <p className="mt-10 text-[48px] font-semibold leading-none text-[#0F2340]">
                {item.value}
              </p>

              <p className="mt-3 text-[18px] text-[#344054]">
                {item.label}
              </p>

              <p className="mt-3 text-[15px] text-[#667085]">
                {item.sub}
              </p>
            </div>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
        <div className="border-b border-[#E4E7EC] p-7">
          <div className="relative w-full xl:max-w-[770px]">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search users by name, email, role or location..."
              aria-label="Search users"
              className="h-14 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-14 pr-4 text-[17px] text-[#0F2340] outline-none placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-[14px] font-semibold uppercase tracking-[0.04em] text-[#475467]">
                <th className="px-7 py-5">
                  User
                </th>

                <th className="px-7 py-5">
                  Role
                </th>

                <th className="px-7 py-5">
                  Contact
                </th>

                <th className="px-7 py-5">
                  Location
                </th>

                <th className="px-7 py-5">
                  Created
                </th>

                <th className="px-7 py-5 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAECF0]">
              {paginatedUsers.map(
                (item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-[#FAFBFC]"
                  >
                    <td className="px-7 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#475467_0%,#D4AF37_100%)] text-[18px] font-semibold text-white">
                          {initials(
                            item.fullName,
                            item.email,
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[18px] font-semibold text-[#0F2340]">
                            {item.fullName ||
                              "Unnamed user"}
                          </p>

                          <p className="truncate text-[15px] text-[#667085]">
                            {item.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-7 py-5">
                      <span
                        className={`inline-flex rounded-full px-4 py-1.5 text-[15px] font-semibold ${roleBadge(
                          item.role,
                        )}`}
                      >
                        {item.role}
                      </span>
                    </td>

                    <td className="px-7 py-5">
                      <div className="space-y-2 text-[15px] text-[#667085]">
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 shrink-0 text-[#1B365D]" />
                          <span className="max-w-[250px] truncate">
                            {item.email}
                          </span>
                        </p>

                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0 text-[#1B365D]" />
                          {item.phone || "-"}
                        </p>
                      </div>
                    </td>

                    <td className="px-7 py-5">
                      <p className="flex items-center gap-2 text-[15px] text-[#667085]">
                        <MapPin className="h-4 w-4 shrink-0 text-[#1B365D]" />

                        {[item.city, item.country]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-7 py-5 text-[15px] text-[#667085]">
                      {formatDate(
                        item.createdAt,
                      )}
                    </td>

                    <td className="px-7 py-5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(item)
                          }
                          disabled={
                            deletingId ===
                              item.id ||
                            item.id === user?.id
                          }
                          title={
                            item.id === user?.id
                              ? "You cannot delete your own account"
                              : "Delete user"
                          }
                          aria-label={`Delete ${
                            item.fullName ||
                            item.email
                          }`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-7 py-14 text-center"
                  >
                    <Users className="mx-auto h-10 w-10 text-[#98A2B3]" />

                    <p className="mt-4 font-semibold text-[#344054]">
                      No users found
                    </p>

                    <p className="mt-2 text-sm text-[#667085]">
                      Try another name, email,
                      role or location.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-[#E4E7EC] px-7 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#667085]">
              Showing{" "}
              <span className="font-semibold text-[#0F2340]">
                {firstVisibleUser}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-[#0F2340]">
                {lastVisibleUser}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#0F2340]">
                {filteredUsers.length}
              </span>{" "}
              users
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(1, page - 1),
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {visiblePages.map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        pageNumber,
                      )
                    }
                    className={`h-10 min-w-10 rounded-xl px-3 text-sm font-semibold transition ${
                      currentPage ===
                      pageNumber
                        ? "bg-[#1B365D] text-white"
                        : "border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8F9FA]"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(
                      totalPages,
                      page + 1,
                    ),
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function UsersPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-12 w-80 animate-pulse rounded-xl bg-[#E9EDF3]" />
        <div className="h-6 w-96 animate-pulse rounded-xl bg-[#E9EDF3]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="h-60 animate-pulse rounded-[28px] bg-[#E9EDF3]"
            />
          ),
        )}
      </div>

      <div className="h-[520px] animate-pulse rounded-[28px] bg-[#E9EDF3]" />
    </div>
  );
}