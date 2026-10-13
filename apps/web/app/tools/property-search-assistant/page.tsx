"use client";

import { useState } from "react";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import FloatingChatWindow from "@/components/chat/FloatingChatWindow";

import {
  getToken,
  getStoredUser,
} from "@/lib/session";

import type { AuthUser } from "@/lib/auth-api";

import {
  createLeadFromPropertySearch,
  type MatchedProperty,
} from "@/lib/leads-api";

import { extractPropertySearch } from "@/lib/ai-api";
import { contactProperty } from "@/lib/matching-api";

import { useToast } from "@/components/ui/ToastProvider";

import {
  Search,
  Sparkles,
  WandSparkles,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  CheckCircle2,
  AlertCircle,
  UserRound,
  MessageCircle,
  Phone,
} from "lucide-react";

export default function PropertySearchAssistantPage() {
  const toast = useToast();

  /*
   * ============================================================
   * CHAT
   * ============================================================
   */

  const [activeChatRoomId, setActiveChatRoomId] =
    useState<string | null>(null);

  const [
    contactingPropertyId,
    setContactingPropertyId,
  ] = useState<string | null>(null);

  /*
   * ============================================================
   * LOADING STATES
   * ============================================================
   */

  const [extracting, setExtracting] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  /*
   * ============================================================
   * SEARCH FORM
   * ============================================================
   */

  const [searchText, setSearchText] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const [propertyType, setPropertyType] =
    useState("apartment");

  const [bedrooms, setBedrooms] =
    useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");

  const [goal, setGoal] =
    useState("buy");

  /*
   * ============================================================
   * SEARCH ANALYSIS
   * ============================================================
   */

  const [mustHave, setMustHave] =
    useState<string[]>([]);

  const [aiSummary, setAiSummary] =
    useState("");

  const [confidence, setConfidence] =
    useState<number | null>(null);

  /*
   * ============================================================
   * MATCHING PROPERTIES
   * ============================================================
   */

  const [
    matchingProperties,
    setMatchingProperties,
  ] = useState<MatchedProperty[]>([]);

  /*
   * ============================================================
   * ANALYZE SEARCH
   * ============================================================
   */

  async function handleExtractWithAI() {
    if (!searchText.trim()) {
      toast.warning(
        "Search required",
        "Please describe what you are looking for."
      );

      return;
    }

    try {
      setExtracting(true);

      const extracted =
        await extractPropertySearch(
          searchText
        );

      setLocation(
        extracted.location || ""
      );

      setMinBudget(
        extracted.minBudget != null
          ? String(extracted.minBudget)
          : ""
      );

      setMaxBudget(
        extracted.maxBudget != null
          ? String(extracted.maxBudget)
          : extracted.budget || ""
      );

      setPropertyType(
        extracted.propertyType ||
        "apartment"
      );

      setBedrooms(
        extracted.bedrooms || ""
      );
      setBathrooms(extracted.bathrooms || "");

      setMinArea(
        extracted.minArea != null
          ? String(extracted.minArea)
          : ""
      );

      setMaxArea(
        extracted.maxArea != null
          ? String(extracted.maxArea)
          : ""
      );

      setGoal(
        extracted.goal || "buy"
      );

      setMustHave(
        extracted.mustHave || []
      );

      setAiSummary(
        extracted.summary || ""
      );

      setConfidence(
        extracted.confidence ?? null
      );

      toast.success(
        "Search analyzed",
        "The key search criteria were extracted successfully."
      );
    } catch (error) {
      toast.error(
        "Search analysis failed",
        error instanceof Error
          ? error.message
          : "Please try again later."
      );
    } finally {
      setExtracting(false);
    }
  }

  /*
   * ============================================================
   * FIND MATCHING PROPERTIES
   * ============================================================
   */

  async function handleCreateRequest() {
    const token = getToken();
    const user = getStoredUser<AuthUser>();

    if (!token || !user) {
      toast.warning(
        "Login required",
        "Please sign in as a Buyer to create a property search request.",
      );

      return;
    }

    if (user.role !== "BUYER") {
      toast.warning(
        "Buyer account required",
        "Only Buyer accounts can create property search requests.",
      );

      return;
    }

    if (!searchText.trim()) {
      toast.warning(
        "Search required",
        "Please describe what you are looking for.",
      );

      return;
    }


    const parsedMinArea = minArea.trim() ? Number(minArea) : undefined;
    const parsedMaxArea = maxArea.trim() ? Number(maxArea) : undefined;

    if (
      (parsedMinArea !== undefined &&
        (!Number.isFinite(parsedMinArea) || parsedMinArea <= 0)) ||
      (parsedMaxArea !== undefined &&
        (!Number.isFinite(parsedMaxArea) || parsedMaxArea <= 0)) ||
      (parsedMinArea !== undefined &&
        parsedMaxArea !== undefined &&
        parsedMinArea > parsedMaxArea)
    ) {
      toast.warning(
        "Invalid surface range",
        "Please enter a valid minimum and maximum surface."
      );
      return;
    }

    const parsedMinBudget = minBudget.trim()
      ? Number(minBudget)
      : undefined;

    const parsedMaxBudget = maxBudget.trim()
      ? Number(maxBudget)
      : undefined;

    if (
      (parsedMinBudget !== undefined &&
        (!Number.isFinite(parsedMinBudget) || parsedMinBudget < 0)) ||
      (parsedMaxBudget !== undefined &&
        (!Number.isFinite(parsedMaxBudget) || parsedMaxBudget <= 0)) ||
      (parsedMinBudget !== undefined &&
        parsedMaxBudget !== undefined &&
        parsedMinBudget > parsedMaxBudget)
    ) {
      toast.warning(
        "Invalid budget range",
        "Please enter a valid minimum and maximum budget."
      );
      return;
    }

    try {
      setSaving(true);

      setMatchingProperties([]);

      const result =
        await createLeadFromPropertySearch(
          token,
          {
            searchText:
              searchText.trim(),

            location:
              location.trim() ||
              undefined,

            budget:
              parsedMaxBudget !== undefined
                ? String(parsedMaxBudget)
                : undefined,

            minBudget: parsedMinBudget,
            maxBudget: parsedMaxBudget,

            propertyType,

            bedrooms: bedrooms.trim()
              ? Number(bedrooms)
              : undefined,

            bathrooms: bathrooms.trim()
              ? Number(bathrooms)
              : undefined,

            minArea: parsedMinArea,
            maxArea: parsedMaxArea,

            goal,
            mustHave,

            aiSummary:
              aiSummary ||
              undefined,

            confidence:
              confidence ??
              undefined,

            notificationsEnabled:
              true,
          },
        );

      /*
       * ==========================================================
       * PROPERTIES FOUND DIRECTLY
       * ==========================================================
       *
       * In this case no professional matching is required yet.
       * We already have compatible published properties.
       */

      if (result.found) {
        setMatchingProperties(
          result.properties,
        );

        toast.success(
          "Matching properties found",
          `${result.properties.length} propert${result.properties.length === 1
            ? "y matches"
            : "ies match"
          } your search criteria.`,
        );

        return;
      }

      /*
       * From this point:
       *
       * no property currently reaches the required threshold,
       * so the backend has created/reused a persistent Buyer Lead.
       */

      const lead =
        result.lead;

      /*
       * ==========================================================
       * SMART PROFESSIONAL MATCH FOUND
       * ==========================================================
       */

      if (
        lead.status === "MATCHED" ||
        lead.autoMatching?.matched
      ) {
        const bestMatch =
          lead.matches?.[0];

        const professionalName =
          bestMatch
            ?.professional
            ?.user
            ?.fullName;

        const score =
          bestMatch?.score;

        /*
         * Existing search that has just been reprocessed.
         */
        if (result.alreadyExists) {
          if (
            professionalName &&
            typeof score === "number"
          ) {
            toast.success(
              "Smart match found",
              `${professionalName} is matched to your active property search with a ${score}% compatibility score.`,
            );
          } else {
            toast.success(
              "Property search matched",
              "Your active search has been automatically matched with a compatible verified property agent.",
            );
          }

          return;
        }

        /*
         * Brand-new persistent search + automatic professional match.
         */
        if (
          professionalName &&
          typeof score === "number"
        ) {
          toast.success(
            "Smart match found",
            `${professionalName} has been automatically matched to your property search with a ${score}% compatibility score.`,
          );
        } else {
          toast.success(
            "Property agent matched",
            "A compatible verified property agent has been automatically assigned to your search.",
          );
        }

        return;
      }

      /*
       * ==========================================================
       * EXISTING SEARCH — NO PROFESSIONAL MATCH YET
       * ==========================================================
       */

      if (result.alreadyExists) {
        toast.info(
          "Search already active",
          "This property search is already saved. Smart Matching and property alerts will continue running automatically.",
        );

        return;
      }

      /*
       * ==========================================================
       * NEW SEARCH — NO PROPERTY AND NO PROFESSIONAL >= THRESHOLD
       * ==========================================================
       */

      toast.success(
        "Property search activated",
        "No property currently reaches the required match level. Your search remains active, property alerts are enabled, and Smart Matching will automatically connect you with a compatible verified property agent when one becomes available.",
      );
    } catch (error) {
      toast.error(
        "Unable to create request",
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your property search. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ============================================================
   * CONTACT AGENT - INTERNAL CHAT
   * ============================================================
   */

  async function handleContactAgent(
    propertyId: string
  ) {
    const token = getToken();

    const user =
      getStoredUser<AuthUser>();

    if (!token || !user) {
      toast.warning(
        "Login required",
        "Please sign in as a buyer."
      );

      return;
    }

    if (user.role !== "BUYER") {
      toast.warning(
        "Buyer account required",
        "Only buyers can contact property agents."
      );

      return;
    }

    try {
      setContactingPropertyId(
        propertyId
      );

      const result =
        await contactProperty(
          token,
          propertyId
        );

      toast.success(
        result.alreadyExists
          ? "Conversation already available"
          : "Agent contacted",

        result.alreadyExists
          ? "Opening your existing conversation."
          : "A conversation with the property agent has been created."
      );

      /*
       * Open Messenger-style floating chat.
       */
      setActiveChatRoomId(
        result.chatRoom.id
      );
    } catch (error) {
      toast.error(
        "Unable to contact agent",
        error instanceof Error
          ? error.message
          : "Please try again later."
      );
    } finally {
      setContactingPropertyId(null);
    }
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F8F9FA] px-6 py-16 md:px-12">
        <div className="mx-auto max-w-[1180px]">

          {/* ====================================================
              HEADER
          ==================================================== */}

          <section className="mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1B365D] shadow-sm">
              <Sparkles size={16} />

              AI Property Search
            </div>

            <h1 className="text-[42px] font-bold tracking-[-0.04em] text-[#0F2340] md:text-[48px]">
              Tell us what you’re
              looking for
            </h1>

            <p className="mt-3 max-w-[760px] text-[18px] leading-8 text-[#667085]">
              Describe your ideal property. We will analyze your request,
              search for matching listings and automatically connect you
              with compatible verified property agents when needed.
            </p>
          </section>

          {/* ====================================================
              SEARCH FORM
          ==================================================== */}

          <section className="rounded-[28px] border border-[#E4E7EC] bg-white p-8 shadow-sm">
            <label className="mb-3 block text-sm font-semibold text-[#0F2340]">
              Describe your search
            </label>

            <textarea
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
              placeholder="Example: I need a 3-bedroom apartment near the metro in Lisbon under €550k..."
              className="min-h-[150px] w-full rounded-2xl border border-[#D0D5DD] p-5 text-[#101828] outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              {/* LOCATION */}

              <input
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value
                  )
                }
                placeholder="Location, e.g. Lisbon"
                className="h-14 rounded-2xl border border-[#D0D5DD] px-5 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
              />

              {/* BUDGET */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0F2340]">
                  Minimum budget (€)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minBudget}
                  onChange={(event) => setMinBudget(event.target.value)}
                  placeholder="e.g. 200000"
                  className="h-14 w-full rounded-2xl border border-[#D0D5DD] px-5 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#0F2340]">
                  Maximum budget (€)
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxBudget}
                  onChange={(event) => setMaxBudget(event.target.value)}
                  placeholder="e.g. 750000"
                  className="h-14 w-full rounded-2xl border border-[#D0D5DD] px-5 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                />
              </div>

              {/* PROPERTY TYPE */}

              <select
                value={propertyType}
                onChange={(event) =>
                  setPropertyType(
                    event.target.value
                  )
                }
                className="h-14 rounded-2xl border border-[#D0D5DD] px-5 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
              >
                <option value="apartment">
                  Apartment
                </option>

                <option value="house">
                  House
                </option>

                <option value="villa">
                  Villa
                </option>

                <option value="penthouse">
                  Penthouse
                </option>
              </select>

              {/* BEDROOMS */}

              <input
                value={bedrooms}
                onChange={(event) =>
                  setBedrooms(
                    event.target.value
                  )
                }
                placeholder="Bedrooms, e.g. 3"
                inputMode="numeric"
                className="h-14 rounded-2xl border border-[#D0D5DD] px-5 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
              />
              {/* BATHROOMS */}
              <input
                type="number"
                min="0"
                step="1"
                value={bathrooms}
                onChange={(event) => setBathrooms(event.target.value)}
                placeholder="Bathrooms, e.g. 3"
                className="h-14 rounded-2xl border border-[#D0D5DD] px-5 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
              />
              {/* MINIMUM SURFACE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0F2340]">
                  Minimum surface (m²)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minArea}
                  onChange={(event) => setMinArea(event.target.value)}
                  placeholder="e.g. 100"
                  className="h-14 w-full rounded-2xl border border-[#D0D5DD] px-5 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                />
              </div>

              {/* MAXIMUM SURFACE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0F2340]">
                  Maximum surface (m²)
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxArea}
                  onChange={(event) => setMaxArea(event.target.value)}
                  placeholder="e.g. 250"
                  className="h-14 w-full rounded-2xl border border-[#D0D5DD] px-5 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
                />
              </div>

              {/* GOAL */}

              <select
                value={goal}
                onChange={(event) =>
                  setGoal(
                    event.target.value
                  )
                }
                className="h-14 rounded-2xl border border-[#D0D5DD] px-5 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10 md:col-span-2"
              >
                <option value="buy">
                  Buy to live
                </option>

                <option value="invest">
                  Investment
                </option>

                <option value="relocate">
                  Relocation
                </option>

                <option value="retire">
                  Retirement
                </option>
              </select>
            </div>

            {/* ==================================================
                SEARCH ANALYSIS
            ================================================== */}

            {(confidence !== null ||
              mustHave.length > 0 ||
              aiSummary) && (
                <div className="mt-6 rounded-2xl border border-[#E4E7EC] bg-[#F8FAFC] p-5">

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles
                        size={17}
                        className="text-[#C9A227]"
                      />

                      <p className="font-semibold text-[#0F2340]">
                        Search analysis
                      </p>
                    </div>

                    {confidence !==
                      null && (
                        <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-sm font-semibold text-[#1B365D]">
                          Confidence{" "}
                          {confidence}%
                        </span>
                      )}
                  </div>

                  {mustHave.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {mustHave.map(
                        (item) => (
                          <span
                            key={item}
                            className="rounded-full bg-[#FFF8E1] px-4 py-2 text-sm font-semibold text-[#8A6400]"
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>
                  )}

                  {aiSummary && (
                    <p className="mt-4 text-sm leading-6 text-[#667085]">
                      {aiSummary}
                    </p>
                  )}
                </div>
              )}

            {/* ==================================================
                ACTION BUTTONS
            ================================================== */}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={
                  handleExtractWithAI
                }
                disabled={extracting}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#D0D5DD] bg-white px-7 font-semibold text-[#1B365D] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <WandSparkles
                  size={18}
                />

                {extracting
                  ? "Analyzing..."
                  : "Analyze Search"}
              </button>

              <button
                type="button"
                onClick={
                  handleCreateRequest
                }
                disabled={saving}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#1B365D] px-7 font-semibold text-white transition hover:bg-[#0F2340] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search size={18} />

                {saving
                  ? "Searching..."
                  : "Find Matching Properties"}
              </button>
            </div>
          </section>

          {/* ====================================================
              MATCHING PROPERTIES
          ==================================================== */}

          {matchingProperties.length >
            0 && (
              <section className="mt-14">

                {/* RESULTS HEADER */}

                <div className="mb-8">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles
                      size={20}
                      className="text-[#C9A227]"
                    />

                    <span className="text-sm font-semibold uppercase tracking-wide text-[#C9A227]">
                      Smart
                      recommendations
                    </span>
                  </div>

                  <h2 className="text-3xl font-bold text-[#0F2340]">
                    Matching Properties
                  </h2>

                  <p className="mt-2 text-[#667085]">
                    We found{" "}
                    {
                      matchingProperties.length
                    }{" "}
                    properties that match
                    your search criteria.
                  </p>
                </div>

                {/* PROPERTY GRID */}

                <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">

                  {matchingProperties.map(
                    (property) => {
                      /*
                       * ==========================================
                       * WHATSAPP
                       * ==========================================
                       */

                      const phone =
                        property
                          .professionalProfile
                          ?.user.phone?.replace(
                            /\D/g,
                            ""
                          );

                      /*
                       * Avoid direct unguarded window access
                       * during server rendering.
                       */

                      const origin =
                        typeof window !==
                          "undefined"
                          ? window.location
                            .origin
                          : process.env
                            .NEXT_PUBLIC_APP_URL ||
                          "";

                      const propertyUrl =
                        `${origin}/properties/${property.id}`;

                      const whatsappMessage = `
👋 Hello ${property.professionalProfile?.user.fullName ?? ""},

I found your property on Real Estate Lisbon.

━━━━━━━━━━━━━━━━━━

🏡 ${property.title}

📍 ${property.city ?? property.location ?? "Portugal"}

💰 €${property.price.toLocaleString()}

🔗 ${propertyUrl}

━━━━━━━━━━━━━━━━━━

📅 I'm interested in arranging a viewing.

Could you please let me know when you are available?

Thank you!
`.trim();

                      const whatsappUrl =
                        phone
                          ? `https://wa.me/${phone}?text=${encodeURIComponent(
                            whatsappMessage
                          )}`
                          : null;

                      return (
                        <article
                          key={
                            property.id
                          }
                          className="relative flex h-full flex-col overflow-hidden rounded-[26px] border border-[#E4E7EC] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >

                          {/* ======================================
                            MATCH SCORE
                        ====================================== */}

                          <div
                            className={`absolute right-4 top-4 z-10 rounded-full px-4 py-2 text-sm font-bold text-white shadow ${property.matchScore >=
                              90
                              ? "bg-emerald-600"
                              : property.matchScore >=
                                75
                                ? "bg-amber-500"
                                : "bg-slate-600"
                              }`}
                          >
                            {
                              property.matchScore
                            }
                            % Match
                          </div>

                          {/* ======================================
                            PROPERTY IMAGE
                        ====================================== */}

                          <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                            <img
                              src={
                                property
                                  .imageUrls?.[0] ||
                                "/images/placeholder-property.png"
                              }
                              alt={
                                property.title
                              }
                              className="h-full w-full object-cover transition duration-500 hover:scale-105"
                            />
                          </div>

                          <div className="flex flex-1 flex-col p-6">

                            {/* ====================================
                              PROPERTY INFORMATION
                          ==================================== */}

                            <h3 className="text-xl font-bold leading-snug text-[#101828]">
                              {
                                property.title
                              }
                            </h3>

                            <div className="mt-2 flex items-center gap-1 text-sm text-[#667085]">
                              <MapPin
                                size={15}
                              />

                              <span>
                                {[
                                  property.city,
                                  property.region,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    ", "
                                  ) ||
                                  property.location ||
                                  "Portugal"}
                              </span>
                            </div>

                            <p className="mt-4 text-2xl font-bold text-[#1B365D]">
                              €
                              {property.price.toLocaleString()}
                            </p>

                            {/* PROPERTY SPECS */}

                            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#F8FAFC] p-3 text-center text-sm text-[#475467]">

                              <div className="flex items-center justify-center gap-1">
                                <BedDouble
                                  size={16}
                                />

                                {property.bedrooms ??
                                  "—"}
                              </div>

                              <div className="flex items-center justify-center gap-1">
                                <Bath
                                  size={16}
                                />

                                {property.bathrooms ??
                                  "—"}
                              </div>

                              <div className="flex items-center justify-center gap-1">
                                <Maximize
                                  size={16}
                                />

                                {property.area
                                  ? `${property.area}m²`
                                  : "—"}
                              </div>
                            </div>

                            {/* ====================================
                              SMART ANALYSIS
                          ==================================== */}

                            <div className="mt-5 rounded-2xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">

                              <div className="flex items-center gap-2">
                                <Sparkles
                                  size={17}
                                  className="text-[#C9A227]"
                                />

                                <p className="font-semibold text-[#0F2340]">
                                  Smart
                                  Property
                                  Analysis
                                </p>
                              </div>

                              <p className="mt-3 text-sm leading-6 text-[#667085]">
                                {
                                  property.recommendation
                                }
                              </p>

                              {/* MATCHED CRITERIA */}

                              {property
                                .matchedCriteria
                                .length >
                                0 && (
                                  <div className="mt-4">

                                    <p className="text-sm font-semibold text-emerald-700">
                                      Matches
                                      your
                                      criteria
                                    </p>

                                    <ul className="mt-2 space-y-2">

                                      {property.matchedCriteria.map(
                                        (
                                          criterion
                                        ) => (
                                          <li
                                            key={
                                              criterion
                                            }
                                            className="flex items-start gap-2 text-sm text-[#475467]"
                                          >
                                            <CheckCircle2
                                              size={
                                                16
                                              }
                                              className="mt-[2px] shrink-0 text-emerald-600"
                                            />

                                            <span>
                                              {
                                                criterion
                                              }
                                            </span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}

                              {/* MISSING CRITERIA */}

                              {property
                                .missingCriteria
                                .length >
                                0 && (
                                  <div className="mt-4">

                                    <p className="text-sm font-semibold text-amber-700">
                                      Things
                                      to
                                      consider
                                    </p>

                                    <ul className="mt-2 space-y-2">

                                      {property.missingCriteria.map(
                                        (
                                          criterion
                                        ) => (
                                          <li
                                            key={
                                              criterion
                                            }
                                            className="flex items-start gap-2 text-sm text-[#475467]"
                                          >
                                            <AlertCircle
                                              size={
                                                16
                                              }
                                              className="mt-[2px] shrink-0 text-amber-500"
                                            />

                                            <span>
                                              {
                                                criterion
                                              }
                                            </span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                            </div>

                            {/* ====================================
                              AGENT
                          ==================================== */}

                            {property.professionalProfile && (
                              <div className="mt-auto pt-5">
                                <div className="border-t border-[#E4E7EC] pt-5">

                                  {/* AGENT INFO */}

                                  <div className="mb-4 flex items-center gap-3">

                                    {property
                                      .professionalProfile
                                      .user
                                      .avatarUrl ? (
                                      <img
                                        src={
                                          property
                                            .professionalProfile
                                            .user
                                            .avatarUrl
                                        }
                                        alt={
                                          property
                                            .professionalProfile
                                            .user
                                            .fullName ||
                                          "Property Agent"
                                        }
                                        className="h-11 w-11 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF4FF] text-[#1B365D]">
                                        <UserRound
                                          size={
                                            20
                                          }
                                        />
                                      </div>
                                    )}

                                    <div className="min-w-0">
                                      <p className="text-xs font-medium uppercase tracking-wide text-[#98A2B3]">
                                        Listed
                                        by
                                      </p>

                                      <p className="truncate font-semibold text-[#0F2340]">
                                        {property
                                          .professionalProfile
                                          .user
                                          .fullName ||
                                          "Property Agent"}
                                      </p>

                                      {property
                                        .professionalProfile
                                        .companyName && (
                                          <p className="truncate text-xs text-[#667085]">
                                            {
                                              property
                                                .professionalProfile
                                                .companyName
                                            }
                                          </p>
                                        )}
                                    </div>
                                  </div>

                                  {/* ==================================
                                    CONTACT BUTTONS
                                ================================== */}

                                  <div className="space-y-3">

                                    {/* INTERNAL CHAT */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleContactAgent(
                                          property.id
                                        )
                                      }
                                      disabled={
                                        contactingPropertyId ===
                                        property.id
                                      }
                                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-5 font-semibold text-white transition hover:bg-[#0F2340] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <MessageCircle
                                        size={
                                          18
                                        }
                                      />

                                      {contactingPropertyId ===
                                        property.id
                                        ? "Opening conversation..."
                                        : "Contact in App"}
                                    </button>

                                    {/* WHATSAPP */}

                                    {whatsappUrl && (
                                      <a
                                        href={
                                          whatsappUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-green-600 bg-white px-5 font-semibold text-green-700 transition hover:bg-green-50"
                                      >
                                        <Phone
                                          size={
                                            18
                                          }
                                        />

                                        Contact
                                        on
                                        WhatsApp
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              </section>
            )}
        </div>
      </main>

      <Footer />

      {/* ========================================================
          FLOATING MESSENGER CHAT
      ======================================================== */}

      {activeChatRoomId && (
        <FloatingChatWindow
          roomId={activeChatRoomId}
          onClose={() =>
            setActiveChatRoomId(
              null
            )
          }
        />
      )}
    </>
  );
}