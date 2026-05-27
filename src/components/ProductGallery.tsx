"use client";

import { useState } from "react";

export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const safe = images?.length ? images : [];

  if (safe.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        No image
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={safe[active]}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      {safe.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {safe.slice(0, 10).map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={[
                "aspect-square bg-gray-100 rounded overflow-hidden border-2 transition-colors",
                i === active ? "border-brand-600" : "border-transparent hover:border-gray-300",
              ].join(" ")}
              aria-label={`view image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${name} thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
