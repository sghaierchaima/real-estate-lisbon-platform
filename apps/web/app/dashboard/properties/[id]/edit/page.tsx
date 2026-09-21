"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  ChevronDown,
  Home,
  ImageIcon,
  MapPin,
  Ruler,
  Save,
  Sparkles,
  Tag,
  Upload,
  X,
} from "lucide-react";

import { getToken } from "@/lib/session";
import {
  getProperty,
  PropertyStatus,
  updatePropertyWithImages,
} from "@/lib/properties-api";
import { useToast } from "@/components/ui/ToastProvider";

type StepKey = "info" | "details" | "equipment" | "photos";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const propertyTypes = ["Villa", "Apartment", "Penthouse", "House", "Studio", "Land"];
const regions = ["Lisbon", "Porto", "Algarve", "Coimbra", "Braga", "Faro", "Évora", "Setúbal"];

const equipmentOptions = [
  "Swimming Pool",
  "Garden",
  "Garage",
  "Terrace",
  "Balcony",
  "Air Conditioning",
  "Central Heating",
  "Fireplace",
  "Elevator",
  "Gym",
  "Sauna",
  "Sea View",
  "Mountain View",
  "Gated Community",
  "Security System",
  "Solar Panels",
  "Underfloor Heating",
];

const stepItems = [
  { key: "info", label: "Information", icon: Home },
  { key: "details", label: "Details", icon: Tag },
  { key: "equipment", label: "Amenities", icon: Sparkles },
  { key: "photos", label: "Photos", icon: ImageIcon },
] as const;

