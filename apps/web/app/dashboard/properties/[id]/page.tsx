"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Edit,
  Eye,
  MapPin,
  Ruler,
  Star,
} from "lucide-react";
import { getAssetUrl } from "@/lib/api";
import { getToken, getStoredUser } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { getProperty, Property } from "@/lib/properties-api";
import { useToast } from "@/components/ui/ToastProvider";


export default function ViewPropertyPage() {
  
  const router = useRouter();
  const toast = useToast();
  const params =
  useParams<{ id: string }>();

const propertyId = params.id;
  
  const user = getStoredUser<AuthUser>();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
const handledErrorIdRef =
  useRef<string | null>(null);

const toastRef = useRef(toast);

useEffect(() => {
  toastRef.current = toast;
}, [toast]);

  
useEffect(() => {
  let cancelled = false;

  async function loadProperty() {
    if (!propertyId) {
      setLoading(false);
      return;
    }

    const token = getToken();

    if (!token) {
      setLoading(false);

      toastRef.current.warning(
        "Session required",
        "Please sign in again.",
      );

      router.replace(
        `/login?redirect=${encodeURIComponent(
          `/dashboard/properties/${propertyId}`,
        )}`,
      );

      return;
    }

    try {
      setLoading(true);
      setProperty(null);

      const data = await getProperty(
        token,
        propertyId,
      );

      if (cancelled) {
        return;
      }

      setProperty(data);

      const firstImage =
        data.imageUrls?.[0];

      setSelectedImage(
        firstImage
          ? getAssetUrl(
              firstImage,
              "/images/prop1.png",
            )
          : null,
      );
    } catch (error) {
      if (cancelled) {
        return;
      }

      setProperty(null);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to load property.";

      const normalizedMessage =
        message.toLowerCase();

      const forbidden =
        normalizedMessage.includes("forbidden") ||
        normalizedMessage.includes(
          "only access your own properties",
        ) ||
        normalizedMessage.includes("403") ||
        normalizedMessage.includes(
          "cannot access",
        );

      if (forbidden) {
        router.replace("/access-denied");
        return;
      }

      if (
        handledErrorIdRef.current !==
        propertyId
      ) {
        handledErrorIdRef.current =
          propertyId;

        toastRef.current.error(
          "Property not found",
          message,
        );
      }

      router.replace(
        "/dashboard/properties",
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void loadProperty();

  return () => {
    cancelled = true;
  };
}, [propertyId, router]);
  

  if (loading) {
    return <div className="p-8 text-[#667085]">Loading property...</div>;
  }

  if (!property) {
    return null;
  }
  const isAdmin =
  user?.role === "ADMIN";

const isPropertyOwner =
  user?.role === "PROFESSIONAL" &&
  property.professionalProfile?.userId ===
    user.id;

const canManage =
  isAdmin || isPropertyOwner;

  const images = property.imageUrls || [];

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-6 xl:px-8">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-3 text-[16px] font-medium text-[#102A56]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Properties
          </Link>

          <div className="flex gap-3">
  {property.status === "PUBLISHED" && (
    <Link
      href={`/properties/${property.id}`}
      target="_blank"
      className="inline-flex h-12 items-center gap-2 rounded-[16px] border border-[#D0D5DD] bg-white px-6 font-semibold text-[#163B73]"
    >
      <Eye className="h-4 w-4" />
      View Public
    </Link>
  )}

  {canManage && (
    <Link
      href={`/dashboard/properties/${property.id}/edit`}
      className="inline-flex h-12 items-center gap-2 rounded-[16px] bg-[#163B73] px-6 font-semibold text-white"
    >
      <Edit className="h-4 w-4" />
      Edit Property
    </Link>
  )}
</div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[30px] border border-[#E1E6EC] bg-white shadow-[0_8px_28px_rgba(16,24,40,0.06)]">
              <div className="relative h-[520px] bg-[#F2F4F7]">
                {selectedImage ? (
                  <img
  src={selectedImage}
  alt={property.title}
  className="h-full w-full object-cover"
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/images/prop1.png";
  }}
/>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#98A2B3]">
                    <Building2 className="h-20 w-20" />
                  </div>
                )}

                <div className="absolute left-6 top-6 flex flex-col gap-3">
                  {property.featured && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#E8D8A8]/90 px-5 py-2 text-[15px] font-semibold text-[#B88700]">
                      <Star className="h-4 w-4" />
                      Featured
                    </span>
                  )}

                  <span
                    className={`inline-flex rounded-full px-5 py-2 text-[15px] font-semibold ${
                      property.status === "PUBLISHED"
                        ? "bg-[#DDF7E8] text-[#0A9952]"
                        : "bg-[#FFF1DD] text-[#E17A00]"
                    }`}
                  >
                    {property.status}
                  </span>
                </div>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {images.map((url, index) => {
                  const src = getAssetUrl(
  url,
  "/images/prop1.png",
);

                  return (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(src)}
                        className={`h-[130px] overflow-hidden rounded-[18px] border-2 bg-white transition ${
                          selectedImage === src
                            ? "border-[#1B365D] ring-4 ring-[#1B365D]/10"
                            : "border-[#E1E6EC] hover:border-[#98A2B3]"
                        }`}                    >
                      {src ? (
                        <img
  src={src}
  alt={`Property image ${index + 1}`}
  className="h-full w-full object-cover"
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/images/prop1.png";
  }}
/>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#98A2B3]">
                          <Building2 className="h-8 w-8" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="rounded-[30px] border border-[#E1E6EC] bg-white p-8 shadow-[0_6px_24px_rgba(16,24,40,0.05)]">
              <h2 className="text-[26px] font-semibold text-[#0B2C5F]">
                Description
              </h2>

              <p className="mt-4 whitespace-pre-line text-[17px] leading-8 text-[#475467]">
                {property.description || "No description available."}
              </p>
            </div>

            <div className="rounded-[30px] border border-[#E1E6EC] bg-white p-8 shadow-[0_6px_24px_rgba(16,24,40,0.05)]">
              <h2 className="text-[26px] font-semibold text-[#0B2C5F]">
                Amenities
              </h2>

              {property.equipments?.length ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {property.equipments.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[#EEF3F8] px-5 py-2 text-[15px] font-semibold text-[#163B73]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-[#667085]">No amenities added.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] border border-[#E1E6EC] bg-white p-8 shadow-[0_8px_28px_rgba(16,24,40,0.06)]">
              <p className="text-[15px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
                {property.propertyType || "Property"}
              </p>

              <h1 className="mt-3 text-[40px] font-semibold leading-tight tracking-[-0.03em] text-[#0B2C5F]">
                {property.title}
              </h1>

              <div className="mt-5 flex items-start gap-2 text-[17px] text-[#667085]">
  <MapPin className="mt-0.5 h-5 w-5 shrink-0" />

  <span>
    {[
      property.location,
      property.city,
      property.region,
    ]
      .filter(Boolean)
      .join(", ") ||
      "No location specified"}
  </span>
</div>

              <div className="mt-8 text-[42px] font-semibold tracking-[-0.04em] text-[#163B73]">
                €{Number(property.price || 0).toLocaleString()}
              </div>
            </div>


            {property.professionalProfile && (
  <div className="rounded-[30px] border border-[#E1E6EC] bg-white p-7 shadow-[0_8px_28px_rgba(16,24,40,0.06)]">
    <p className="text-sm font-semibold uppercase tracking-wide text-[#667085]">
      Professional
    </p>

    <div className="mt-5 flex items-center gap-4">
      {property.professionalProfile.user.avatarUrl ? (
        <img
          src={getAssetUrl(
            property.professionalProfile.user.avatarUrl,
            "/images/default-avatar.png",
          )}
          className="h-14 w-14 rounded-full object-cover"
          alt="Professional"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1B365D] text-xl font-bold text-white">
          {(
            property.professionalProfile.user.fullName ||
            property.professionalProfile.user.email
          )
            .charAt(0)
            .toUpperCase()}
        </div>
      )}

      <div>
        <p className="font-semibold text-[#0F2340]">
          {property.professionalProfile.user.fullName}
        </p>

        <p className="text-sm text-[#667085]">
          {property.professionalProfile.companyName ||
            "Independent Professional"}
        </p>
      </div>
    </div>

    <Link
      href={`/dashboard/professionals/${property.professionalProfile.id}`}
      className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#1B365D] px-5 text-white"
    >
      View Professional
    </Link>
  </div>
)}

            <div className="grid gap-4">
              <InfoCard
                icon={<BedDouble className="h-6 w-6" />}
                label="Bedrooms"
                value={
  property.bedrooms ?? "Not specified"
}
              />

              <InfoCard
                icon={<Bath className="h-6 w-6" />}
                label="Bathrooms"
                value={
  property.bathrooms ?? "Not specified"
}
              />

              <InfoCard
                icon={<Ruler className="h-6 w-6" />}
                label="Area"
                value={
  property.area
    ? `${property.area} m²`
    : "Not specified"
}
              />

{property.landArea != null && (
  <InfoCard
    icon={<Ruler className="h-6 w-6" />}
    label="Land Area"
    value={`${property.landArea} m²`}
  />
)}
              <InfoCard
                icon={<Building2 className="h-6 w-6" />}
                label="Construction Year"
                value={property.constructionYear || "Not specified"}
              />

              <InfoCard
                icon={<Eye className="h-6 w-6" />}
                label="Published Date"
                value={
                  property.createdAt
                    ? new Date(property.createdAt).toLocaleDateString()
                    : "No date"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-5 rounded-[24px] border border-[#E1E6EC] bg-white p-6 shadow-[0_6px_20px_rgba(16,24,40,0.04)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#EEF3F8] text-[#163B73]">
        {icon}
      </div>

      <div>
        <p className="text-[15px] text-[#667085]">
          {label}
        </p>

        <p className="mt-1 text-[22px] font-semibold text-[#0B2C5F]">
          {value}
        </p>
      </div>
    </div>
  );
}