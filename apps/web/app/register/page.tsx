"use client";

import Link from "next/link";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
  BriefcaseBusiness,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth-api";
import { saveSession } from "@/lib/session";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

type UserRole = "BUYER" | "PROFESSIONAL";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("BUYER");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const cleanName = fullName.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanName || !cleanEmail || !password) {
        throw new Error("Please fill in all fields.");
      }

      if (password.length < 8) {
        throw new Error("Password must contain at least 8 characters.");
      }

      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
        throw new Error(
          "Password must contain at least one uppercase letter, one lowercase letter, and one number."
        );
      }

      const result = await register({
        email: cleanEmail,
        password,
        fullName: cleanName,
        
      });

      saveSession(result.accessToken, result.user);
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(
        getFriendlyError(error, "Register failed")
      );
    } finally {
      setLoading(false);
    }
  };

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
            <div className="mb-10 flex items-start gap-5">
              <div className="flex h-28 w-28 items-center justify-center rounded-md bg-[#F8F9FA]">
                <img
                  src="/images/pfelogo.png"
                  alt="Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>

              <div className="flex-1">
                <h1 className="text-5xl font-bold leading-[0.95] text-[#1B365D]">
                  Create
                  <br />
                  Account
                </h1>

                <p className="mt-3 text-[17px] text-gray-500">
                  Start your Portugal property journey
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#DADADA] bg-[#F6F4EC] px-5 py-3 text-[15px]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#67D48A]" />
                  Free Forever
                </div>
              </div>
            </div>

            <div className="mb-6">
  <GoogleLoginButton />
</div>

<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-200"></div>
  </div>

  <div className="relative flex justify-center">
    <span className="bg-white px-4 text-sm text-gray-500">
      OR
    </span>
  </div>
</div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="mb-3 block text-[18px] font-medium text-[#1B365D]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-[#E5E7EB] pl-12 pr-4 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-[18px] font-medium text-[#1B365D]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-[#E5E7EB] pl-12 pr-4 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-[18px] font-medium text-[#1B365D]">
                  Role
                </label>
                <div className="relative">
                  <BriefcaseBusiness className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="h-14 w-full appearance-none rounded-2xl border border-[#E5E7EB] bg-white pl-12 pr-12 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                  >
                    <option value="BUYER">Buyer</option>
                    <option value="PROFESSIONAL">Professional</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-[18px] font-medium text-[#1B365D]">
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-[#E5E7EB] pl-12 pr-12 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                    placeholder="Create a password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
                {errorMessage && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                    {errorMessage}
                  </div>
                )}
              <button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-[#1B365D] text-[20px] font-semibold text-white transition hover:bg-[#0F2340] disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-[#1B365D]">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-8 flex gap-3 rounded-2xl bg-[#F8F9FA] p-4">
              <ShieldCheck className="text-green-600" />
              <p className="text-sm text-gray-600">
                You can create a buyer or professional account. Professional
                profiles will be verified before appearing publicly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}