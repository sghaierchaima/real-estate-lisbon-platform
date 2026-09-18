"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Bell,
  BriefcaseBusiness,
  CreditCard,
  Eye,
  EyeOff,
  Save,
  Settings,
  Shield,
  User,
} from "lucide-react";

import { getToken } from "@/lib/session";

import {
  getMe,
  type SettingsUser,
  updateMe,
  getMyProfessionalProfile,
  updateMyProfessionalProfile,
  uploadAvatar,
  changePassword,
  updateNotificationPreferences,
} from "@/lib/settings-api";

import { useToast } from "@/components/ui/ToastProvider";

/* ============================================================
   API / MEDIA CONFIGURATION
============================================================ */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

/*
 * IMPORTANT
 *
 * Si NEXT_PUBLIC_API_URL vaut :
 *
 * http://localhost:3001
 *
 * API_ORIGIN devient :
 *
 * http://localhost:3001
 *
 * Si NEXT_PUBLIC_API_URL vaut :
 *
 * http://localhost:3001/api
 *
 * API_ORIGIN reste :
 *
 * http://localhost:3001
 *
 * On évite ainsi :
 *
 * http://localhost:3001/api/uploads/avatars/...
 */
const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return API_URL.replace(/\/api\/?$/, "");
  }
})();

/* ============================================================
   TYPES
============================================================ */

type TabKey =
  | "personal"
  | "professional"
  | "notifications"
  | "security"
  | "billing";

/* ============================================================
   AVATAR / IMAGE HELPERS
============================================================ */

