"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not send reset email");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-md text-center">
        <div className="rounded-2xl bg-emerald-50 p-8 dark:bg-emerald-950/40">
          <Mail className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <h1 className="text-2xl font-black">Check your inbox</h1>
          <p className="mt-2 text-sm text-slate-500">If an account exists for that email, a password reset link is on its way (configure SMTP to send real emails).</p>
          <Link href="/login" className="btn-primary mt-6">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md">
      <h1 className="mb-1 text-2xl font-black">Forgot password?</h1>
      <p className="mb-6 text-sm text-slate-500">Enter your email and we&apos;ll send you a reset link.</p>
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">{error}</div>}
      <div className="mb-4">
        <label className="label"><Mail className="mr-1 inline h-3.5 w-3.5" /> Email</label>
        <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <button className="btn-primary w-full py-3" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</button>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Back to login</Link>
      </p>
    </form>
  );
}