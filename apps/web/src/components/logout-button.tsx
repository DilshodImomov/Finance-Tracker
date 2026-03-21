"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    router.prefetch("/login");
  }, [router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setPending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Could not sign out.");
      }

      startTransition(() => {
        router.replace("/login");
      });
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Could not sign out.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="logout-form">
      <button type="submit" className="btn-link btn-link-pending" disabled={pending}>
        {pending ? (
          <>
            <span className="btn-spinner btn-spinner-soft" aria-hidden="true" />
            Signing out…
          </>
        ) : (
          "Logout"
        )}
      </button>
      {error ? <p className="logout-error">{error}</p> : null}
    </form>
  );
}
