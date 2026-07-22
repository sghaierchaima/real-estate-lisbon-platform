"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { resetPassword } from "@/lib/auth-api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    try {
      if (!token) {
        throw new Error("Reset token is missing.");
      }

      if (newPassword.length < 8) {
        throw new Error("Password must contain at least 8 characters.");
      }

      if (
        !/[A-Z]/.test(newPassword) ||
        !/[a-z]/.test(newPassword) ||
        !/\d/.test(newPassword)
      ) {
        throw new Error(
          "Password must contain at least one uppercase letter, one lowercase letter, and one number."
        );
      }

      const result = await resetPassword({
        token,
        newPassword,
      });

      setSuccessMessage(result.message || "Password reset successfully.");

      setTimeout(() => {
        router.push("/login");
      }, 1800);
    } catch (error) {
      const message =
  error instanceof Error ? error.message : "Unable to reset password.";

if (
  message.toLowerCase().includes("too many requests") ||
  message.toLowerCase().includes("throttlerexception")
) {
  setErrorMessage("Too many attempts. Please wait one minute and try again.");
} else {
  setErrorMessage(message);
}
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-[#0F2340]">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#1B365D] to-[#0F2340] py-16 lg:py-24">
        <div className="container-page relative">
          <div className="mx-auto max-w-md rounded-[28px] bg-white p-8 shadow-[0_20px_60px_rgba(15,35,64,0.18)]">
            <Link
              href="/login"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1B365D]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>

            <div className="mb-10 flex items-start gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-md bg-[#F8F9FA]">
                <img
                  src="/images/pfelogo.png"
                  alt="Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>

              <div>
                <h1 className="text-5xl font-bold leading-[0.95] text-[#1B365D]">
                  Reset
                  <br />
                  Password
                </h1>

                <p className="mt-3 text-[17px] text-gray-500">
                  Create a new secure password.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-3 block text-[18px] font-medium text-[#1B365D]">
                  New Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter new password"
                    className="h-14 w-full rounded-2xl border border-[#E5E7EB] pl-12 pr-12 text-[17px] outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-700">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-[#1B365D] text-[19px] font-semibold text-white transition hover:bg-[#0F2340] disabled:opacity-60"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <div className="mt-8 flex items-start gap-3 rounded-2xl bg-[#F8F9FA] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2E7D32]" />
              <p className="text-sm leading-6 text-gray-600">
                Your reset link expires after 15 minutes and can only be used
                once.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}