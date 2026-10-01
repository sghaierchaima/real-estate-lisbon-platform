"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Home,
  Loader2,
  MapPin,
  Target,
} from "lucide-react";

import {
  BuyerJourney,
  getMyBuyerJourneys,
} from "@/lib/buyer-journeys";

function money(value?: number | null) {
  if (value == null) return "—";

  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function BuyerJourneysPage() {
  const [journeys, setJourneys] = useState<BuyerJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const data = await getMyBuyerJourneys();
        setJourneys(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your buyer journeys."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#F6F8FB] text-[#102A4C]">
      {/* HERO */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#C99A16]">
              <Target className="h-4 w-4" />
              Buyer workspace
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-[#102A4C] md:text-5xl">
              Your property journeys
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Keep your property projects, financing preferences and
              professional support needs in one place.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {loading && (
          <div className="flex min-h-[350px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B365D]" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-red-600">{error}</p>

            <Link
              href="/properties"
              className="mt-6 inline-flex rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white"
            >
              Browse properties
            </Link>
          </div>
        )}

        {!loading && !error && journeys.length === 0 && (
          <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF3F8]">
              <Home className="h-7 w-7 text-[#1B365D]" />
            </div>

            <h2 className="mt-6 text-2xl font-bold">
              No buyer journey yet
            </h2>

            <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-500">
              Explore properties and start a buyer journey when you find
              a property you would like to evaluate further.
            </p>

            <Link
              href="/properties"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-6 py-3 font-semibold text-white transition hover:bg-[#102A4C]"
            >
              Explore properties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {!loading && !error && journeys.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {journeys.map((journey) => {
              const property = journey.property;
              const image = property?.imageUrls?.[0];

              return (
                <article
                  key={journey.id}
                  className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="grid md:grid-cols-[210px_1fr]">
                    <div className="min-h-[220px] bg-[#102A4C]">
                      {image ? (
                        <img
                          src={image}
                          alt={property?.title || "Property"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-[220px] items-center justify-center">
                          <Building2 className="h-10 w-10 text-white/60" />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <span className="rounded-full bg-[#FFF7DD] px-3 py-1 text-xs font-bold text-[#9B7410]">
                          {statusLabel(journey.status)}
                        </span>

                        <span className="text-sm font-bold text-[#102A4C]">
                          {journey.progress}%
                        </span>
                      </div>

                      <h2 className="mt-5 text-xl font-bold">
                        {property?.title || "Property journey"}
                      </h2>

                      {(property?.city || property?.region) && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="h-4 w-4" />
                          {[property.city, property.region]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-xl font-bold">
                          {money(property?.price)}
                        </span>

                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <CalendarDays className="h-4 w-4" />
                          {new Date(
                            journey.updatedAt
                          ).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#D4A514]"
                          style={{
                            width: `${Math.min(
                              Math.max(journey.progress, 0),
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <Link
                        href={`/buyer-journey/${journey.propertyId}`}
                        className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 font-semibold text-[#1B365D]"
                      >
                        Continue journey
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}