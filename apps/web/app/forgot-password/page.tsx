"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { forgotPassword } from "@/lib/auth-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
function getFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;

  if (
    message.toLowerCase().includes("too many requests") ||
    message.toLowerCase().includes("throttlerexception")
  ) {
    return "Too many attempts. Please wait one minute and try again.";
  }

  return message;
}
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error("Please enter your email address.");
      }

      const result = await forgotPassword({ email: cleanEmail });

      setSuccessMessage(
        result.message ||
          "If an account exists with this email, a password reset link has been sent."
      );
    } catch (error) {
      setErrorMessage(
        getFriendlyError(error, "Unable to send reset instructions.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-[#0F2340]">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#1B365D] to-[#0F2340] py-16 lg:py-24">
        <div className="absolute inset-0 opacity-20">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="container-page relative">
          <div className="mx-auto max-w-md rounded-[28px] bg-white p-8 shadow-[0_20px_60px_rgba(15,35,64,0.18)]">
            <div className="mb-10">
              <Link
                href="/login"
                className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1B365D] hover:text-[#0F2340]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>

              <div className="flex items-start gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-md bg-[#F8F9FA]">
                  <img
                    src="/images/pfelogo.png"
                    alt="Logo"
                    className="h-16 w-auto object-contain"
                  />
                </div>

                <div className="flex-1">
                  <h1 className="text-5xl font-bold leading-[0.95] text-[#1B365D]">
                    Forgot
                    <br />
                    Password
                  </h1>

                  <p className="mt-3 text-[17px] text-gray-500">
                    Enter your email and we will send you reset instructions.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-3 block text-[18px] font-medium text-[#1B365D]">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-14 w-full rounded-2xl border border-[#E5E7EB] bg-white pl-12 pr-4 text-[17px] text-gray-900 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                  />
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
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-8 flex items-start gap-3 rounded-2xl bg-[#F8F9FA] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2E7D32]" />
              <p className="text-sm leading-6 text-gray-600">
                For security, we will never reveal whether an email address is
                registered or not.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}