function getImageSrc(url: string) {
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}
function parsePropertyPrice(value: string): number {
  const raw = value.trim().replace(/\s/g, "");

  if (!raw) return 0;

  // European thousands format:
  // 1.456       -> 1456
  // 450.000     -> 450000
  // 1.250.000   -> 1250000
  if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    return Number(raw.replace(/\./g, ""));
  }

  // European decimal format:
  // 1456,50 -> 1456.50
  if (/^\d+(,\d{1,2})$/.test(raw)) {
    return Number(raw.replace(",", "."));
  }

  // Plain numeric format:
  // 1456
  // 450000
  // 1456.50
  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : 0;
}
export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const propertyId = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepKey>("info");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    region: "",
    city: "",
    price: "",
    propertyType: "Villa",
    status: "DRAFT" as PropertyStatus,
    featured: false,
    bedrooms: "0",
    bathrooms: "0",
    area: "0",
    landArea: "",
    constructionYear: "",
    equipments: [] as string[],
    imageUrls: [] as string[],
    photos: [] as File[],
    photoPreviews: [] as string[],
  });

  function updateField(field: string, value: string | boolean | string[]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleEquipment(item: string) {
    setFormData((prev) => {
      const exists = prev.equipments.includes(item);
      return {
        ...prev,
        equipments: exists
          ? prev.equipments.filter((eq) => eq !== item)
          : [...prev.equipments, item],
      };
    });
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const nextFiles = Array.from(files).filter((file) =>
      ["image/png", "image/jpeg", "image/webp"].includes(file.type)
    );

    if (!nextFiles.length) {
      toast.warning("Invalid images", "Please upload PNG, JPG or WebP images only.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...nextFiles],
      photoPreviews: [
        ...prev.photoPreviews,
        ...nextFiles.map((file) => URL.createObjectURL(file)),
      ],
    }));
  }

  function removeExistingImage(index: number) {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  }

  function removeNewImage(index: number) {
    setFormData((prev) => {
      const preview = prev.photoPreviews[index];
      if (preview) URL.revokeObjectURL(preview);

      return {
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index),
        photoPreviews: prev.photoPreviews.filter((_, i) => i !== index),
      };
    });
  }

  function nextStep() {
    if (currentStep === "info") setCurrentStep("details");
    else if (currentStep === "details") setCurrentStep("equipment");
    else if (currentStep === "equipment") setCurrentStep("photos");
  }

  function prevStep() {
    if (currentStep === "photos") setCurrentStep("equipment");
    else if (currentStep === "equipment") setCurrentStep("details");
    else if (currentStep === "details") setCurrentStep("info");
  }

  async function loadProperty() {
    const token = getToken();

    if (!token) {
      toast.warning("Session required", "Please sign in again.");
      router.push("/login");
      return;
    }

    try {
      const property = await getProperty(token, propertyId);

      setFormData({
        title: property.title || "",
        description: property.description || "",
        location: property.location || "",
        region: property.region || "",
        city: property.city || "",
        price: String(property.price || ""),
        propertyType: property.propertyType || "Villa",
        status: property.status || "DRAFT",
        featured: Boolean(property.featured),
        bedrooms: String(property.bedrooms || "0"),
        bathrooms: String(property.bathrooms || "0"),
        area: String(property.area || "0"),
        landArea: String(property.landArea || ""),
        constructionYear: String(property.constructionYear || ""),
        equipments: property.equipments || [],
        imageUrls: property.imageUrls || [],
        photos: [],
        photoPreviews: [],
      });
    } catch (error) {
      toast.error(
        "Unable to load property",
        error instanceof Error ? error.message : "Property not found."
      );
      router.push("/dashboard/properties");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      toast.warning("Session required", "Please sign in again.");
      router.push("/login");
      return;
    }

    if (!formData.title.trim()) {
      toast.warning("Title required", "Please enter a property title.");
      setCurrentStep("info");
      return;
    }

    const parsedPrice = parsePropertyPrice(formData.price);

    if (!formData.price.trim() || parsedPrice <= 0) {
      toast.warning("Price required", "Please enter a valid price.");
      setCurrentStep("info");
      return;
    }

    setSaving(true);

    try {
      const finalLocation =
        formData.location || [formData.city, formData.region].filter(Boolean).join(", ");

      const data = new FormData();

      data.append("title", formData.title.trim());
      data.append("description", formData.description.trim());
      data.append("location", finalLocation);
      data.append("region", formData.region);
      data.append("city", formData.city);
      data.append("price", String(parsedPrice));
      data.append("propertyType", formData.propertyType);
      data.append("status", formData.status);
      data.append("featured", String(formData.featured));
      data.append("bedrooms", String(Number(formData.bedrooms || 0)));
      data.append("bathrooms", String(Number(formData.bathrooms || 0)));
      data.append("area", String(Number(formData.area || 0)));
      data.append("landArea", String(Number(formData.landArea || 0)));
      data.append("constructionYear", String(Number(formData.constructionYear || 0)));
      data.append("equipments", JSON.stringify(formData.equipments));
      data.append("existingImageUrls", JSON.stringify(formData.imageUrls));

      formData.photos.forEach((file) => {
        data.append("images", file);
      });

      await updatePropertyWithImages(token, propertyId, data);

      toast.success("Property updated", "The property was updated successfully.");
      router.push("/dashboard/properties");
    } catch (error) {
      toast.error(
        "Update failed",
        error instanceof Error ? error.message : "Unable to update property."
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadProperty();

    return () => {
      formData.photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const summary = useMemo(() => {
    return {
      bedrooms: Number(formData.bedrooms || 0),
      bathrooms: Number(formData.bathrooms || 0),
      area: Number(formData.area || 0),
    };
  }, [formData.bedrooms, formData.bathrooms, formData.area]);

  if (loading) {
    return <div className="p-6 text-[#475467]">Loading property...</div>;
  }

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

          <span
            className={`inline-flex items-center rounded-[14px] px-6 py-2.5 text-[15px] font-semibold text-white ${formData.status === "PUBLISHED"
              ? "bg-emerald-600"
              : formData.status === "ARCHIVED"
                ? "bg-gray-600"
                : "bg-[#CFA320]"
              }`}
          >
            {formData.status === "PUBLISHED"
              ? "Published"
              : formData.status === "ARCHIVED"
                ? "Archived"
                : "Draft"}
          </span>
        </div>

        <div>
          <h1 className="text-[38px] font-semibold tracking-[-0.03em] text-[#0B2C5F] md:text-[46px]">
            Edit Property
          </h1>
          <p className="mt-3 text-[18px] text-[#475467]">
            Update the information for this property
          </p>
        </div>

        <div className="rounded-full bg-[#E8EDF3] p-2">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {stepItems.map((step) => {
              const Icon = step.icon;
              const active = currentStep === step.key;

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setCurrentStep(step.key)}
                  className={`inline-flex h-[46px] items-center justify-center gap-3 rounded-full px-6 text-[17px] font-medium transition ${active
                    ? "bg-white text-[#102A56] shadow-[0_2px_8px_rgba(15,35,64,0.08)]"
                    : "text-[#102A56] hover:bg-white/70"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === "info" && (
            <div className="rounded-[30px] border border-[#E1E6EC] bg-white p-8 shadow-[0_6px_24px_rgba(16,24,40,0.05)]">
              <h2 className="mb-8 flex items-center gap-3 text-[22px] font-semibold text-[#0B2C5F]">
                <Home className="h-6 w-6 text-[#163B73]" />
                Basic Information
              </h2>

              <div className="grid gap-7">
                <input
                  placeholder="Listing title"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="h-[46px] rounded-[16px] border border-[#D0D5DD] px-4 outline-none"
                />

                <textarea
                  placeholder="Describe the property..."
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="min-h-[110px] rounded-[16px] border border-[#D0D5DD] px-4 py-4 outline-none"
                />

                <div className="grid gap-7 xl:grid-cols-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Price"
                    value={formData.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    className="h-[46px] rounded-[16px] border border-[#D0D5DD] px-4 outline-none"
                  />

                  <div className="relative">
                    <select
                      value={formData.propertyType}
                      onChange={(e) => updateField("propertyType", e.target.value)}
                      className="h-[46px] w-full appearance-none rounded-[16px] border border-[#D0D5DD] px-4 outline-none"
                    >
                      {propertyTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
                  </div>
                </div>

                <div className="grid gap-7 xl:grid-cols-3">
                  <select
                    value={formData.region}
                    onChange={(e) => updateField("region", e.target.value)}
                    className="h-[46px] rounded-[16px] border border-[#D0D5DD] px-4 outline-none"
                  >
                    <option value="">Select region</option>
                    {regions.map((region) => (
                      <option key={region}>{region}</option>
                    ))}
                  </select>

                  <input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="h-[46px] rounded-[16px] border border-[#D0D5DD] px-4 outline-none"
                  />

                  <input
                    placeholder="Full location"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className="h-[46px] rounded-[16px] border border-[#D0D5DD] px-4 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === "details" && (
            <div className="rounded-[30px] border border-[#E1E6EC] bg-white p-8 shadow-[0_6px_24px_rgba(16,24,40,0.05)]">
              <h2 className="mb-8 flex items-center gap-3 text-[22px] font-semibold text-[#0B2C5F]">
                <Tag className="h-6 w-6 text-[#163B73]" />
                Property Details
              </h2>

              <div className="grid gap-7 xl:grid-cols-3">
                {[
                  ["bedrooms", "Bedrooms", BedDouble],
                  ["bathrooms", "Bathrooms", Bath],
                  ["area", "Area m²", Ruler],
                  ["landArea", "Land Area m²", MapPin],
                  ["constructionYear", "Construction Year", Home],
                ].map(([field, label, Icon]: any) => (
                  <div key={field}>
                    <label className="mb-3 flex items-center gap-2 font-semibold text-[#0F172A]">
                      <Icon className="h-5 w-5" />
                      {label}
                    </label>
                    <input
                      type="number"
                      value={(formData as any)[field]}
                      onChange={(e) => updateField(field, e.target.value)}
                      className="h-[46px] w-full rounded-[16px] border border-[#D0D5DD] px-4 outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl bg-[#F8FAFC] p-5 text-[#475467]">
                Summary: {summary.bedrooms} bedrooms • {summary.bathrooms} bathrooms •{" "}
                {summary.area}m²
              </div>
            </div>
          )}

          {currentStep === "equipment" && (
            <div className="rounded-[30px] border border-[#E1E6EC] bg-white p-8">
              <h2 className="mb-8 flex items-center gap-3 text-[22px] font-semibold text-[#0B2C5F]">
                <Sparkles className="h-6 w-6 text-[#163B73]" />
                Amenities
              </h2>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {equipmentOptions.map((item) => {
                  const active = formData.equipments.includes(item);

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleEquipment(item)}
                      className={`rounded-[18px] border px-5 py-4 text-left font-medium ${active
                        ? "border-[#163B73] bg-[#EEF3F8] text-[#163B73]"
                        : "border-[#D0D5DD] bg-white text-[#344054]"
                        }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === "photos" && (
            <div className="rounded-[30px] border border-[#E1E6EC] bg-white p-8">
              <h2 className="mb-8 flex items-center gap-3 text-[22px] font-semibold text-[#0B2C5F]">
                <ImageIcon className="h-6 w-6 text-[#163B73]" />
                Property Photos
              </h2>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[210px] w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#163B73] bg-[#FCFDFE] px-6 text-center transition hover:bg-[#F8FBFF]"
              >
                <Upload className="h-14 w-14 text-[#98A2B3]" />
                <p className="mt-5 text-[20px] font-medium text-[#163B73]">
                  Click to upload new images
                </p>
                <p className="mt-2 text-[16px] text-[#667085]">
                  PNG, JPG or WebP
                </p>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              {(formData.imageUrls.length > 0 || formData.photoPreviews.length > 0) && (
                <div className="mt-8">
                  <h3 className="mb-5 text-[20px] font-semibold text-[#163B73]">
                    Property Images ({formData.imageUrls.length + formData.photoPreviews.length})
                  </h3>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {formData.imageUrls.map((url, index) => (
                      <div key={url} className="relative overflow-hidden rounded-[22px] border">
                        <img
                          src={getImageSrc(url)}
                          alt={`Existing image ${index + 1}`}
                          className="h-[190px] w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FF3B30] text-white shadow-lg"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}

                    {formData.photoPreviews.map((preview, index) => (
                      <div key={preview} className="relative overflow-hidden rounded-[22px] border">
                        <img
                          src={preview}
                          alt={`New image ${index + 1}`}
                          className="h-[190px] w-full object-cover"
                        />

                        <span className="absolute bottom-3 left-3 rounded-full bg-[#D4A621] px-4 py-1.5 text-[13px] font-semibold text-white">
                          New
                        </span>

                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FF3B30] text-white shadow-lg"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="sticky bottom-6 rounded-[28px] border border-[#DDE3EA] bg-white px-7 py-5 shadow-[0_12px_32px_rgba(16,24,40,0.10)]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-8">
                {/* Featured Property */}
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      "featured",
                      !formData.featured
                    )
                  }
                  className="inline-flex items-center gap-3"
                >
                  <span
                    className={`relative h-8 w-14 rounded-full transition ${formData.featured
                      ? "bg-[#163B73]"
                      : "bg-[#D0D5DD]"
                      }`}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${formData.featured
                        ? "left-7"
                        : "left-1"
                        }`}
                    />
                  </span>

                  <span className="text-[17px] font-medium text-[#22324D]">
                    Featured Property
                  </span>
                </button>

                {/* Property Status */}
                <div className="flex items-center gap-4">
                  <span className="text-[17px] font-medium text-[#22324D]">
                    Status:
                  </span>

                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(event) =>
                        updateField(
                          "status",
                          event.target
                            .value as PropertyStatus
                        )
                      }
                      className="h-[46px] appearance-none rounded-[16px] border border-[#D0D5DD] bg-white pl-4 pr-12 text-[16px] font-medium text-[#22324D] outline-none focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                    >
                      <option value="DRAFT">
                        Draft
                      </option>

                      <option value="PUBLISHED">
                        Published
                      </option>

                      <option value="ARCHIVED">
                        Archived
                      </option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex flex-wrap items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === "info"}
                  className="inline-flex h-[46px] items-center justify-center rounded-[16px] border border-[#D0D5DD] bg-[#F9FAFB] px-8 text-[16px] font-medium text-[#22324D] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {currentStep !== "photos" ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex h-[46px] items-center justify-center rounded-[16px] bg-[#163B73] px-8 text-[16px] font-semibold text-white shadow-[0_10px_20px_rgba(22,59,115,0.18)] transition hover:bg-[#102F5C]"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-[46px] items-center justify-center gap-3 rounded-[16px] bg-[#163B73] px-8 text-[16px] font-semibold text-white shadow-[0_10px_20px_rgba(22,59,115,0.18)] transition hover:bg-[#102F5C] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />

                    {saving
                      ? "Saving..."
                      : "Update Property"}
                  </button>
                )}
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}