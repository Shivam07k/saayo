"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-x flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950">
        <AlertTriangle className="h-8 w-8" />
      </span>
      <h2 className="text-2xl font-black">Something went wrong</h2>
      <p className="max-w-md text-sm text-slate-500">
        {error?.message || "An unexpected error occurred. Please try again."}
      </p>
      <button onClick={() => reset()} className="btn-primary">Try again</button>
    </div>
  );
}