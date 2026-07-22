"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import Link from "next/link";
import { getPublicProfessional, Professional } from "@/lib/professionals-api";
import { useToast } from "@/components/ui/ToastProvider";
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
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatType(type: string) {
  return type.replaceAll("_", " ");
}

function getImageSrc(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

export default function ProfessionalDetailsPage() {
  const params = useParams();
  const id = String(params.id);
  const toast = useToast();

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfessional() {
      try {
        const data = await getPublicProfessional(id);
        setProfessional(data);
      } catch (error) {
        toast.error(
          "Professional not found",
          error instanceof Error ? error.message : "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfessional();
  }, [id, toast]);

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

  const avatar = getImageSrc(professional.user.avatarUrl);

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

            <div className="overflow-hidden rounded-[34px] border border-[#E5E7EB] bg-white shadow-[0_18px_50px_rgba(15,35,64,0.08)]">
              <div className="grid lg:grid-cols-[380px_1fr]">
                <div className="bg-[#10284D] p-8 text-white">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={professional.user.fullName || "Professional"}
                      className="h-[320px] w-full rounded-[26px] object-cover"
                    />
                  ) : (
                    <div className="flex h-[320px] w-full items-center justify-center rounded-[26px] bg-white/10 text-[80px] font-bold">
                      {(professional.user.fullName ||
                        professional.user.email ||
                        "P")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="mt-6 rounded-2xl bg-white/10 p-5">
                    <p className="text-sm text-white/70">Verification</p>
                    <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
                      <BadgeCheck className="h-5 w-5 text-[#C9A227]" />
                      {professional.verificationStatus}
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white/10 p-5">
                    <p className="text-sm text-white/70">Profile completion</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-[#C9A227]"
                        style={{
                          width: `${Math.min(
                            professional.profileCompletion || 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-sm font-semibold">
                      {professional.profileCompletion || 0}%
                    </p>
                  </div>
                </div>

                <div className="p-8 lg:p-10">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A227]">
                        {formatType(professional.professionalType)}
                      </p>

                      <h1 className="mt-3 text-[42px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F2340]">
                        {professional.user.fullName || "Unnamed Professional"}
                      </h1>

                      <p className="mt-3 flex items-center gap-2 text-[#667085]">
                        <Building2 className="h-5 w-5" />
                        {professional.companyName || "Independent Professional"}
                      </p>

                      {(professional.user.city || professional.user.country) && (
                        <p className="mt-3 flex items-center gap-2 text-[#667085]">
                          <MapPin className="h-5 w-5" />
                          {[professional.user.city, professional.user.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF7E2] px-5 py-3 text-lg font-bold text-[#B78103]">
                      <Star className="h-5 w-5 fill-current" />
                      {Number(professional.rating || 0).toFixed(1)}
                    </div>
                  </div>

                  <p className="mt-8 max-w-[760px] text-[17px] leading-8 text-[#475467]">
                    {professional.bio || "No biography provided yet."}
                  </p>

                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <StatBox label="Reviews" value={professional.reviewsCount} />
                    <StatBox label="Clients" value={professional.clientsCount} />
                    <StatBox
                      label="Profile"
                      value={`${professional.profileCompletion}%`}
                    />
                  </div>

                  <div className="mt-8">
                    <h2 className="mb-4 text-xl font-bold">Languages</h2>

                    <div className="flex flex-wrap gap-3">
                      {professional.languages.length > 0 ? (
                        professional.languages.map((lang) => (
                          <span
                            key={lang}
                            className="inline-flex items-center gap-2 rounded-full bg-[#EEF3F8] px-4 py-2 text-sm font-semibold text-[#1B365D]"
                          >
                            <Globe2 className="h-4 w-4" />
                            {lang}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#667085]">
                          No languages listed.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 rounded-3xl border border-[#E5E7EB] bg-[#F8FAFC] p-6">
                    <h2 className="text-xl font-bold">Why this professional?</h2>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <Reason
                        icon={<ShieldCheck className="h-5 w-5" />}
                        title="Verified profile"
                        text="Approved by the platform admin."
                      />
                      <Reason
                        icon={<Users className="h-5 w-5" />}
                        title="Client experience"
                        text={`${professional.clientsCount} clients handled.`}
                      />
                      <Reason
                        icon={<Star className="h-5 w-5" />}
                        title="Rated service"
                        text={`${Number(professional.rating || 0).toFixed(
                          1
                        )} average rating.`}
                      />
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col gap-4 md:flex-row">
                    <Link
                      href={`mailto:${professional.user.email}`}
                      className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#1B365D] px-7 font-semibold text-white"
                    >
                      <Mail className="h-5 w-5" />
                      Email professional
                    </Link>

                    {professional.user.phone && (
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
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 rounded-[34px] border border-[#E5E7EB] bg-white p-8 shadow-[0_18px_50px_rgba(15,35,64,0.08)]">
  <div className="mb-7 flex items-center justify-between">
    <div>
      <h2 className="text-[30px] font-bold tracking-[-0.03em] text-[#0F2340]">
        Properties from this professional
      </h2>
      <p className="mt-2 text-[#667085]">
        Published listings managed by this professional
      </p>
    </div>
  </div>

  {professional.properties && professional.properties.length > 0 ? (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {professional.properties.map((property) => {
        const image = property.imageUrls?.[0]
          ? getImageSrc(property.imageUrls[0])
          : "";

        return (
          <Link
            key={property.id}
            href={`/properties/${property.id}`}
            className="group overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,35,64,0.12)]"
          >
            <div className="h-[260px] bg-[#EEF2F6] overflow-hidden">
              {image ? (
                
                  <img
                    src={image}
                    alt={property.title}
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
                {property.propertyType || "Property"}
              </p>

              <h3 className="mt-2 line-clamp-2 text-[20px] font-bold text-[#0F2340]">
                {property.title}
              </h3>

              <p className="mt-3 text-[15px] text-[#667085]">
                {property.location || property.city || "Portugal"}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-[22px] font-bold text-[#1B365D]">
                  €{Number(property.price || 0).toLocaleString()}
                </p>

                <p className="text-sm text-[#667085]">
                  {property.bedrooms || 0} beds • {property.area || 0}m²
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  ) : (
    <div className="rounded-[24px] bg-[#F8FAFC] p-10 text-center text-[#667085]">
      No published properties from this professional yet.
    </div>
  )}
</div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] p-5">
      <p className="text-sm text-[#667085]">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

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
      <p className="font-bold text-[#0F2340]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#667085]">{text}</p>
    </div>
  );
}