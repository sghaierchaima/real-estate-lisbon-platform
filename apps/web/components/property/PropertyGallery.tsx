"use client";

type PropertyGalleryProps = {
  images: string[];
  currentImage: number;
  title: string;
  onSelect: (index: number) => void;
};

export default function PropertyGallery({
  images,
  currentImage,
  title,
  onSelect,
}: PropertyGalleryProps) {
  if (images.length <= 1) {
    return null;
  }

  return (
    <section className="container-page relative z-10 -mt-8">
      <div className="overflow-x-auto rounded-[24px] border border-[#E4E7EC] bg-white p-4 shadow-[0_16px_40px_rgba(15,35,64,0.14)]">
        <div className="flex min-w-max gap-3">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Show property image ${index + 1}`}
              className={`h-24 w-36 overflow-hidden rounded-2xl border-2 transition md:h-28 md:w-44 ${
                currentImage === index
                  ? "border-[#1B365D] ring-4 ring-[#1B365D]/10"
                  : "border-transparent hover:border-[#98A2B3]"
              }`}
            >
              <img
                src={image}
                alt={`${title} image ${index + 1}`}
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "/images/placeholder-property.png";
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}