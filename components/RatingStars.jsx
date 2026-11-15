import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RatingStars({ rating = 0, count = 0, size = "h-4 w-4", showValue = false, className }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.85;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} className={cn(size, "fill-amber-400 text-amber-400")} />
        ))}
        {half && <StarHalf className={cn(size, "fill-amber-400 text-amber-400")} />}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} className={cn(size, "text-slate-300 dark:text-slate-600")} />
        ))}
      </div>
      {showValue && <span className="text-sm font-semibold">{Number(rating).toFixed(1)}</span>}
      {count !== undefined && count > 0 && <span className="text-xs text-slate-500">({count})</span>}
    </div>
  );
}