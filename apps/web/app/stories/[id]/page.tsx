"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPublicStory, Story } from "@/lib/stories-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function imageSrc(url?: string | null) {
  if (!url) return "/images/prop1.png";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

export default function StoryDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStory() {
      try {
        const data = await getPublicStory(id);
        setStory(data);
      } catch {
        setStory(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchStory();
  }, [id]);

  if (loading) {
    return (
      <main className="bg-[#F8F9FA] text-[#0F2340]">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center text-gray-500">
          Loading story...
        </div>
        <Footer />
      </main>
    );
  }

  if (!story) {
    return (
      <main className="bg-[#F8F9FA] text-[#0F2340]">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="mb-4 text-3xl font-bold">Story not found</h1>
          <Link href="/stories" className="text-[#1B365D] underline">
            Back to Stories
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="bg-[#F8F9FA] text-[#0F2340]">
      <Navbar />

      <div className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/stories"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-[#1B365D]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Success Stories
          </Link>
        </div>
      </div>

      <div className="relative h-[400px] overflow-hidden lg:h-[500px]">
        <img
          src={imageSrc(story.imageUrl)}
          alt={story.title}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = "/images/prop1.png";
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

        <div className="absolute left-6 top-6">
          <span className="rounded-md bg-[#C9A227] px-4 py-1 text-sm font-semibold text-white">
            Success Story
          </span>
        </div>

        <div className="absolute bottom-0 w-full p-6 lg:p-12">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-4 text-3xl font-bold text-white lg:text-5xl">
              {story.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(story.createdAt).toLocaleDateString()}
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />6 min read
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {story.location || "Portugal"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-12 flex items-center gap-4 rounded-xl border bg-gradient-to-br from-[#F8F9FA] to-white p-6">
          <img
            src="/images/hero2.jpg"
            className="h-16 w-16 rounded-full border-2 border-[#C9A227] object-cover"
            alt={story.author || "Verified buyer"}
          />

          <div className="flex-1">
            <p className="text-lg font-bold">
              {story.author || "Verified Buyer"}
            </p>
            <p className="text-sm text-gray-500">
              {story.location || "Portugal"}
            </p>
          </div>

          <div className="hidden items-center gap-2 font-semibold text-[#C9A227] sm:flex">
            ❤️ Verified Buyer
          </div>
        </div>

        {story.excerpt && (
          <p className="mb-12 text-lg leading-8 text-gray-700">
            {story.excerpt}
          </p>
        )}

        <article className="prose prose-lg max-w-none rounded-xl border bg-white p-8 text-gray-700">
          {(story.content || "No content available yet.")
            .split("\n")
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </article>

        <div className="mt-12 rounded-xl border-l-4 border-green-500 bg-green-50 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
            <CheckCircle className="text-green-500" />
            Key Takeaway
          </h2>
          <p className="leading-7 text-gray-700">
            This story helps buyers understand real decision points, expected
            timeline, and practical challenges when purchasing property in
            Portugal.
          </p>
        </div>

        <div className="mt-12 rounded-xl bg-gradient-to-br from-[#1B365D] to-[#0F2340] p-10 text-center text-white">
          <h2 className="mb-4 text-2xl font-bold">
            Ready to Start Your Own Success Story?
          </h2>

          <p className="mb-6 text-gray-200">
            Use our tools to compare neighborhoods, estimate costs, and connect
            with verified professionals.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/tools"
              className="rounded-lg bg-[#C9A227] px-6 py-3 font-medium hover:bg-yellow-600"
            >
              Start with Free Tools
            </Link>

            <Link
              href="/properties"
              className="rounded-lg border border-white px-6 py-3 hover:bg-white/10"
            >
              Browse Properties
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}