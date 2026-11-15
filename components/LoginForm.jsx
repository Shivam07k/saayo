"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function LoginForm({ redirect = "" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const registerHref = redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, redirect }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    window.location.href = data.redirectTo || "/";
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md">
      <h1 className="mb-1 text-2xl font-black">Welcome back</h1>
      <p className="mb-6 text-sm text-slate-500">Sign in to continue to your account</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">{error}</div>
      )}

      <div className="mb-4">
        <label className="label"><Mail className="mr-1 inline h-3.5 w-3.5" /> Email</label>
        <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div className="mb-4">
        <label className="label"><Lock className="mr-1 inline h-3.5 w-3.5" /> Password</label>
        <div className="relative">
          <input type={show ? "text" : "password"} className="input pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShow((s) => !s)} aria-label="Toggle password">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <input type="checkbox" className="h-4 w-4 rounded accent-brand-600" /> Remember me
        </label>
        <Link href="/forgot-password" className="font-medium text-brand-600 hover:underline dark:text-brand-400">Forgot password?</Link>
      </div>

      <button className="btn-primary w-full py-3" disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>

      <p className="mt-4 text-center text-sm text-slate-500">
        Don&apos;t have an account? <Link href={registerHref} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Create one</Link>
      </p>

      {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />or<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
          <a href="/api/auth/google" className="btn-outline w-full">Continue with Google</a>
        </>
      )}
    </form>
  );
}