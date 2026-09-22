"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { MediaFile } from "@/lib/api/types";
import { ProductImage } from "./ProductImage";

/**
 * Product photos. The first image is rendered eagerly because it is the largest element above the fold, and the
 * thumbnails only appear when there is more than one — a single-image product should not look like it is missing
 * something.
 */
export function ProductGallery({ images, name }: { images: MediaFile[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-line/80 bg-page shadow-card">
        <ProductImage
          src={current?.url ?? null}
          alt={name}
          eager
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="p-6"
        />
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Ảnh ${index + 1} của ${name}`}
                aria-current={index === active}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-md border bg-page transition-colors",
                  index === active
                    ? "border-brand-900 ring-1 ring-brand-900"
                    : "border-line hover:border-line-strong",
                )}
              >
                <ProductImage src={image.url} alt="" sizes="100px" className="p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
