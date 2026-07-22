"use client";

import Link from "next/link";
import { ArrowLeft, Home, ShieldX } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-6 text-[#0F2340]">
      <section className="w-full max-w-xl rounded-[32px] border border-[#E4E7EC] bg-white p-10 text-center shadow-[0_20px_60px_rgba(15,35,64,0.08)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldX className="h-10 w-10" />
        </div>

        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
          Access denied
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.02em] text-[#0F2340]">
          You do not have permission to view this page.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#667085]">
          This section is restricted to authorized administrators. Your account
          does not have the required permission.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-6 font-semibold text-white transition hover:bg-[#0F2340]"
          >
            <Home className="h-5 w-5" />
            Go to dashboard
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D0D5DD] px-6 font-semibold text-[#1B365D] transition hover:bg-[#F8F9FA]"
          >
            <ArrowLeft className="h-5 w-5" />
            Go back
          </button>
        </div>
      </section>
    </main>
  );
}