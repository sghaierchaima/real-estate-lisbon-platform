"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Lock,
  MapPin,
  PenLine,
  Send,
  Sparkles,
  Upload,
  User,
} from "lucide-react";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { getStoredUser, getToken } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { createStoryWithImage } from "@/lib/stories-api";

export default function SubmitStory() {
  const user = getStoredUser<AuthUser>();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit = user?.role === "BUYER";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    event.preventDefault();
    setErrorMessage("");
    setSuccess(false);

    const token = getToken();

    if (!token) {
      setErrorMessage("Please sign in before submitting your story.");
      return;
    }

    if (!canSubmit) {
      setErrorMessage("Only buyers can submit success stories.");
      return;
    }

    const formData = new FormData();

    formData.append("title", String(form.get("title") || ""));
    formData.append("author", String(form.get("author") || ""));
    formData.append("location", String(form.get("location") || ""));
    formData.append("excerpt", String(form.get("excerpt") || ""));
    formData.append("content", String(form.get("content") || ""));

    const image = form.get("image");

    if (image instanceof File && image.size > 0) {
      formData.append("images", image);
    }

    try {
      setLoading(true);
      await createStoryWithImage(token, formData);
      setSuccess(true);
      form.reset();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error submitting story."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen overflow-hidden bg-[#F8F9FA] px-6 py-16 text-[#0F2340]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-[#1B365D]/10 blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-100px] h-[320px] w-[320px] rounded-full bg-[#C9A227]/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(27,54,93,0.05)_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A227]/30 bg-white px-4 py-2 text-sm font-semibold text-[#1B365D] shadow-sm">
              <Sparkles className="h-4 w-4 text-[#C9A227]" />
              Share Your Buying Journey
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-[-0.04em] text-[#0F2340] md:text-6xl">
                Share your success story
              </h1>

              <p className="mt-5 max-w-xl text-[17px] leading-8 text-[#667085]">
                Tell us about your real estate experience in Portugal. Your story
                will be reviewed by the admin before being published publicly.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-6 shadow-[0_20px_60px_rgba(15,35,64,0.08)]">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1B365D] text-white">
                  <PenLine className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#0F2340]">
                    What happens next?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#667085]">
                    After submission, your story will be saved as PENDING.
                    Once approved by the admin, it can appear as a verified
                    success story.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[34px] border border-[#E4E7EC] bg-white p-6 shadow-[0_24px_70px_rgba(15,35,64,0.12)] md:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#0F2340]">
                Story details
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                Fill in the form below to submit your story.
              </p>
            </div>

            {!canSubmit && (
              <div className="mb-6 flex items-start gap-3 rounded-[20px] border border-orange-200 bg-orange-50 p-4 text-orange-700">
                <Lock className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Buyer account required</p>
                  <p className="mt-1 text-sm">
                    Only buyers can submit success stories.
                  </p>
                  <Link
                    href="/login"
                    className="mt-2 inline-flex text-sm font-semibold text-[#1B365D]"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-start gap-3 rounded-[20px] border border-green-200 bg-green-50 p-4 text-green-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Submitted successfully!</p>
                  <p className="mt-1 text-sm">
                    Your story is waiting for admin approval.
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0F2340]">
                  Story title
                </label>
                <input
                  name="title"
                  placeholder="Example: How I found my dream apartment in Lisbon"
                  className="h-14 w-full rounded-[18px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 text-sm text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:bg-white focus:ring-4 focus:ring-[#1B365D]/10"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0F2340]">
                    Your name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                    <input
                      name="author"
                      defaultValue={user?.fullName || ""}
                      placeholder="Your name"
                      className="h-14 w-full rounded-[18px] border border-[#D0D5DD] bg-[#F9FAFB] pl-11 pr-5 text-sm text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:bg-white focus:ring-4 focus:ring-[#1B365D]/10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0F2340]">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                    <input
                      name="location"
                      placeholder="Lisbon, Portugal"
                      className="h-14 w-full rounded-[18px] border border-[#D0D5DD] bg-[#F9FAFB] pl-11 pr-5 text-sm text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:bg-white focus:ring-4 focus:ring-[#1B365D]/10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0F2340]">
                  Story image
                </label>
                <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[18px] border border-dashed border-[#D0D5DD] bg-[#F9FAFB] px-5 py-6 text-center transition hover:border-[#1B365D] hover:bg-white">
                  <Upload className="mb-3 h-6 w-6 text-[#1B365D]" />
                  <span className="text-sm font-semibold text-[#0F2340]">
                    Upload image from your computer
                  </span>
                  <span className="mt-1 text-xs text-[#667085]">
                    PNG, JPG, JPEG accepted
                  </span>
                  <input
                    name="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0F2340]">
                  Short summary
                </label>
                <textarea
                  name="excerpt"
                  placeholder="Write a short summary of your story..."
                  className="min-h-[110px] w-full resize-none rounded-[18px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-sm leading-6 text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:bg-white focus:ring-4 focus:ring-[#1B365D]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0F2340]">
                  Full story
                </label>
                <textarea
                  name="content"
                  placeholder="Tell us the full story..."
                  className="min-h-[180px] w-full resize-none rounded-[18px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-sm leading-6 text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:bg-white focus:ring-4 focus:ring-[#1B365D]/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="inline-flex h-[58px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#1B365D] px-7 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(27,54,93,0.22)] transition hover:bg-[#0F2340] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {loading ? "Submitting..." : "Submit Story"}
              </button>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}