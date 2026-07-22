"use client";

import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Share2,
} from "lucide-react";

type PropertyHeroProps = {
  title: string;
  location: string;
  price: string;

  image: string;

  currentImage: number;
  totalImages: number;

  featured: boolean;

  savingFavorite: boolean;
  isSaved: boolean;

  onPrevious: () => void;
  onNext: () => void;

  onShare: () => void;
  onToggleSave: () => void;
};

export default function PropertyHero({
  title,
  location,
  price,

  image,

  currentImage,
  totalImages,

  featured,

  savingFavorite,
  isSaved,

  onPrevious,
  onNext,

  onShare,
  onToggleSave,
}: PropertyHeroProps) {
  return (
    <section className="relative h-[72vh] min-h-[540px] overflow-hidden bg-[#0F2340] lg:h-[78vh]">
      {/* Arrière-plan flouté pour remplir toute la zone */}
      
<img
  src={image}
  alt=""
  
  aria-hidden="true"
  className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-55"
  onError={(event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src =
      "/images/placeholder-property.png";
  }}
/>

{/* Image principale affichée entièrement, sans recadrage */}
<img
  src={image}
  alt={title}
  className="relative z-[1] h-full w-full object-contain"
  onError={(event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src =
      "/images/placeholder-property.png";
  }}
/>
<div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

      

      <div className="absolute left-5 top-5 z-[3] flex flex-wrap gap-2 md:left-10 md:top-8">
        {featured && (
          <span className="rounded-full bg-[#C9A227] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white">
            Featured
          </span>
        )}

        <span className="rounded-full bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#1B365D]">
          Verified listing
        </span>
      </div>

      <div className="absolute right-5 top-5 z-[3] flex gap-3 md:right-10 md:top-8">
        <button
          type="button"
          onClick={onShare}
          aria-label="Share property"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[#0F2340] shadow-lg transition hover:scale-105 hover:bg-white"
        >
          <Share2 className="h-5 w-5" />
        </button>

        <button
  type="button"
  onClick={onToggleSave}
  disabled={savingFavorite}
  aria-label={
    isSaved
      ? "Remove from saved properties"
      : "Save property"
  }
  aria-pressed={isSaved}
  className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 ${
    isSaved
      ? "bg-red-500 text-white"
      : "bg-white/95 text-[#0F2340] hover:bg-white"
  }`}
>
  <Heart
    className="h-5 w-5"
    fill={isSaved ? "currentColor" : "none"}
  />
</button>
      </div>

      {totalImages > 1 && (
        <>
          <button
            type="button"
            onClick={onPrevious}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 z-[3] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#0F2340] shadow-lg transition hover:scale-105 hover:bg-white md:left-8"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={onNext}
            aria-label="Next image"
            className="absolute right-4 top-1/2 z-[3] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#0F2340] shadow-lg transition hover:scale-105 hover:bg-white md:right-8"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-[3]">
        <div className="container-page pb-10 md:pb-14">
          <div className="max-w-4xl text-white">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/85">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] md:text-6xl">
              {title}
            </h1>

            <div className="mt-7 flex flex-wrap items-end justify-between gap-6">
              <p className="text-4xl font-semibold tracking-[-0.02em] text-white md:text-5xl">
                {price}
              </p>

              <div className="rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm font-semibold backdrop-blur-md">
                {currentImage + 1} / {totalImages}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}