"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  Bath,
  BedDouble,
  Heart,
  MapPin,
  Search,
  Trash2,
} from "lucide-react";

import { getAssetUrl } from "@/lib/api";
import {
  getSavedProperties,
  removeSavedProperty,
  type SavedPropertyItem,
} from "@/lib/saved-properties-api";
import { getToken } from "@/lib/session";
import { useToast } from "@/components/ui/ToastProvider";

const ITEMS_PER_PAGE = 6;

function formatPrice(price: number) {
  return new Intl.NumberFormat(
    "en-IE",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    },
  ).format(price);
}

export default function SavedPropertiesPage() {
  const toast = useToast();

  const [items, setItems] =
    useState<SavedPropertyItem[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [removingId, setRemovingId] =
    useState<string | null>(null);

  async function loadSavedProperties() {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data =
        await getSavedProperties(token);

      setItems(data);
    } catch (error) {
      toast.error(
        "Unable to load saved properties",
        error instanceof Error
          ? error.message
          : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSavedProperties();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredItems = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter(({ property }) =>
      [
        property.title,
        property.location,
        property.city,
        property.region,
        property.propertyType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [items, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredItems.length /
        ITEMS_PER_PAGE,
    ),
  );

  const paginatedItems = useMemo(() => {
    const start =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredItems.slice(
      start,
      start + ITEMS_PER_PAGE,
    );
  }, [
    filteredItems,
    currentPage,
  ]);

  async function handleRemove(
    propertyId: string,
  ) {
    const token = getToken();

    if (!token || removingId) {
      return;
    }

    setRemovingId(propertyId);

    try {
      await removeSavedProperty(
        token,
        propertyId,
      );

      setItems((currentItems) =>
        currentItems.filter(
          (item) =>
            item.propertyId !==
            propertyId,
        ),
      );

      window.dispatchEvent(
  new Event("saved-properties-changed"),
);


      toast.success(
        "Property removed",
        "The property was removed from your saved list.",
      );
    } catch (error) {
      toast.error(
        "Unable to remove property",
        error instanceof Error
          ? error.message
          : "Please try again.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="text-[#667085]">
        Loading saved properties...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[48px] font-semibold tracking-[-0.03em] text-[#0F2340]">
          Saved Properties
        </h1>

        <p className="mt-2 text-[18px] text-[#667085]">
          Review the properties you
          saved for later.
        </p>
      </header>

      <section className="rounded-[28px] border border-[#E4E7EC] bg-white p-6 shadow-sm">
        <div className="relative max-w-2xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search saved properties..."
            className="h-14 w-full rounded-2xl border border-[#D0D5DD] pl-14 pr-5 outline-none focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
          />
        </div>
      </section>

      {paginatedItems.length === 0 ? (
        <section className="rounded-[28px] border border-[#E4E7EC] bg-white px-6 py-16 text-center">
          <Heart className="mx-auto h-12 w-12 text-[#98A2B3]" />

          <h2 className="mt-5 text-2xl font-semibold text-[#0F2340]">
            No saved properties
          </h2>

          <p className="mt-2 text-[#667085]">
            Save properties using the
            heart button to find them
            here.
          </p>

          <Link
            href="/properties"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-[#1B365D] px-6 font-semibold text-white"
          >
            Browse Properties
          </Link>
        </section>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {paginatedItems.map(
            ({ property }) => {
              const image =
                getAssetUrl(
                  property.imageUrls?.[0],
                  "/images/prop1.png",
                );

              return (
                <article
                  key={property.id}
                  className="overflow-hidden rounded-[26px] border border-[#E4E7EC] bg-white shadow-sm"
                >
                  <Link
                    href={`/properties/${property.id}`}
                    className="block"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-[#F2F4F7]">
                      <img
                        src={image}
                        alt={
                          property.title
                        }
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        onError={(
                          event,
                        ) => {
                          event.currentTarget.onerror =
                            null;

                          event.currentTarget.src =
                            "/images/prop1.png";
                        }}
                      />
                    </div>
                  </Link>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085]">
                          {property.propertyType ||
                            "Property"}
                        </p>

                        <Link
                          href={`/properties/${property.id}`}
                          className="mt-2 block text-xl font-semibold text-[#0F2340] hover:text-[#1B365D]"
                        >
                          {property.title}
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void handleRemove(
                            property.id,
                          )
                        }
                        disabled={
                          removingId ===
                          property.id
                        }
                        aria-label="Remove saved property"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-sm text-[#667085]">
                      <MapPin className="h-4 w-4" />

                      {[
                        property.location,
                        property.city,
                      ]
                        .filter(Boolean)
                        .join(", ") ||
                        "Portugal"}
                    </p>

                    <div className="mt-5 flex items-center gap-4 text-sm text-[#667085]">
                      <span className="inline-flex items-center gap-2">
                        <BedDouble className="h-4 w-4" />
                        {property.bedrooms ??
                          "—"}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <Bath className="h-4 w-4" />
                        {property.bathrooms ??
                          "—"}
                      </span>

                      {property.area && (
                        <span>
                          {property.area} m²
                        </span>
                      )}
                    </div>

                    <p className="mt-6 text-2xl font-semibold text-[#0F2340]">
                      {formatPrice(
                        property.price,
                      )}
                    </p>
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}

      {filteredItems.length > 0 && (
        <div className="flex flex-col gap-4 rounded-[24px] border border-[#E4E7EC] bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#667085]">
            Showing{" "}
            {(currentPage - 1) *
              ITEMS_PER_PAGE +
              1}{" "}
            to{" "}
            {Math.min(
              currentPage *
                ITEMS_PER_PAGE,
              filteredItems.length,
            )}{" "}
            of {filteredItems.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1,
                    ),
                )
              }
              className="h-10 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from(
              {
                length:
                  totalPages,
              },
              (_, index) =>
                index + 1,
            ).map(
              (pageNumber) => (
                <button
                  key={
                    pageNumber
                  }
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      pageNumber,
                    )
                  }
                  className={`h-10 min-w-10 rounded-xl px-3 text-sm font-semibold ${
                    pageNumber ===
                    currentPage
                      ? "bg-[#1B365D] text-white"
                      : "border border-[#D0D5DD] text-[#344054]"
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1,
                    ),
                )
              }
              className="h-10 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}