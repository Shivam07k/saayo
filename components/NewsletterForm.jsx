"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useToast } from "@/components/StoreProvider";

export function NewsletterForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      toast(data.message || "Subscribed!");
      setEmail("");
    } else {
      toast(data.error || "Could not subscribe", "error");
    }
  };

  return (
    <form onSubmit={submit} className="flex max-w-md gap-2">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com" className="input" aria-label="Email" />
      <button type="submit" disabled={loading} className="btn-primary shrink-0">
        <Send className="h-4 w-4" /> {loading ? "..." : "Subscribe"}
      </button>
    </form>
  );
}

export function FlashSaleCountdown({ endAt }) {
  const [FlashTimer] = [null];
  return <div id="flash-countdown-root" data-end={endAt} />;
}