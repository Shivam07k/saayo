"use client";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
let cachedPromise = null;

export function hasMapsKey() {
  return Boolean(MAPS_KEY);
}

export function getMapsKey() {
  return MAPS_KEY;
}

export function loadMaps(libraries = []) {
  if (!MAPS_KEY) return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
  if (cachedPromise) return cachedPromise;
  if (typeof window === "undefined") return Promise.reject(new Error("Maps can only be loaded in the browser"));
  cachedPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google.maps);
    const cb = `__gmapcb_${Date.now()}`;
    window[cb] = () => {
      delete window[cb];
      resolve(window.google.maps);
    };
    const src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=${libraries.join(",")}&v=weekly&loading=async&callback=${cb}`;
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onerror = () => {
      delete window[cb];
      cachedPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(s);
  });
  return cachedPromise;
}

export function placeToAddress(place) {
  const parts = {};
  for (const c of place.address_components || []) {
    const t = c.types[0];
    if (t === "street_number") parts.streetNumber = c.long_name;
    else if (t === "route") parts.route = c.long_name;
    else if (t === "sublocality_level_1" || t === "sublocality" || t === "neighborhood") parts.sublocality = c.long_name;
    else if (t === "locality") parts.city = c.long_name;
    else if (t === "administrative_area_level_1") parts.state = c.short_name;
    else if (t === "postal_code") parts.postalCode = c.long_name;
    else if (t === "country") parts.country = c.long_name;
  }
  return {
    line1: [parts.streetNumber, parts.route].filter(Boolean).join(" "),
    line2: parts.sublocality || "",
    city: parts.city || "",
    state: parts.state || "",
    postalCode: parts.postalCode || "",
    country: parts.country || "",
    formattedAddress: place.formatted_address || "",
    lat: place.geometry?.location?.lat?.() || null,
    lng: place.geometry?.location?.lng?.() || null,
  };
}

export function geocodeAddress(address) {
  const maps = typeof window !== "undefined" ? window.google?.maps : null;
  if (!maps) return Promise.reject(new Error("Maps not loaded"));
  return new Promise((resolve, reject) => {
    new maps.Geocoder().geocode({ address }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        resolve({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng(), formattedAddress: results[0].formatted_address });
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

export function reverseGeocode({ lat, lng }) {
  const maps = typeof window !== "undefined" ? window.google?.maps : null;
  if (!maps) return Promise.reject(new Error("Maps not loaded"));
  return new Promise((resolve, reject) => {
    new maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        resolve({ lat, lng, address: results[0].formatted_address });
      } else {
        reject(new Error(`Reverse geocoding failed: ${status}`));
      }
    });
  });
}