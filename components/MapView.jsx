"use client";

import { useEffect, useRef, useState } from "react";
import { hasMapsKey, loadMaps } from "@/lib/maps";

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

export default function MapView({ center = null, markers = [], zoom = 13, className = "h-72 w-full", onPick = null, picker = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasMapsKey()) {
      setError("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Add it to .env to enable maps.");
      return;
    }
    loadMaps(["places", "geometry"])
      .then(() => setReady(true))
      .catch((e) => setError(e.message || "Failed to load Google Maps"));
  }, []);

  useEffect(() => {
    if (!ready || error || !containerRef.current) return;
    const maps = window.google.maps;
    if (!mapRef.current) {
      mapRef.current = new maps.Map(containerRef.current, {
        center: center || markers[0] || INDIA_CENTER,
        zoom: center || markers[0] ? zoom : 5,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });
      if (picker && onPick) {
        mapRef.current.addListener("click", (e) => {
          onPick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
      }
    }
    if (center) mapRef.current.setCenter(center);
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = (markers || []).map((m) => {
      const marker = new maps.Marker({ map: mapRef.current, position: { lat: m.lat, lng: m.lng }, title: m.title || "" });
      if (m.info) {
        const info = new maps.InfoWindow({ content: m.info });
        marker.addListener("click", () => info.open({ map: mapRef.current, anchor: marker }));
      }
      return marker;
    });
  }, [ready, error, center, markers, picker, onPick, zoom]);

  if (error) {
    return <div className={`${className} flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900`}>{error}</div>;
  }
  if (!ready) {
    return <div className={`${className} flex animate-pulse items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400 dark:bg-slate-800`}>Loading map…</div>;
  }
  return <div ref={containerRef} className={className} />;
}