"use client";

import Link from "next/link";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, Suspense, } from "react";
import { useRouter,useSearchParams } from "next/navigation";
import { login } from "@/lib/auth-api";
import {
  clearSession,
  saveSession,
} from "@/lib/session";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { useToast } from "@/components/ui/ToastProvider";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
const toast = useToast();
const sessionToastShownRef =
  useRef(false);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
useEffect(() => {
  const reason =
    searchParams.get("reason");

  if (
    !reason ||
    sessionToastShownRef.current
  ) {
    return;
  }

  if (reason === "session-expired") {
    sessionToastShownRef.current = true;

    clearSession();

    toast.warning(
      "Session expired",
      "Your session has expired. Please sign in again.",
    );

    router.replace("/login");
    return;
  }

  if (
    reason ===
    "professional-activated"
  ) {
    sessionToastShownRef.current = true;

    /*
     * Sécurité supplémentaire :
     * on s’assure qu’aucune ancienne session
     * BUYER n’est encore stockée.
     */
    clearSession();

    toast.success(
      "Professional account activated",
      "Sign in again to open your professional workspace.",
    );

    router.replace("/login");
  }
}, [router, searchParams, toast]);

  function getFriendlyError(
  error: unknown,
  fallback: string,
) {
  const message =
    error instanceof Error
      ? error.message
      : fallback;

  if (
    message
      .toLowerCase()
      .includes("too many requests") ||
    message
      .toLowerCase()
      .includes("throttlerexception")
  ) {
    return "Too many attempts. Please wait one minute and try again.";
  }

  return message;
}
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
   
    try {
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      saveSession(
  result.accessToken,
  result.user,
);

toast.success(
  "Login successful",
  "Welcome back.",
);

router.push("/dashboard");
    }  catch (error) {
  toast.error(
    "Login failed",
    getFriendlyError(
      error,
      "Unable to sign in. Please try again.",
    ),
  );
} finally {
      setLoading(false);
    }
  };
  

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
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="container-page relative">
          <div className="mx-auto w-full max-w-md rounded-[26px] bg-white p-6 shadow-[0_20px_60px_rgba(15,35,64,0.18)] sm:p-7">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-[#F8F9FA]">
                <img
                  src="/images/pfelogo.png"
                  alt="Logo"
                  className="h-12 w-auto object-contain"
                />
              </div>

              <div className="flex-1">
                <h1 className="text-4xl font-bold leading-[0.95] tracking-[-0.03em] text-[#1B365D]">
                  Welcome
                  <br />
                  Back
                </h1>

                <p className="mt-3 text-[17px] text-gray-500">
                  Sign in to your account
                </p>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#DADADA] bg-[#F6F4EC] px-4 py-2 text-sm font-medium text-gray-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#67D48A]" />
                  Secure Login
                </div>
              </div>
            </div>

            <div className="mb-4">
  <GoogleLoginButton />
</div>

<div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-200"></div>
  </div>

  <div className="relative flex justify-center">
    <span className="bg-white px-4 text-sm text-gray-500">
      OR
    </span>
  </div>
</div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-base font-semibold text-[#1B365D]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="required"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-2xl border border-[#E5E7EB] bg-white pl-12 pr-4 text-[17px] text-gray-900 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-[18px] font-medium text-[#1B365D]">
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-[16px] font-medium text-[#1B365D] transition hover:text-[#0F2340]"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                  required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-[#E5E7EB] bg-white pl-12 pr-12 text-[17px] text-gray-900 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-[#1B365D]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
                    
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-[#1B365D] text-base font-semibold text-white transition hover:bg-[#0F2340] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-16 text-center">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-[#1B365D] transition hover:text-[#0F2340]"
                >
                  Create free account
                </Link>
              </p>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#F8F9FA] p-3.5">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2E7D32]" />
              <p className="text-sm leading-6 text-gray-600">
                Your login is encrypted and protected. We never share your data
                with professionals unless you request an introduction.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8F9FA]">
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-[#1B365D]">
              Loading...
            </p>
          </div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}