"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Bath,
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Edit,
  Eye,
  Filter,
  Grid3X3,
  Home,
  List,
  MapPin,
  MoreVertical,
  Plus,
  Ruler,
  Search,
  Star,
  Trash2,
  TrendingUp,
  Upload,
} from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";
import { getStoredUser, getToken } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { deleteProperty, getProperties, } from "@/lib/properties-api";
import { getMyProfessionalProfile } from "@/lib/settings-api";

type PropertyStatus = "draft" | "published";

type Property = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  price: number | null;
  property_type: string | null;
  status: PropertyStatus;
  featured: boolean | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  land_area: number | null;
  construction_year: number | null;
  equipments: string[] | null;
  image_urls: string[] | null;
  professional_id: string;
  created_at: string | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";


function getFirstValidImage(
  imageUrls: string[] | null | undefined
): string | null {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return null;
  }

  const image = imageUrls.find(
    (url) => typeof url === "string" && url.trim().length > 0
  );

  if (!image) return null;

  if (image.startsWith("http")) {
    return image;
  }

  return `${API_URL}${image}`;
}

function PropertyImage({
  imageUrls,
  title,
  className,
  fallbackClassName = "",
}: {
  imageUrls: string[] | null | undefined;
  title: string;
  className: string;
  fallbackClassName?: string;
}) {

  const [imgSrc, setImgSrc] = useState<string | null>(
    getFirstValidImage(imageUrls)
  );

  useEffect(() => {
    setImgSrc(getFirstValidImage(imageUrls));
  }, [imageUrls]);

  if (!imgSrc) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[#F2F4F7] text-[#98A2B3] ${fallbackClassName}`}
      >
        <Building2 className="h-12 w-12" />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={title}
      className={className}
      onError={() => setImgSrc(null)}
    />
  );
}

export default function DashboardPropertiesPage() {
 
  const router = useRouter();
  const toast = useToast();
  const user = getStoredUser<AuthUser>();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyToDelete, setPropertyToDelete] =
  useState<Property | null>(null);

const [deletingProperty, setDeletingProperty] =
  useState(false);

