"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recoveryRedirecting] = useState(() => {
    if (typeof window === "undefined") return false;
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    return hashParams.get("type") === "recovery";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const notice =
    searchParams.get("reset") === "sent"
      ? "Password reset email sent. Check your inbox."
      : searchParams.get("reset") === "done"
        ? "Password updated. You can sign in now."
        : !recoveryRedirecting && searchParams.get("error") === "unauthorized"
          ? "This account is not authorized for the dashboard."
          : "";

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  useEffect(() => {
    if (!recoveryRedirecting) return;

    const hash = window.location.hash;
    window.location.replace(`${window.location.origin}/reset-password${hash}`);
  }, [recoveryRedirecting]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setLoading(false);
        setError(data?.error ?? "Could not sign in.");
        return;
      }

      startTransition(() => {
        router.push("/dashboard");
      });
    } catch {
      setLoading(false);
      setError("Network error while signing in. Check your connection and try again.");
    }
  }

  return (
    <div className="login-split">
      <div className="login-left">
        <p className="eyebrow login-left-eyebrow">DIB Finance Tracker</p>
        <div className="login-left-deco" aria-hidden="true">
          <span className="login-left-mark">AED</span>
        </div>
        <p className="login-left-tagline">
          Your personal window into every dirham spent.
        </p>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <p className="eyebrow" style={{ marginBottom: "10px" }}>Welcome back</p>
          <h1 className="login-heading">Sign in</h1>
          <p className="subtle" style={{ marginBottom: "20px" }}>Admin access only.</p>

          {notice ? <p className="notice">{notice}</p> : null}

          <form onSubmit={onSubmit} className="stack-md">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </label>

            <div className="login-links-row">
              <Link href="/forgot-password" className="login-link">
                Forgot password?
              </Link>
            </div>

            {error ? <p className="error">{error}</p> : null}

            <button type="submit" className="primary-btn login-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
