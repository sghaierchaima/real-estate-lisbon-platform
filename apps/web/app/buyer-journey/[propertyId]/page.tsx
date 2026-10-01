"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Banknote,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    Check,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    Euro,
    FileCheck2,
    Home,
    Landmark,
    Loader2,
    MapPin,
    PiggyBank,
    Scale,
    ShieldCheck,
    Target,
    UserRoundSearch,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
    BuyerJourney,
    CreateBuyerJourneyPayload,
    FinancingType,
    PurchaseGoal,
    PurchaseTimeline,
    createBuyerJourney,
    getMyBuyerJourneys,
} from "@/lib/buyer-journeys";

/* ============================================================
   TYPES
============================================================ */

interface Property {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    region?: string | null;
    city?: string | null;
    price: number;
    propertyType?: string | null;

    bedrooms?: number | null;
    bathrooms?: number | null;
    area?: number | null;

    imageUrls?: string[];
}

/* ============================================================
   CONFIG
============================================================ */

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const TOTAL_STEPS = 4;

const GOALS: {
    value: PurchaseGoal;
    title: string;
    description: string;
    icon: typeof Home;
}[] = [
        {
            value: "PRIMARY_RESIDENCE",
            title: "Primary Residence",
            description: "A home where I plan to live.",
            icon: Home,
        },
        {
            value: "SECONDARY_RESIDENCE",
            title: "Second Home",
            description: "A holiday or secondary residence.",
            icon: Building2,
        },
        {
            value: "INVESTMENT",
            title: "Investment",
            description: "A property for rental income or capital growth.",
            icon: BriefcaseBusiness,
        },
        {
            value: "RELOCATION",
            title: "Relocation",
            description: "I am moving to Portugal.",
            icon: MapPin,
        },
        {
            value: "OTHER",
            title: "Other",
            description: "Another property purchase objective.",
            icon: Target,
        },
    ];

const FINANCING: {
    value: FinancingType;
    title: string;
    description: string;
    icon: typeof Landmark;
}[] = [
        {
            value: "MORTGAGE",
            title: "Mortgage",
            description: "I expect to finance the purchase with a mortgage.",
            icon: Landmark,
        },
        {
            value: "CASH",
            title: "Cash",
            description: "I plan to purchase without mortgage financing.",
            icon: Banknote,
        },
        {
            value: "MIXED",
            title: "Mixed",
            description: "A combination of cash and financing.",
            icon: CircleDollarSign,
        },
        {
            value: "UNDECIDED",
            title: "Not sure yet",
            description: "I would like guidance before deciding.",
            icon: PiggyBank,
        },
    ];

const TIMELINES: {
    value: PurchaseTimeline;
    title: string;
    description: string;
}[] = [
        {
            value: "ASAP",
            title: "As soon as possible",
            description: "I am ready to move quickly.",
        },
        {
            value: "ONE_TO_THREE_MONTHS",
            title: "1–3 months",
            description: "I plan to purchase within the next three months.",
        },
        {
            value: "THREE_TO_SIX_MONTHS",
            title: "3–6 months",
            description: "I am actively preparing my purchase.",
        },
        {
            value: "SIX_TO_TWELVE_MONTHS",
            title: "6–12 months",
            description: "I am planning ahead.",
        },
        {
            value: "MORE_THAN_ONE_YEAR",
            title: "More than 1 year",
            description: "My purchase is a longer-term project.",
        },
        {
            value: "UNDECIDED",
            title: "Not decided",
            description: "I do not have a fixed timeline yet.",
        },
    ];

const SUPPORT = [
    {
        key: "needsMortgageBroker",
        title: "Mortgage Broker",
        description:
            "Help comparing financing options and preparing a mortgage.",
        icon: Landmark,
    },
    {
        key: "needsPropertyLawyer",
        title: "Property Lawyer",
        description:
            "Legal support for due diligence, contracts and the purchase process.",
        icon: Scale,
    },
    {
        key: "needsTaxAdvisor",
        title: "Tax Advisor",
        description:
            "Guidance on taxes and financial implications of buying in Portugal.",
        icon: FileCheck2,
    },
    {
        key: "needsInsuranceBroker",
        title: "Insurance Broker",
        description:
            "Help identifying appropriate insurance for your property.",
        icon: ShieldCheck,
    },
] as const;

/* ============================================================
   HELPERS
============================================================ */

