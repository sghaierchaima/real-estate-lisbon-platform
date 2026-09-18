"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";

import {
  ArrowRight,
  Calendar,
  Clock3,
  Heart,
  Home,
  ImageOff,
  MapPin,
  Search,
  Trophy,
} from "lucide-react";

import {
  getPublicStories,
  Story,
} from "@/lib/stories-api";

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

function resolveStoryImageUrl(
  imageUrl?: string | null,
): string | null {
  if (!imageUrl) {
    return null;
  }

  const value = imageUrl.trim();

  if (!value) {
    return null;
  }

  /*
   * URL déjà complète :
   * Supabase, Cloudinary, Unsplash, etc.
   */
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  /*
   * Fichiers publics appartenant directement
   * au frontend Next.js.
   */
  if (
    value.startsWith("/images/") ||
    value.startsWith("/assets/")
  ) {
    return value;
  }

  /*
   * Images uploadées et servies
   * par le backend NestJS.
   *
   * Exemple :
   * /uploads/stories/image.jpg
   *
   * devient :
   * http://localhost:3001/uploads/stories/image.jpg
   */
  return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"
    }${value}`;
}

function StoryImage({
  src,
  title,
}: {
  src: string | null;
  title: string;
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (!src || imageFailed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#E8EEF5_0%,#F8F9FA_50%,#F4F0E5_100%)]">
        <div className="flex flex-col items-center px-6 text-center">

          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#1B365D] shadow-[0_12px_30px_rgba(15,35,64,0.18)]">
            <Home className="h-9 w-9 text-white" />
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-semibold text-[#667085] shadow-sm backdrop-blur">
            <ImageOff className="h-3.5 w-3.5" />
            Story image unavailable
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
      onError={() => {
        setImageFailed(true);
      }}
    />
  );
}

export default function StoriesPage() {
  const [
    stories,
    setStories,
  ] = useState<Story[]>([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    async function loadStories() {
      setLoading(true);

      try {
        const data =
          await getPublicStories();
        console.log(
          data.map((story) => ({
            id: story.id,
            title: story.title,
            imageUrl: story.imageUrl,
          }))
        );

        setStories(data);
      } catch {
        setStories([]);
      } finally {
        setLoading(false);
      }
    }

    loadStories();
  }, []);

  const filteredStories =
    useMemo(() => {
      const q =
        search.toLowerCase().trim();

      if (!q) {
        return stories;
      }

      return stories.filter(
        (story) =>
          story.title
            ?.toLowerCase()
            .includes(q) ||
          story.excerpt
            ?.toLowerCase()
            .includes(q) ||
          story.author
            ?.toLowerCase()
            .includes(q) ||
          story.location
            ?.toLowerCase()
            .includes(q),
      );
    }, [stories, search]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F8F9FA] text-[#0F2340]">

        {/* HERO */}

        <section className="relative overflow-hidden bg-gradient-to-br from-[#1B365D] to-[#0F2340] py-16 text-white">

          <div className="absolute inset-0 opacity-30">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(201,162,39,0.18),transparent_28%),radial-gradient(circle_at_left,rgba(255,255,255,0.08),transparent_30%)]" />
          </div>

          <div className="container-page relative">

            <div className="mb-8 text-center">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-[#F4D77B] backdrop-blur">
                <Trophy className="h-4 w-4" />

                Approved Success Stories
              </div>

              <h1 className="mb-4 text-4xl font-bold tracking-[-0.02em] lg:text-5xl">
                Real Buyer Success Stories
              </h1>

              <p className="mx-auto max-w-3xl text-xl leading-8 text-gray-200">
                Discover approved stories from buyers who started their
                Portugal property journey with confidence.
              </p>
            </div>

            <div className="mx-auto max-w-2xl">

              <div className="relative">

                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  placeholder="Search stories by title, buyer or location..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  className="h-14 w-full rounded-xl border border-white/20 bg-white pl-12 pr-4 text-base text-gray-900 shadow-sm outline-none transition focus:border-[#C9A227] focus:ring-4 focus:ring-[#C9A227]/15"
                />
              </div>

              <div className="mt-6 text-center">

                <Link
                  href="/stories/submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#B8941F]"
                >
                  Share Your Buyer Story

                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* STORIES */}

        <section className="container-page py-12">

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white"
                  >
                    <div className="aspect-[16/10] animate-pulse bg-[#E9EDF2]" />

                    <div className="space-y-4 p-6">
                      <div className="h-6 w-3/4 animate-pulse rounded bg-[#E9EDF2]" />
                      <div className="h-4 w-full animate-pulse rounded bg-[#E9EDF2]" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-[#E9EDF2]" />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : filteredStories.length ===
            0 ? (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">

              <Trophy className="mx-auto h-10 w-10 text-[#C9A227]" />

              <h2 className="mt-4 text-xl font-bold text-[#0F2340]">
                No stories found
              </h2>

              <p className="mt-2 text-gray-500">
                Try another search or come back later.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {filteredStories.map(
                (story) => {
                  const image =
                    resolveStoryImageUrl(
                      story.imageUrl,
                    );

                  return (
                    <Link
                      key={story.id}
                      href={`/stories/${story.id}`}
                      className="group overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(15,35,64,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,35,64,0.12)]"
                    >

                      {/* IMAGE */}

                      <div className="relative aspect-[16/10] overflow-hidden">

                        <StoryImage
                          src={image}
                          title={
                            story.title ||
                            "Buyer success story"
                          }
                        />

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />

                        <span className="absolute left-3 top-3 rounded-lg bg-[#C9A227] px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                          Success Story
                        </span>

                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#1B365D] shadow-sm backdrop-blur">
                          <Trophy className="h-3 w-3 text-[#C9A227]" />
                          Approved
                        </span>
                      </div>

                      {/* CONTENT */}

                      <div className="p-6">

                        <h3 className="mb-3 line-clamp-2 text-[19px] font-bold leading-7 text-[#111827] transition group-hover:text-[#1B365D]">
                          {story.title ||
                            "Buyer Success Story"}
                        </h3>

                        <p className="mb-5 line-clamp-2 min-h-[56px] text-sm leading-7 text-[#4B5563]">
                          {story.excerpt ||
                            "Discover this buyer's property journey in Portugal."}
                        </p>

                        <div className="border-t border-[#EEF0F3] pt-4">

                          <div className="flex items-center justify-between gap-4 text-sm text-[#6B7280]">

                            <div className="flex min-w-0 items-center gap-2">
                              <Heart className="h-4 w-4 shrink-0 text-[#1B365D]" />

                              <span className="truncate">
                                {story.author ||
                                  "Buyer"}
                              </span>
                            </div>

                            <div className="flex min-w-0 items-center gap-2">
                              <MapPin className="h-4 w-4 shrink-0 text-[#1B365D]" />

                              <span className="truncate">
                                {story.location ||
                                  "Portugal"}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-4 text-sm text-[#6B7280]">

                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 shrink-0 text-[#1B365D]" />

                              <span>
                                {new Date(
                                  story.createdAt,
                                ).toLocaleDateString(
                                  "en-GB",
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4 shrink-0 text-[#1B365D]" />

                              <span>
                                6 min read
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          )}

          {/* CTA */}

          <section className="mt-16 rounded-[28px] bg-gradient-to-br from-[#1B365D] to-[#0F2340] px-6 py-16 text-center text-white shadow-[0_18px_42px_rgba(15,35,64,0.15)] md:px-10">

            <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em]">
              Ready to Start Your Property Journey?
            </h2>

            <p className="mx-auto mb-8 max-w-3xl text-xl text-[#E5E7EB]">
              Use our free tools and get matched with verified professionals.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">

              <Link
                href="/tools"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-6 py-3 text-lg font-medium text-white transition hover:bg-[#B8941F]"
              >
                Explore Free Tools

                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/properties"
                className="inline-flex items-center justify-center rounded-xl border border-white/70 px-6 py-3 text-lg font-medium text-white transition hover:bg-white/10"
              >
                Browse Properties
              </Link>
            </div>
          </section>
        </section>
      </main>

      <Footer />
    </>
  );
}