"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

export default function CountdownTimer({ endAt }) {
  const end = new Date(endAt).getTime();
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);

  const diff = Math.max(0, end - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return (
    <div className="flex items-center gap-1.5">
      <Clock3 className="h-4 w-4 text-amber-300" />
      {[
        [days, "Days"], [hours, "Hrs"], [minutes, "Min"], [seconds, "Sec"],
      ].map(([v, label], i) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className="rounded-lg bg-amber-400 px-2 py-1 font-mono text-sm font-bold text-amber-950">
            {String(v).padStart(2, "0")}
          </span>
          {i < 3 && <span className="text-amber-200">:</span>}
        </span>
      ))}
    </div>
  );
}