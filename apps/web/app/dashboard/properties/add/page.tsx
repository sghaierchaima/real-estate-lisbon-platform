"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Home,
  Tag,
  Sparkles,
  ImageIcon,
  Save,
  Upload,
  BedDouble,
  Bath,
  Ruler,
  MapPin,
  ChevronDown,
  X,
} from "lucide-react";

import { getToken } from "@/lib/session";
import { createPropertyWithImages } from "@/lib/properties-api";
import { useToast } from "@/components/ui/ToastProvider";

type StepKey = "info" | "details" | "equipment" | "photos";
type StatusType = "draft" | "published";

const stepItems = [
  { key: "info", label: "Information", icon: Home },
  { key: "details", label: "Details", icon: Tag },
  { key: "equipment", label: "Amenities", icon: Sparkles },
  { key: "photos", label: "Photos", icon: ImageIcon },
] as const;

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

const propertyTypes = [
  "Villa",
  "Apartment",
  "Penthouse",
  "House",
  "Studio",
  "Land",
];

const regions = [
  "Lisbon",
  "Porto",
  "Algarve",
  "Coimbra",
  "Braga",
  "Faro",
  "Évora",
  "Setúbal",
];


export default function AddPropertyPage() {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [currentStep, setCurrentStep] = useState<StepKey>("info");
  const [saving, setSaving] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    region: "",
    city: "",
    address: "",
    postal_code: "",
    price: "",
    property_type: "Villa",
    bedrooms: "3",
    bathrooms: "2",
    area: "120",
    land_area: "500",
    construction_year: "2020",
    featured: false,
    status: "draft" as StatusType,
    equipments: [] as string[],
    image_urls: [] as string[],
    photos: [] as File[],
  });



  useEffect(() => {
    const token = getToken();

    if (!token) {
      toast.warning("Session required", "Please sign in again.");
      router.replace("/login");
      return;
    }

    setCheckingAccess(false);
  }, [router, toast]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  const updateField = (
    field: string,
    value: string | boolean | string[] | File[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleEquipment = (item: string) => {
    setFormData((prev) => {
      const exists = prev.equipments.includes(item);

      return {
        ...prev,
        equipments: exists
          ? prev.equipments.filter((eq) => eq !== item)
          : [...prev.equipments, item],
      };
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const nextFiles = Array.from(files).filter((file) =>
      ["image/png", "image/jpeg", "image/webp"].includes(file.type)
    );

    if (!nextFiles.length) {
      toast.warning(
        "Invalid images",
        "Please upload PNG, JPG or WebP images only."
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...nextFiles],
    }));

    const nextPreviews = nextFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...nextPreviews]);
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));

    setPhotoPreviews((prev) => {
      const previewToRemove = prev[index];
      if (previewToRemove) URL.revokeObjectURL(previewToRemove);
      return prev.filter((_, i) => i !== index);
    });
  };

  const nextStep = () => {
    if (currentStep === "info") setCurrentStep("details");
    else if (currentStep === "details") setCurrentStep("equipment");
    else if (currentStep === "equipment") setCurrentStep("photos");
  };

  const prevStep = () => {
    if (currentStep === "photos") setCurrentStep("equipment");
    else if (currentStep === "equipment") setCurrentStep("details");
    else if (currentStep === "details") setCurrentStep("info");
  };


  const parsePropertyPrice = (value: string): number => {
    const cleaned = value.trim().replace(/\s/g, "");

    if (!cleaned) {
      return 0;
    }

    // Format européen avec points comme séparateurs de milliers
    // 1.456       -> 1456
    // 450.000     -> 450000
    // 1.250.000   -> 1250000
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      return Number(cleaned.replace(/\./g, ""));
    }

    // Nombre simple
    // 1456 -> 1456
    // 450000 -> 450000
    return Number(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getToken();

    if (!token) {
      toast.warning("Session expired", "Please sign in again.");
      router.replace("/login");
      return;
    }

    if (!formData.title.trim()) {
      toast.warning("Title required", "Please enter a property title.");
      setCurrentStep("info");
      return;
    }

    if (!formData.description.trim()) {
      toast.warning(
        "Description required",
        "Please enter a property description."
      );
      setCurrentStep("info");
      return;
    }

    const parsedPrice = parsePropertyPrice(formData.price);

    if (
      !formData.price ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice <= 0
    ) {
      toast.warning(
        "Price required",
        "Please enter a valid property price."
      );
      setCurrentStep("info");
      return;
    }

    if (!formData.region || !formData.city) {
      toast.warning("Location required", "Please select region and city.");
      setCurrentStep("info");
      return;
    }

    setSaving(true);

    try {
      const finalLocation =
        formData.location ||
        [formData.city, formData.region].filter(Boolean).join(", ");

      const data = new FormData();

      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("location", finalLocation);
      data.append("region", formData.region);
      data.append("city", formData.city);
      data.append("price", String(parsedPrice));
      data.append("propertyType", formData.property_type);
      data.append(
        "status",
        formData.status === "published" ? "PUBLISHED" : "DRAFT"
      );
      data.append("featured", String(formData.featured));
      data.append("bedrooms", String(Number(formData.bedrooms || 0)));
      data.append("bathrooms", String(Number(formData.bathrooms || 0)));
      data.append("area", String(Number(formData.area || 0)));
      data.append("landArea", String(Number(formData.land_area || 0)));
      data.append(
        "constructionYear",
        String(Number(formData.construction_year || 0))
      );

      data.append("equipments", JSON.stringify(formData.equipments));

      formData.photos.forEach((file) => {
        data.append("images", file);
      });

      await createPropertyWithImages(token, data);

      toast.success("Property created", "The property was created successfully.");
      router.push("/dashboard/properties");
    } catch (error) {
      toast.error(
        "Create failed",
        error instanceof Error ? error.message : "Unable to create property."
      );
    } finally {
      setSaving(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] text-[#667085]">
        Checking access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-6 xl:px-8">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-3 text-[16px] font-medium text-[#102A56] transition hover:opacity-80"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>

          <span className="inline-flex items-center rounded-[14px] bg-[#CFA320] px-6 py-2.5 text-[15px] font-semibold text-white">
            {formData.status === "published" ? "Published" : "Draft"}
          </span>
        </div>

        <div>
          <h1 className="text-[38px] font-semibold tracking-[-0.03em] text-[#0B2C5F] md:text-[46px]">
            Add Property
          </h1>
          <p className="mt-3 text-[18px] text-[#475467]">
            Create a new property listing for the platform
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
              <div className="mb-8">
                <div className="flex items-center gap-3 text-[#163B73]">
                  <Home className="h-6 w-6" />
                  <h2 className="text-[22px] font-semibold text-[#0B2C5F]">
                    Basic Information
                  </h2>
                </div>
                <p className="mt-2 text-[18px] text-[#667085]">
                  Main details about the property
                </p>
              </div>

              <div className="grid gap-7">
                <div>
                  <label className="mb-3 block text-[16px] font-semibold text-[#0F172A]">
                    Listing Title <span className="text-[#F04438]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Modern Villa with Sea View in Lagos"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="h-[46px] w-full rounded-[16px] border border-[#D0D5DD] bg-white px-4 text-[16px] text-[#22324D] outline-none placeholder:text-[#98A2B3] focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-[16px] font-semibold text-[#0F172A]">
                    Description <span className="text-[#F04438]">*</span>
                  </label>
                  <textarea
                    placeholder="Describe the property in detail..."
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="min-h-[100px] w-full rounded-[16px] border border-[#D0D5DD] bg-white px-4 py-4 text-[16px] text-[#22324D] outline-none placeholder:text-[#98A2B3] focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                  />
                </div>

                <div className="grid gap-7 xl:grid-cols-2">
                  <div>
                    <label className="mb-3 block text-[16px] font-semibold text-[#0F172A]">
                      Price (€) <span className="text-[#F04438]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[18px] text-[#98A2B3]">
                        €
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="450000"
                        value={formData.price}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (/^[0-9.\s]*$/.test(value)) {
                            updateField("price", value);
                          }
                        }}
                        className="h-[46px] w-full rounded-[16px] border border-[#D0D5DD] bg-white pl-11 pr-4 text-[16px] text-[#22324D] outline-none placeholder:text-[#98A2B3] focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-[16px] font-semibold text-[#0F172A]">
                      Property Type <span className="text-[#F04438]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.property_type}
                        onChange={(e) =>
                          updateField("property_type", e.target.value)
                        }
                        className="h-[46px] w-full appearance-none rounded-[16px] border border-[#D0D5DD] bg-white px-4 pr-12 text-[16px] text-[#22324D] outline-none focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                      >
                        {propertyTypes.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-5 flex items-center gap-3 text-[#163B73]">
                    <MapPin className="h-6 w-6" />
                    <h3 className="text-[20px] font-semibold">Location</h3>
                  </div>

                  <div className="grid gap-7">
                    <div className="grid gap-7 xl:grid-cols-2">
                      <div>
                        <label className="mb-3 block text-[16px] font-semibold text-[#0F172A]">
                          Region <span className="text-[#F04438]">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={formData.region}
                            onChange={(e) => updateField("region", e.target.value)}
                            className="h-[46px] w-full appearance-none rounded-[16px] border border-[#D0D5DD] bg-white px-4 pr-12 text-[16px] text-[#22324D] outline-none focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                          >
                            <option value="">Select region</option>
                            {regions.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
                        </div>
                      </div>

                      <div>
                        <label className="mb-3 block text-[16px] font-semibold text-[#0F172A]">
                          City <span className="text-[#F04438]">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="ex: Lagos"
                          value={formData.city}
                          onChange={(e) => updateField("city", e.target.value)}
                          className="h-[46px] w-full rounded-[16px] border border-[#D0D5DD] bg-white px-4 text-[16px] text-[#22324D] outline-none placeholder:text-[#98A2B3] focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                        />
                      </div>
                    </div>

                    <div className="grid gap-7 xl:grid-cols-2">
                      <div>
                        <label className="mb-3 block text-[16px] font-semibold text-[#0F172A]">
                          Address
                        </label>
                        <input
                          type="text"
                          placeholder="ex: Rua das Flores, 123"
                          value={formData.address}
                          onChange={(e) => updateField("address", e.target.value)}
                          className="h-[46px] w-full rounded-[16px] border border-[#D0D5DD] bg-white px-4 text-[16px] text-[#22324D] outline-none placeholder:text-[#98A2B3] focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                        />
                      </div>

                      <div>
                        <label className="mb-3 block text-[16px] font-semibold text-[#0F172A]">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          placeholder="ex: 8600-123"
                          value={formData.postal_code}
                          onChange={(e) =>
                            updateField("postal_code", e.target.value)
                          }
                          className="h-[46px] w-full rounded-[16px] border border-[#D0D5DD] bg-white px-4 text-[16px] text-[#22324D] outline-none placeholder:text-[#98A2B3] focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === "details" && (
            <div className="rounded-[30px] border border-[#E1E6EC] bg-white p-8 shadow-[0_6px_24px_rgba(16,24,40,0.05)]">
              <div className="mb-8">
                <div className="flex items-center gap-3 text-[#163B73]">
                  <Tag className="h-6 w-6" />
                  <h2 className="text-[22px] font-semibold text-[#0B2C5F]">
                    Property Details
                  </h2>
                </div>
                <p className="mt-2 text-[18px] text-[#667085]">
                  Technical characteristics and dimensions
                </p>
              </div>

              <div className="grid gap-7">
                <div className="grid gap-7 xl:grid-cols-3">
                  <div>
                    <label className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-[#0F172A]">
                      <BedDouble className="h-5 w-5" />
                      Bedrooms <span className="text-[#F04438]">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => updateField("bedrooms", e.target.value)}
                      className="h-[46px] w-full rounded-[16px] border border-[#D0D5DD] bg-white px-4 text-[16px] text-[#22324D] outline-none focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-[#0F172A]">
                      <Bath className="h-5 w-5" />
                      Bathrooms <span className="text-[#F04438]">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => updateField("bathrooms", e.target.value)}
                      className="h-[46px] w-full rounded-[16px] border border-[#D0D5DD] bg-white px-4 text-[16px] text-[#22324D] outline-none focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-[#0F172A]">
                      <Ruler className="h-5 w-5" />
                      Area (m²) <span className="text-[#F04438]">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.area}
                      onChange={(e) => updateField("area", e.target.value)}
                      className="h-[46px] w-full rounded-[16px] border border-[#D0D5DD] bg-white px-4 text-[16px] text-[#22324D] outline-none focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                    />
                  </div>
                </div>

                <div className="grid gap-7 xl:grid-cols-2">
                  <div>
                    <label className="mb-3 block text-[16px] font-semibold text-[#0F172A]">
                      Land Area (m²)
                    </label>
                    <input
                      type="number"
                      value={formData.land_area}
                      onChange={(e) => updateField("land_area", e.target.value)}
                      className="h-[46px] w-full rounded-[16px] border border-[#D0D5DD] bg-white px-4 text-[16px] text-[#22324D] outline-none focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                    />
                    <p className="mt-3 text-[15px] text-[#667085]">
                      Optional - for villas/houses
                    </p>
                  </div>

                  <div>
                    <label className="mb-3 block text-[16px] font-semibold text-[#0F172A]">
                      Construction Year
                    </label>
                    <input
                      type="number"
                      value={formData.construction_year}
                      onChange={(e) =>
                        updateField("construction_year", e.target.value)
                      }
                      className="h-[46px] w-full rounded-[16px] border border-[#D0D5DD] bg-white px-4 text-[16px] text-[#22324D] outline-none focus:border-[#163B73] focus:ring-4 focus:ring-[#163B73]/10"
                    />
                    <p className="mt-3 text-[15px] text-[#667085]">Optional</p>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#DDE3EA] bg-[#FBFCFD] px-8 py-10">
                  <h3 className="text-[20px] font-semibold text-[#163B73]">
                    Property Summary
                  </h3>

                  <div className="mt-8 grid gap-8 text-center md:grid-cols-3">
                    <div>
                      <div className="text-[36px] font-semibold leading-none tracking-[-0.03em] text-[#163B73]">
                        {Number(formData.bedrooms || 0)}
                      </div>
                      <div className="mt-2 text-[17px] text-[#475467]">
                        Bedrooms
                      </div>
                    </div>

                    <div>
                      <div className="text-[36px] font-semibold leading-none tracking-[-0.03em] text-[#163B73]">
                        {Number(formData.bathrooms || 0)}
                      </div>
                      <div className="mt-2 text-[17px] text-[#475467]">
                        Bathrooms
                      </div>
                    </div>

                    <div>
                      <div className="text-[36px] font-semibold leading-none tracking-[-0.03em] text-[#163B73]">
                        {Number(formData.area || 0)}m²
                      </div>
                      <div className="mt-2 text-[17px] text-[#475467]">
                        Area
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === "equipment" && (
            <div className="rounded-[30px] border border-[#E1E6EC] bg-white p-8 shadow-[0_6px_24px_rgba(16,24,40,0.05)]">
              <div className="mb-8">
                <div className="flex items-center gap-3 text-[#163B73]">
                  <Sparkles className="h-6 w-6" />
                  <h2 className="text-[22px] font-semibold text-[#0B2C5F]">
                    Amenities & Features
                  </h2>
                </div>
                <p className="mt-2 text-[18px] text-[#667085]">
                  Select all available amenities
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {equipmentOptions.map((item) => {
                  const checked = formData.equipments.includes(item);

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleEquipment(item)}
                      className={`flex h-[58px] items-center gap-4 rounded-[18px] border px-4 text-left text-[17px] font-medium transition ${checked
                          ? "border-[#163B73] bg-[#EEF4FF] text-[#163B73]"
                          : "border-[#D0D5DD] bg-white text-[#101828] hover:bg-[#F9FAFB]"
                        }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full border ${checked
                            ? "border-[#163B73] bg-[#163B73]"
                            : "border-[#C5CBD3] bg-white"
                          }`}
                      >
                        {checked ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-white" />
                        ) : null}
                      </span>
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === "photos" && (
            <div className="rounded-[30px] border border-[#E1E6EC] bg-white p-8 shadow-[0_6px_24px_rgba(16,24,40,0.05)]">
              <div className="mb-8">
                <div className="flex items-center gap-3 text-[#163B73]">
                  <ImageIcon className="h-6 w-6" />
                  <h2 className="text-[22px] font-semibold text-[#0B2C5F]">
                    Property Photos
                  </h2>
                </div>
                <p className="mt-2 text-[18px] text-[#667085]">
                  Add high-quality photos (minimum 5 recommended)
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[235px] w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#163B73] bg-[#FCFDFE] px-6 text-center transition hover:bg-[#F8FBFF]"
              >
                <Upload className="h-14 w-14 text-[#98A2B3]" />
                <p className="mt-5 text-[20px] font-medium text-[#163B73]">
                  Click to upload images
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

              {formData.photos.length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-5 text-[20px] font-semibold text-[#163B73]">
                    Uploaded Images ({formData.photos.length})
                  </h3>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {photoPreviews.map((preview, index) => (
                      <div
                        key={`${preview}-${index}`}
                        className="relative overflow-hidden rounded-[22px]"
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="h-[200px] w-full rounded-[22px] object-cover"
                        />

                        {index === 0 && (
                          <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-[#D4A621] px-4 py-1.5 text-[14px] font-semibold text-white">
                            Main Photo
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FF3B30] text-white shadow-lg transition hover:scale-105"
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
                <button
                  type="button"
                  onClick={() => updateField("featured", !formData.featured)}
                  className="inline-flex items-center gap-3"
                >
                  <span
                    className={`relative h-8 w-14 rounded-full transition ${formData.featured ? "bg-[#163B73]" : "bg-[#D0D5DD]"
                      }`}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${formData.featured ? "left-7" : "left-1"
                        }`}
                    />
                  </span>
                  <span className="text-[17px] font-medium text-[#22324D]">
                    Featured Property
                  </span>
                </button>

                <div className="flex items-center gap-4">
                  <span className="text-[17px] font-medium text-[#22324D]">
                    Status:
                  </span>

                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        updateField("status", e.target.value as StatusType)
                      }
                      className="h-[46px] appearance-none rounded-[16px] border border-[#D0D5DD] bg-white pl-4 pr-12 text-[16px] font-medium text-[#22324D] outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex h-[46px] items-center justify-center rounded-[16px] border border-[#D0D5DD] bg-[#F9FAFB] px-8 text-[16px] font-medium text-[#22324D] transition hover:bg-white"
                >
                  Back
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
                    className="inline-flex h-[46px] items-center justify-center gap-3 rounded-[16px] bg-[#163B73] px-8 text-[16px] font-semibold text-white shadow-[0_10px_20px_rgba(22,59,115,0.18)] transition hover:bg-[#102F5C] disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save"}
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