const [accessRestricted, setAccessRestricted] =
  useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "published" | "draft"
  >("all");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [canManage, setCanManage] = useState(false);
  const [canCreateProperty, setCanCreateProperty] = useState(false);
  const itemsPerPage = 3;
  const [authorized, setAuthorized] = useState(
    user?.role === "ADMIN"
  );
  useEffect(() => {
  let cancelled = false;

  async function loadPage() {
    const token = getToken();

    if (!token) {
      if (!cancelled) {
        setLoading(false);

        toast.warning(
          "Session required",
          "Please sign in to access properties.",
        );

        router.replace("/login");
      }

      return;
    }

    try {
      setLoading(true);
      setAccessRestricted(false);

      const data = await getProperties(token);

      if (cancelled) {
        return;
      }

      const mappedProperties: Property[] = data.map(
        (item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description ?? null,
          location: item.location ?? null,
          price: item.price ?? 0,
          property_type: item.propertyType ?? null,
          status:
            item.status === "PUBLISHED"
              ? "published"
              : "draft",
          featured: Boolean(item.featured),
          bedrooms: item.bedrooms ?? 0,
          bathrooms: item.bathrooms ?? 0,
          area: item.area ?? 0,
          land_area: item.landArea ?? 0,
          construction_year:
            item.constructionYear ?? 0,
          equipments: item.equipments ?? [],
          image_urls: item.imageUrls ?? [],
          professional_id:
            item.professionalProfileId ?? "",
          created_at: item.createdAt ?? null,
        }),
      );

      setProperties(mappedProperties);

      if (user?.role === "ADMIN") {
        setCanManage(true);
        setCanCreateProperty(false);
        setAuthorized(true);
        return;
      }

      if (user?.role === "PROFESSIONAL") {
        const profile =
          await getMyProfessionalProfile(token);

        if (cancelled) {
          return;
        }

        const isActivePropertyAgent =
          profile.professionalType ===
            "PROPERTY_AGENT" &&
          profile.verificationStatus === "ACTIVE";

        setCanManage(isActivePropertyAgent);
        setCanCreateProperty(
          isActivePropertyAgent,
        );
        setAuthorized(true);

        return;
      }

      setCanManage(false);
      setCanCreateProperty(false);
      setAuthorized(true);
    } catch (error) {
      if (cancelled) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load properties.";

      const normalizedMessage =
        message.toLowerCase();

      const isRestricted =
        normalizedMessage.includes(
          "only property agents",
        ) ||
        normalizedMessage.includes(
          "property management",
        ) ||
        normalizedMessage.includes(
          "professional profile must be active",
        );

      if (
        user?.role === "PROFESSIONAL" &&
        isRestricted
      ) {
        setAccessRestricted(true);
        setAuthorized(false);
        setCanManage(false);
        setCanCreateProperty(false);
        setProperties([]);

        return;
      }

      toast.error(
        "Unable to load properties",
        message,
      );

      setProperties([]);
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void loadPage();

  return () => {
    cancelled = true;
  };
}, [router, toast, user?.role]);

 

  const propertyTypes = useMemo(() => {
    return Array.from(
      new Set(
        properties
          .map((property) => property.property_type)
          .filter((type): type is string => Boolean(type))
      )
    );
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const q = searchQuery.trim().toLowerCase();

      const matchesSearch =
        property.title?.toLowerCase().includes(q) ||
        property.location?.toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "all" || property.status === filterStatus;

      const matchesType =
        filterType === "all" || property.property_type === filterType;

      return Boolean(matchesSearch && matchesStatus && matchesType);
    });
  }, [properties, searchQuery, filterStatus, filterType]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProperties.length / itemsPerPage)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedProperties = filteredProperties.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const stats = useMemo(() => {
    return {
      total: properties.length,
      published: properties.filter((p) => p.status === "published").length,
      drafts: properties.filter((p) => p.status === "draft").length,
      featured: properties.filter((p) => p.featured).length,
    };
  }, [properties]);

  function requestDeleteProperty(
  property: Property,
) {
  setPropertyToDelete(property);
}
  async function confirmDeleteProperty() {
  if (
    !propertyToDelete ||
    deletingProperty
  ) {
    return;
  }

  const token = getToken();

  if (!token) {
    toast.warning(
      "Session required",
      "Please sign in again.",
    );

    router.replace("/login");
    return;
  }

  setDeletingProperty(true);

  try {
    await deleteProperty(
      token,
      propertyToDelete.id,
    );

    setProperties((currentProperties) =>
      currentProperties.filter(
        (property) =>
          property.id !==
          propertyToDelete.id,
      ),
    );

    toast.success(
      "Property deleted",
      `"${propertyToDelete.title}" was deleted successfully.`,
    );

    setPropertyToDelete(null);
  } catch (error) {
    toast.error(
      "Unable to delete property",
      error instanceof Error
        ? error.message
        : "Please try again.",
    );
  } finally {
    setDeletingProperty(false);
  }
}

  const handleExport = () => {
    if (filteredProperties.length === 0) {
      toast.info("No data", "There are no properties to export.");
      return;
    }

    const rows = filteredProperties.map((property) => ({
      title: property.title,
      location: property.location ?? "",
      price: property.price ?? 0,
      type: property.property_type ?? "",
      status: property.status,
      featured: property.featured ? "Yes" : "No",
      bedrooms: property.bedrooms ?? 0,
      bathrooms: property.bathrooms ?? 0,
      area: property.area ?? 0,
      created_at: property.created_at ?? "",
    }));

    const headers = Object.keys(rows[0]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) =>
            `"${String(row[header as keyof typeof row]).replace(/"/g, '""')}"`
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "properties.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Export ready", "Properties CSV has been downloaded.");
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterType("all");
    setCurrentPage(1);
  };

  const formatPrice = (price: number | null) => {
    return `€${Number(price || 0).toLocaleString()}`;
  };

  if (loading) {
   
    return (
      <div className="min-h-[60vh] rounded-[28px] border border-[#E4E7EC] bg-white p-8 text-[#667085] shadow-[0_6px_24px_rgba(16,24,40,0.05)]">
        Loading properties...
      </div>
    );
  }
