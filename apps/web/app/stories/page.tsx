"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import {
  ArrowRight,
  Calendar,
  Clock3,
  Heart,
  MapPin,
  Search,
  Trophy,
} from "lucide-react";
import { getPublicStories, Story } from "@/lib/stories-api";

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStories() {
      try {
        const data = await getPublicStories();
        setStories(data);
      } catch {
        setStories([]);
      } finally {
        setLoading(false);
      }
    }

    loadStories();
  }, []);

  const filteredStories = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return stories;

    return stories.filter(
      (story) =>
        story.title.toLowerCase().includes(q) ||
        story.excerpt?.toLowerCase().includes(q) ||
        story.author?.toLowerCase().includes(q) ||
        story.location?.toLowerCase().includes(q)
    );
  }, [stories, search]);

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-[#0F2340]">
      <Navbar />

      <section className="relative bg-gradient-to-br from-[#1B365D] to-[#0F2340] py-16 text-white">
        <div className="container-page relative">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#C9A227]">
              <Trophy className="h-4 w-4" />
              Approved Success Stories
            </div>

            <h1 className="mb-4 text-4xl font-bold lg:text-5xl">
              Real Buyer Success Stories
            </h1>

            <p className="mx-auto max-w-3xl text-xl text-gray-200">
              Discover approved stories from buyers who started their Portugal
              property journey with confidence.
            </p>
          </div>

          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Search stories by title, buyer or location..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-14 w-full rounded-lg border border-gray-300 bg-white pl-12 pr-4 text-base text-gray-900 outline-none transition focus:border-[#1B365D] focus:ring-4 focus:ring-[#1B365D]/10"
              />
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/stories/submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C9A227] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#F9A825]"
              >
                Share Your Buyer Story
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
            Loading stories...
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-[#0F2340]">
              No stories found
            </h2>
            <p className="mt-2 text-gray-500">
              Try another search or come back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {filteredStories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="group overflow-hidden rounded-xl border border-[#E5E7EB] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={story.imageUrl || "/images/prop1.png"}
                    alt={story.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />

                  <span className="absolute left-3 top-3 rounded-md bg-[#C9A227] px-3 py-1 text-xs font-semibold text-white">
                    Success Story
                  </span>

                  <span className="absolute right-3 top-3 rounded-md bg-white/95 px-3 py-1 text-xs font-semibold text-[#111827]">
                    Approved
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="mb-3 line-clamp-2 text-[18px] font-bold text-[#111827] transition group-hover:text-[#1B365D]">
                    {story.title}
                  </h3>

                  <p className="mb-4 line-clamp-2 text-sm leading-7 text-[#4B5563]">
                    {story.excerpt || "No excerpt provided."}
                  </p>

                  <div className="flex items-center justify-between text-sm text-[#6B7280]">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      <span>{story.author || "Buyer"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{story.location || "Portugal"}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-[#6B7280]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(story.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      <span>6 min read</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <section className="mt-16 rounded-xl bg-gradient-to-br from-[#1B365D] to-[#0F2340] px-6 py-16 text-center text-white md:px-10">
          <h2 className="mb-4 text-3xl font-bold">
            Ready to Start Your Property Journey?
          </h2>

          <p className="mx-auto mb-8 max-w-3xl text-xl text-[#E5E7EB]">
            Use our free tools and get matched with verified professionals.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/tools"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C9A227] px-6 py-3 text-lg font-medium text-white transition hover:bg-[#F9A825]"
            >
              Explore Free Tools
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/properties"
              className="inline-flex items-center justify-center rounded-lg border border-white px-6 py-3 text-lg font-medium text-white transition hover:bg-white/10"
            >
              Browse Properties
            </Link>
          </div>
        </section>
      </section>

      <Footer />
    </main>
  );
}