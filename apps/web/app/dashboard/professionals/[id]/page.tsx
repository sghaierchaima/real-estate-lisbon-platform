"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  ImageIcon,
  Languages,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";
import {
  approveProfessional,
  getProfessionalById,
  rejectProfessional,
  type Professional,
} from "@/lib/professionals-api";
import { getStoredUser, getToken } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { getAssetUrl } from "@/lib/api";
function statusStyle(status: Professional["verificationStatus"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-50 text-green-700 border-green-200";

    case "PENDING":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";

    case "SUSPENDED":
      return "bg-orange-50 text-orange-700 border-orange-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function formatProfessionalType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
}

function getInitial(
  name?: string | null,
  email?: string | null,
) {
  return (
    name?.trim().charAt(0).toUpperCase() ||
    email?.trim().charAt(0).toUpperCase() ||
    "P"
  );
}

export default function ProfessionalDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const currentUser = getStoredUser<AuthUser>();

  const [professional, setProfessional] =
    useState<Professional | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState<"approve" | "reject" | null>(
      null,
    );

  const [
    showRejectModal,
    setShowRejectModal,
  ] = useState(false);

  const [rejectingProfessional, setRejectingProfessional] =
    useState(false);

  const professionalId = params.id;

  async function loadProfessional() {
    const token = getToken();

    if (!token || !currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.role !== "ADMIN") {
      router.replace("/access-denied");
      return;
    }

    try {
      setLoading(true);

      const result =
        await getProfessionalById(
          token,
          professionalId,
        );

      setProfessional(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load professional.";

      const normalized =
        message.toLowerCase();

      if (
        normalized.includes("401") ||
        normalized.includes("unauthorized")
      ) {
        router.replace("/login");
        return;
      }

      if (
        normalized.includes("403") ||
        normalized.includes("forbidden") ||
        normalized.includes("permission")
      ) {
        router.replace("/access-denied");
        return;
      }

      if (
        normalized.includes("404") ||
        normalized.includes("not found")
      ) {
        router.replace(
          "/dashboard/professionals",
        );

        toast.error(
          "Professional not found",
          "The requested profile does not exist.",
        );

        return;
      }

      toast.error(
        "Unable to load professional",
        message,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfessional();
  }, [professionalId]);

  const location = useMemo(() => {
    if (!professional) {
      return "-";
    }

    return (
      [
        professional.user.city,
        professional.user.country,
      ]
        .filter(Boolean)
        .join(", ") || "-"
    );
  }, [professional]);
  const verificationDocumentUrl =
  professional?.verificationDocumentUrl
    ? getAssetUrl(
        professional.verificationDocumentUrl,
        "",
      )
    : "";

  async function handleApprove() {
    if (!professional) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setProcessing("approve");

    try {
      const updated =
        await approveProfessional(
          token,
          professional.id,
        );

      setProfessional(updated);

      toast.success(
        "Professional approved",
        "The professional profile is now active.",
      );
    } catch (error) {
      toast.error(
        "Approval failed",
        error instanceof Error
          ? error.message
          : "Unable to approve professional.",
      );
    } finally {
      setProcessing(null);
    }
  }

  function requestRejectProfessional() {
    if (!professional) {
      return;
    }

    setShowRejectModal(true);
  }

  async function confirmRejectProfessional() {
    if (
      !professional ||
      rejectingProfessional
    ) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setRejectingProfessional(true);
    setProcessing("reject");

    try {
      const updated =
        await rejectProfessional(
          token,
          professional.id,
        );

      setProfessional(updated);

      toast.success(
        "Professional rejected",
        "The professional has been notified.",
      );

      setShowRejectModal(false);
    } catch (error) {
      toast.error(
        "Rejection failed",
        error instanceof Error
          ? error.message
          : "Unable to reject professional.",
      );
    } finally {
      setRejectingProfessional(false);
      setProcessing(null);
    }
  }

  if (loading) {
    return <ProfessionalDetailsSkeleton />;
  }

  if (!professional) {
    return null;
  }

  return (
    <>
      <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/professionals"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#667085] transition hover:text-[#1B365D]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to professionals
          </Link>

          <h1 className="mt-5 text-[42px] font-semibold leading-none tracking-[-0.03em] text-[#0F2340] md:text-[52px]">
            Professional Details
          </h1>

          <p className="mt-3 text-[18px] text-[#667085]">
            Review profile information,
            verification status and activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
  {professional.verificationStatus ===
    "PENDING" && (
    <>
      <button
        type="button"
        onClick={handleApprove}
        disabled={processing !== null}
        className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#1B365D] px-5 font-semibold text-white transition hover:bg-[#10284D] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CheckCircle2 className="h-5 w-5" />

        {processing === "approve"
          ? "Approving..."
          : "Approve"}
      </button>

      <button
        type="button"
        onClick={
          requestRejectProfessional
        }
        disabled={processing !== null}
        className="inline-flex h-12 items-center gap-2 rounded-xl border border-red-200 bg-white px-5 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <XCircle className="h-5 w-5" />

        {processing === "reject"
          ? "Rejecting..."
          : "Reject"}
      </button>
    </>
  )}
</div>
      </div>

      <section className="overflow-hidden rounded-[30px] border border-[#E4E7EC] bg-white shadow-[0_8px_28px_rgba(15,35,64,0.05)]">
        <div className="bg-[linear-gradient(135deg,#1B365D,#0F2340)] px-7 py-10 text-white md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            {professional.user.avatarUrl ? (
  <img
    src={getAssetUrl(
      professional.user.avatarUrl,
      "/images/default-avatar.png",
    )}
    alt={
      professional.user.fullName ||
      "Professional"
    }
    className="h-28 w-28 rounded-full border-4 border-white/20 object-cover"
    onError={(event) => {
      event.currentTarget.onerror = null;
      event.currentTarget.src =
        "/images/default-avatar.png";
    }}
  />
) : (
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-white/20 bg-[linear-gradient(135deg,#475467,#C9A227)] text-4xl font-semibold">
                {getInitial(
                  professional.user.fullName,
                  professional.user.email,
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-semibold">
                  {professional.user.fullName ||
                    "Unnamed professional"}
                </h2>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(
                    professional.verificationStatus,
                  )}`}
                >
                  {professional.verificationStatus}
                </span>
              </div>

              <p className="mt-2 text-lg text-white/80">
                {formatProfessionalType(
                  professional.professionalType,
                )}
              </p>

              <p className="mt-1 text-white/65">
                {professional.companyName ||
                  "Independent professional"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-4">
          <InfoMetric
            icon={Star}
            label="Rating"
            value={`${professional.rating.toFixed(
              1,
            )} / 5`}
          />

          <InfoMetric
            icon={Users}
            label="Clients"
            value={String(
              professional.clientsCount,
            )}
          />

          <InfoMetric
            icon={ShieldCheck}
            label="Profile completion"
            value={`${professional.profileCompletion}%`}
          />

          <InfoMetric
            icon={Building2}
            label="Properties"
            value={String(
              professional.properties?.length ??
                0,
            )}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <UserRound className="h-6 w-6 text-[#1B365D]" />

            <h2 className="text-2xl font-semibold text-[#0F2340]">
              Professional profile
            </h2>
          </div>

          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <DetailItem
              icon={BriefcaseBusiness}
              label="Professional type"
              value={formatProfessionalType(
                professional.professionalType,
              )}
            />

            <DetailItem
              icon={Building2}
              label="Company"
              value={
                professional.companyName ||
                "Independent professional"
              }
            />

            <DetailItem
              icon={Star}
              label="Reviews"
              value={`${professional.reviewsCount} reviews`}
            />

            <DetailItem
              icon={ShieldCheck}
              label="Created"
              value={formatDate(
                professional.createdAt,
              )}
            />
          </div>

          <div className="mt-8 border-t border-[#EAECF0] pt-7">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#667085]">
              Biography
            </p>

            <p className="mt-3 whitespace-pre-line leading-7 text-[#475467]">
              {professional.bio ||
                "No biography has been provided."}
            </p>
          </div>

          <div className="mt-8 border-t border-[#EAECF0] pt-7">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-[#1B365D]" />

              <p className="font-semibold text-[#0F2340]">
                Languages
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {professional.languages.length >
              0 ? (
                professional.languages.map(
                  (language) => (
                    <span
                      key={language}
                      className="rounded-full bg-[#EEF3F8] px-4 py-2 text-sm font-semibold text-[#1B365D]"
                    >
                      {language}
                    </span>
                  ),
                )
              ) : (
                <p className="text-[#667085]">
                  No languages provided.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-[#1B365D]" />

            <h2 className="text-2xl font-semibold text-[#0F2340]">
              Contact information
            </h2>
          </div>

          <div className="mt-7 space-y-5">
            <ContactItem
              icon={Mail}
              label="Email"
              value={professional.user.email}
              href={`mailto:${professional.user.email}`}
            />

            <ContactItem
              icon={Phone}
              label="Phone"
              value={
                professional.user.phone ||
                "Not provided"
              }
              href={
                professional.user.phone
                  ? `tel:${professional.user.phone}`
                  : undefined
              }
            />

            <ContactItem
              icon={MapPin}
              label="Location"
              value={location}
            />
          </div>

          <a
            href={`mailto:${professional.user.email}`}
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-5 font-semibold text-white transition hover:bg-[#10284D]"
          >
            <Mail className="h-5 w-5" />
            Email professional
          </a>
        </section>
      </div>
      <section className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-sm">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3F8] text-[#1B365D]">
        <ShieldCheck className="h-6 w-6" />
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#0F2340]">
          Professional Verification
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
          Verification document submitted by
          this applicant as proof of professional
          activity.
        </p>
      </div>
    </div>

    <span
      className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(
        professional.verificationStatus,
      )}`}
    >
      {professional.verificationStatus}
    </span>
  </div>

  {verificationDocumentUrl ? (
    <div className="mt-7">
      <div className="rounded-2xl border border-[#E4E7EC] bg-[#F8FAFC] p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#1B365D] shadow-sm">
              {professional.verificationDocumentMimeType?.startsWith(
                "image/",
              ) ? (
                <ImageIcon className="h-6 w-6" />
              ) : (
                <FileText className="h-6 w-6" />
              )}
            </div>

            <div className="min-w-0">
              <p className="break-all font-semibold text-[#0F2340]">
                {professional.verificationDocumentName ||
                  "Verification document"}
              </p>

              <p className="mt-1 text-sm text-[#667085]">
                {professional.verificationDocumentMimeType ||
                  "Professional verification file"}
              </p>
            </div>
          </div>

          <a
            href={verificationDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-5 text-sm font-semibold text-white transition hover:bg-[#10284D]"
          >
            <ExternalLink className="h-4 w-4" />
            View Document
          </a>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#667085]">
        This document is private and is used
        only for administrative verification.
      </p>
    </div>
  ) : (
    <div className="mt-7 rounded-2xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] p-6">
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#98A2B3]" />

        <div>
          <p className="font-semibold text-[#344054]">
            No verification document
          </p>

          <p className="mt-1 text-sm leading-6 text-[#667085]">
            No professional verification document
            is associated with this application.
          </p>
        </div>
      </div>
    </div>
  )}
</section>

      {professional.properties &&
  professional.properties.length > 0 && (
    <section className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold text-[#0F2340]">
          Published properties
        </h2>

        <p className="mt-2 text-[#667085]">
          Recent listings published by this professional.
        </p>
      </div>

      <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {professional.properties.map((property) => {
          const propertyImage = getAssetUrl(
            property.imageUrls?.[0],
            "/images/prop1.png",
          );

          return (
            <Link
              key={property.id}
              href={`/dashboard/properties/${property.id}`}
              className="group overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-[16/10] overflow-hidden bg-[#F2F4F7]">
                <img
                  src={propertyImage}
                  alt={property.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src =
                      "/images/prop1.png";
                  }}
                />
              </div>

              <div className="p-5">
                <h3 className="line-clamp-1 font-semibold text-[#0F2340]">
                  {property.title}
                </h3>

                <p className="mt-2 flex items-center gap-2 text-sm text-[#667085]">
                  <MapPin className="h-4 w-4 shrink-0" />

                  {property.city ||
                    property.location ||
                    "Portugal"}
                </p>

                <p className="mt-4 text-lg font-semibold text-[#1B365D]">
                  €{" "}
                  {Number(
                    property.price || 0,
                  ).toLocaleString()}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  )}
      </div>

      {showRejectModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F2340]/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-professional-title"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !rejectingProfessional
            ) {
              setShowRejectModal(false);
            }
          }}
        >
          <div className="relative w-full max-w-[500px] rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_24px_80px_rgba(15,35,64,0.30)]">
            <button
              type="button"
              disabled={
                rejectingProfessional
              }
              onClick={() =>
                setShowRejectModal(false)
              }
              aria-label="Close rejection confirmation"
              className="absolute right-5 top-5 rounded-full p-2 text-[#667085] transition hover:bg-[#F2F4F7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
              <XCircle className="h-7 w-7" />
            </div>

            <h2
              id="reject-professional-title"
              className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-[#0F2340]"
            >
              Reject this professional?
            </h2>

            <p className="mt-3 text-[15px] leading-7 text-[#667085]">
              You are about to reject the
              professional profile of{" "}
              <span className="font-semibold text-[#0F2340]">
                {professional.user.fullName ||
                  professional.user.email ||
                  "this professional"}
              </span>
              .
            </p>

            <div className="mt-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4">
              <p className="text-sm font-medium text-[#B42318]">
                Once rejected:
              </p>

              <p className="mt-2 text-sm leading-6 text-[#667085]">
                The profile will be marked as
                rejected and the professional
                will be notified.
              </p>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={
                  rejectingProfessional
                }
                onClick={() =>
                  setShowRejectModal(false)
                }
                className="h-12 rounded-xl border border-[#D0D5DD] px-6 font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  rejectingProfessional
                }
                onClick={() =>
                  void confirmRejectProfessional()
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-6 font-semibold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle className="h-5 w-5" />

                {rejectingProfessional
                  ? "Rejecting..."
                  : "Reject professional"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="border-t border-[#EAECF0] p-7 md:border-l md:border-t-0">
      <Icon className="h-6 w-6 text-[#1B365D]" />

      <p className="mt-5 text-sm text-[#667085]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-[#0F2340]">
        {value}
      </p>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-[#667085]">
        <Icon className="h-4 w-4" />
        {label}
      </div>

      <p className="mt-2 font-semibold text-[#0F2340]">
        {value}
      </p>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-4 rounded-2xl bg-[#F8F9FA] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1B365D]">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-sm text-[#667085]">
          {label}
        </p>

        <p className="mt-1 break-words font-semibold text-[#0F2340]">
          {value}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block transition hover:opacity-80"
      >
        {content}
      </a>
    );
  }

  return content;
}

function ProfessionalDetailsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-20 w-96 animate-pulse rounded-2xl bg-[#E9EDF3]" />

      <div className="h-80 animate-pulse rounded-[30px] bg-[#E9EDF3]" />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-[28px] bg-[#E9EDF3]" />
        <div className="h-96 animate-pulse rounded-[28px] bg-[#E9EDF3]" />
      </div>
    </div>
  );
}