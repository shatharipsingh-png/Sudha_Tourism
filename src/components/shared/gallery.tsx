"use client";

import * as React from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  if (images.length === 0) return null;

  function close() {
    setActiveIndex(null);
  }

  function next(e?: React.MouseEvent) {
    e?.stopPropagation();
    setActiveIndex((i) => (i === null ? null : (i + 1) % images.length));
  }

  function prev(e?: React.MouseEvent) {
    e?.stopPropagation();
    setActiveIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }

  return (
    <>
      <div className="scrollbar-none flex gap-3 overflow-x-auto sm:grid sm:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <button
            key={src + i}
            onClick={() => setActiveIndex(i)}
            className="relative h-40 w-56 shrink-0 overflow-hidden rounded-xl sm:h-40 sm:w-full"
          >
            <Image
              src={src}
              alt={`${alt} photo ${i + 1}`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 60vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/90 p-4"
          onClick={close}
        >
          <button
            onClick={close}
            aria-label="Close gallery"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="relative h-[70vh] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[activeIndex]!}
              alt={`${alt} photo ${activeIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}