function getImageSrc(url?: string | null) {
  if (!url) {
    return "";
  }

  const value = url.trim();

  if (!value) {
    return "";
  }

  /*
   * URL déjà complète.
   */
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  /*
   * URL provenant du backend.
   *
   * Exemple reçu :
   * /uploads/avatars/avatar.jpg
   *
   * Résultat :
   * http://localhost:3001/uploads/avatars/avatar.jpg
   */
  return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"
    }${value}`;
}

function initials(
  name?: string | null,
  email?: string | null,
) {
  if (name?.trim()) {
    return name.trim().charAt(0).toUpperCase();
  }

  return (
    email?.trim().charAt(0).toUpperCase() ||
    "U"
  );
}

/* ============================================================
   SECTION CARD
============================================================ */

function SectionCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
      {children}
    </div>
  );
}

/* ============================================================
   SECTION TITLE
============================================================ */

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 flex items-start gap-3">
      <div className="mt-1 text-[#1B365D]">
        {icon}
      </div>

      <div>
        <h2 className="text-[26px] font-bold tracking-[-0.02em] text-[#0F2340]">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-[15px] text-[#667085]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   STANDARD FIELD
============================================================ */

function Field({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-[15px] font-semibold text-[#0F2340]">
        {label}
      </label>

      <input
        value={value}
        readOnly={readOnly}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        className={`h-12 w-full rounded-xl border border-[#E4E7EC] px-4 text-[15px] text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10 ${readOnly
            ? "cursor-not-allowed bg-[#F9FAFB] text-[#667085]"
            : "bg-white"
          }`}
      />
    </div>
  );
}

/* ============================================================
   PASSWORD FIELD
============================================================ */

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] =
    useState(false);

  return (
    <div>
      <label className="mb-2 block text-[15px] font-semibold text-[#0F2340]">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-12 w-full rounded-xl border border-[#E4E7EC] bg-white px-4 pr-12 text-[15px] text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
        />

        <button
          type="button"
          onClick={() =>
            setVisible(
              (previous) => !previous,
            )
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#667085] transition hover:text-[#1B365D]"
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
        >
          {visible ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   SETTINGS SIDEBAR
============================================================ */

function Sidebar({
  active,
  setActive,
  role,
}: {
  active: TabKey;
  setActive: (key: TabKey) => void;
  role?: string;
}) {
  const tabs = [
    {
      key: "personal" as TabKey,
      label: "Personal Info",
      icon: <User size={18} />,
    },

    ...(role === "PROFESSIONAL"
      ? [
        {
          key:
            "professional" as TabKey,
          label:
            "Professional Profile",
          icon: (
            <BriefcaseBusiness
              size={18}
            />
          ),
        },
      ]
      : []),

    {
      key:
        "notifications" as TabKey,
      label: "Notifications",
      icon: <Bell size={18} />,
    },

    {
      key: "security" as TabKey,
      label: "Security",
      icon: <Shield size={18} />,
    },

    ...(role === "PROFESSIONAL"
      ? [
        {
          key: "billing" as TabKey,
          label: "Billing",
          icon: (
            <CreditCard size={18} />
          ),
        },
      ]
      : []),
  ];

  return (
    <div className="sticky top-6 h-fit rounded-[22px] border border-[#E4E7EC] bg-white p-4 shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() =>
              setActive(tab.key)
            }
            className={`flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left text-[15px] font-semibold transition ${active === tab.key
                ? "bg-[#1B365D] text-white shadow-[0_8px_20px_rgba(27,54,93,0.16)]"
                : "text-[#344054] hover:bg-[#F8F9FA]"
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   SETTINGS PAGE
============================================================ */

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();

  /* ==========================================================
     GENERAL
  ========================================================== */

  const [active, setActive] =
    useState<TabKey>("personal");

  const [loading, setLoading] =
    useState(true);

  const [user, setUser] =
    useState<SettingsUser | null>(null);

  /* ==========================================================
     AVATAR DEBUG STATE
  ========================================================== */

  const [
    avatarError,
    setAvatarError,
  ] = useState(false);

  const avatarSrc = useMemo(() => {
    return getImageSrc(
      user?.avatarUrl,
    );
  }, [user?.avatarUrl]);

  /*
   * Diagnostic automatique.
   *
   * Ouvre :
   *
   * F12 → Console
   *
   * puis cherche :
   *
   * [SETTINGS AVATAR DEBUG]
   */
  useEffect(() => {
    if (!user) return;

    console.group(
      "[SETTINGS AVATAR DEBUG]",
    );

    console.log(
      "NEXT_PUBLIC_API_URL:",
      process.env.NEXT_PUBLIC_API_URL,
    );

    console.log(
      "API_URL:",
      API_URL,
    );

    console.log(
      "API_ORIGIN:",
      API_ORIGIN,
    );

    console.log(
      "Backend avatarUrl:",
      user.avatarUrl,
    );

    console.log(
      "Computed avatar URL:",
      avatarSrc,
    );

    console.log(
      "Avatar error state:",
      avatarError,
    );

    console.log(
      "Current user:",
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    );

    console.groupEnd();
  }, [
    user,
    avatarSrc,
    avatarError,
  ]);

  /* ==========================================================
     PERSONAL
  ========================================================== */

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [city, setCity] =
    useState("");

  /* ==========================================================
     PROFESSIONAL
  ========================================================== */

  const [
    companyName,
    setCompanyName,
  ] = useState("");

  const [
    professionalType,
    setProfessionalType,
  ] = useState(
    "PROPERTY_AGENT",
  );

  const [bio, setBio] =
    useState("");

  const [languages, setLanguages] =
    useState(
      "English, Portuguese",
    );

  /* ==========================================================
     NOTIFICATIONS
  ========================================================== */

  const [
    emailNotifications,
    setEmailNotifications,
  ] = useState(true);

  const [
    leadNotifications,
    setLeadNotifications,
  ] = useState(true);

  const [
    matchNotifications,
    setMatchNotifications,
  ] = useState(true);

  const [
    propertyAlertNotifications,
    setPropertyAlertNotifications,
  ] = useState(true);

  const [
    savingNotifications,
    setSavingNotifications,
  ] = useState(false);

  /* ==========================================================
     SECURITY
  ========================================================== */

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);

  /* ==========================================================
     LOAD SETTINGS
  ========================================================== */

  useEffect(() => {
    async function loadSettings() {
      const token =
        getToken();

      console.group(
        "[SETTINGS LOAD DEBUG]",
      );

      console.log(
        "Token exists:",
        Boolean(token),
      );

      console.log(
        "API URL:",
        API_URL,
      );

      console.groupEnd();

      if (!token) {
        toast.warning(
          "Session required",
          "Please sign in again.",
        );

        router.push("/login");

        return;
      }

      try {
        console.log(
          "[SETTINGS LOAD] Calling GET /users/me...",
        );

        const data =
          await getMe(token);

        console.log(
          "[SETTINGS LOAD] /users/me response:",
          data,
        );

        console.log(
          "[SETTINGS LOAD] avatarUrl received:",
          data.avatarUrl,
        );

        console.log(
          "[SETTINGS LOAD] calculated avatar URL:",
          getImageSrc(
            data.avatarUrl,
          ),
        );

        setUser(data);

        /*
         * Une nouvelle valeur avatar doit
         * permettre une nouvelle tentative.
         */
        setAvatarError(false);

        setFullName(
          data.fullName || "",
        );

        setPhone(
          data.phone || "",
        );

        setCountry(
          data.country || "",
        );

        setCity(
          data.city || "",
        );

        setEmailNotifications(
          data.emailNotifications ??
          true,
        );

        setLeadNotifications(
          data.leadNotifications ??
          true,
        );

        setMatchNotifications(
          data.matchNotifications ??
          true,
        );

        setPropertyAlertNotifications(
          data.propertyAlertNotifications ??
          true,
        );

        if (
          data.role ===
          "PROFESSIONAL"
        ) {
          try {
            const profile =
              await getMyProfessionalProfile(
                token,
              );

            setCompanyName(
              profile.companyName ||
              "",
            );

            setProfessionalType(
              profile.professionalType ||
              "PROPERTY_AGENT",
            );

            setBio(
              profile.bio || "",
            );

            setLanguages(
              profile.languages?.join(
                ", ",
              ) || "",
            );
          } catch (error) {
            console.error(
              "[SETTINGS PROFESSIONAL PROFILE ERROR]",
              error,
            );

            setCompanyName("");
            setProfessionalType(
              "PROPERTY_AGENT",
            );
            setBio("");
            setLanguages("");
          }
        }
      } catch (error) {
        console.error(
          "[SETTINGS LOAD ERROR]",
          error,
        );

        toast.error(
          "Unable to load settings",
          error instanceof Error
            ? error.message
            : "Failed to load settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [router, toast]);

  /* ==========================================================
     SAVE PERSONAL INFO
  ========================================================== */

  async function savePersonalInfo() {
    const token = getToken();

    if (!token) {
      toast.warning(
        "Session required",
        "Please sign in again.",
      );
      return;
    }

    try {
      const payload = {
        fullName:
          fullName.trim(),

        phone:
          phone.trim(),

        country:
          country.trim(),

        city:
          city.trim(),
      };

      console.log(
        "[SETTINGS PERSONAL SAVE] payload:",
        payload,
      );

      const updated =
        await updateMe(
          token,
          payload,
        );

      console.log(
        "[SETTINGS PERSONAL SAVE] response:",
        updated,
      );

      setUser(
        (previous) => {
          if (!previous) {
            return updated;
          }

          return {
            ...previous,
            ...updated,
          };
        },
      );

      toast.success(
        "Profile updated",
        "Your personal information was saved.",
      );
    } catch (error) {
      console.error(
        "[SETTINGS PERSONAL SAVE ERROR]",
        error,
      );

      toast.error(
        "Update failed",
        error instanceof Error
          ? error.message
          : "Unable to update profile.",
      );
    }
  }

  /* ==========================================================
     AVATAR UPLOAD
  ========================================================== */

  async function handleAvatarUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      console.warn(
        "[AVATAR UPLOAD] No file selected.",
      );

      return;
    }

    console.group(
      "[AVATAR UPLOAD DEBUG]",
    );

    console.log(
      "File name:",
      file.name,
    );

    console.log(
      "File type:",
      file.type,
    );

    console.log(
      "File size:",
      file.size,
    );

    console.groupEnd();

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      console.warn(
        "[AVATAR UPLOAD] Invalid file type:",
        file.type,
      );

      toast.warning(
        "Invalid image",
        "Please upload a PNG, JPG, JPEG or WebP image.",
      );

      event.target.value =
        "";

      return;
    }

    const token =
      getToken();

    if (!token) {
      toast.warning(
        "Session required",
        "Please sign in again.",
      );

      return;
    }

    try {
      console.log(
        "[AVATAR UPLOAD] Sending image to backend...",
      );

      const updatedUser =
        await uploadAvatar(
          token,
          file,
        );

      console.log(
        "[AVATAR UPLOAD] Backend response:",
        updatedUser,
      );

      console.log(
        "[AVATAR UPLOAD] avatarUrl returned:",
        updatedUser.avatarUrl,
      );

      console.log(
        "[AVATAR UPLOAD] computed URL:",
        getImageSrc(
          updatedUser.avatarUrl,
        ),
      );

      setAvatarError(false);

      setUser(
        (previous) => {
          if (!previous) {
            return updatedUser;
          }

          return {
            ...previous,
            ...updatedUser,
          };
        },
      );

      toast.success(
        "Avatar updated",
        "Profile picture uploaded successfully.",
      );
    } catch (error) {
      console.error(
        "[AVATAR UPLOAD ERROR]",
        error,
      );

      toast.error(
        "Upload failed",
        error instanceof Error
          ? error.message
          : "Unable to upload avatar.",
      );
    } finally {
      event.target.value =
        "";
    }
  }

  /* ==========================================================
     PROFESSIONAL PROFILE
  ========================================================== */

  async function saveProfessionalProfile() {
    const token =
      getToken();

    if (!token) {
      toast.warning(
        "Session required",
        "Please sign in again.",
      );
      return;
    }

    try {
      await updateMyProfessionalProfile(
        token,
        {
          companyName:
            companyName.trim(),

          professionalType,

          bio: bio.trim(),

          languages:
            languages
              .split(",")
              .map(
                (item) =>
                  item.trim(),
              )
              .filter(Boolean),
        },
      );

      toast.success(
        "Professional profile updated",
        "Your professional information was saved.",
      );
    } catch (error) {
      console.error(
        "[PROFESSIONAL PROFILE ERROR]",
        error,
      );

      toast.error(
        "Update failed",
        error instanceof Error
          ? error.message
          : "Unable to update professional profile.",
      );
    }
  }

  /* ==========================================================
     NOTIFICATIONS
  ========================================================== */

  async function saveNotificationPreferences() {
    const token =
      getToken();

    if (!token) {
      toast.warning(
        "Session required",
        "Please sign in again.",
      );

      return;
    }

    try {
      setSavingNotifications(
        true,
      );

      const payload = {
        emailNotifications,
        leadNotifications,
        matchNotifications,
        propertyAlertNotifications,
      };

      console.log(
        "[NOTIFICATION SETTINGS] Saving:",
        payload,
      );

      const updated =
        await updateNotificationPreferences(
          token,
          payload,
        );

      console.log(
        "[NOTIFICATION SETTINGS] Response:",
        updated,
      );

      setEmailNotifications(
        updated.emailNotifications,
      );

      setLeadNotifications(
        updated.leadNotifications,
      );

      setMatchNotifications(
        updated.matchNotifications,
      );

      setPropertyAlertNotifications(
        updated.propertyAlertNotifications,
      );

      setUser(
        (previous) =>
          previous
            ? {
              ...previous,

              emailNotifications:
                updated.emailNotifications,

              leadNotifications:
                updated.leadNotifications,

              matchNotifications:
                updated.matchNotifications,

              propertyAlertNotifications:
                updated.propertyAlertNotifications,
            }
            : previous,
      );

      toast.success(
        "Preferences saved",
        "Your notification preferences were updated.",
      );
    } catch (error) {
      console.error(
        "[NOTIFICATION SETTINGS ERROR]",
        error,
      );

      toast.error(
        "Update failed",
        error instanceof Error
          ? error.message
          : "Unable to update notification preferences.",
      );
    } finally {
      setSavingNotifications(
        false,
      );
    }
  }

  /* ==========================================================
     CHANGE PASSWORD
  ========================================================== */

  async function handleChangePassword() {
    const token =
      getToken();

    if (!token) {
      toast.warning(
        "Session required",
        "Please sign in again.",
      );

      return;
    }

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      toast.warning(
        "Missing fields",
        "Please fill all password fields.",
      );

      return;
    }

    if (
      newPassword.length <
      8
    ) {
      toast.warning(
        "Weak password",
        "New password must contain at least 8 characters.",
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      toast.warning(
        "Password mismatch",
        "New password and confirmation do not match.",
      );

      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {
      toast.warning(
        "Password unchanged",
        "Your new password must be different from your current password.",
      );

      return;
    }

    setChangingPassword(true);

    try {
      console.log(
        "[PASSWORD CHANGE] Request started.",
      );

      await changePassword(
        token,
        {
          currentPassword,
          newPassword,
        },
      );

      console.log(
        "[PASSWORD CHANGE] Success.",
      );

      setCurrentPassword(
        "",
      );

      setNewPassword("");

      setConfirmPassword(
        "",
      );

      toast.success(
        "Password updated",
        "Your password was changed successfully.",
      );
    } catch (error) {
      console.error(
        "[PASSWORD CHANGE ERROR]",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to change password.";

      const normalized =
        message.toLowerCase();

      if (
        (
          normalized.includes(
            "current",
          ) &&
          normalized.includes(
            "password",
          )
        ) ||
        normalized.includes(
          "invalid password",
        ) ||
        normalized.includes(
          "incorrect password",
        )
      ) {
        toast.error(
          "Incorrect password",
          "Your current password is incorrect.",
        );
      } else {
        toast.error(
          "Password update failed",
          message,
        );
      }
    } finally {
      setChangingPassword(
        false,
      );
    }
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-6 text-[#475467]">
        Loading settings...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="space-y-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1B365D_0%,#D4AF37_100%)] text-white">
              <Settings
                size={24}
              />
            </div>

            <h1 className="text-[36px] font-bold tracking-[-0.03em] text-[#0F2340] md:text-[42px]">
              Account Settings
            </h1>

          </div>

          <p className="mt-2 text-[17px] text-[#667085]">
            Complete your profile and manage your dashboard preferences
          </p>
        </div>

        <div className="w-fit rounded-2xl bg-[linear-gradient(135deg,#1B365D_0%,#D4AF37_100%)] px-5 py-3 text-[15px] font-semibold text-white">
          {user.role}
        </div>

      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="grid gap-7 lg:grid-cols-[320px_1fr]">

        <Sidebar
          active={active}
          setActive={setActive}
          role={user.role}
        />

        <div className="space-y-7">

          {/* ==================================================
              PERSONAL INFO
          ================================================== */}

          {active ===
            "personal" && (

              <SectionCard>

                <SectionTitle
                  icon={
                    <User size={24} />
                  }
                  title="Personal Information"
                  subtitle="Basic information used across the platform"
                />

                {/* ==============================================
                  AVATAR
              ============================================== */}

                <div className="mb-8 flex flex-col gap-6 border-b border-[#EAECF0] pb-7 sm:flex-row sm:items-center">

                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#1B365D_0%,#D4AF37_100%)] text-[34px] font-bold text-white shadow-lg">
                    {user.avatarUrl && avatarSrc && !avatarError ? (
                      <img
                        key={avatarSrc}
                        src={avatarSrc}
                        alt=""
                        className="h-full w-full object-cover"
                        onLoad={() => {
                          setAvatarError(false);
                        }}
                        onError={() => {
                          setAvatarError(true);
                        }}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[34px] font-bold text-white">
                        {initials(
                          user.fullName,
                          user.email,
                        )}
                      </span>
                    )}
                  </div>

                  <div>

                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={
                        handleAvatarUpload
                      }
                      className="hidden"
                    />

                    <label
                      htmlFor="avatar-upload"
                      className="inline-flex cursor-pointer rounded-xl border border-[#D0D5DD] px-4 py-2 text-[14px] font-semibold text-[#1B365D] transition hover:bg-[#F9FAFB]"
                    >
                      Upload Photo
                    </label>

                    <p className="mt-2 text-[15px] text-[#667085]">
                      Upload a PNG, JPG or WebP profile picture.
                    </p>

                    {/* DEBUG INFORMATION IN DEVELOPMENT */}

                    {process.env.NODE_ENV ===
                      "development" &&
                      user.avatarUrl && (
                        <p className="mt-2 max-w-[500px] break-all text-[11px] text-[#98A2B3]">
                          Avatar debug:{" "}
                          {avatarSrc ||
                            "No URL"}
                        </p>
                      )}

                  </div>

                </div>

                {/* FIELDS */}

                <div className="grid gap-5 md:grid-cols-2">

                  <Field
                    label="Full Name"
                    value={fullName}
                    onChange={
                      setFullName
                    }
                  />

                  <Field
                    label="Email Address"
                    value={
                      user.email
                    }
                    readOnly
                  />

                  <Field
                    label="Phone Number"
                    value={phone}
                    onChange={
                      setPhone
                    }
                  />

                  <Field
                    label="Country"
                    value={
                      country
                    }
                    onChange={
                      setCountry
                    }
                  />

                  <Field
                    label="City"
                    value={city}
                    onChange={
                      setCity
                    }
                  />

                  <Field
                    label="Role"
                    value={user.role}
                    readOnly
                  />

                </div>

                <div className="mt-10 flex justify-end">

                  <button
                    type="button"
                    onClick={
                      savePersonalInfo
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white transition hover:bg-[#0F2340]"
                  >
                    <Save
                      size={18}
                    />

                    Save Changes
                  </button>

                </div>

              </SectionCard>
            )}

          {/* ==================================================
              PROFESSIONAL PROFILE
          ================================================== */}

          {active ===
            "professional" &&
            user.role ===
            "PROFESSIONAL" && (

              <SectionCard>

                <SectionTitle
                  icon={
                    <BriefcaseBusiness
                      size={24}
                    />
                  }
                  title="Professional Profile"
                  subtitle="Information displayed to buyers after matching"
                />

                <div className="grid gap-5 md:grid-cols-2">

                  <Field
                    label="Company Name"
                    value={
                      companyName
                    }
                    onChange={
                      setCompanyName
                    }
                  />

                  <div>

                    <label className="mb-2 block text-[15px] font-semibold text-[#0F2340]">
                      Professional Type
                    </label>

                    <select
                      value={
                        professionalType
                      }
                      onChange={(
                        event,
                      ) =>
                        setProfessionalType(
                          event.target
                            .value,
                        )
                      }
                      className="h-12 w-full rounded-xl border border-[#E4E7EC] bg-white px-4 text-[15px] text-[#0F2340] outline-none"
                    >
                      <option value="PROPERTY_AGENT">
                        Property Agent
                      </option>

                      <option value="MORTGAGE_BROKER">
                        Mortgage Broker
                      </option>

                      <option value="PROPERTY_LAWYER">
                        Property Lawyer
                      </option>

                      <option value="TAX_ADVISOR">
                        Tax Advisor
                      </option>

                      <option value="HOME_INSPECTOR">
                        Home Inspector
                      </option>

                      <option value="PROPERTY_VALUER">
                        Property Valuer
                      </option>

                      <option value="INSURANCE_BROKER">
                        Insurance Broker
                      </option>
                    </select>

                  </div>

                  <Field
                    label="Languages"
                    value={
                      languages
                    }
                    onChange={
                      setLanguages
                    }
                  />

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-[15px] font-semibold text-[#0F2340]">
                      Bio
                    </label>

                    <textarea
                      value={bio}
                      onChange={(
                        event,
                      ) =>
                        setBio(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Describe your expertise and services..."
                      className="min-h-[130px] w-full rounded-xl border border-[#E4E7EC] bg-white px-4 py-3 text-[15px] text-[#0F2340] outline-none"
                    />

                  </div>

                </div>

                <div className="mt-10 flex justify-end">

                  <button
                    type="button"
                    onClick={
                      saveProfessionalProfile
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white"
                  >
                    <Save size={18} />

                    Save Professional Profile
                  </button>

                </div>

              </SectionCard>
            )}

          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          {active ===
            "notifications" && (

              <SectionCard>

                <SectionTitle
                  icon={
                    <Bell size={24} />
                  }
                  title="Notifications"
                  subtitle="Choose how you want to receive platform updates"
                />

                <div className="space-y-4">

                  <ToggleRow
                    title="Email notifications"
                    text="Receive important platform updates by email."
                    checked={
                      emailNotifications
                    }
                    onChange={
                      setEmailNotifications
                    }
                  />

                  {user.role ===
                    "BUYER" && (
                      <>
                        <ToggleRow
                          title="Match notifications"
                          text="Get notified when a professional is matched with one of your requests."
                          checked={
                            matchNotifications
                          }
                          onChange={
                            setMatchNotifications
                          }
                        />

                        <ToggleRow
                          title="Property alert notifications"
                          text="Get notified when a newly published property matches one of your active searches."
                          checked={
                            propertyAlertNotifications
                          }
                          onChange={
                            setPropertyAlertNotifications
                          }
                        />
                      </>
                    )}

                  {user.role ===
                    "PROFESSIONAL" && (
                      <>
                        <ToggleRow
                          title="Lead notifications"
                          text="Get notified when relevant buyer requests become available."
                          checked={
                            leadNotifications
                          }
                          onChange={
                            setLeadNotifications
                          }
                        />

                        <ToggleRow
                          title="Match notifications"
                          text="Get notified when one of your matches changes status."
                          checked={
                            matchNotifications
                          }
                          onChange={
                            setMatchNotifications
                          }
                        />
                      </>
                    )}

                  {user.role ===
                    "ADMIN" && (
                      <>
                        <ToggleRow
                          title="Lead notifications"
                          text="Receive updates about newly created buyer requests."
                          checked={
                            leadNotifications
                          }
                          onChange={
                            setLeadNotifications
                          }
                        />

                        <ToggleRow
                          title="Match notifications"
                          text="Receive updates about Smart Matching activity."
                          checked={
                            matchNotifications
                          }
                          onChange={
                            setMatchNotifications
                          }
                        />
                      </>
                    )}

                </div>

                <div className="mt-10 flex justify-end">

                  <button
                    type="button"
                    onClick={
                      saveNotificationPreferences
                    }
                    disabled={
                      savingNotifications
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white disabled:opacity-60"
                  >

                    <Save size={18} />

                    {savingNotifications
                      ? "Saving..."
                      : "Save Preferences"}

                  </button>

                </div>

              </SectionCard>
            )}

          {/* ==================================================
              SECURITY
          ================================================== */}

          {active ===
            "security" && (

              <SectionCard>

                <SectionTitle
                  icon={
                    <Shield size={24} />
                  }
                  title="Security"
                  subtitle="Update your account password securely"
                />

                <div className="grid gap-5 md:grid-cols-2">

                  <PasswordField
                    label="Current Password"
                    value={
                      currentPassword
                    }
                    onChange={
                      setCurrentPassword
                    }
                  />

                  <PasswordField
                    label="New Password"
                    value={newPassword}
                    onChange={
                      setNewPassword
                    }
                  />

                  <PasswordField
                    label="Confirm New Password"
                    value={
                      confirmPassword
                    }
                    onChange={
                      setConfirmPassword
                    }
                  />

                </div>

                <div className="mt-10 flex justify-end">

                  <button
                    type="button"
                    onClick={
                      handleChangePassword
                    }
                    disabled={
                      changingPassword
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white disabled:opacity-60"
                  >

                    <Save size={18} />

                    {changingPassword
                      ? "Updating..."
                      : "Update Password"}

                  </button>

                </div>

              </SectionCard>
            )}

          {/* ==================================================
              BILLING
          ================================================== */}

          {active ===
            "billing" &&
            user.role ===
            "PROFESSIONAL" && (

              <SectionCard>

                <SectionTitle
                  icon={
                    <CreditCard
                      size={24}
                    />
                  }
                  title="Billing"
                  subtitle="Subscription and billing configuration"
                />

                <div className="rounded-2xl border border-[#EAECF0] bg-[#F9FAFB] p-6 text-[#667085]">
                  Billing features will be available when professional subscription plans are enabled.
                </div>

              </SectionCard>
            )}

        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TOGGLE
============================================================ */

function ToggleRow({
  title,
  text,
  checked,
  onChange,
}: {
  title: string;
  text: string;
  checked: boolean;
  onChange: (
    value: boolean,
  ) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-[#EAECF0] p-5 transition hover:border-[#D0D5DD]">

      <div>
        <p className="text-[17px] font-semibold text-[#0F2340]">
          {title}
        </p>

        <p className="mt-1 text-[15px] leading-6 text-[#667085]">
          {text}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() =>
          onChange(!checked)
        }
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked
            ? "bg-[#1B365D]"
            : "bg-[#D0D5DD]"
          }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-all duration-200 ${checked
              ? "left-7"
              : "left-1"
            }`}
        />
      </button>

    </div>
  );
}