"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast-store";

type Pending = {
  userId: string;
  email: string;
  password: string;
};

export default function SignupPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [pending, setPending] = useState<Pending | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      // Auto-confirmed (email confirmations disabled) — go straight in
      router.push(next);
      router.refresh();
      return;
    }
    if (data.user) {
      setPending({ userId: data.user.id, email, password });
      setLoading(false);
      return;
    }
    setError("Unexpected signup state.");
    setLoading(false);
  }

  // While waiting on confirmation, poll the server for email_confirmed_at.
  // When it flips, auto-sign-in in this browser and redirect.
  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    let attempts = 0;

    async function tick() {
      attempts++;
      try {
        const res = await fetch(
          `/api/auth/check-confirmation?userId=${encodeURIComponent(pending!.userId)}`,
          { cache: "no-store" },
        );
        if (cancelled || !res.ok) return;
        const j: { confirmed: boolean } = await res.json();
        if (!j.confirmed) return;

        if (pollRef.current) clearInterval(pollRef.current);
        setLoggingIn(true);
        toast.success("Email confirmed — logging you in...");

        const supabase = createClient();
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: pending!.email,
          password: pending!.password,
        });
        if (cancelled) return;
        if (signInErr) {
          setError(
            `Confirmed but auto-login failed: ${signInErr.message}. Please sign in.`,
          );
          setLoggingIn(false);
          return;
        }
        router.push(next);
        router.refresh();
      } catch {
        // network blip — keep polling
      }
      // Give up quietly after ~15 minutes (300 × 3s)
      if (attempts >= 300 && pollRef.current) clearInterval(pollRef.current);
    }

    tick();
    pollRef.current = setInterval(tick, 3000);

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pending, next, router]);

  if (pending) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-display font-bold mb-3">Check your email</h1>
        <p className="text-gray-600 mb-5">
          We&apos;ve sent a confirmation link to{" "}
          <strong>{pending.email}</strong>. Click it to activate your account.
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-2 rounded bg-brand-50 border border-brand-100 text-brand-700 text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          {loggingIn
            ? "Email confirmed — logging you in..."
            : "Waiting for confirmation..."}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Keep this tab open — once you click the link, we&apos;ll sign you in
          here automatically.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-sm mt-4">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-display font-bold mb-2">Create account</h1>
      <p className="text-sm text-gray-500 mb-6">
        Already have an account?{" "}
        <Link
          href={`/auth/login?next=${encodeURIComponent(next)}`}
          className="text-brand-600 font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input
            className="input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
