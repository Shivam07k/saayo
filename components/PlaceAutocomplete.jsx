"use client";

import { useEffect, useRef } from "react";
import { loadMaps, placeToAddress } from "@/lib/maps";

export default function PlaceAutocomplete({
  value,
  onChange,
  onPlace,
  placeholder = "Start typing your address…",
  className = "input",
  country = "IN",
  required = false,
}) {
  const inputRef = useRef(null);
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;

  useEffect(() => {
    let autocomplete = null;
    let active = true;
    loadMaps(["places"])
      .then((maps) => {
        if (!active || !inputRef.current) return;
        autocomplete = new maps.places.Autocomplete(inputRef.current, {
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["address"],
          componentRestrictions: country ? { country } : undefined,
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place || !place.geometry) return;
          const addr = placeToAddress(place);
          onPlaceRef.current?.(addr);
        });
      })
      .catch(() => {});
    return () => {
      active = false;
      if (autocomplete && window.google?.maps) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [country]);

  return (
    <input
      ref={inputRef}
      className={className}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
      autoCorrect="off"
      required={required}
    />
  );
}