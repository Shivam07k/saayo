"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import MapView from "@/components/MapView";
import { geocodeAddress, hasMapsKey, loadMaps } from "@/lib/maps";

export default function StoreLocationMap({ address }) {
  const [state, setState] = useState("loading");
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (!hasMapsKey()) {
      setState("no-key");
      return;
    }
    if (!address) {
      setState("no-address");
      return;
    }
    loadMaps(["places", "geometry"])
      .then(() => geocodeAddress(address))
      .then(({ lat, lng }) => {
        setMarkers([{ lat, lng, title: "Our store" }]);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [address]);

  return (
    <section className="container-x max-w-3xl py-10">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-brand-600" />
        <h2 className="text-xl font-black">Find us</h2>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        {state === "ready" ? (
          <MapView markers={markers} center={markers[0]} zoom={15} className="h-80 w-full" />
        ) : (
          <div className="flex h-80 w-full items-center justify-center p-6 text-center text-sm text-slate-500">
            {state === "no-key" ? (
              <p>Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env to show the store map.</p>
            ) : state === "no-address" ? (
              <p>Add a store address in admin settings to display the map.</p>
            ) : state === "error" ? (
              <p>Could not locate that address on the map.</p>
            ) : (
              <p className="animate-pulse">Loading store location…</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}