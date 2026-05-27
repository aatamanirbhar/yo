"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

export type ResolvedPlace = {
  formatted: string;
  lat: number;
  lng: number;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

type PhotonProps = {
  osm_id?: number;
  osm_type?: string;
  name?: string;
  country?: string;
  countrycode?: string;
  state?: string;
  county?: string;
  city?: string;
  district?: string;
  locality?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  type?: string;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number]; type: "Point" };
  properties: PhotonProps;
};

type Suggestion = { feature: PhotonFeature; label: string };

function buildLabel(p: PhotonProps): string {
  const street = [p.housenumber, p.street].filter(Boolean).join(" ");
  const bits = [
    street,
    p.name && p.name !== p.street ? p.name : null,
    p.district,
    p.city || p.locality || p.county,
    p.state,
    p.postcode,
  ].filter(Boolean) as string[];
  // Deduplicate while preserving order
  const seen = new Set<string>();
  return bits.filter((b) => (seen.has(b) ? false : (seen.add(b), true))).join(", ");
}

function toResolved(f: PhotonFeature): ResolvedPlace {
  const p = f.properties;
  const [lng, lat] = f.geometry.coordinates;
  const line1 =
    [p.housenumber, p.street].filter(Boolean).join(" ") || p.name || "";
  const line2 = [p.district, p.locality]
    .filter(Boolean)
    .filter((s) => s && s !== line1)
    .join(", ");
  return {
    formatted: buildLabel(p),
    lat,
    lng,
    line1,
    line2,
    city: p.city || p.locality || p.county || "",
    state: p.state || "",
    pincode: p.postcode || "",
  };
}

type Props = {
  onPlace: (place: ResolvedPlace) => void;
  defaultValue?: string;
};

export default function AddressAutocomplete({
  onPlace,
  defaultValue = "",
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const skipNextRef = useRef(false);

  useEffect(() => {
    const q = value.trim();
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      try {
        const base =
          process.env.NEXT_PUBLIC_PHOTON_URL || "https://photon.komoot.io/api/";
        const url = new URL(base);
        url.searchParams.set("q", q);
        url.searchParams.set("lang", "en");
        url.searchParams.set("limit", "8");
        // Bias results around India (geographic center)
        url.searchParams.set("lat", "20.5937");
        url.searchParams.set("lon", "78.9629");

        const res = await fetch(url.toString(), { signal: ctrl.signal });
        if (!res.ok) throw new Error(`Photon ${res.status}`);
        const json: { features?: PhotonFeature[] } = await res.json();
        const feats = json.features ?? [];
        const indiaOnly = feats.filter(
          (f) =>
            f.properties.countrycode === "IN" ||
            f.properties.country === "India",
        );
        const list: Suggestion[] = indiaOnly.map((f) => ({
          feature: f,
          label: buildLabel(f.properties),
        }));
        setSuggestions(list);
        setOpen(list.length > 0);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError("Address search unavailable. Enter your address manually below.");
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [value]);

  function pick(s: Suggestion) {
    const place = toResolved(s.feature);
    skipNextRef.current = true;
    setValue(place.formatted);
    setOpen(false);
    setSuggestions([]);
    onPlace(place);
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Start typing your address..."
          className="input pl-9"
          autoComplete="off"
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-amber-600 mt-1">{error}</p>}
      {!error && (
        <p className="text-xs text-gray-500 mt-1">
          Powered by OpenStreetMap. Pick an option for accurate shipping — you can edit fields below.
        </p>
      )}
      {loading && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
    </div>
  );
}
