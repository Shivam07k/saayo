"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductGallery({ images = [], videoUrl, productName }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const all = images.length ? images : [{ url: "https://images.unsplash.com/photo-1503602642458-232111445657?w=800" }];

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  return (
    <div className="flex gap-3">
      {/* thumbnails */}
      <div className="flex w-16 shrink-0 flex-col gap-2 overflow-y-auto">
        {videoUrl && (
          <button className="aspect-square overflow-hidden rounded-lg bg-slate-900 text-[10px] font-bold text-white" onClick={setActive.bind(null, -1)}>
            ▶ Video
          </button>
        )}
        {all.map((img, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={cn("relative aspect-square overflow-hidden rounded-lg border-2", active === i ? "border-brand-600" : "border-transparent hover:border-slate-300")}>
            <Image
              src={img.url}
              alt={img.alt || `${productName} image ${i + 1}`}
              fill
              sizes="64px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* main */}
      <div className="flex-1">
        {videoUrl && active === -1 ? (
          <video src={videoUrl} controls className="aspect-square w-full rounded-2xl bg-slate-900" />
        ) : (
          <div className={cn("relative aspect-square overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-900", zoom && "cursor-zoom-out")}
            onMouseMove={zoom ? onMove : undefined}
            onClick={() => setZoom((z) => !z)}>
            <Image
              src={all[active]?.url}
              alt={all[active]?.alt || productName}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              style={zoom ? { transformOrigin: `${pos.x}% ${pos.y}%`, transform: "scale(2)" } : undefined}
              className="object-cover transition-transform duration-150"
            />
            <button className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow dark:bg-slate-900/90" onClick={(e) => { e.stopPropagation(); setZoom((z) => !z); }} aria-label="Zoom">
              {zoom ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}