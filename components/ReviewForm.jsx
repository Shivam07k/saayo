"use client";

import Link from "next/link";
import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/components/StoreProvider";

export default function ReviewForm({ productId }) {
  const { user, toast } = useStore();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="card p-6 text-center">
        <p className="mb-3 text-sm text-slate-500">Login to write a review and help other customers.</p>
        <Link href="/login" className="btn-primary w-full">Login to Review</Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (body.trim().length < 5) {
      toast("Please write a few sentences", "error");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, title, body }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast(data.error || "Could not submit review", "error");
      return;
    }
    toast("Review submitted for approval");
    setTitle("");
    setBody("");
  };

  return (
    <form onSubmit={submit} className="card p-6">
      <h3 className="mb-4 font-bold">Write a review</h3>
      <div className="mb-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            aria-label={`${n} stars`}>
            <Star className={cn("h-6 w-6 transition", (hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600")} />
          </button>
        ))}
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review title (optional)" className="input mb-3" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your experience with this product…" className="input mb-3 min-h-24" />
      <button className="btn-primary w-full" disabled={loading}>{loading ? "Submitting…" : "Submit Review"}</button>
    </form>
  );
}