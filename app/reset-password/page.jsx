"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || "Could not reset password");
    setDone(true);
  };

  if (!token) {
    return <p className="text-center text-sm text-red-500">Invalid or missing reset token. Request a new one from the forgot-password page.</p>;
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-8 text-center dark:bg-emerald-950/40">
        <KeyRound className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
        <h1 className="text-2xl font-black">Password updated</h1>
        <p className="mt-2 text-sm text-slate-500">You can now sign in with your new password.</p>
        <Link href="/login" className="btn-primary mt-6">Go to login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md">
      <h1 className="mb-1 text-2xl font-black">Set a new password</h1>
      <p className="mb-6 text-sm text-slate-500">Choose a strong password for your account.</p>
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">{error}</div>}
      <div className="mb-4">
        <label className="label">New password</label>
        <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </div>
      <div className="mb-4">
        <label className="label">Confirm password</label>
        <input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
      </div>
      <button className="btn-primary w-full py-3" disabled={loading}>{loading ? "Updating…" : "Update password"}</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container-x flex min-h-[60vh] items-center py-12">
      <Suspense fallback={<p className="mx-auto text-slate-400">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}