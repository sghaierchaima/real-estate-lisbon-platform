"use client";

import { useEffect, useState } from "react";
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
  SettingsUser,
  updateMe,
  getMyProfessionalProfile,
  updateMyProfessionalProfile,
  uploadAvatar,
  changePassword,
} from "@/lib/settings-api";
import { useToast } from "@/components/ui/ToastProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type TabKey = "personal" | "professional" | "notifications" | "security" | "billing";

function getImageSrc(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

function initials(name?: string | null, email?: string | null) {
  if (name) return name.charAt(0).toUpperCase();
  return email?.charAt(0).toUpperCase() || "U";
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[#E4E7EC] bg-white p-7 shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
      {children}
    </div>
  );
}

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
      <div className="mt-1 text-[#1B365D]">{icon}</div>
      <div>
        <h2 className="text-[26px] font-bold tracking-[-0.02em] text-[#0F2340]">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-[15px] text-[#667085]">{subtitle}</p>}
      </div>
    </div>
  );
}

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
        onChange={(e) => onChange?.(e.target.value)}
        className={`h-12 w-full rounded-xl border border-[#E4E7EC] px-4 text-[15px] text-[#0F2340] outline-none ${
          readOnly ? "bg-[#F9FAFB]" : "bg-white"
        }`}
      />
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="mb-2 block text-[15px] font-semibold text-[#0F2340]">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-xl border border-[#E4E7EC] bg-white px-4 pr-12 text-[15px] text-[#0F2340] outline-none"
        />

        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#1B365D]"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

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
    { key: "personal" as TabKey, label: "Personal Info", icon: <User size={18} /> },
    ...(role === "PROFESSIONAL"
      ? [
          {
            key: "professional" as TabKey,
            label: "Professional Profile",
            icon: <BriefcaseBusiness size={18} />,
          },
        ]
      : []),
    { key: "notifications" as TabKey, label: "Notifications", icon: <Bell size={18} /> },
    { key: "security" as TabKey, label: "Security", icon: <Shield size={18} /> },
    { key: "billing" as TabKey, label: "Billing", icon: <CreditCard size={18} /> },
  ];

  return (
    <div className="sticky top-6 h-fit rounded-[22px] border border-[#E4E7EC] bg-white p-4 shadow-[0_4px_20px_rgba(15,35,64,0.04)]">
      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left text-[15px] font-semibold transition ${
              active === tab.key
                ? "bg-[#1B365D] text-white"
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

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();

  const [active, setActive] = useState<TabKey>("personal");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SettingsUser | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [professionalType, setProfessionalType] = useState("PROPERTY_AGENT");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState("English, Portuguese");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [leadNotifications, setLeadNotifications] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const token = getToken();

      if (!token) {
        toast.warning("Session required", "Please sign in again.");
        router.push("/login");
        return;
      }

      try {
        const data = await getMe(token);

        setUser(data);
        setFullName(data.fullName || "");
        setPhone(data.phone || "");
        setCountry(data.country || "");
        setCity(data.city || "");

        if (data.role === "PROFESSIONAL") {
          try {
            const profile = await getMyProfessionalProfile(token);
            setCompanyName(profile.companyName || "");
            setProfessionalType(profile.professionalType || "PROPERTY_AGENT");
            setBio(profile.bio || "");
            setLanguages(profile.languages?.join(", ") || "");
          } catch {
            setCompanyName("");
            setProfessionalType("PROPERTY_AGENT");
            setBio("");
            setLanguages("");
          }
        }
      } catch (error) {
        toast.error(
          "Unable to load settings",
          error instanceof Error ? error.message : "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [router, toast]);

  async function savePersonalInfo() {
    const token = getToken();

    if (!token) {
      toast.warning("Session required", "Please sign in again.");
      return;
    }

    try {
      const updated = await updateMe(token, {
        fullName,
        phone,
        country,
        city,
      });

      setUser(updated);
      toast.success("Profile updated", "Your personal information was saved.");
    } catch (error) {
      toast.error(
        "Update failed",
        error instanceof Error ? error.message : "Unable to update profile."
      );
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const token = getToken();

    if (!token) {
      toast.warning("Session required", "Please sign in again.");
      return;
    }

    try {
      const updatedUser = await uploadAvatar(token, file);
      setUser(updatedUser);

      toast.success("Avatar updated", "Profile picture uploaded successfully.");
    } catch (error) {
      toast.error(
        "Upload failed",
        error instanceof Error ? error.message : "Unable to upload avatar."
      );
    }
  }

  async function saveProfessionalProfile() {
    const token = getToken();

    if (!token) {
      toast.warning("Session required", "Please sign in again.");
      return;
    }

    try {
      await updateMyProfessionalProfile(token, {
        companyName,
        professionalType,
        bio,
        languages: languages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      toast.success(
        "Professional profile updated",
        "Your professional information was saved."
      );
    } catch (error) {
      toast.error(
        "Update failed",
        error instanceof Error ? error.message : "Unable to update professional profile."
      );
    }
  }

  async function handleChangePassword() {
    const token = getToken();

    if (!token) {
      toast.warning("Session required", "Please sign in again.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning("Missing fields", "Please fill all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      toast.warning("Weak password", "New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning("Password mismatch", "New password and confirmation do not match.");
      return;
    }

    setChangingPassword(true);

    try {
      await changePassword(token, {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password updated", "Your password was changed successfully.");
    } catch (error) {
      toast.error(
        "Password update failed",
        error instanceof Error ? error.message : "Unable to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  function saveNotificationPreferences() {
    localStorage.setItem(
      "dashboard_preferences",
      JSON.stringify({
        emailNotifications,
        leadNotifications,
        matchNotifications,
      })
    );

    toast.success("Preferences saved", "Your notification preferences were updated.");
  }

  if (loading) {
    return <div className="p-6 text-[#475467]">Loading settings...</div>;
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1B365D_0%,#D4AF37_100%)] text-white">
              <Settings size={24} />
            </div>

            <h1 className="text-[42px] font-bold tracking-[-0.03em] text-[#0F2340]">
              Account Settings
            </h1>
          </div>

          <p className="mt-2 text-[17px] text-[#667085]">
            Complete your profile and manage your dashboard preferences
          </p>
        </div>

        <div className="rounded-2xl bg-[linear-gradient(135deg,#1B365D_0%,#D4AF37_100%)] px-5 py-3 text-[15px] font-semibold text-white">
          {user.role}
        </div>
      </div>

      <div className="grid gap-7 lg:grid-cols-[320px_1fr]">
        <Sidebar active={active} setActive={setActive} role={user.role} />

        <div className="space-y-7">
          {active === "personal" && (
            <SectionCard>
              <SectionTitle
                icon={<User size={24} />}
                title="Personal Information"
                subtitle="Basic information used across the platform"
              />

              <div className="mb-8 flex items-center gap-6 border-b border-[#EAECF0] pb-7">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#1B365D_0%,#D4AF37_100%)] text-[34px] font-bold text-white shadow-lg">
                  {user.avatarUrl ? (
                    <img
                      src={getImageSrc(user.avatarUrl)}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(user.fullName, user.email)
                  )}
                </div>

                <div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />

                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex cursor-pointer rounded-xl border border-[#D0D5DD] px-4 py-2 text-[14px] font-semibold text-[#1B365D] hover:bg-[#F9FAFB]"
                  >
                    Upload Photo
                  </label>

                  <p className="mt-2 text-[15px] text-[#667085]">
                    Upload a PNG, JPG or WebP profile picture.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Full Name" value={fullName} onChange={setFullName} />
                <Field label="Email Address" value={user.email} readOnly />
                <Field label="Phone Number" value={phone} onChange={setPhone} />
                <Field label="Country" value={country} onChange={setCountry} />
                <Field label="City" value={city} onChange={setCity} />
                <Field label="Role" value={user.role} readOnly />
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  type="button"
                  onClick={savePersonalInfo}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </SectionCard>
          )}

          {active === "professional" && user.role === "PROFESSIONAL" && (
            <SectionCard>
              <SectionTitle
                icon={<BriefcaseBusiness size={24} />}
                title="Professional Profile"
                subtitle="Information displayed to buyers after matching"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Company Name" value={companyName} onChange={setCompanyName} />

                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-[#0F2340]">
                    Professional Type
                  </label>
                  <select
                    value={professionalType}
                    onChange={(e) => setProfessionalType(e.target.value)}
                    className="h-12 w-full rounded-xl border border-[#E4E7EC] bg-white px-4 text-[15px] text-[#0F2340] outline-none"
                  >
                    <option value="PROPERTY_AGENT">Property Agent</option>
                    <option value="MORTGAGE_BROKER">Mortgage Broker</option>
                    <option value="PROPERTY_LAWYER">Property Lawyer</option>
                    <option value="TAX_ADVISOR">Tax Advisor</option>
                    <option value="HOME_INSPECTOR">Home Inspector</option>
                  </select>
                </div>

                <Field label="Languages" value={languages} onChange={setLanguages} />

                <div className="md:col-span-2">
                  <label className="mb-2 block text-[15px] font-semibold text-[#0F2340]">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your expertise and services..."
                    className="min-h-[130px] w-full rounded-xl border border-[#E4E7EC] bg-white px-4 py-3 text-[15px] text-[#0F2340] outline-none"
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  type="button"
                  onClick={saveProfessionalProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white"
                >
                  <Save size={18} />
                  Save Professional Profile
                </button>
              </div>
            </SectionCard>
          )}

          {active === "notifications" && (
            <SectionCard>
              <SectionTitle
                icon={<Bell size={24} />}
                title="Notifications"
                subtitle="Choose how you want to receive platform updates"
              />

              <div className="space-y-4">
                <ToggleRow title="Email notifications" text="Receive important platform updates by email." checked={emailNotifications} onChange={setEmailNotifications} />
                <ToggleRow title="Lead notifications" text="Get notified when new buyer leads are created." checked={leadNotifications} onChange={setLeadNotifications} />
                <ToggleRow title="Match notifications" text="Get notified when matches change status." checked={matchNotifications} onChange={setMatchNotifications} />
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  type="button"
                  onClick={saveNotificationPreferences}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white"
                >
                  <Save size={18} />
                  Save Preferences
                </button>
              </div>
            </SectionCard>
          )}

          {active === "security" && (
            <SectionCard>
              <SectionTitle
                icon={<Shield size={24} />}
                title="Security"
                subtitle="Update your account password securely"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} />
                <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} />
                <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} />
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white disabled:opacity-60"
                >
                  <Save size={18} />
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </SectionCard>
          )}

          {active === "billing" && (
            <SectionCard>
              <SectionTitle
                icon={<CreditCard size={24} />}
                title="Billing"
                subtitle="Subscription and billing configuration"
              />

              <div className="rounded-2xl bg-[#F9FAFB] p-6 text-[#667085]">
                Billing module is ready for the next implementation step.
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  text,
  checked,
  onChange,
}: {
  title: string;
  text: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-[#EAECF0] p-5">
      <div>
        <p className="text-[17px] font-semibold text-[#0F2340]">{title}</p>
        <p className="mt-1 text-[15px] text-[#667085]">{text}</p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 rounded-full transition ${
          checked ? "bg-[#1B365D]" : "bg-[#D0D5DD]"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}