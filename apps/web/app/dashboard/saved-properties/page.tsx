"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bath,
  BedDouble,
  Heart,
  Loader2,
  MapPin,
  Search,
  Trash2,
  X,
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
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
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

  /* ============================================================
     DELETE CONFIRMATION MODAL
  ============================================================ */

  const [propertyToRemove, setPropertyToRemove] =
    useState<SavedPropertyItem["property"] | null>(
      null,
    );

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

  /* ============================================================
     CLOSE MODAL WITH ESCAPE
  ============================================================ */

  useEffect(() => {
    if (!propertyToRemove) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        !removingId
      ) {
        setPropertyToRemove(null);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    // Prevent page scrolling while modal is open
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [propertyToRemove, removingId]);

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

  /* ============================================================
     KEEP PAGINATION VALID AFTER DELETE
  ============================================================ */

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  /* ============================================================
     OPEN DELETE CONFIRMATION
  ============================================================ */

  function requestRemove(
    property: SavedPropertyItem["property"],
  ) {
    if (removingId) {
      return;
    }

    setPropertyToRemove(property);
  }

  /* ============================================================
     CANCEL DELETE
  ============================================================ */

  function cancelRemove() {
    if (removingId) {
      return;
    }

    setPropertyToRemove(null);
  }

  /* ============================================================
     CONFIRM DELETE
  ============================================================ */

  async function confirmRemove() {
    if (!propertyToRemove) {
      return;
    }

    const token = getToken();

    if (!token || removingId) {
      return;
    }

    const propertyId =
      propertyToRemove.id;

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

      /*
       * Inform sidebar / other components
       * that saved properties changed.
       */
      window.dispatchEvent(
        new Event(
          "saved-properties-changed",
        ),
      );

      /*
       * Close modal only after backend
       * confirms successful deletion.
       */
      setPropertyToRemove(null);

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

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="text-[#667085]">
        Loading saved properties...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <header>
          <h1 className="text-[48px] font-semibold tracking-[-0.03em] text-[#0F2340]">
            Saved Properties
          </h1>

          <p className="mt-2 text-[18px] text-[#667085]">
            Review the properties you
            saved for later.
          </p>
        </header>

        {/* =====================================================
            SEARCH
        ===================================================== */}

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

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

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
              className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-[#1B365D] px-6 font-semibold text-white transition hover:bg-[#0F2340]"
            >
              Browse Properties
            </Link>
          </section>
        ) : (
          /* ===================================================
             PROPERTY GRID
          =================================================== */

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
                    className="overflow-hidden rounded-[26px] border border-[#E4E7EC] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* IMAGE */}

                    <Link
                      href={`/properties/${property.id}`}
                      className="block"
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-[#F2F4F7]">
                        <img
                          src={image}
                          alt={property.title}
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.onerror =
                              null;

                            event.currentTarget.src =
                              "/images/prop1.png";
                          }}
                        />
                      </div>
                    </Link>

                    {/* CONTENT */}

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

                        {/* REMOVE BUTTON */}

                        <button
                          type="button"
                          onClick={() =>
                            requestRemove(
                              property,
                            )
                          }
                          disabled={
                            removingId !== null
                          }
                          aria-label={`Remove ${property.title} from saved properties`}
                          title="Remove from saved properties"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* LOCATION */}

                      <p className="mt-3 flex items-center gap-2 text-sm text-[#667085]">
                        <MapPin className="h-4 w-4 shrink-0" />

                        {[
                          property.location,
                          property.city,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                          "Portugal"}
                      </p>

                      {/* DETAILS */}

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

                      {/* PRICE */}

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

        {/* =====================================================
            PAGINATION
        ===================================================== */}

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
                className="h-10 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-40"
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
                    className={`h-10 min-w-10 rounded-xl px-3 text-sm font-semibold transition ${
                      pageNumber ===
                      currentPage
                        ? "bg-[#1B365D] text-white"
                        : "border border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB]"
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
                className="h-10 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =======================================================
          REMOVE PROPERTY CONFIRMATION MODAL
      ======================================================= */}

      {propertyToRemove && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0F2340]/45 p-4 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !removingId
            ) {
              cancelRemove();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-property-title"
            aria-describedby="remove-property-description"
            className="relative w-full max-w-[500px] overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_30px_80px_rgba(15,35,64,0.30)]"
          >
            {/* TOP ACCENT */}

            <div className="h-1.5 w-full bg-gradient-to-r from-[#1B365D] via-[#C9A227] to-[#1B365D]" />

            <div className="p-7 sm:p-8">
              {/* CLOSE */}

              <button
                type="button"
                onClick={cancelRemove}
                disabled={
                  removingId !== null
                }
                aria-label="Close confirmation"
                className="absolute right-5 top-6 flex h-9 w-9 items-center justify-center rounded-full text-[#667085] transition hover:bg-[#F2F4F7] hover:text-[#0F2340] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>

              {/* ICON */}

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>

              {/* TITLE */}

              <h2
                id="remove-property-title"
                className="mt-5 pr-10 text-[26px] font-semibold tracking-[-0.02em] text-[#0F2340]"
              >
                Remove saved property?
              </h2>

              {/* DESCRIPTION */}

              <p
                id="remove-property-description"
                className="mt-3 leading-7 text-[#667085]"
              >
                Are you sure you want to
                remove{" "}
                <span className="font-semibold text-[#344054]">
                  “
                  {
                    propertyToRemove.title
                  }
                  ”
                </span>{" "}
                from your saved
                properties?
              </p>

              <p className="mt-2 text-sm text-[#98A2B3]">
                You can save this
                property again later.
              </p>

              {/* PROPERTY PREVIEW */}

              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-[#E4E7EC] bg-[#F9FAFB] p-4">
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-[#EAECF0]">
                  <img
                    src={getAssetUrl(
                      propertyToRemove
                        .imageUrls?.[0],
                      "/images/prop1.png",
                    )}
                    alt={
                      propertyToRemove.title
                    }
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror =
                        null;

                      event.currentTarget.src =
                        "/images/prop1.png";
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#0F2340]">
                    {
                      propertyToRemove.title
                    }
                  </p>

                  <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-[#667085]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />

                    {[
                      propertyToRemove.location,
                      propertyToRemove.city,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                      "Portugal"}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#1B365D]">
                    {formatPrice(
                      propertyToRemove.price,
                    )}
                  </p>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelRemove}
                  disabled={
                    removingId !== null
                  }
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-[#D0D5DD] bg-white px-5 font-semibold text-[#344054] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void confirmRemove()
                  }
                  disabled={
                    removingId !== null
                  }
                  className="inline-flex h-12 min-w-[175px] items-center justify-center gap-2 rounded-xl bg-red-600 px-5 font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {removingId ===
                  propertyToRemove.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Remove Property
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}