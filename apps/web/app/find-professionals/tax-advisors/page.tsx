"use client";

import {
    useEffect,
    useState,
} from "react";

import Link from "next/link";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";

import {
    getPublicProfessionals,
} from "@/lib/professionals-api";

import {
    createCalculatorLead,
} from "@/lib/calculator-leads-api";

import {
    useToast,
} from "@/components/ui/ToastProvider";

import {
    BadgeCheck,
    Calculator,
    CheckCircle2,
    ChevronRight,
    FileText,
    Globe2,
    HeartHandshake,
    Landmark,
    MapPinned,
    PhoneCall,
    ReceiptText,
    ShieldCheck,
    Star,
    TrendingUp,
    Users,
    WalletCards,
} from "lucide-react";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";

const API_ORIGIN = (() => {
    try {
        return new URL(API_URL).origin;
    } catch {
        return API_URL.replace(/\/api\/?$/, "");
    }
})();

function resolveAvatarUrl(
    avatarUrl?: string | null,
): string | null {
    if (!avatarUrl) {
        return null;
    }

    const value = avatarUrl.trim();

    if (!value) {
        return null;
    }

    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:") ||
        value.startsWith("blob:")
    ) {
        return value;
    }

    return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
}

type TaxAdvisor = {
    id: string;
    name: string;
    title: string;
    agency: string;
    rating: number;
    reviews: number;
    languages: string;
    speciality: string;
    clients: number;
    area: string;
    image: string | null;
};

const benefits = [
    {
        icon: Calculator,
        title: "Property tax guidance",
        text:
            "Connect with tax professionals who can help you understand the tax considerations associated with property ownership, acquisition, sale, and investment.",
    },
    {
        icon: ReceiptText,
        title: "Purchase & sale considerations",
        text:
            "Get professional guidance on the tax considerations that may arise when buying or selling property in Portugal.",
    },
    {
        icon: TrendingUp,
        title: "Investment tax support",
        text:
            "Understand relevant tax considerations when evaluating property investments and planning your real estate strategy.",
    },
    {
        icon: ShieldCheck,
        title: "Verified professionals",
        text:
            "Connect with verified tax advisors who provide professional guidance for property-related decisions in Portugal.",
    },
];

const steps = [
    "Tell us about your property situation, investment plans, or tax advisory needs.",
    "Get matched with a verified tax advisor suited to your property-related request.",
    "Compare professional profiles, experience, ratings, languages, and expertise.",
    "Connect with your selected advisor and discuss your situation in greater detail.",
];

function getInitials(name: string) {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    const initials = parts
        .map((part) =>
            part.charAt(0).toUpperCase(),
        )
        .join("");

    return initials || "TA";
}

function AdvisorImage({
    src,
    name,
}: {
    src: string | null;
    name: string;
}) {
    const [imageFailed, setImageFailed] =
        useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [src]);

    if (!src || imageFailed) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#E7EDF4_0%,#F8F9FA_55%,#EEE8D8_100%)]">
                <div className="flex flex-col items-center">

                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-[#1B365D] text-4xl font-bold text-white shadow-[0_12px_30px_rgba(15,35,64,0.20)]">
                        {getInitials(name)}
                    </div>

                    <span className="mt-4 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-[#667085] shadow-sm backdrop-blur">
                        Profile photo unavailable
                    </span>

                </div>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={name}
            className="h-full w-full object-cover object-center"
            onError={() => {
                setImageFailed(true);
            }}
        />
    );
}

