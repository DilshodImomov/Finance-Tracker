import { requirePageAuth } from "@/lib/auth";
import { AdminClient } from "@/components/admin-client";
import { NavLinkButton } from "@/components/nav-link-button";
import { listCategories, listRules } from "@/lib/repo";

export const preferredRegion = "sin1";

export default async function AdminPage() {
  await requirePageAuth();
  const [categories, rules] = await Promise.all([listCategories(), listRules()]);

  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-mark">◆</span>
          <div>
            <p className="eyebrow">DIB Purchase Monitor</p>
            <h1>Automation Admin</h1>
          </div>
        </div>
        <NavLinkButton href="/dashboard" label="← Dashboard" pendingLabel="Opening dashboard…" />
      </header>

      <AdminClient initialCategories={categories} initialRules={rules} />
    </div>
  );
}
