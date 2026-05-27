"use client";

let _promise: Promise<void> | null = null;

declare global {
  interface Window {
    // eslint-disable-next-line
    google: any;
  }
}

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (_promise) return _promise;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Promise.reject(
      new Error(
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set — add it to .env.local",
      ),
    );
  }

  _promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-google-maps-loader="1"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Maps load failed")));
      return;
    }

    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`;
    s.async = true;
    s.defer = true;
    s.dataset.googleMapsLoader = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Maps load failed"));
    document.body.appendChild(s);
  });

  return _promise;
}
