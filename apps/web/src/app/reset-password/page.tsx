"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasRecoveryContext, setHasRecoveryContext] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    let mounted = true;

    async function bootstrapRecovery() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorDescription = url.searchParams.get("error_description");
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const hashType = hashParams.get("type");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (errorDescription) {
          if (!mounted) return;
          setError(decodeURIComponent(errorDescription));
          setReady(false);
          setChecking(false);
          return;
        }

        if (hashType === "recovery" && accessToken && refreshToken) {
          setHasRecoveryContext(true);
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!mounted) return;

          if (sessionError) {
            setError(sessionError.message);
            setReady(false);
            setChecking(false);
            return;
          }

          window.history.replaceState({}, document.title, `${window.location.origin}/reset-password`);
          setReady(true);
          setChecking(false);
          return;
        }

        if (code) {
          setHasRecoveryContext(true);
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!mounted) return;
          if (exchangeError) {
            setError(exchangeError.message);
            setReady(false);
            setChecking(false);
            return;
          }

          setReady(true);
          setChecking(false);
          return;
        }

        if (!mounted) return;
        setReady(false);
        setChecking(false);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Could not process the recovery link.");
        setReady(false);
        setChecking(false);
      }
    }

    void bootstrapRecovery();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && hasRecoveryContext) {
        setReady(Boolean(session));
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    window.location.assign("/dashboard");
  }

  return (
    <div className="login-split">
      <div className="login-left">
        <p className="eyebrow login-left-eyebrow">DIB Finance Tracker</p>
        <div className="login-left-deco" aria-hidden="true">
          <span className="login-left-mark">AED</span>
        </div>
        <p className="login-left-tagline">
          Choose a new password for your dashboard access.
        </p>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <p className="eyebrow" style={{ marginBottom: "10px" }}>Recovery</p>
          <h1 className="login-heading">Reset password</h1>
          <p className="subtle" style={{ marginBottom: "20px" }}>
            Open the reset link from your email in this browser, then set a new password.
          </p>

          {checking ? <p className="notice">Checking your recovery link…</p> : null}
          {!checking && !ready ? (
            <p className="error">
              This recovery link is invalid or expired. Request a new reset email.
            </p>
          ) : null}

          {ready ? (
            <form onSubmit={onSubmit} className="stack-md">
              <label>
                New password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </label>

              <label>
                Confirm password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </label>

              {error ? <p className="error">{error}</p> : null}

              <button type="submit" className="primary-btn login-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    Updating…
                  </>
                ) : (
                  "Update password"
                )}
              </button>
            </form>
          ) : null}

          <div className="login-links-row" style={{ marginTop: "16px" }}>
            <Link href="/forgot-password" className="login-link">
              Request another reset email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
