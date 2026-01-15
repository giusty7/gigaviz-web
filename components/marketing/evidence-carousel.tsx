"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

/**
 * Evidence images for Technology Provider verification.
 * Paths are deterministic to avoid hydration mismatches.
 */
const EVIDENCE_IMAGES = [
  {
    src: "/trust/technology-provider-proof-1.png",
    alt: "Technology Provider verification proof 1 - Dashboard status showing onboarding completion",
  },
  {
    src: "/trust/technology-provider-proof-2.png",
    alt: "Technology Provider verification proof 2 - API access confirmation",
  },
  {
    src: "/trust/technology-provider-proof-3.png",
    alt: "Technology Provider verification proof 3 - WhatsApp Business Platform integration",
  },
] as const;

interface EvidenceCarouselProps {
  /** Show thumbnails below the main image */
  showThumbnails?: boolean;
  /** Aspect ratio class (default: aspect-video) */
  aspectClass?: string;
}

export function EvidenceCarousel({
  showThumbnails = true,
  aspectClass = "aspect-video",
}: EvidenceCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [errorIndexes, setErrorIndexes] = useState<Set<number>>(new Set());

  const handleImageError = useCallback((index: number) => {
    setErrorIndexes((prev) => new Set(prev).add(index));
  }, []);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? EVIDENCE_IMAGES.length - 1 : prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev === EVIDENCE_IMAGES.length - 1 ? 0 : prev + 1));
  }, []);

  const currentImage = EVIDENCE_IMAGES[activeIndex];
  const hasError = errorIndexes.has(activeIndex);

  // Count available (non-errored) images
  const availableCount = EVIDENCE_IMAGES.length - errorIndexes.size;

  return (
    <div className="space-y-4">
      {/* Main image container */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-background">
        <div className={`relative ${aspectClass}`}>
          {hasError ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gigaviz-gold/15">
                <svg
                  className="h-6 w-6 text-gigaviz-gold"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Evidence image pending</p>
                <p className="text-xs text-muted-foreground">
                  Add: <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{currentImage.src}</code>
                </p>
              </div>
            </div>
          ) : (
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              className="object-cover"
              onError={() => handleImageError(activeIndex)}
              priority={activeIndex === 0}
            />
          )}
        </div>

        {/* Navigation arrows */}
        <button
          type="button"
          onClick={goToPrev}
          aria-label="Previous image"
          className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/50 bg-background/80 text-foreground backdrop-blur transition hover:bg-background hover:border-gigaviz-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={goToNext}
          aria-label="Next image"
          className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/50 bg-background/80 text-foreground backdrop-blur transition hover:bg-background hover:border-gigaviz-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Counter badge */}
        <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border/50 bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
          {activeIndex + 1} / {EVIDENCE_IMAGES.length}
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && (
        <div className="flex justify-center gap-2">
          {EVIDENCE_IMAGES.map((img, index) => {
            const thumbHasError = errorIndexes.has(index);
            return (
              <button
                key={img.src}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`View evidence ${index + 1}`}
                className={`relative h-14 w-20 overflow-hidden rounded-lg border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold ${
                  index === activeIndex
                    ? "border-gigaviz-gold shadow-[0_0_12px_-4px_var(--gv-gold)]"
                    : "border-border/50 hover:border-border"
                }`}
              >
                {thumbHasError ? (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <svg
                      className="h-4 w-4 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                      />
                    </svg>
                  </div>
                ) : (
                  <Image
                    src={img.src}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    onError={() => handleImageError(index)}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Available count info */}
      {availableCount < EVIDENCE_IMAGES.length && (
        <p className="text-center text-xs text-muted-foreground">
          {availableCount} of {EVIDENCE_IMAGES.length} evidence images available
        </p>
      )}
    </div>
  );
}

/** Export count for use in other components */
export const EVIDENCE_COUNT = EVIDENCE_IMAGES.length;
