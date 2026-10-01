"use client";

import {
  FormEvent,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  submitProfessionalApplication,
  type ProfessionalType,
} from "@/lib/professionals-api";
import {
  getToken,
} from "@/lib/session";
import {
  useToast,
} from "@/components/ui/ToastProvider";

const professionalTypes: {
  value: ProfessionalType;
  label: string;
}[] = [
    {
      value: "MORTGAGE_BROKER",
      label: "Mortgage Broker",
    },
    {
      value: "PROPERTY_AGENT",
      label: "Property Agent",
    },
    {
      value: "PROPERTY_LAWYER",
      label: "Property Lawyer",
    },
    {
      value: "TAX_ADVISOR",
      label: "Tax Advisor",
    },
    {
      value: "HOME_INSPECTOR",
      label: "Home Inspector",
    },
    {
      value: "PROPERTY_VALUER",
      label: "Property Valuer",
    },
    {
      value: "INSURANCE_BROKER",
      label: "Insurance Broker",
    },
  ];

export default function BecomeProfessionalPage() {
  const router = useRouter();
  const toast = useToast();

  const [
    professionalType,
    setProfessionalType,
  ] = useState<ProfessionalType>(
    "PROPERTY_AGENT",
  );

  const [
    companyName,
    setCompanyName,
  ] = useState("");

  const [
    bio,
    setBio,
  ] = useState("");

  const [
    languagesText,
    setLanguagesText,
  ] = useState("");
  const [
    verificationDocument,
    setVerificationDocument,
  ] = useState<File | null>(null);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      toast.warning(
        "Session required",
        "Please sign in again.",
      );

      router.push("/login");
      return;
    }

    const languages = languagesText
      .split(",")
      .map((language) =>
        language.trim(),
      )
      .filter(Boolean);

    if (languages.length === 0) {
      toast.warning(
        "Languages required",
        "Please enter at least one language.",
      );
      return;
    }

    if (
      companyName.trim() &&
      companyName.trim().length < 2
    ) {
      toast.warning(
        "Invalid company name",
        "Company name must contain at least 2 characters.",
      );
      return;
    }

    if (
      bio.trim() &&
      bio.trim().length < 20
    ) {
      toast.warning(
        "Bio too short",
        "Your professional bio must contain at least 20 characters.",
      );
      return;
    }
    /* ============================================================
   PROFESSIONAL VERIFICATION DOCUMENT
============================================================ */

    if (!verificationDocument) {
      toast.warning(
        "Verification document required",
        "Please upload proof of your professional activity.",
      );
      return;
    }

    const allowedDocumentTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedDocumentTypes.includes(
        verificationDocument.type,
      )
    ) {
      toast.warning(
        "Invalid document",
        "Only PDF, JPG, JPEG and PNG files are allowed.",
      );
      return;
    }

    const maximumDocumentSize =
      5 * 1024 * 1024;

    if (
      verificationDocument.size >
      maximumDocumentSize
    ) {
      toast.warning(
        "File too large",
        "The verification document must not exceed 5 MB.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const result =
        await submitProfessionalApplication(
          token,
          {
            professionalType,
            companyName:
              companyName.trim() ||
              undefined,
            bio:
              bio.trim() ||
              undefined,
            languages,
            verificationDocument,
          },
        );

      toast.success(
        "Application submitted",
        result.message,
      );

      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to submit your professional application.";

      toast.error(
        "Application failed",
        message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-600">
            Professional application
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Become a Professional
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Complete your professional profile.
            Your application will be reviewed
            by an administrator before your
            professional account is activated.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="professionalType"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Professional Type
            </label>

            <select
              id="professionalType"
              value={professionalType}
              onChange={(event) =>
                setProfessionalType(
                  event.target
                    .value as ProfessionalType,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-700"
            >
              {professionalTypes.map(
                (type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="companyName"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Company Name
            </label>

            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(event) =>
                setCompanyName(
                  event.target.value,
                )
              }
              maxLength={120}
              placeholder="Lisbon Homes"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-700"
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Professional Bio
            </label>

            <textarea
              id="bio"
              value={bio}
              onChange={(event) =>
                setBio(event.target.value)
              }
              minLength={20}
              maxLength={1500}
              rows={6}
              placeholder="Describe your professional experience and services."
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-700"
            />

            <p className="mt-2 text-xs text-slate-500">
              {bio.length}/1500 characters
            </p>
          </div>
  {/* ============================================================
    PROFESSIONAL VERIFICATION
============================================================ */}

          <div>
            <label
              htmlFor="verificationDocument"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Professional Verification{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <p className="mb-3 text-sm leading-6 text-slate-600">
              Upload an official document that proves
              your professional activity. You may
              provide a professional license,
              certificate, business registration
              document or another relevant proof.
            </p>

            <input
              id="verificationDocument"
              name="verificationDocument"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(event) => {
                const file =
                  event.target.files?.[0] ??
                  null;

                setVerificationDocument(file);
              }}
              disabled={submitting}
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="mt-2 text-xs text-slate-500">
              Accepted formats: PDF, JPG, JPEG or PNG.
              Maximum file size: 5 MB.
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              This document is used only to verify
              your professional application and will
              not be displayed on your public profile.
            </p>

            {verificationDocument && (
  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
    <p className="break-all text-sm font-semibold text-slate-800">
      {verificationDocument.name}
    </p>

    <p className="mt-1 text-xs text-slate-500">
      {(
        verificationDocument.size /
        1024 /
        1024
      ).toFixed(2)}{" "}
      MB
    </p>
  </div>
)}
          </div>
          <div>
            <label
              htmlFor="languages"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Languages
            </label>

            <input
              id="languages"
              type="text"
              value={languagesText}
              onChange={(event) =>
                setLanguagesText(
                  event.target.value,
                )
              }
              placeholder="English, Portuguese, French"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-700"
            />

            <p className="mt-2 text-xs text-slate-500">
              Separate each language with a comma.
            </p>
          </div>
        

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                router.back()
              }
              disabled={submitting}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Submitting..."
                : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}