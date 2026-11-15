"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User, Mail, Phone } from "lucide-react";

export default function RegisterForm({ redirect = "" }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, redirect }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErrors(data.fieldErrors || { form: data.error || "Registration failed" });
      return;
    }
    window.location.href = data.redirectTo || "/";
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md">
      <h1 className="mb-1 text-2xl font-black">Create account</h1>
      <p className="mb-6 text-sm text-slate-500">Join Saayo for faster checkout, orders and 3D favourites</p>

      {errors.form && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">{errors.form}</div>}

      <div className="mb-4">
        <label className="label"><User className="mr-1 inline h-3.5 w-3.5" /> Full name</label>
        <input className="input" value={form.name} onChange={set("name")} required />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>
      <div className="mb-4">
        <label className="label"><Mail className="mr-1 inline h-3.5 w-3.5" /> Email</label>
        <input type="email" className="input" value={form.email} onChange={set("email")} required />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
      </div>
      <div className="mb-4">
        <label className="label"><Phone className="mr-1 inline h-3.5 w-3.5" /> Phone (optional)</label>
        <input className="input" value={form.phone} onChange={set("phone")} placeholder="+91 98XXX XXXXX" />
        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
      </div>
      <div className="mb-6">
        <label className="label">Password</label>
        <div className="relative">
          <input type={show ? "text" : "password"} className="input pr-10" value={form.password} onChange={set("password")} required minLength={8} />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShow((s) => !s)} aria-label="Toggle password">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
      </div>

      <button className="btn-primary w-full py-3" disabled={loading}>{loading ? "Creating account…" : "Create Account"}</button>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account? <Link href={loginHref} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Sign in</Link>
      </p>
    </form>
  );
}