if (
  accessRestricted ||
  (!authorized &&
    user?.role !== "ADMIN")
) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-[#E4E7EC] bg-white p-12 text-center shadow-sm">
      <div className="max-w-xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#EEF3F8] text-[#98A2B3]">
          <Building2 className="h-10 w-10" />
        </div>

        <h2 className="mt-6 text-[32px] font-semibold text-[#0F2340]">
          Property Management Restricted
        </h2>

        <p className="mt-3 text-[17px] leading-7 text-[#667085]">
          Only verified Property Agents can
          manage real estate listings.
        </p>

        <Link
          href="/dashboard"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-[#1B365D] px-6 font-semibold text-white transition hover:bg-[#142B4A]"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
  return (
  <>
    <div className="properties-container space-y-8 p-6 xl:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-[#0B2C5F] md:text-[42px]">
            Properties Management
          </h1>

          <p className="mt-3 text-[18px] text-[#475467]">
            Manage all real estate listings on the platform
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex h-12 items-center gap-2 rounded-[18px] border border-[#D0D5DD] bg-white px-5 text-[16px] font-medium text-[#344054] shadow-sm transition hover:bg-[#F9FAFB]"
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          <button className="inline-flex h-12 items-center gap-2 rounded-[18px] border border-[#D0D5DD] bg-white px-5 text-[16px] font-medium text-[#344054] shadow-sm transition hover:bg-[#F9FAFB]">
            <Upload className="h-4 w-4" />
            Import
          </button>

          {canCreateProperty && (
  <Link
    href="/dashboard/properties/add"
    className="inline-flex h-[52px] items-center gap-2 rounded-[18px] bg-[#1B365D] px-7 text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(27,54,93,0.28)] transition hover:bg-[#132B4B]"
  >
    <Plus className="h-4 w-4" />
    <span>Add Property</span>
  </Link>
)}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Home className="h-5 w-5 text-[#344054]" />}
          value={stats.total}
          label="Total Properties"
          trend="12%"
          trendColor="green"
          iconBg="#F2F4F7"
        />

        <StatCard
          icon={<Eye className="h-5 w-5 text-[#12B76A]" />}
          value={stats.published}
          label="Published"
          trend="8%"
          trendColor="green"
          iconBg="#DDF7E8"
        />

        <StatCard
          icon={<Clock3 className="h-5 w-5 text-[#F79009]" />}
          value={stats.drafts}
          label="Drafts"
          iconBg="#FFF1DD"
        />

        <StatCard
          icon={<Star className="h-5 w-5 text-[#D4A017]" />}
          value={stats.featured}
          label="Featured"
          iconBg="#F8F0DC"
        />
      </div>

      <div className="tb-dashboard-card p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="tb-search-input-wrapper">
              <Search className="tb-search-input-icon" />

              <input
                type="text"
                placeholder="Search by title or location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="tb-search-input"
              />
            </div>

            <div className="tb-filter-group">
              {["all", "published", "draft"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status as "all" | "published" | "draft");
                    setCurrentPage(1);
                  }}
                  className={`tb-filter-chip ${
                    filterStatus === status ? "active" : ""
                  }`}
                >
                  {status === "all"
                    ? "All"
                    : status === "published"
                    ? "Published"
                    : "Drafts"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="tb-filter-group">
              <button
                onClick={() => {
                  setFilterType("all");
                  setCurrentPage(1);
                }}
                className={`tb-filter-chip ${
                  filterType === "all" ? "active" : ""
                }`}
              >
                <Filter className="h-4 w-4" />
                All Types
              </button>

              {propertyTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type);
                    setCurrentPage(1);
                  }}
                  className={`tb-filter-chip ${
                    filterType === type ? "active" : ""
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="tb-view-toggle">
              <button
                onClick={() => setViewMode("grid")}
                className={`tb-view-toggle-button ${
                  viewMode === "grid" ? "active" : ""
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>

              <button
                onClick={() => setViewMode("table")}
                className={`tb-view-toggle-button ${
                  viewMode === "table" ? "active" : ""
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="rounded-[30px] border border-[#E4E7EC] bg-white px-6 py-16 text-center shadow-[0_8px_28px_rgba(16,24,40,0.05)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#F2F4F7] text-[#98A2B3]">
            <Building2 className="h-10 w-10" />
          </div>

          <h3 className="mt-6 text-[24px] font-semibold text-[#0B2C5F]">
            No properties found
          </h3>

          <p className="mt-2 text-[16px] text-[#667085]">
            No properties match your search criteria.
          </p>

          <button
            onClick={resetFilters}
            className="mt-6 inline-flex h-12 items-center rounded-[16px] border border-[#D0D5DD] bg-white px-5 text-[15px] font-medium text-[#344054] transition hover:bg-[#F9FAFB]"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <>
<div className="grid gap-8 md:grid-cols-2 2xl:grid-cols-3">
             {paginatedProperties.map((property) => (
              <PropertyGridCard
  key={property.id}
  property={property}
  canManage={canManage}
  formatPrice={formatPrice}
  onDelete={requestDeleteProperty}
  router={router}
/>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProperties.length}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
              onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </>
      ) : (
        <>
          <PropertyTable
  properties={paginatedProperties}
  canManage={canManage}
  formatPrice={formatPrice}
  onDelete={requestDeleteProperty}
  router={router}
/>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProperties.length}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
              onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </>
      )}
        </div>

    {propertyToDelete && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F2340]/55 px-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-property-title"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget &&
            !deletingProperty
          ) {
            setPropertyToDelete(null);
          }
        }}
      >
        <div className="w-full max-w-[460px] rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_24px_80px_rgba(15,35,64,0.28)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Trash2 className="h-6 w-6" />
          </div>

          <h2
            id="delete-property-title"
            className="mt-5 text-2xl font-semibold text-[#0F2340]"
          >
            Delete property?
          </h2>

          <p className="mt-3 leading-7 text-[#667085]">
            You are about to delete{" "}
            <span className="font-semibold text-[#0F2340]">
              {propertyToDelete.title}
            </span>
            . This action cannot be undone.
          </p>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={deletingProperty}
              onClick={() =>
                setPropertyToDelete(null)
              }
              className="h-12 rounded-xl border border-[#D0D5DD] px-6 font-semibold text-[#344054] transition hover:bg-[#F8F9FA] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={deletingProperty}
              onClick={() =>
                void confirmDeleteProperty()
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />

              {deletingProperty
                ? "Deleting..."
                : "Delete property"}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);


 



function PropertyGridCard({
  property,
  canManage,
  formatPrice,
  onDelete,
  router,
}: {
  property: Property;
  canManage: boolean;
  formatPrice: (price: number | null) => string;
  onDelete: (property: Property) => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
<div className="group h-full overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_8px_28px_rgba(16,24,40,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(16,24,40,0.10)]"> 
  <div className="relative h-[250px] overflow-hidden bg-[#F2F4F7]">
        <PropertyImage
          imageUrls={property.image_urls}
          title={property.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#101828]/20 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

        <div className="absolute left-4 top-4 flex flex-col gap-3">
          {property.featured && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#E8D8A8]/85 px-4 py-2 text-[14px] font-semibold text-[#B88700] backdrop-blur-sm">
              <Star className="h-3.5 w-3.5" />
              Featured
            </span>
          )}

          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-[14px] font-semibold ${
              property.status === "published"
                ? "bg-[#DDF7E8] text-[#0A9952]"
                : "bg-[#FFF1DD] text-[#E17A00]"
            }`}
          >
            {property.status === "published" ? "Published" : "Draft"}
          </span>
        </div>

<div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-3 opacity-0 transition group-hover:opacity-100">          <button
            onClick={() => router.push(`/dashboard/properties/${property.id}`)}
            className="inline-flex h-12 items-center gap-2 rounded-[16px] bg-white px-5 text-[15px] font-semibold text-[#101828] shadow-lg transition hover:bg-[#F9FAFB]"
          >
            <Eye className="h-4 w-4" />
            View
          </button>

          {canManage && (
            <button
              onClick={() =>
                router.push(`/dashboard/properties/${property.id}/edit`)
              }
              className="inline-flex h-12 items-center gap-2 rounded-[16px] bg-white px-5 text-[15px] font-semibold text-[#101828] shadow-lg transition hover:bg-[#F9FAFB]"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="line-clamp-2 text-[18px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#0B2C5F]">
            {property.title}
          </h3>

          <button className="shrink-0 text-[#667085] transition hover:text-[#344054]">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[15px] text-[#667085]">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{property.location || "No location"}</span>
        </div>

        <div className="mt-4 text-[22px] font-semibold tracking-[-0.03em] text-[#163B73]">
          {formatPrice(property.price)}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-6 text-[15px] text-[#475467]">
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            <span>{property.bedrooms || 0}</span>
          </div>

          <div className="flex items-center gap-2">
            <Bath className="h-4 w-4" />
            <span>{property.bathrooms || 0}</span>
          </div>

          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            <span>{property.area || 0}m²</span>
          </div>
        </div>

        <div className="mt-5 border-t border-[#EAECF0]" />

        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="inline-flex rounded-full border border-[#D0D5DD] bg-white px-4 py-2 text-[14px] font-medium text-[#22324D]">
            {property.property_type || "Property"}
          </span>

          <div className="flex items-center gap-2 text-[15px] text-[#667085]">
            <Eye className="h-4 w-4" />
            <span>
              {property.created_at
                ? new Date(property.created_at).toLocaleDateString()
                : "No date"}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          {canManage && (
            <button
              onClick={() =>
                router.push(`/dashboard/properties/${property.id}/edit`)
              }
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[16px] bg-[#163B73] px-5 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(22,59,115,0.22)] transition hover:bg-[#102F5C]"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )}

          {canManage && (
            <button
              onClick={() => onDelete(property)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition hover:bg-[#FEE4E2]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyTable({
  properties,
  canManage,
  formatPrice,
  onDelete,
  router,
}: {
  properties: Property[];
  canManage: boolean;
  formatPrice: (price: number | null) => string;
  onDelete: (property: Property) => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_8px_28px_rgba(16,24,40,0.05)]">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#F9FAFB]">
            <tr className="border-b border-[#EAECF0]">
              {[
                "Property",
                "Location",
                "Price",
                "Features",
                "Type",
                "Status",
                "Date",
                "Actions",
              ].map((head) => (
                <th
                  key={head}
                  className="px-6 py-4 text-left text-[13px] font-semibold uppercase tracking-[0.04em] text-[#667085]"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {properties.map((property) => (
              <tr
                key={property.id}
                className="border-b border-[#EAECF0] last:border-b-0"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 overflow-hidden rounded-[12px] bg-[#F2F4F7]">
                      <PropertyImage
                        imageUrls={property.image_urls}
                        title={property.title}
                        className="h-full w-full object-cover"
                        fallbackClassName="rounded-[12px]"
                      />
                    </div>

                    <div>
                      <div className="text-[15px] font-semibold text-[#101828]">
                        {property.title}
                      </div>

                      {property.featured && (
                        <div className="mt-1 text-[13px] text-[#B88700]">
                          Featured
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5 text-[15px] text-[#475467]">
                  {property.location || "No location"}
                </td>

                <td className="px-6 py-5 text-[15px] font-semibold text-[#163B73]">
                  {formatPrice(property.price)}
                </td>

                <td className="px-6 py-5">
                  <div className="flex flex-wrap items-center gap-4 text-[14px] text-[#475467]">
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="h-4 w-4" />
                      {property.bedrooms || 0}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bath className="h-4 w-4" />
                      {property.bathrooms || 0}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Ruler className="h-4 w-4" />
                      {property.area || 0}m²
                    </span>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <span className="inline-flex rounded-full border border-[#D0D5DD] px-3 py-1.5 text-[13px] font-medium text-[#344054]">
                    {property.property_type || "Property"}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                      property.status === "published"
                        ? "bg-[#DDF7E8] text-[#0A9952]"
                        : "bg-[#FFF1DD] text-[#E17A00]"
                    }`}
                  >
                    {property.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>

                <td className="px-6 py-5 text-[14px] text-[#667085]">
                  {property.created_at
                    ? new Date(property.created_at).toLocaleDateString()
                    : "No date"}
                </td>

                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/properties/${property.id}`)}
                      className="rounded-[12px] border border-[#D0D5DD] p-2.5 text-[#344054] transition hover:bg-[#F9FAFB]"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {canManage && (
                      <>
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/properties/${property.id}/edit`
                            )
                          }
                          className="rounded-[12px] border border-[#D0D5DD] p-2.5 text-[#344054] transition hover:bg-[#F9FAFB]"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDelete(property)}
                          className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] p-2.5 text-[#EF4444] transition hover:bg-[#FEE4E2]"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  trend,
  trendColor,
  iconBg,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  trend?: string;
  trendColor?: "green";
  iconBg: string;
}) {
  return (
    <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_6px_22px_rgba(16,24,40,0.05)]">
      <div className="flex items-start justify-between">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[18px]"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>

        {trend ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[14px] font-semibold ${
              trendColor === "green"
                ? "bg-[#DDF7E8] text-[#12B76A]"
                : "bg-[#F2F4F7] text-[#667085]"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {trend}
          </span>
        ) : null}
      </div>

      <div className="mt-7 text-[54px] font-semibold leading-none tracking-[-0.04em] text-[#0B2C5F]">
        {value}
      </div>

      <div className="mt-3 text-[17px] text-[#475467]">{label}</div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  itemsPerPage,
  onPrev,
  onNext,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  itemsPerPage: number;
  onPrev: () => void;
  onNext: () => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-[#E4E7EC] bg-white px-5 py-4 shadow-[0_6px_20px_rgba(16,24,40,0.04)] md:flex-row md:items-center md:justify-between">
      <div className="text-[15px] text-[#667085]">
        Showing {startIndex + 1}-
        {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}{" "}
        properties
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-[#D0D5DD] bg-white px-4 text-[14px] font-medium text-[#344054] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`flex h-10 w-10 items-center justify-center rounded-[12px] text-[14px] font-semibold transition ${
                currentPage === page
                  ? "bg-[#163B73] text-white"
                  : "border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-[#D0D5DD] bg-white px-4 text-[14px] font-medium text-[#344054] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );



  
}}