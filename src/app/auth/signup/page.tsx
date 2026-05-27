"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      // Auto-confirmed (email confirmations off) — go straight in
      router.push(next);
      router.refresh();
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-display font-bold mb-3">Check your email</h1>
        <p className="text-gray-600">
          We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-display font-bold mb-2">Create account</h1>
      <p className="text-sm text-gray-500 mb-6">
        Already have an account?{" "}
        <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="text-brand-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-sm">
            {error}
          </div>
        )}

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
