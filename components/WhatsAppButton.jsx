"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WhatsAppButton({ settings }) {
  const [open, setOpen] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const whatsappUrl = settings?.socialWhatsApp;
  if (!whatsappUrl) return null;

  const handleClick = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-600",
          !open && "scale-0 pointer-events-none"
        )}
        aria-label="Chat on WhatsApp"
      >
        <MessageSquare className="h-7 w-7" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-30 animate-fade-in">
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-lg dark:bg-slate-900 dark:text-white",
              showTooltip && "opacity-100 translate-x-0",
              !showTooltip && "opacity-0 translate-x-2 pointer-events-none"
            )}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <MessageSquare className="h-5 w-5 text-green-500" />
            <span>Chat with us</span>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="ml-2 flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}