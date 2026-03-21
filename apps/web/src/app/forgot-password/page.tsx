"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("Password reset email sent. Check your inbox.");
  }

  return (
    <div className="login-split">
      <div className="login-left">
        <p className="eyebrow login-left-eyebrow">DIB Finance Tracker</p>
        <div className="login-left-deco" aria-hidden="true">
          <span className="login-left-mark">AED</span>
        </div>
        <p className="login-left-tagline">
          Reset your dashboard password securely through Supabase Auth.
        </p>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <p className="eyebrow" style={{ marginBottom: "10px" }}>Recovery</p>
          <h1 className="login-heading">Forgot password</h1>
          <p className="subtle" style={{ marginBottom: "20px" }}>
            Enter your account email and we&apos;ll send a reset link.
          </p>

          {message ? <p className="notice">{message}</p> : null}

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

            {error ? <p className="error">{error}</p> : null}

            <button type="submit" className="primary-btn login-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>

          <div className="login-links-row" style={{ marginTop: "16px" }}>
            <Link href="/login" className="login-link">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
