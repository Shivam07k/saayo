"use client";

import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || "Login failed");
    window.location.href = data.redirectTo || "/admin";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-2xl font-black text-white">S</div>
          <h1 className="text-2xl font-black text-white">Saayo Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in with your staff account</p>
        </div>
        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">{error}</div>}
          <div className="mb-4">
            <label className="label"><Mail className="mr-1 inline h-3.5 w-3.5" /> Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="mb-6">
            <label className="label"><Lock className="mr-1 inline h-3.5 w-3.5" /> Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button className="btn-primary w-full py-3" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
          <p className="mt-4 text-center text-xs text-slate-400">
            Demo: admin@saayo.example.com / Admin@123
          </p>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          <Link href="/" className="font-medium text-brand-400 hover:underline">← Back to store</Link>
        </p>
      </div>
    </div>
  );
}