export default function TaxAdvisorsPage() {
    const toast = useToast();

    const [advisors, setAdvisors] =
        useState<TaxAdvisor[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [leadName, setLeadName] =
        useState("");

    const [leadEmail, setLeadEmail] =
        useState("");

    const [leadPhone, setLeadPhone] =
        useState("");

    const [leadSaved, setLeadSaved] =
        useState(false);

    const [savingLead, setSavingLead] =
        useState(false);

    useEffect(() => {
        const loadAdvisors = async () => {
            setLoading(true);

            try {
                const data =
                    await getPublicProfessionals(
                        "TAX_ADVISOR",
                    );

                const formatted: TaxAdvisor[] =
                    data.map((item) => ({
                        id: item.id,

                        name:
                            item.user?.fullName?.trim() ||
                            "Tax Advisory Professional",

                        title:
                            "PROPERTY TAX ADVISOR",

                        agency:
                            item.companyName?.trim() ||
                            "Independent Tax Advisor",

                        rating:
                            Number(
                                item.rating || 0,
                            ),

                        reviews:
                            Number(
                                item.reviewsCount || 0,
                            ),

                        languages:
                            item.languages?.length
                                ? item.languages.join(", ")
                                : "Languages not specified",

                        speciality:
                            item.bio?.trim() ||
                            "Professional tax advisory support for property buyers, owners, sellers, and investors in Portugal.",

                        clients:
                            Number(
                                item.clientsCount || 0,
                            ),

                        area:
                            "Portugal",

                        image:
                            resolveAvatarUrl(
                                item.user?.avatarUrl,
                            ),
                    }));

                setAdvisors(formatted);
            } catch (error) {
                toast.error(
                    "Unable to load tax advisors",
                    error instanceof Error
                        ? error.message
                        : "Failed to load tax advisors",
                );

                setAdvisors([]);
            } finally {
                setLoading(false);
            }
        };

        loadAdvisors();
    }, [toast]);

    async function handleRequestAdvisorMatch() {
        if (!leadEmail.trim()) {
            toast.warning(
                "Email required",
                "Please enter your email address.",
            );

            return;
        }

        setSavingLead(true);

        try {
            await createCalculatorLead({
                fullName:
                    leadName.trim() ||
                    undefined,

                email:
                    leadEmail
                        .trim()
                        .toLowerCase(),

                phone:
                    leadPhone.trim() ||
                    undefined,

                source:
                    "Tax Advisor Match Request",

                interest:
                    "Property Tax Advisory",

                location:
                    "Portugal",

                budget:
                    "Not specified yet",
            });

            setLeadSaved(true);

            toast.success(
                "Request submitted",
                "We will match you with a qualified tax advisor shortly.",
            );
        } catch (error) {
            toast.error(
                "Request failed",
                error instanceof Error
                    ? error.message
                    : "Failed to create request",
            );
        } finally {
            setSavingLead(false);
        }
    }

    return (
        <>
            <Navbar />

            <main className="bg-[#F8F9FA] text-[#0F2340]">

                {/* ================================================= */}
                {/* HERO */}
                {/* ================================================= */}

                <section className="relative overflow-hidden border-b border-[#E6EAF0] bg-[linear-gradient(135deg,#F8F9FA_0%,#EEF3F8_42%,#F9F6EE_100%)]">

                    <div className="absolute inset-0 opacity-40">
                        <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(201,162,39,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(27,54,93,0.08),transparent_30%)]" />
                    </div>

                    <div className="relative mx-auto flex max-w-[1440px] flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-24">

                        {/* HERO LEFT */}

                        <div className="max-w-[720px]">

                            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E0EA] bg-white/80 px-4 py-2 text-sm font-medium text-[#1B365D] backdrop-blur">

                                <BadgeCheck className="h-4 w-4 text-[#C9A227]" />

                                Verified Tax Advisors

                            </div>

                            <h1 className="mt-6 max-w-[760px] text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#0F2340] md:text-5xl lg:text-6xl">

                                Find the right tax advisor for your property decisions

                            </h1>

                            <p className="mt-6 max-w-[650px] text-lg leading-8 text-[#667085]">

                                Connect with verified tax advisors who can help you
                                understand property-related tax considerations when
                                buying, selling, owning, or investing in real estate
                                in Portugal.

                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-4">

                                <Link
                                    href="#advisor-match"
                                    className="inline-flex h-14 items-center rounded-2xl bg-[#1B365D] px-7 text-base font-semibold text-white shadow-[0_12px_30px_rgba(27,54,93,0.20)] transition hover:bg-[#10284D]"
                                >
                                    Get matched now
                                </Link>

                                <Link
                                    href="/properties"
                                    className="inline-flex h-14 items-center rounded-2xl border border-[#D5DDE8] bg-white px-7 text-base font-semibold text-[#1B365D] transition hover:bg-[#F5F8FB]"
                                >
                                    Explore properties
                                </Link>

                            </div>

                            <div className="mt-10 flex flex-wrap gap-6 text-sm text-[#475467]">

                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-[#C9A227]" />
                                    Verified tax professionals
                                </div>

                                <div className="flex items-center gap-2">
                                    <Calculator className="h-4 w-4 text-[#C9A227]" />
                                    Property tax expertise
                                </div>

                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-[#C9A227]" />
                                    Independent tax guidance
                                </div>

                            </div>
                        </div>

                        {/* HERO RIGHT */}

                        <div className="w-full max-w-[480px] rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,35,64,0.10)] backdrop-blur">

                            <div className="rounded-[28px] bg-[linear-gradient(180deg,#1B365D_0%,#10284D_100%)] p-6 text-white">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-sm text-white/70">
                                            Property taxation
                                        </p>

                                        <h2 className="mt-2 text-4xl font-semibold">
                                            Portugal
                                        </h2>

                                    </div>

                                    <div className="rounded-2xl bg-white/10 p-3">

                                        <Landmark className="h-7 w-7 text-[#F4D77B]" />

                                    </div>
                                </div>

                                <div className="mt-8 grid grid-cols-2 gap-4">

                                    <div className="rounded-2xl bg-white/10 p-4">

                                        <p className="text-xs text-white/70">
                                            Advisory service
                                        </p>

                                        <p className="mt-2 text-lg font-semibold">
                                            Property Tax Guidance
                                        </p>

                                    </div>

                                    <div className="rounded-2xl bg-white/10 p-4">

                                        <p className="text-xs text-white/70">
                                            Expertise
                                        </p>

                                        <p className="mt-2 text-lg font-semibold">
                                            Buyers & Investors
                                        </p>

                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">

                                {[
                                    "Property tax guidance",
                                    "Purchase and sale tax considerations",
                                    "Investment tax support",
                                    "Tax guidance for informed decisions",
                                ].map((item) => (

                                    <div
                                        key={item}
                                        className="flex items-center gap-3 rounded-2xl border border-[#E8EDF3] bg-[#FBFCFD] px-4 py-4"
                                    >

                                        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2E7D32]" />

                                        <span className="text-sm font-medium text-[#344054]">
                                            {item}
                                        </span>

                                    </div>
                                ))}

                            </div>
                        </div>
                    </div>
                </section>

                {/* ================================================= */}
                {/* BENEFITS */}
                {/* ================================================= */}

                <section className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">

                    <div className="mb-10">

                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
                            Why work with a tax advisor
                        </p>

                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#0F2340] md:text-4xl">
                            Clearer tax guidance for your property decisions
                        </h2>

                        <p className="mt-4 max-w-[720px] text-[16px] leading-7 text-[#667085]">

                            Property decisions can involve important tax
                            considerations. A qualified advisor can help you
                            understand the relevant issues and discuss your
                            individual situation.

                        </p>

                    </div>

                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

                        {benefits.map((item) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.title}
                                    className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_8px_24px_rgba(15,35,64,0.04)] transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,35,64,0.08)]"
                                >

                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(27,54,93,0.10),rgba(201,162,39,0.16))] text-[#1B365D]">

                                        <Icon className="h-7 w-7" />

                                    </div>

                                    <h3 className="mt-6 text-xl font-semibold text-[#0F2340]">
                                        {item.title}
                                    </h3>

                                    <p className="mt-3 text-[15px] leading-7 text-[#667085]">
                                        {item.text}
                                    </p>

                                </div>
                            );
                        })}

                    </div>
                </section>

                {/* ================================================= */}
                {/* TAX ADVISORS */}
                {/* ================================================= */}

                <section className="mx-auto max-w-[1440px] px-6 py-6 lg:px-10 lg:py-10">

                    <div className="rounded-[36px] border border-[#E4E7EC] bg-white p-6 shadow-[0_10px_30px_rgba(15,35,64,0.04)] md:p-8 lg:p-10">

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

                            <div>

                                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
                                    Verified tax advisors
                                </p>

                                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#0F2340] md:text-4xl">
                                    Professionals ready to guide your property decisions
                                </h2>

                                {!loading && (
                                    <p className="mt-3 text-sm text-[#667085]">

                                        {advisors.length}{" "}

                                        {advisors.length === 1
                                            ? "professional available"
                                            : "professionals available"}

                                    </p>
                                )}

                            </div>

                            <Link
                                href="#advisor-match"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B365D]"
                            >
                                Request help

                                <ChevronRight className="h-4 w-4" />

                            </Link>
                        </div>

                        {/* LOADING */}

                        {loading ? (

                            <div className="mt-10 grid gap-6 lg:grid-cols-3">

                                {[1, 2, 3].map((item) => (

                                    <div
                                        key={item}
                                        className="overflow-hidden rounded-[30px] border border-[#E7EBF1] bg-[#FCFCFD]"
                                    >

                                        <div className="h-[260px] animate-pulse bg-[#EEF1F4]" />

                                        <div className="space-y-4 p-6">

                                            <div className="h-7 w-2/3 animate-pulse rounded bg-[#EEF1F4]" />

                                            <div className="h-5 w-1/2 animate-pulse rounded bg-[#EEF1F4]" />

                                            <div className="h-20 animate-pulse rounded-2xl bg-[#EEF1F4]" />

                                        </div>
                                    </div>
                                ))}

                            </div>

                        ) : advisors.length === 0 ? (

                            /* EMPTY STATE */

                            <div className="mt-10 rounded-[24px] border border-[#E4E7EC] bg-[#F8F9FA] p-10 text-center">

                                <Users className="mx-auto h-10 w-10 text-[#98A2B3]" />

                                <h3 className="mt-4 text-lg font-semibold text-[#0F2340]">
                                    No tax advisors available
                                </h3>

                                <p className="mt-2 text-sm text-[#667085]">
                                    No active verified tax advisors are currently available.
                                </p>

                                <Link
                                    href="#advisor-match"
                                    className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[#1B365D] px-6 text-sm font-semibold text-white transition hover:bg-[#10284D]"
                                >
                                    Request an advisor
                                </Link>

                            </div>

                        ) : (

                            /* ADVISOR CARDS */

                            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

                                {advisors.map((advisor) => (

                                    <article
                                        key={advisor.id}
                                        className="group overflow-hidden rounded-[30px] border border-[#E7EBF1] bg-[#FCFCFD] shadow-[0_10px_26px_rgba(15,35,64,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(15,35,64,0.10)]"
                                    >

                                        {/* PHOTO */}

                                        <div className="relative h-[260px] overflow-hidden">

                                            <AdvisorImage
                                                src={advisor.image}
                                                name={advisor.name}
                                            />

                                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

                                            <div className="absolute left-5 top-5 max-w-[75%] truncate rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#1B365D] shadow-sm backdrop-blur">
                                                {advisor.agency}
                                            </div>

                                            <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-[#2E7D32] shadow-sm backdrop-blur">

                                                <BadgeCheck className="h-4 w-4" />

                                                Verified

                                            </div>
                                        </div>

                                        {/* CARD CONTENT */}

                                        <div className="p-6">

                                            <div className="flex items-start justify-between gap-4">

                                                <div className="min-w-0">

                                                    <h3 className="truncate text-2xl font-semibold text-[#0F2340]">
                                                        {advisor.name}
                                                    </h3>

                                                    <p className="mt-2 text-[15px] font-medium text-[#667085]">
                                                        {advisor.title}
                                                    </p>

                                                </div>

                                                {advisor.rating > 0 &&
                                                advisor.reviews > 0 ? (

                                                    <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF7E2] px-3 py-2 text-sm font-semibold text-[#B78103]">

                                                        <Star className="h-4 w-4 fill-current" />

                                                        {advisor.rating.toFixed(1)}

                                                    </div>

                                                ) : (

                                                    <div className="shrink-0 rounded-full bg-[#F2F4F7] px-3 py-2 text-xs font-semibold text-[#667085]">
                                                        New professional
                                                    </div>

                                                )}

                                            </div>

                                            {/* STATS */}

                                            <div className="mt-6 grid grid-cols-2 gap-3">

                                                <div className="rounded-2xl border border-[#E7EBF1] bg-white p-4">

                                                    <p className="text-xs text-[#98A2B3]">
                                                        Reviews
                                                    </p>

                                                    <p className="mt-2 text-base font-semibold text-[#0F2340]">
                                                        {advisor.reviews}
                                                    </p>

                                                </div>

                                                <div className="rounded-2xl border border-[#E7EBF1] bg-white p-4">

                                                    <p className="text-xs text-[#98A2B3]">
                                                        Clients
                                                    </p>

                                                    <p className="mt-2 text-base font-semibold text-[#0F2340]">
                                                        {advisor.clients}
                                                    </p>

                                                </div>
                                            </div>

                                            {/* DETAILS */}

                                            <div className="mt-5 space-y-3 text-sm text-[#475467]">

                                                <div className="flex items-start gap-2">

                                                    <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1B365D]" />

                                                    <span>
                                                        {advisor.languages}
                                                    </span>

                                                </div>

                                                <div className="flex items-start gap-2">

                                                    <WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-[#1B365D]" />

                                                    <span>
                                                        {advisor.clients > 0
                                                            ? `${advisor.clients} clients supported`
                                                            : "Client activity not available"}
                                                    </span>

                                                </div>

                                                <div className="flex items-start gap-2">

                                                    <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-[#1B365D]" />

                                                    <span>
                                                        {advisor.area}
                                                    </span>

                                                </div>

                                                <div className="flex items-start gap-2">

                                                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#1B365D]" />

                                                    <span className="line-clamp-3 leading-6">
                                                        {advisor.speciality}
                                                    </span>

                                                </div>
                                            </div>

                                            {/* ACTIONS */}

                                            <div className="mt-6 flex gap-3">

                                                <Link
                                                    href={`/find-professionals/${advisor.id}`}
                                                    className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-[#D5DDE8] bg-white px-4 text-center text-sm font-semibold text-[#1B365D] transition hover:bg-[#F6F8FB]"
                                                >
                                                    View profile
                                                </Link>

                                                <Link
                                                    href="#advisor-match"
                                                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1B365D] px-4 text-center text-sm font-semibold text-white transition hover:bg-[#10284D]"
                                                >

                                                    <PhoneCall className="h-4 w-4" />

                                                    Contact

                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                ))}

                            </div>
                        )}

                    </div>
                </section>

                {/* ================================================= */}
                {/* HOW IT WORKS + MATCH FORM */}
                {/* ================================================= */}

                <section className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">

                    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">

                        {/* HOW IT WORKS */}

                        <div className="rounded-[32px] bg-[linear-gradient(135deg,#10284D_0%,#1B365D_60%,#0F2340_100%)] p-8 text-white shadow-[0_18px_40px_rgba(15,35,64,0.18)] md:p-10">

                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#F1D37A]">
                                How it works
                            </p>

                            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
                                A clear path to the right tax advisor
                            </h2>

                            <p className="mt-4 max-w-[600px] text-[15px] leading-7 text-white/70">
                                Tell us what you need and connect with a professional
                                whose profile is suited to your property-related tax
                                request.
                            </p>

                            <div className="mt-8 space-y-5">

                                {steps.map((step, index) => (

                                    <div
                                        key={step}
                                        className="flex gap-4 rounded-[24px] border border-white/10 bg-white/5 p-5"
                                    >

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1D37A] text-sm font-bold text-[#10284D]">
                                            {index + 1}
                                        </div>

                                        <p className="text-[15px] leading-7 text-white/85">
                                            {step}
                                        </p>

                                    </div>
                                ))}

                            </div>
                        </div>

                        {/* MATCH FORM */}

                        <div
                            id="advisor-match"
                            className="scroll-mt-28 rounded-[32px] border border-[#E4E7EC] bg-white p-8 shadow-[0_12px_30px_rgba(15,35,64,0.05)] md:p-10"
                        >

                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
                                Need property tax guidance?
                            </p>

                            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#0F2340]">
                                Find the right tax advisor today
                            </h2>

                            <p className="mt-4 text-[16px] leading-7 text-[#667085]">

                                Share your contact details and we’ll help connect
                                you with verified tax advisors suited to your
                                property-related advisory needs.

                            </p>

                            <div className="mt-8 space-y-4">

                                {/* NAME */}

                                <div>

                                    <label
                                        htmlFor="advisor-name"
                                        className="mb-2 block text-sm font-medium text-[#344054]"
                                    >
                                        Full name
                                    </label>

                                    <input
                                        id="advisor-name"
                                        value={leadName}
                                        onChange={(event) =>
                                            setLeadName(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Your full name"
                                        autoComplete="name"
                                        className="h-14 w-full rounded-2xl border border-[#E7EBF1] bg-[#FAFBFC] px-5 text-sm text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/5"
                                    />

                                </div>

                                {/* EMAIL */}

                                <div>

                                    <label
                                        htmlFor="advisor-email"
                                        className="mb-2 block text-sm font-medium text-[#344054]"
                                    >
                                        Email address *
                                    </label>

                                    <input
                                        id="advisor-email"
                                        value={leadEmail}
                                        onChange={(event) =>
                                            setLeadEmail(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="you@example.com"
                                        type="email"
                                        autoComplete="email"
                                        className="h-14 w-full rounded-2xl border border-[#E7EBF1] bg-[#FAFBFC] px-5 text-sm text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/5"
                                    />

                                </div>

                                {/* PHONE */}

                                <div>

                                    <label
                                        htmlFor="advisor-phone"
                                        className="mb-2 block text-sm font-medium text-[#344054]"
                                    >
                                        Phone
                                    </label>

                                    <input
                                        id="advisor-phone"
                                        value={leadPhone}
                                        onChange={(event) =>
                                            setLeadPhone(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="+351 ..."
                                        type="tel"
                                        autoComplete="tel"
                                        className="h-14 w-full rounded-2xl border border-[#E7EBF1] bg-[#FAFBFC] px-5 text-sm text-[#0F2340] outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/5"
                                    />

                                </div>

                            </div>

                            {/* SUBMIT */}

                            <button
                                type="button"
                                onClick={
                                    handleRequestAdvisorMatch
                                }
                                disabled={
                                    savingLead ||
                                    leadSaved
                                }
                                className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#1B365D] px-6 text-base font-semibold text-white transition hover:bg-[#10284D] disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                {leadSaved
                                    ? "Request submitted"
                                    : savingLead
                                        ? "Submitting request..."
                                        : "Request a tax advisor"}

                            </button>

                            {/* SUCCESS */}

                            {leadSaved && (

                                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#CFE8D2] bg-[#F0F9F1] p-4 text-sm text-[#2E7D32]">

                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                                    <span>
                                        Your request has been saved successfully.
                                        You can now be matched with a suitable tax
                                        advisor.
                                    </span>

                                </div>
                            )}

                            {/* INFORMATION */}

                            <div className="mt-6 rounded-2xl border border-[#E7EBF1] bg-[#F8F9FA] p-4">

                                <div className="flex items-start gap-3">

                                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1B365D]" />

                                    <p className="text-xs leading-6 text-[#667085]">
                                        The information provided on this platform is
                                        intended to help you connect with relevant
                                        professionals. Tax advice should be discussed
                                        directly with a qualified professional based
                                        on your individual circumstances.
                                    </p>

                                </div>
                            </div>

                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </>
    );
}