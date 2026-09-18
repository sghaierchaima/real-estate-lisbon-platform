"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";

import {
  getPublicProfessional,
  Professional,
} from "@/lib/professionals-api";

import { useToast } from "@/components/ui/ToastProvider";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import type { AuthUser } from "@/lib/auth-api";

import {
  getMyBuyerMatches,
  type MatchItem,
} from "@/lib/matching-api";

import {
  createReview,
  getMyMatchReview,
  getProfessionalReviews,
  type AdminReview,
} from "@/lib/reviews";

import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Globe2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Users,
  MessageSquarePlus,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

/* ============================================================
   Helpers
============================================================ */

function formatType(type: string) {
  return type.replaceAll("_", " ");
}

function getImageSrc(url?: string | null) {
  if (!url) return "";

  if (url.startsWith("http")) {
    return url;
  }

  return `${API_URL}${url}`;
}

type ExistingReview = {
  id: string;
  rating: number;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  matchId: string;
  createdAt: string;
  updatedAt?: string;
};

/* ============================================================
   Page
============================================================ */

export default function ProfessionalDetailsPage() {
  const params = useParams();
  const id = String(params.id);

  const toast = useToast();

  const [professional, setProfessional] =
    useState<Professional | null>(null);

  const [loading, setLoading] =
    useState(true);
  const [publicReviews, setPublicReviews] =
    useState<AdminReview[]>([]);

  const [publicReviewsLoading, setPublicReviewsLoading] =
    useState(true);

  /* ============================================================
     REVIEW STATE
  ============================================================ */

  const [reviewMatch, setReviewMatch] =
    useState<MatchItem | null>(null);

  const [existingReview, setExistingReview] =
    useState<ExistingReview | null>(null);

  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [reviewModalOpen, setReviewModalOpen] =
    useState(false);

  const [rating, setRating] =
    useState(0);

  const [comment, setComment] =
    useState("");

  const [submittingReview, setSubmittingReview] =
    useState(false);

  const [propertyPage, setPropertyPage] =
    useState(1);

  const propertiesPerPage = 3;

  const user =
    getStoredUser<AuthUser>();

  const reviewsScrollRef =
    useRef<HTMLDivElement | null>(null);

  function scrollReviews(direction: "left" | "right") {
    const container = reviewsScrollRef.current;

    if (!container) {
      return;
    }

    const amount = Math.min(container.clientWidth * 0.85, 900);

    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  /* ============================================================
     LOAD PROFESSIONAL
  ============================================================ */

  useEffect(() => {
    async function loadProfessional() {
      try {
        const data =
          await getPublicProfessional(id);

        setProfessional(data);
      } catch (error) {
        toast.error(
          "Professional not found",
          error instanceof Error
            ? error.message
            : "Unable to load profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfessional();
  }, [id, toast]);

  /* ============================================================
   LOAD PUBLIC REVIEWS
============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadPublicReviews() {
      setPublicReviewsLoading(true);

      try {
        const reviews =
          await getProfessionalReviews(id);

        if (cancelled) {
          return;
        }

        /*
         * Sécurité frontend :
         * on affiche uniquement les reviews APPROVED.
         * Normalement le backend public doit déjà faire ce filtre.
         */
        const approvedReviews =
          reviews
            .filter(
              (review) =>
                review.status === "APPROVED",
            )
            .sort(
              (a, b) =>
                new Date(
                  b.createdAt,
                ).getTime() -
                new Date(
                  a.createdAt,
                ).getTime(),
            );

        setPublicReviews(
          approvedReviews,
        );
      } catch (error) {
        console.error(
          "[PUBLIC REVIEWS] Unable to load professional reviews:",
          error,
        );

        if (!cancelled) {
          setPublicReviews([]);
        }
      } finally {
        if (!cancelled) {
          setPublicReviewsLoading(false);
        }
      }
    }

    void loadPublicReviews();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ============================================================
     LOAD BUYER REVIEW CONTEXT
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadBuyerReviewContext() {
      if (!professional) {
        return;
      }

      /*
       * Reviews concernent uniquement les Buyers.
       */
      if (user?.role !== "BUYER") {
        return;
      }

      const token = getToken();

      if (!token) {
        return;
      }

      setReviewLoading(true);

      try {
        /*
         * Récupérer tous les matches du Buyer.
         */
        const matches =
          await getMyBuyerMatches(token);

        if (cancelled) {
          return;
        }

        /*
         * Un Buyer peut laisser une review seulement
         * après un match COMPLETED avec ce professionnel.
         */
        const completedMatches =
          matches
            .filter(
              (match) =>
                match.professionalId ===
                professional.id &&
                match.status ===
                "COMPLETED",
            )
            .sort(
              (a, b) =>
                new Date(
                  b.updatedAt,
                ).getTime() -
                new Date(
                  a.updatedAt,
                ).getTime(),
            );

        const eligibleMatch =
          completedMatches[0] ?? null;

        setReviewMatch(
          eligibleMatch,
        );

        if (!eligibleMatch) {
          setExistingReview(null);
          return;
        }

        /*
         * Si Matching API renvoie déjà la review,
         * on évite un appel API supplémentaire.
         */
        if (eligibleMatch.review) {
          setExistingReview(
            eligibleMatch.review,
          );

          return;
        }

        /*
         * Sinon on vérifie directement l'API Reviews.
         */
        const review =
          await getMyMatchReview(
            token,
            eligibleMatch.id,
          );

        if (!cancelled) {
          setExistingReview(
            review,
          );
        }
      } catch (error) {
        /*
         * On ne bloque surtout pas le profil public
         * si le contexte Review ne peut pas être chargé.
         */
        console.error(
          "[PROFESSIONAL REVIEW] Unable to load review context:",
          error,
        );

        if (!cancelled) {
          setReviewMatch(null);
          setExistingReview(null);
        }
      } finally {
        if (!cancelled) {
          setReviewLoading(false);
        }
      }
    }

    void loadBuyerReviewContext();

    return () => {
      cancelled = true;
    };
  }, [
    professional,
    user?.role,
  ]);

  /* ============================================================
     SUBMIT REVIEW
  ============================================================ */

  async function handleSubmitReview() {
    if (!reviewMatch) {
      toast.error(
        "Review unavailable",
        "A completed professional match is required before leaving a review.",
      );

      return;
    }

    if (
      rating < 1 ||
      rating > 5
    ) {
      toast.error(
        "Rating required",
        "Please choose a rating from 1 to 5 stars.",
      );

      return;
    }

    const token = getToken();

    if (!token) {
      toast.error(
        "Authentication required",
        "Please sign in again.",
      );

      return;
    }

    setSubmittingReview(true);

    try {
      const result =
        await createReview(
          token,
          {
            matchId:
              reviewMatch.id,

            rating,

            comment:
              comment.trim() ||
              undefined,
          },
        );

      /*
       * La nouvelle review est normalement PENDING.
       */
      setExistingReview(
        result.review,
      );

      setReviewModalOpen(false);

      setRating(0);
      setComment("");

      toast.success(
        "Review submitted",
        "Your review is waiting for administrator approval.",
      );
    } catch (error) {
      console.error(
        "[PROFESSIONAL REVIEW] Submit error:",
        error,
      );

      toast.error(
        "Unable to submit review",
        error instanceof Error
          ? error.message
          : "Please try again.",
      );
    } finally {
      setSubmittingReview(false);
    }
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#F8F9FA] px-6 py-20 text-[#667085] lg:px-[140px]">
          Loading professional profile...
        </main>

        <Footer />
      </>
    );
  }

  /* ============================================================
     NOT FOUND
  ============================================================ */

  if (!professional) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#F8F9FA] px-6 py-20 lg:px-[140px]">
          <div className="rounded-3xl border bg-white p-10 text-center text-[#667085]">
            Professional not found or not active.
          </div>
        </main>

        <Footer />
      </>
    );
  }

  const avatar =
    getImageSrc(
      professional.user.avatarUrl,
    );

  const properties =
    professional.properties || [];

  const totalPropertyPages =
    Math.max(
      1,
      Math.ceil(
        properties.length /
          propertiesPerPage,
      ),
    );

  const currentPropertyPage =
    Math.min(
      propertyPage,
      totalPropertyPages,
    );

  const paginatedProperties =
    properties.slice(
      (currentPropertyPage - 1) *
        propertiesPerPage,
      currentPropertyPage *
        propertiesPerPage,
    );

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F8F9FA] text-[#0F2340]">
        <section className="px-6 py-14 lg:px-[140px]">
          <div className="mx-auto max-w-[1200px]">
            <Link
              href="/find-professionals"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1B365D]"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to professionals
            </Link>

            {/* ==================================================
                PROFESSIONAL PROFILE
            ================================================== */}

            <div className="overflow-hidden rounded-[34px] border border-[#E5E7EB] bg-white shadow-[0_18px_50px_rgba(15,35,64,0.08)]">
              <div className="grid lg:grid-cols-[380px_1fr]">
                {/* ==============================================
                    LEFT PROFILE
                ============================================== */}

                <div className="bg-[#10284D] p-8 text-white">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={
                        professional.user
                          .fullName ||
                        "Professional"
                      }
                      className="h-[320px] w-full rounded-[26px] object-cover"
                    />
                  ) : (
                    <div className="flex h-[320px] w-full items-center justify-center rounded-[26px] bg-white/10 text-[80px] font-bold">
                      {(
                        professional.user
                          .fullName ||
                        professional.user
                          .email ||
                        "P"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="mt-6 rounded-2xl bg-white/10 p-5">
                    <p className="text-sm text-white/70">
                      Verification
                    </p>

                    <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
                      <BadgeCheck className="h-5 w-5 text-[#C9A227]" />

                      {
                        professional.verificationStatus
                      }
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white/10 p-5">
                    <p className="text-sm text-white/70">
                      Profile completion
                    </p>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-[#C9A227]"
                        style={{
                          width: `${Math.min(
                            professional.profileCompletion ||
                            0,
                            100,
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-sm font-semibold">
                      {professional.profileCompletion ||
                        0}
                      %
                    </p>
                  </div>
                </div>

                {/* ==============================================
                    RIGHT PROFILE
                ============================================== */}

                <div className="p-8 lg:p-10">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
                        {formatType(
                          professional.professionalType,
                        )}
                      </p>

                      <h1 className="mt-3 text-[42px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F2340]">
                        {professional.user
                          .fullName ||
                          "Unnamed Professional"}
                      </h1>

                      <p className="mt-3 flex items-center gap-2 text-[#667085]">
                        <Building2 className="h-5 w-5" />

                        {professional.companyName ||
                          "Independent Professional"}
                      </p>

                      {(professional.user
                        .city ||
                        professional.user
                          .country) && (
                          <p className="mt-3 flex items-center gap-2 text-[#667085]">
                            <MapPin className="h-5 w-5" />

                            {[
                              professional.user
                                .city,

                              professional.user
                                .country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF7E2] px-5 py-3 text-lg font-bold text-[#B78103]">
                      <Star className="h-5 w-5 fill-current" />

                      {Number(
                        professional.rating ||
                        0,
                      ).toFixed(1)}
                    </div>
                  </div>

                  <p className="mt-8 max-w-[760px] text-[17px] leading-8 text-[#475467]">
                    {professional.bio ||
                      "No biography provided yet."}
                  </p>

                  {/* ============================================
                      STATS
                  ============================================ */}

                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <StatBox
                      label="Reviews"
                      value={
                        professional.reviewsCount
                      }
                    />

                    <StatBox
                      label="Clients"
                      value={
                        professional.clientsCount
                      }
                    />

                    <StatBox
                      label="Profile"
                      value={`${professional.profileCompletion}%`}
                    />
                  </div>

                  {/* ============================================
                      LANGUAGES
                  ============================================ */}

                  <div className="mt-8">
                    <h2 className="mb-4 text-xl font-bold">
                      Languages
                    </h2>

                    <div className="flex flex-wrap gap-3">
                      {professional.languages
                        .length > 0 ? (
                        professional.languages.map(
                          (lang) => (
                            <span
                              key={lang}
                              className="inline-flex items-center gap-2 rounded-full bg-[#EEF3F8] px-4 py-2 text-sm font-semibold text-[#1B365D]"
                            >
                              <Globe2 className="h-4 w-4" />

                              {lang}
                            </span>
                          ),
                        )
                      ) : (
                        <span className="text-[#667085]">
                          No languages listed.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ============================================
                      WHY THIS PROFESSIONAL
                  ============================================ */}

                  <div className="mt-8 rounded-3xl border border-[#E5E7EB] bg-[#F8FAFC] p-6">
                    <h2 className="text-xl font-bold">
                      Why this professional?
                    </h2>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <Reason
                        icon={
                          <ShieldCheck className="h-5 w-5" />
                        }
                        title="Verified profile"
                        text="Approved by the platform admin."
                      />

                      <Reason
                        icon={
                          <Users className="h-5 w-5" />
                        }
                        title="Client experience"
                        text={`${professional.clientsCount} clients handled.`}
                      />

                      <Reason
                        icon={
                          <Star className="h-5 w-5" />
                        }
                        title="Rated service"
                        text={`${Number(
                          professional.rating ||
                          0,
                        ).toFixed(
                          1,
                        )} average rating.`}
                      />
                    </div>
                  </div>

                  {/* ============================================
                      ACTIONS
                  ============================================ */}

                  <div className="mt-10 flex flex-col gap-4 md:flex-row md:flex-wrap">
                    <Link
                      href={`mailto:${professional.user.email}`}
                      className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#1B365D] px-7 font-semibold text-white"
                    >
                      <Mail className="h-5 w-5" />

                      Email professional
                    </Link>

                    {professional.user
                      .phone && (
                        <Link
                          href={`tel:${professional.user.phone}`}
                          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#D0D5DD] bg-white px-7 font-semibold text-[#1B365D]"
                        >
                          <Phone className="h-5 w-5" />

                          Call professional
                        </Link>
                      )}

                    <Link
                      href="/tools/mortgage-calculator"
                      className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#D0D5DD] bg-white px-7 font-semibold text-[#1B365D]"
                    >
                      <Users className="h-5 w-5" />

                      Start buyer journey
                    </Link>

                    {/* ==========================================
                        LEAVE REVIEW
                    ========================================== */}

                    {user?.role ===
                      "BUYER" &&
                      !reviewLoading &&
                      reviewMatch &&
                      !existingReview && (
                        <button
                          type="button"
                          onClick={() =>
                            setReviewModalOpen(
                              true,
                            )
                          }
                          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#C9A227] px-7 font-semibold text-white transition hover:bg-[#B8941F]"
                        >
                          <MessageSquarePlus className="h-5 w-5" />

                          Leave a Review
                        </button>
                      )}

                    {/* ==========================================
                        EXISTING REVIEW STATUS
                    ========================================== */}

                    {user?.role ===
                      "BUYER" &&
                      existingReview && (
                        <div
                          className={`inline-flex h-14 items-center justify-center gap-2 rounded-2xl border px-6 font-semibold ${existingReview.status ===
                              "APPROVED"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : existingReview.status ===
                                "REJECTED"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                        >
                          <Star className="h-5 w-5" />

                          {existingReview.status ===
                            "APPROVED"
                            ? "Review Published"
                            : existingReview.status ===
                              "REJECTED"
                              ? "Review Rejected"
                              : "Review Pending"}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ====================================================
    CLIENT REVIEWS
==================================================== */}

<div className="mt-10 rounded-[34px] border border-[#E5E7EB] bg-white p-8 shadow-[0_18px_50px_rgba(15,35,64,0.08)] lg:p-10">
  {/* ================================================
      HEADER
  ================================================ */}

  <div className="flex flex-col gap-5 border-b border-[#EAECF0] pb-7 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
        Buyer Feedback
      </p>

      <h2 className="mt-2 text-[30px] font-bold tracking-[-0.03em] text-[#0F2340]">
        Client Reviews
      </h2>

      <p className="mt-2 max-w-[650px] text-[#667085]">
        Feedback from buyers who completed
        their journey with this professional.
      </p>
    </div>

    {!publicReviewsLoading &&
      publicReviews.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#FFF7E2] px-5 py-3">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-[#C9A227] text-[#C9A227]" />

            <span className="text-lg font-bold text-[#0F2340]">
              {Number(
                professional.rating || 0,
              ).toFixed(1)}
            </span>
          </div>

          <span className="h-5 w-px bg-[#E7D8A6]" />

          <span className="text-sm font-semibold text-[#667085]">
            {publicReviews.length}{" "}
            {publicReviews.length === 1
              ? "review"
              : "reviews"}
          </span>
        </div>
      )}
  </div>

  {/* ================================================
      LOADING
  ================================================ */}

  {publicReviewsLoading ? (
    <div className="py-12">
      <div className="grid gap-5 md:grid-cols-2">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-[24px] border border-[#EAECF0] bg-[#F8FAFC] p-6"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#E4E7EC]" />

              <div className="flex-1">
                <div className="h-4 w-32 rounded bg-[#E4E7EC]" />

                <div className="mt-2 h-3 w-20 rounded bg-[#EAECF0]" />
              </div>
            </div>

            <div className="mt-5 h-4 w-full rounded bg-[#EAECF0]" />

            <div className="mt-2 h-4 w-3/4 rounded bg-[#EAECF0]" />
          </div>
        ))}
      </div>
    </div>
  ) : publicReviews.length > 0 ? (
    /* ================================================
       REVIEWS LIST
    ================================================ */

    <div className="relative mt-7">
      <button
        type="button"
        onClick={() => scrollReviews("left")}
        className="absolute left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#1B365D] shadow-[0_10px_30px_rgba(15,35,64,0.12)] transition hover:bg-[#F8FAFC] md:flex"
        aria-label="Previous reviews"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => scrollReviews("right")}
        className="absolute right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#1B365D] shadow-[0_10px_30px_rgba(15,35,64,0.12)] transition hover:bg-[#F8FAFC] md:flex"
        aria-label="Next reviews"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={reviewsScrollRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {publicReviews.map((review) => {
          const buyerName =
            review.buyer?.fullName ||
            "Verified Buyer";

          const buyerAvatar =
            getImageSrc(
              review.buyer?.avatarUrl,
            );

          return (
            <article
              key={review.id}
              className="flex w-[88%] shrink-0 snap-start flex-col rounded-[24px] border border-[#EAECF0] bg-[#F8FAFC] p-6 transition duration-200 hover:-translate-y-0.5 hover:border-[#D0D5DD] hover:shadow-[0_12px_30px_rgba(15,35,64,0.07)] sm:w-[420px] lg:w-[460px]"
            >
              {/* ========================================
                  BUYER
              ======================================== */}

              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  {buyerAvatar ? (
                    <img
                      src={buyerAvatar}
                      alt={buyerName}
                      className="h-12 w-12 shrink-0 rounded-full border border-[#E5E7EB] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1B365D] text-base font-bold text-white">
                      {buyerName
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#0F2340]">
                      {buyerName}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#667085]">
                      <BadgeCheck className="h-4 w-4 text-[#1B365D]" />

                      Verified Buyer
                    </div>
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  Verified
                </span>
              </div>

              {/* ========================================
                  STARS
              ======================================== */}

              <div className="mt-5 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= review.rating
                          ? "fill-[#C9A227] text-[#C9A227]"
                          : "text-[#D0D5DD]"
                      }`}
                    />
                  ),
                )}

                <span className="ml-2 text-sm font-bold text-[#0F2340]">
                  {review.rating}.0
                </span>
              </div>

              {/* ========================================
                  COMMENT
              ======================================== */}

              {review.comment ? (
                <p className="mt-5 flex-1 text-[15px] leading-7 text-[#475467]">
                  “{review.comment}”
                </p>
              ) : (
                <p className="mt-5 flex-1 text-[15px] italic leading-7 text-[#98A2B3]">
                  No written comment provided.
                </p>
              )}

              {/* ========================================
                  DATE
              ======================================== */}

              <div className="mt-6 border-t border-[#EAECF0] pt-4">
                <p className="text-xs font-medium text-[#98A2B3]">
                  {new Intl.DateTimeFormat(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  ).format(
                    new Date(
                      review.createdAt,
                    ),
                  )}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  ) : (
    /* ================================================
       EMPTY STATE
    ================================================ */

    <div className="mt-7 flex flex-col items-center justify-center rounded-[24px] bg-[#F8FAFC] px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF3F8] text-[#1B365D]">
        <Star className="h-7 w-7" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-[#0F2340]">
        No reviews yet
      </h3>

      <p className="mt-2 max-w-[430px] text-sm leading-6 text-[#667085]">
        This professional has not received
        any published buyer reviews yet.
      </p>
    </div>
  )}
</div>

          {/* ====================================================
              PROPERTIES
          ==================================================== */}

          <div className="mt-10 rounded-[34px] border border-[#E5E7EB] bg-white p-8 shadow-[0_18px_50px_rgba(15,35,64,0.08)]">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <h2 className="text-[30px] font-bold tracking-[-0.03em] text-[#0F2340]">
                  Properties from this professional
                </h2>

                <p className="mt-2 text-[#667085]">
                  Published listings managed
                  by this professional
                </p>
              </div>
            </div>

            {professional.properties &&
              professional.properties
                .length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {paginatedProperties.map(
                    (property) => {
                      const image =
                        property.imageUrls?.[0]
                          ? getImageSrc(
                            property
                              .imageUrls[0],
                          )
                          : "";

                      return (
                        <Link
                          key={property.id}
                          href={`/properties/${property.id}`}
                          className="group overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,35,64,0.12)]"
                        >
                          <div className="h-[260px] overflow-hidden bg-[#EEF2F6]">
                            {image ? (
                              <img
                                src={image}
                                alt={
                                  property.title
                                }
                                className="h-full w-full object-cover object-center"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#98A2B3]">
                                <Building2 className="h-12 w-12" />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#C9A227]">
                              {property.propertyType ||
                                "Property"}
                            </p>

                            <h3 className="mt-2 line-clamp-2 text-[20px] font-bold text-[#0F2340]">
                              {
                                property.title
                              }
                            </h3>

                            <p className="mt-3 text-[15px] text-[#667085]">
                              {property.location ||
                                property.city ||
                                "Portugal"}
                            </p>

                            <div className="mt-4 flex items-center justify-between">
                              <p className="text-[22px] font-bold text-[#1B365D]">
                                €
                                {Number(
                                  property.price ||
                                  0,
                                ).toLocaleString()}
                              </p>

                              <p className="text-sm text-[#667085]">
                                {property.bedrooms ||
                                  0}{" "}
                                beds •{" "}
                                {property.area ||
                                  0}
                                m²
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    },
                  )}
                </div>

                {totalPropertyPages > 1 && (
                  <div className="mt-8 flex flex-col gap-4 border-t border-[#EAECF0] pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-[#667085]">
                      Showing{" "}
                      {(currentPropertyPage - 1) *
                        propertiesPerPage +
                        1}
                      –
                      {Math.min(
                        currentPropertyPage *
                          propertiesPerPage,
                        properties.length,
                      )}{" "}
                      of {properties.length} properties
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={
                          currentPropertyPage === 1
                        }
                        onClick={() =>
                          setPropertyPage(
                            Math.max(
                              1,
                              currentPropertyPage -
                                1,
                            ),
                          )
                        }
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm font-semibold text-[#1B365D] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>

                      {Array.from(
                        {
                          length:
                            totalPropertyPages,
                        },
                        (_, index) =>
                          index + 1,
                      ).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() =>
                            setPropertyPage(
                              page,
                            )
                          }
                          className={`h-10 min-w-10 rounded-xl px-3 text-sm font-bold transition ${
                            page ===
                            currentPropertyPage
                              ? "bg-[#1B365D] text-white shadow-sm"
                              : "border border-[#D0D5DD] bg-white text-[#1B365D] hover:bg-[#F8FAFC]"
                          }`}
                          aria-current={
                            page ===
                            currentPropertyPage
                              ? "page"
                              : undefined
                          }
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={
                          currentPropertyPage ===
                          totalPropertyPages
                        }
                        onClick={() =>
                          setPropertyPage(
                            Math.min(
                              totalPropertyPages,
                              currentPropertyPage +
                                1,
                            ),
                          )
                        }
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm font-semibold text-[#1B365D] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-[24px] bg-[#F8FAFC] p-10 text-center text-[#667085]">
                No published properties
                from this professional yet.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ========================================================
          REVIEW MODAL
      ======================================================== */}

      {reviewModalOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0F2340]/55 p-4 backdrop-blur-sm"
          onClick={() => {
            if (
              !submittingReview
            ) {
              setReviewModalOpen(
                false,
              );
            }
          }}
        >
          <div
            className="w-full max-w-[560px] rounded-[30px] bg-white p-7 shadow-[0_30px_90px_rgba(15,35,64,0.30)]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* ================================================
                MODAL HEADER
            ================================================ */}

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
                  Professional Review
                </p>

                <h2 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-[#0F2340]">
                  Rate your experience
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  Share your experience
                  with{" "}
                  {professional.user
                    .fullName ||
                    "this professional"}
                  .
                </p>
              </div>

              <button
                type="button"
                disabled={
                  submittingReview
                }
                onClick={() =>
                  setReviewModalOpen(
                    false,
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] text-[#667085] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close review modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ================================================
                STARS
            ================================================ */}

            <div className="mt-7">
              <p className="mb-3 text-sm font-semibold text-[#0F2340]">
                Your rating
              </p>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={
                        submittingReview
                      }
                      onClick={() =>
                        setRating(
                          value,
                        )
                      }
                      className="transition hover:scale-110 disabled:cursor-not-allowed"
                      aria-label={`Rate ${value} star${value > 1
                          ? "s"
                          : ""
                        }`}
                    >
                      <Star
                        className={`h-9 w-9 ${value <=
                            rating
                            ? "fill-[#C9A227] text-[#C9A227]"
                            : "text-[#D0D5DD]"
                          }`}
                      />
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* ================================================
                COMMENT
            ================================================ */}

            <div className="mt-7">
              <label
                htmlFor="review-comment"
                className="text-sm font-semibold text-[#0F2340]"
              >
                Comment
              </label>

              <textarea
                id="review-comment"
                value={comment}
                disabled={
                  submittingReview
                }
                onChange={(event) =>
                  setComment(
                    event.target
                      .value,
                  )
                }
                maxLength={1000}
                rows={5}
                placeholder="Tell other buyers about your experience..."
                className="mt-3 w-full resize-none rounded-2xl border border-[#D0D5DD] bg-white px-4 py-4 text-[#0F2340] outline-none transition placeholder:text-[#98A2B3] focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10 disabled:cursor-not-allowed disabled:bg-[#F8FAFC]"
              />

              <div className="mt-2 text-right text-xs text-[#98A2B3]">
                {comment.length}/1000
              </div>
            </div>

            {/* ================================================
                MODAL ACTIONS
            ================================================ */}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={
                  submittingReview
                }
                onClick={() =>
                  setReviewModalOpen(
                    false,
                  )
                }
                className="h-12 rounded-xl border border-[#D0D5DD] px-6 font-semibold text-[#1B365D] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  submittingReview ||
                  rating === 0
                }
                onClick={
                  handleSubmitReview
                }
                className="h-12 rounded-xl bg-[#1B365D] px-6 font-semibold text-white transition hover:bg-[#142A49] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingReview
                  ? "Submitting..."
                  : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

/* ============================================================
   STAT BOX
============================================================ */

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] p-5">
      <p className="text-sm text-[#667085]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   REASON
============================================================ */

function Reason({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF3F8] text-[#1B365D]">
        {icon}
      </div>

      <p className="font-bold text-[#0F2340]">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#667085]">
        {text}
      </p>
    </div>
  );
}