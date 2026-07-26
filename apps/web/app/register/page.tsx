"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { register } from "@/lib/auth-api";
import { saveSession } from "@/lib/session";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] =
    useState(false);

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  function getFriendlyError(
    error: unknown,
    fallback: string,
  ) {
    const message =
      error instanceof Error
        ? error.message
        : fallback;

    const normalizedMessage =
      message.toLowerCase();

    if (
      normalizedMessage.includes(
        "too many requests",
      ) ||
      normalizedMessage.includes(
        "throttlerexception",
      )
    ) {
      return "Too many attempts. Please wait one minute and try again.";
    }

    return message;
  }

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const cleanName =
        fullName.trim();

      const cleanEmail =
        email.trim().toLowerCase();

      if (
        !cleanName ||
        !cleanEmail ||
        !password
      ) {
        throw new Error(
          "Please fill in all fields.",
        );
      }

      if (password.length < 8) {
        throw new Error(
          "Password must contain at least 8 characters.",
        );
      }

      if (
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/\d/.test(password)
      ) {
        throw new Error(
          "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
        );
      }

      const result = await register({
        email: cleanEmail,
        password,
        fullName: cleanName,
      });

      saveSession(
        result.accessToken,
        result.user,
      );

      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(
        getFriendlyError(
          error,
          "Registration failed. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-[#0F2340]">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#1B365D] to-[#0F2340] px-4 py-8 lg:py-10">
        <div className="absolute inset-0 opacity-20">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize:
                "28px 28px",
            }}
          />
        </div>

        <div className="container-page relative">
          <div className="mx-auto w-full max-w-md rounded-[26px] bg-white p-6 shadow-[0_20px_60px_rgba(15,35,64,0.18)] sm:p-7">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-[#F8F9FA]">
                <img
                  src="/images/pfelogo.png"
                  alt="Real Estate Lisbon"
                  className="h-12 w-auto object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-4xl font-bold leading-[0.95] tracking-[-0.03em] text-[#1B365D]">
                  Create
                  <br />
                  Account
                </h1>

                <p className="mt-2 text-sm leading-5 text-gray-500">
                  Start your Portugal property
                  journey
                </p>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#DADADA] bg-[#F6F4EC] px-4 py-2 text-sm font-medium text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-[#67D48A]" />
                  Free Forever
                </div>
              </div>
            </div>

            <div className="mb-4">
              <GoogleLoginButton />
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>

              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs font-medium text-gray-500">
                  OR
                </span>
              </div>
            </div>

            <form
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-semibold text-[#1B365D]"
                >
                  Full Name
                </label>

                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                  <input
                    id="fullName"
                    required
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(
                        event.target.value,
                      )
                    }
                    className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white pl-12 pr-4 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#1B365D]"
                >
                  Email
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                  <input
                    id="email"
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white pl-12 pr-4 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-[#1B365D]"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                  <input
                    id="password"
                    required
                    minLength={8}
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white pl-12 pr-12 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                    placeholder="Create a password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) =>
                          !previous,
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-[#1B365D]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <p className="mt-1.5 text-xs leading-5 text-gray-500">
                  Minimum 8 characters with an
                  uppercase letter, lowercase
                  letter and number.
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#1B365D] px-5 text-base font-semibold text-white transition hover:bg-[#0F2340] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#1B365D] transition hover:text-[#0F2340]"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#F8F9FA] p-3.5">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />

              <p className="text-xs leading-5 text-gray-600">
                Your account information is
                encrypted and protected. You can
                apply to join the professional
                network from your dashboard after
                creating your account.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}