"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

type Props = {
  href: string;
  label: string;
  pendingLabel?: string;
  className?: string;
};

export function NavLinkButton({
  href,
  label,
  pendingLabel,
  className = "btn-link btn-link-pending",
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    router.prefetch(href);
  }, [href, router]);

  function onClick() {
    if (pending) {
      return;
    }

    setPending(true);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <button type="button" className={className} disabled={pending} onClick={onClick}>
      {pending ? (
        <>
          <span className="btn-spinner btn-spinner-soft" aria-hidden="true" />
          {pendingLabel ?? "Loading…"}
        </>
      ) : (
        label
      )}
    </button>
  );
}
