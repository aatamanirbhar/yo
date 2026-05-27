"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps";

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

type Props = {
  onPlace: (place: ResolvedPlace) => void;
  defaultValue?: string;
};

export default function AddressAutocomplete({ onPlace, defaultValue = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<unknown>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !inputRef.current || acRef.current) return;
        // eslint-disable-next-line
        const google = (window as any).google;
        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "in" },
          fields: ["address_components", "formatted_address", "geometry"],
        });
        acRef.current = ac;
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place.geometry?.location) return;

          let route = "",
            premise = "",
            sublocality = "",
            locality = "",
            state = "",
            pincode = "",
            streetNumber = "";

          for (const c of place.address_components || []) {
            const t: string[] = c.types;
            if (t.includes("street_number")) streetNumber = c.long_name;
            if (t.includes("route")) route = c.long_name;
            if (t.includes("premise")) premise = c.long_name;
            if (t.includes("sublocality") || t.includes("sublocality_level_1"))
              sublocality = c.long_name;
            if (t.includes("locality")) locality = c.long_name;
            if (t.includes("administrative_area_level_1")) state = c.long_name;
            if (t.includes("postal_code")) pincode = c.long_name;
          }

          const line1 =
            [streetNumber, route].filter(Boolean).join(" ") ||
            premise ||
            sublocality ||
            place.formatted_address?.split(",")[0] ||
            "";
          const line2 = [sublocality, premise]
            .filter(Boolean)
            .filter((s) => s !== line1)
            .join(", ");

          onPlace({
            formatted: place.formatted_address ?? "",
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            line1,
            line2,
            city: locality || sublocality,
            state,
            pincode,
          });
        });
        setReady(true);
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [onPlace]);

  return (
    <div>
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          defaultValue={defaultValue}
          placeholder={ready ? "Start typing your address..." : "Loading address search..."}
          className="input pl-9"
          autoComplete="off"
        />
      </div>
      {error && (
        <p className="text-xs text-amber-600 mt-1">
          {error}. Enter your address manually below.
        </p>
      )}
      {ready && (
        <p className="text-xs text-gray-500 mt-1">
          Select an option from the dropdown for accurate shipping. You can edit fields below.
        </p>
      )}
    </div>
  );
}