function money(value?: number | null) {
    if (value == null) return "—";

    return new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(value);
}

function getToken() {
    if (typeof window === "undefined") return null;

    return localStorage.getItem("accessToken");
}

function normalizeProperty(data: any): Property {
    // Allows both:
    // { ...property }
    // and:
    // { data: { ...property } }

    return data?.data || data;
}

/* ============================================================
   PAGE
============================================================ */

export default function BuyerJourneyPropertyPage() {
    const params = useParams();
    const router = useRouter();

    const propertyId = params.propertyId as string;

    const [step, setStep] = useState(1);

    const [property, setProperty] = useState<Property | null>(null);

    const [existingJourney, setExistingJourney] =
        useState<BuyerJourney | null>(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");

    const [successJourney, setSuccessJourney] =
        useState<BuyerJourney | null>(null);

    /* ============================================================
       FORM
    ============================================================ */

    const [form, setForm] =
        useState<CreateBuyerJourneyPayload>({
            propertyId,

            goal: undefined,

            estimatedBudget: undefined,
            availableDeposit: undefined,

            financingType: "UNDECIDED",
            timeline: "UNDECIDED",

            needsMortgageBroker: false,
            needsPropertyLawyer: false,
            needsTaxAdvisor: false,
            needsInsuranceBroker: false,

            notes: "",
        });

    /* ============================================================
       PROGRESS
    ============================================================ */

    const progress = useMemo(() => {
        return Math.round((step / TOTAL_STEPS) * 100);
    }, [step]);

    /* ============================================================
       INITIAL LOAD
    ============================================================ */

    useEffect(() => {
        if (!propertyId) return;

        async function initialize() {
            try {
                setLoading(true);
                setError("");

                /*
                 * ------------------------------------------------------
                 * AUTHENTICATION
                 * ------------------------------------------------------
                 */

                const token = getToken();

                if (!token) {
                    const redirect = encodeURIComponent(
                        `/buyer-journey/${propertyId}`
                    );

                    router.replace(`/login?redirect=${redirect}`);
                    return;
                }

                /*
                 * ------------------------------------------------------
                 * PROPERTY
                 * ------------------------------------------------------
                 */

                const propertyUrl = `${API_URL}/properties/public/${propertyId}`;

                console.log("PROPERTY ID:", propertyId);
                console.log("API URL:", API_URL);
                console.log("PROPERTY URL:", propertyUrl);

                const propertyResponse = await fetch(propertyUrl, {
                    cache: "no-store",
                });

                console.log("PROPERTY STATUS:", propertyResponse.status);

                if (!propertyResponse.ok) {
                    const errorBody = await propertyResponse
                        .text()
                        .catch(() => "");

                    console.error(
                        "PROPERTY LOAD ERROR:",
                        propertyResponse.status,
                        errorBody
                    );

                    throw new Error("Unable to load this property.");
                }

                const propertyData = await propertyResponse.json();

                console.log("PROPERTY DATA:", propertyData);

                setProperty(normalizeProperty(propertyData));

                /*
                 * ------------------------------------------------------
                 * EXISTING JOURNEY
                 * ------------------------------------------------------
                 */

                try {
                    const journeys = await getMyBuyerJourneys();

                    const found = journeys.find(
                        (journey) =>
                            journey.propertyId === propertyId
                    );

                    if (found) {
                        setExistingJourney(found);

                        setForm({
                            propertyId,

                            goal: found.goal || undefined,

                            estimatedBudget:
                                found.estimatedBudget ?? undefined,

                            availableDeposit:
                                found.availableDeposit ?? undefined,

                            financingType:
                                found.financingType || "UNDECIDED",

                            timeline:
                                found.timeline || "UNDECIDED",

                            needsMortgageBroker:
                                found.needsMortgageBroker,

                            needsPropertyLawyer:
                                found.needsPropertyLawyer,

                            needsTaxAdvisor:
                                found.needsTaxAdvisor,

                            needsInsuranceBroker:
                                found.needsInsuranceBroker,

                            notes: found.notes || "",
                        });
                    }
                } catch (journeyError) {
                    console.error(
                        "Could not check existing buyer journeys:",
                        journeyError
                    );
                }
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Something went wrong."
                );
            } finally {
                setLoading(false);
            }
        }

        initialize();
    }, [propertyId, router]);

    /* ============================================================
       NAVIGATION
    ============================================================ */

    function nextStep() {
        setError("");

        if (step === 1 && !form.goal) {
            setError(
                "Please select your main purchase goal."
            );
            return;
        }

        if (step === 2) {
            if (
                form.estimatedBudget !== undefined &&
                form.estimatedBudget <= 0
            ) {
                setError(
                    "Estimated budget must be greater than zero."
                );
                return;
            }

            if (
                form.availableDeposit !== undefined &&
                form.availableDeposit < 0
            ) {
                setError(
                    "Available deposit cannot be negative."
                );
                return;
            }

            if (
                form.estimatedBudget &&
                form.availableDeposit &&
                form.availableDeposit >
                form.estimatedBudget
            ) {
                setError(
                    "Available deposit cannot be greater than your estimated budget."
                );
                return;
            }
        }

        setStep((current) =>
            Math.min(current + 1, TOTAL_STEPS)
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    function previousStep() {
        setError("");

        setStep((current) =>
            Math.max(current - 1, 1)
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    /* ============================================================
       SUBMIT
    ============================================================ */

    async function submitJourney() {
        if (submitting) return;

        try {
            setSubmitting(true);
            setError("");

            const token = getToken();

            if (!token) {
                const redirect = encodeURIComponent(
                    `/buyer-journey/${propertyId}`
                );

                router.push(`/login?redirect=${redirect}`);
                return;
            }

            const payload: CreateBuyerJourneyPayload = {
                ...form,
                propertyId,
            };

            const created =
                await createBuyerJourney(payload);

            setSuccessJourney(created);

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to start your buyer journey."
            );
        } finally {
            setSubmitting(false);
        }
    }

    /* ============================================================
       LOADING
    ============================================================ */

    if (loading) {
        return (
            <main className="flex min-h-[70vh] items-center justify-center bg-[#F6F8FB]">
                <div className="text-center">
                    <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#1B365D]" />

                    <p className="mt-4 text-sm font-medium text-slate-500">
                        Preparing your buyer journey...
                    </p>
                </div>
            </main>
        );
    }

    /* ============================================================
       ERROR WITHOUT PROPERTY
    ============================================================ */

    if (!property) {
        return (
            <main className="min-h-screen bg-[#F6F8FB] px-6 py-20">
                <div className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <Building2 className="mx-auto h-10 w-10 text-slate-400" />

                    <h1 className="mt-5 text-2xl font-bold text-[#102A4C]">
                        Property unavailable
                    </h1>

                    <p className="mt-3 text-slate-500">
                        {error ||
                            "We could not load this property."}
                    </p>

                    <Link
                        href="/properties"
                        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to properties
                    </Link>
                </div>
            </main>
        );
    }

    /* ============================================================
       SUCCESS
    ============================================================ */

    if (successJourney) {
        return (
            <main className="min-h-screen bg-[#F6F8FB]">
                <section className="mx-auto max-w-4xl px-6 py-20">
                    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
                        <div className="bg-[#102A4C] px-8 py-12 text-center text-white md:px-14">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                                <CheckCircle2 className="h-10 w-10 text-[#E1B528]" />
                            </div>

                            <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-[#E1B528]">
                                Journey started
                            </p>

                            <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                                Your property journey is now active
                            </h1>

                            <p className="mx-auto mt-4 max-w-xl leading-7 text-white/70">
                                Your purchase preferences have been saved.
                                You can now continue your property journey
                                and access the relevant professionals and
                                tools.
                            </p>
                        </div>

                        <div className="p-8 md:p-12">
                            <div className="flex gap-5 rounded-2xl bg-[#F6F8FB] p-5">
                                {property.imageUrls?.[0] ? (
                                    <img
                                        src={property.imageUrls[0]}
                                        alt={property.title}
                                        className="h-24 w-28 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="flex h-24 w-28 items-center justify-center rounded-xl bg-[#102A4C]">
                                        <Home className="h-7 w-7 text-white" />
                                    </div>
                                )}

                                <div>
                                    <h2 className="font-bold text-[#102A4C]">
                                        {property.title}
                                    </h2>

                                    <div className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                                        <MapPin className="h-4 w-4" />

                                        {[
                                            property.city,
                                            property.region,
                                        ]
                                            .filter(Boolean)
                                            .join(", ") ||
                                            property.location}
                                    </div>

                                    <p className="mt-2 text-lg font-bold text-[#102A4C]">
                                        {money(property.price)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 p-5">
                                    <Target className="h-5 w-5 text-[#C99A16]" />

                                    <p className="mt-3 text-xs uppercase tracking-wider text-slate-400">
                                        Goal
                                    </p>

                                    <p className="mt-1 font-semibold text-[#102A4C]">
                                        {form.goal
                                            ?.replaceAll("_", " ")
                                            .toLowerCase()
                                            .replace(/\b\w/g, (c) =>
                                                c.toUpperCase()
                                            )}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 p-5">
                                    <Euro className="h-5 w-5 text-[#C99A16]" />

                                    <p className="mt-3 text-xs uppercase tracking-wider text-slate-400">
                                        Budget
                                    </p>

                                    <p className="mt-1 font-semibold text-[#102A4C]">
                                        {money(form.estimatedBudget)}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 p-5">
                                    <Clock3 className="h-5 w-5 text-[#C99A16]" />

                                    <p className="mt-3 text-xs uppercase tracking-wider text-slate-400">
                                        Progress
                                    </p>

                                    <p className="mt-1 font-semibold text-[#102A4C]">
                                        {successJourney.progress}%
                                    </p>
                                </div>
                            </div>

                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/buyer-journey"
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-6 py-3.5 font-semibold text-white transition hover:bg-[#102A4C]"
                                >
                                    View My Journeys
                                    <ArrowRight className="h-4 w-4" />
                                </Link>

                                <Link
                                    href="/find-professionals"
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3.5 font-semibold text-[#1B365D] transition hover:bg-slate-50"
                                >
                                    <UserRoundSearch className="h-5 w-5" />
                                    Find Professionals
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    /* ============================================================
       EXISTING JOURNEY
    ============================================================ */

    if (existingJourney) {
        return (
            <main className="min-h-screen bg-[#F6F8FB]">
                <section className="bg-[#102A4C] text-white">
                    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                        <Link
                            href={`/properties/${propertyId}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to property
                        </Link>

                        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_360px]">
                            <div>
                                <span className="inline-flex rounded-full bg-[#D6A918]/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#E1B528]">
                                    Active Buyer Journey
                                </span>

                                <h1 className="mt-5 text-4xl font-bold md:text-5xl">
                                    {property.title}
                                </h1>

                                <div className="mt-4 flex items-center gap-2 text-white/65">
                                    <MapPin className="h-4 w-4" />

                                    {[
                                        property.city,
                                        property.region,
                                    ]
                                        .filter(Boolean)
                                        .join(", ") ||
                                        property.location}
                                </div>
                            </div>

                            <div className="rounded-3xl bg-white/10 p-7 backdrop-blur">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-sm text-white/60">
                                            Journey progress
                                        </p>

                                        <p className="mt-1 text-4xl font-bold">
                                            {existingJourney.progress}%
                                        </p>
                                    </div>

                                    <CheckCircle2 className="h-9 w-9 text-[#E1B528]" />
                                </div>

                                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                                    <div
                                        className="h-full rounded-full bg-[#E1B528]"
                                        style={{
                                            width: `${existingJourney.progress}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C99A16]">
                                Your purchase plan
                            </p>

                            <h2 className="mt-3 text-2xl font-bold text-[#102A4C]">
                                Journey overview
                            </h2>

                            <div className="mt-8 grid gap-4 md:grid-cols-2">
                                <InfoCard
                                    title="Property"
                                    value={property.title}
                                    icon={Home}
                                />

                                <InfoCard
                                    title="Property price"
                                    value={money(property.price)}
                                    icon={Euro}
                                />

                                <InfoCard
                                    title="Estimated budget"
                                    value={money(
                                        existingJourney.estimatedBudget
                                    )}
                                    icon={CircleDollarSign}
                                />

                                <InfoCard
                                    title="Available deposit"
                                    value={money(
                                        existingJourney.availableDeposit
                                    )}
                                    icon={PiggyBank}
                                />

                                <InfoCard
                                    title="Financing"
                                    value={formatEnum(
                                        existingJourney.financingType
                                    )}
                                    icon={Landmark}
                                />

                                <InfoCard
                                    title="Timeline"
                                    value={formatEnum(
                                        existingJourney.timeline
                                    )}
                                    icon={CalendarDays}
                                />
                            </div>

                            <div className="mt-8 border-t border-slate-100 pt-8">
                                <h3 className="text-lg font-bold text-[#102A4C]">
                                    Professional support
                                </h3>

                                <div className="mt-5 grid gap-3 md:grid-cols-2">
                                    <SupportStatus
                                        active={
                                            existingJourney.needsMortgageBroker
                                        }
                                        label="Mortgage Broker"
                                    />

                                    <SupportStatus
                                        active={
                                            existingJourney.needsPropertyLawyer
                                        }
                                        label="Property Lawyer"
                                    />

                                    <SupportStatus
                                        active={
                                            existingJourney.needsTaxAdvisor
                                        }
                                        label="Tax Advisor"
                                    />

                                    <SupportStatus
                                        active={
                                            existingJourney.needsInsuranceBroker
                                        }
                                        label="Insurance Broker"
                                    />
                                </div>
                            </div>
                        </div>

                        <aside className="space-y-5">
                            <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                                <h3 className="text-lg font-bold text-[#102A4C]">
                                    Continue your journey
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Connect with verified professionals who
                                    can support your purchase.
                                </p>

                                <Link
                                    href="/find-professionals"
                                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-5 py-3 font-semibold text-white"
                                >
                                    <UserRoundSearch className="h-5 w-5" />
                                    Find Professionals
                                </Link>
                            </div>

                            <Link
                                href="/buyer-journey"
                                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 font-semibold text-[#1B365D] shadow-sm"
                            >
                                All My Journeys

                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </aside>
                    </div>
                </section>
            </main>
        );
    }

    /* ============================================================
       CREATE JOURNEY
    ============================================================ */

    return (
        <main className="min-h-screen bg-[#F6F8FB] text-[#102A4C]">
            {/* ======================================================
          HERO
      ====================================================== */}

            <section className="bg-[#102A4C] text-white">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                    <Link
                        href={`/properties/${propertyId}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to property
                    </Link>

                    <div className="mt-8 grid items-center gap-8 lg:grid-cols-[1fr_380px]">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#E1B528]">
                                Start Buyer Journey
                            </p>

                            <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
                                Turn this property into a clear purchase
                                plan.
                            </h1>

                            <p className="mt-5 max-w-2xl leading-7 text-white/65">
                                Tell us about your purchase objective,
                                financing and timeline. Your information
                                will help organise the next steps of your
                                property journey.
                            </p>
                        </div>

                        <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
                            <div className="flex gap-4">
                                {property.imageUrls?.[0] ? (
                                    <img
                                        src={property.imageUrls[0]}
                                        alt={property.title}
                                        className="h-24 w-28 rounded-2xl object-cover"
                                    />
                                ) : (
                                    <div className="flex h-24 w-28 items-center justify-center rounded-2xl bg-white/10">
                                        <Home className="h-7 w-7" />
                                    </div>
                                )}

                                <div className="min-w-0">
                                    <p className="line-clamp-2 font-bold">
                                        {property.title}
                                    </p>

                                    <p className="mt-2 text-sm text-white/60">
                                        {[
                                            property.city,
                                            property.region,
                                        ]
                                            .filter(Boolean)
                                            .join(", ") ||
                                            property.location}
                                    </p>

                                    <p className="mt-2 font-bold text-[#E1B528]">
                                        {money(property.price)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ======================================================
          PROGRESS
      ====================================================== */}

            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-5xl px-6 py-7">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold">
                            Step {step} of {TOTAL_STEPS}
                        </p>

                        <p className="text-sm font-bold text-[#C99A16]">
                            {progress}%
                        </p>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-[#D6A918] transition-all duration-500"
                            style={{
                                width: `${progress}%`,
                            }}
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-4 text-center text-xs font-medium text-slate-400">
                        <span
                            className={
                                step >= 1 ? "text-[#102A4C]" : ""
                            }
                        >
                            Goal
                        </span>

                        <span
                            className={
                                step >= 2 ? "text-[#102A4C]" : ""
                            }
                        >
                            Financing
                        </span>

                        <span
                            className={
                                step >= 3 ? "text-[#102A4C]" : ""
                            }
                        >
                            Timeline
                        </span>

                        <span
                            className={
                                step >= 4 ? "text-[#102A4C]" : ""
                            }
                        >
                            Support
                        </span>
                    </div>
                </div>
            </section>

            {/* ======================================================
          FORM CONTAINER
      ====================================================== */}

            <section className="mx-auto max-w-5xl px-6 py-12">
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
                    {/* ==================================================
              STEP 1
          ================================================== */}

                    {step === 1 && (
                        <>
                            <StepHeader
                                number="01"
                                title="What is your purchase goal?"
                                description="Choose the option that best describes what you want to achieve with this property."
                            />

                            <div className="mt-8 grid gap-4 md:grid-cols-2">
                                {GOALS.map((item) => {
                                    const Icon = item.icon;

                                    const selected =
                                        form.goal === item.value;

                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() =>
                                                setForm((current) => ({
                                                    ...current,
                                                    goal: item.value,
                                                }))
                                            }
                                            className={`relative rounded-2xl border p-6 text-left transition ${selected
                                                    ? "border-[#D6A918] bg-[#FFF9E8] shadow-sm"
                                                    : "border-slate-200 hover:border-[#1B365D]/30 hover:bg-slate-50"
                                                }`}
                                        >
                                            {selected && (
                                                <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#D6A918] text-white">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                            )}

                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF3F8]">
                                                <Icon className="h-5 w-5 text-[#1B365D]" />
                                            </div>

                                            <h3 className="mt-5 font-bold">
                                                {item.title}
                                            </h3>

                                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                                {item.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ==================================================
              STEP 2
          ================================================== */}

                    {step === 2 && (
                        <>
                            <StepHeader
                                number="02"
                                title="How are you planning to finance the purchase?"
                                description="This helps structure the financial side of your buyer journey."
                            />

                            <div className="mt-8 grid gap-5 md:grid-cols-2">
                                <NumberField
                                    label="Estimated purchase budget"
                                    value={form.estimatedBudget}
                                    placeholder="e.g. 750000"
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            estimatedBudget: value,
                                        }))
                                    }
                                />

                                <NumberField
                                    label="Available deposit"
                                    value={form.availableDeposit}
                                    placeholder="e.g. 150000"
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            availableDeposit: value,
                                        }))
                                    }
                                />
                            </div>

                            <h3 className="mt-9 font-bold">
                                Financing method
                            </h3>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                {FINANCING.map((item) => {
                                    const Icon = item.icon;

                                    const selected =
                                        form.financingType === item.value;

                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() =>
                                                setForm((current) => ({
                                                    ...current,
                                                    financingType:
                                                        item.value,
                                                }))
                                            }
                                            className={`flex gap-4 rounded-2xl border p-5 text-left transition ${selected
                                                    ? "border-[#D6A918] bg-[#FFF9E8]"
                                                    : "border-slate-200 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF3F8]">
                                                <Icon className="h-5 w-5" />
                                            </div>

                                            <div>
                                                <h4 className="font-bold">
                                                    {item.title}
                                                </h4>

                                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ==================================================
              STEP 3
          ================================================== */}

                    {step === 3 && (
                        <>
                            <StepHeader
                                number="03"
                                title="When would you like to buy?"
                                description="Your expected timeline helps determine the appropriate next steps."
                            />

                            <div className="mt-8 grid gap-4 md:grid-cols-2">
                                {TIMELINES.map((item) => {
                                    const selected =
                                        form.timeline === item.value;

                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() =>
                                                setForm((current) => ({
                                                    ...current,
                                                    timeline: item.value,
                                                }))
                                            }
                                            className={`flex items-start gap-4 rounded-2xl border p-5 text-left transition ${selected
                                                    ? "border-[#D6A918] bg-[#FFF9E8]"
                                                    : "border-slate-200 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div
                                                className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected
                                                        ? "border-[#D6A918] bg-[#D6A918]"
                                                        : "border-slate-300"
                                                    }`}
                                            >
                                                {selected && (
                                                    <Check className="h-3.5 w-3.5 text-white" />
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="font-bold">
                                                    {item.title}
                                                </h3>

                                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ==================================================
              STEP 4
          ================================================== */}

                    {step === 4 && (
                        <>
                            <StepHeader
                                number="04"
                                title="What professional support do you need?"
                                description="Select any services that could help you complete your purchase."
                            />

                            <div className="mt-8 grid gap-4 md:grid-cols-2">
                                {SUPPORT.map((item) => {
                                    const Icon = item.icon;

                                    const selected = Boolean(
                                        form[item.key]
                                    );

                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() =>
                                                setForm((current) => ({
                                                    ...current,
                                                    [item.key]:
                                                        !current[item.key],
                                                }))
                                            }
                                            className={`relative rounded-2xl border p-6 text-left transition ${selected
                                                    ? "border-[#D6A918] bg-[#FFF9E8]"
                                                    : "border-slate-200 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF3F8]">
                                                    <Icon className="h-5 w-5" />
                                                </div>

                                                <div
                                                    className={`flex h-6 w-6 items-center justify-center rounded-md border ${selected
                                                            ? "border-[#D6A918] bg-[#D6A918]"
                                                            : "border-slate-300"
                                                        }`}
                                                >
                                                    {selected && (
                                                        <Check className="h-4 w-4 text-white" />
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="mt-5 font-bold">
                                                {item.title}
                                            </h3>

                                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                                {item.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-8">
                                <label className="mb-2 block text-sm font-bold">
                                    Additional notes{" "}
                                    <span className="font-normal text-slate-400">
                                        (optional)
                                    </span>
                                </label>

                                <textarea
                                    value={form.notes || ""}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            notes: event.target.value,
                                        }))
                                    }
                                    rows={5}
                                    maxLength={1000}
                                    placeholder="Tell us anything else that may be useful for your property purchase..."
                                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-4 outline-none transition placeholder:text-slate-400 focus:border-[#1B365D]"
                                />

                                <p className="mt-2 text-right text-xs text-slate-400">
                                    {(form.notes || "").length}/1000
                                </p>
                            </div>
                        </>
                    )}

                    {/* ==================================================
              ERROR
          ================================================== */}

                    {error && (
                        <div className="mt-7 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                            {error}
                        </div>
                    )}

                    {/* ==================================================
              ACTIONS
          ================================================== */}

                    <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-7">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={previousStep}
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-semibold text-[#1B365D] transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Previous
                            </button>
                        ) : (
                            <Link
                                href={`/properties/${propertyId}`}
                                className="inline-flex items-center gap-2 px-2 py-3 font-semibold text-slate-500"
                            >
                                Cancel
                            </Link>
                        )}

                        {step < TOTAL_STEPS ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white transition hover:bg-[#102A4C]"
                            >
                                Continue
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={submitJourney}
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-7 py-3 font-semibold text-white transition hover:bg-[#102A4C] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Starting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" />
                                        Start My Journey
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="h-4 w-4" />
                    Your purchase information is linked securely to
                    your account.
                </div>
            </section>
        </main>
    );
}

/* ============================================================
   COMPONENTS
============================================================ */

function StepHeader({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description: string;
}) {
    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C99A16]">
                Step {number}
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#102A4C] md:text-3xl">
                {title}
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-slate-500">
                {description}
            </p>
        </div>
    );
}

function NumberField({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string;
    value?: number;
    placeholder: string;
    onChange: (value: number | undefined) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-bold">
                {label}
            </label>

            <div className="relative">
                <Euro className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                    type="number"
                    min="0"
                    value={value ?? ""}
                    placeholder={placeholder}
                    onChange={(event) => {
                        const raw = event.target.value;

                        onChange(
                            raw === ""
                                ? undefined
                                : Number(raw)
                        );
                    }}
                    className="w-full rounded-xl border border-slate-200 py-3.5 pl-12 pr-4 outline-none transition placeholder:text-slate-400 focus:border-[#1B365D]"
                />
            </div>
        </div>
    );
}

function InfoCard({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: string;
    icon: typeof Home;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF3F8]">
                <Icon className="h-5 w-5 text-[#1B365D]" />
            </div>

            <p className="mt-4 text-xs uppercase tracking-wider text-slate-400">
                {title}
            </p>

            <p className="mt-1 font-bold text-[#102A4C]">
                {value}
            </p>
        </div>
    );
}

function SupportStatus({
    active,
    label,
}: {
    active: boolean;
    label: string;
}) {
    return (
        <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${active
                    ? "border-green-100 bg-green-50"
                    : "border-slate-100 bg-slate-50"
                }`}
        >
            <div
                className={`flex h-7 w-7 items-center justify-center rounded-full ${active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-200 text-slate-400"
                    }`}
            >
                {active ? (
                    <Check className="h-4 w-4" />
                ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
            </div>

            <span
                className={`text-sm font-semibold ${active
                        ? "text-green-800"
                        : "text-slate-500"
                    }`}
            >
                {label}
            </span>
        </div>
    );
}

function formatEnum(value?: string | null) {
    if (!value) return "—";

    return value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}