"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  AlertCircle,
  Loader2,
  BadgeCheck,
  BriefcaseBusiness,
  Clock3,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  getMyProfessionalApplication,
  type MyProfessionalProfile,
} from "@/lib/professionals-api";
import { getToken } from "@/lib/session";
import { useToast } from "@/components/ui/ToastProvider";

export default function ProfessionalApplicationCard() {
  const router = useRouter();
  const toast = useToast();

  const [
    profile,
    setProfile,
  ] = useState<MyProfessionalProfile | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    openingWorkspace,
    setOpeningWorkspace,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadApplication() {
      const token = getToken();

      if (!token) {
        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      try {
        const result =
          await getMyProfessionalApplication(
            token,
          );

        if (!cancelled) {
          setProfile(
            result.professionalProfile,
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load professional application.";

        toast.error(
          "Unable to load application",
          message,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadApplication();

    return () => {
      cancelled = true;
    };
  }, [toast]);
  function handleOpenProfessionalWorkspace() {
    setOpeningWorkspace(true);

    toast.success(
      "Professional account activated",
      "Please sign in again to refresh your professional permissions.",
    );

    /*
     * Le rôle a bien été modifié dans la base,
     * mais le JWT actuel contient encore BUYER.
     * Nous redirigeons donc vers la connexion.
     */
    router.replace(
      "/login?reason=professional-activated",
    );
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
            <BriefcaseBusiness size={24} />
          </div>

          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Professional network
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Become a Professional
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Submit your professional profile
              and join the verified Real Estate
              Lisbon professional network.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/become-professional",
                )
              }
              className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Submit Application
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (
    profile.verificationStatus ===
    "PENDING"
  ) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-amber-600">
            <Clock3 size={24} />
          </div>

          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Professional application
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Application Under Review
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Your application as{" "}
              <strong>
                {formatProfessionalType(
                  profile.professionalType,
                )}
              </strong>{" "}
              has been submitted successfully.
              An administrator will review it
              before activating your professional
              workspace.
            </p>

            <div className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">
              Status: Pending
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (
    profile.verificationStatus ===
    "ACTIVE"
  ) {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-emerald-600">
            <BadgeCheck size={24} />
          </div>

          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Verified professional
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Professional Account Active
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Your application has been approved.
              You can now access your professional
              workspace.
            </p>

            <button
              type="button"
              disabled={openingWorkspace}
              onClick={
                handleOpenProfessionalWorkspace
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {openingWorkspace && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {openingWorkspace
                ? "Redirecting..."
                : "Open Professional Workspace"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (
    profile.verificationStatus ===
    "REJECTED"
  ) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-red-600">
            <AlertCircle size={24} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
              Professional application
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Application Rejected
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Your professional application was
              not approved. Please contact the
              platform administration for more
              information.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-300 bg-slate-100 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-white p-3 text-slate-600">
          <ShieldAlert size={24} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Professional account
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Account Suspended
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            Your professional account is
            currently suspended. Contact the
            platform administration for
            assistance.
          </p>
        </div>
      </div>
    </section>
  );
}

function formatProfessionalType(
  type: string,
) {
  return type
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}