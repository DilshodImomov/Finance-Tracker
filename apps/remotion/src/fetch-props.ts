/**
 * Fetches real data from the Next.js finance API and writes props JSON
 * that Remotion uses for rendering.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 SESSION_COOKIE="session=..." \
 *     npx tsx src/fetch-props.ts > props.json
 *
 * Then render with:
 *   npx remotion render MonthlyRecap out/monthly-recap.mp4 --props props.json
 */

const BASE_URL = process.env["BASE_URL"] ?? "http://localhost:3000";
const SESSION_COOKIE = process.env["SESSION_COOKIE"] ?? "";

async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Cookie: SESSION_COOKIE },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function main() {
  const [overview, byCategory, topMerchants, monthly] = await Promise.all([
    get("/api/stats/overview").catch(() => get("/api/me").then(() => null)),
    get("/api/stats/by-category"),
    get("/api/stats/top-merchants"),
    get("/api/stats/monthly"),
  ]);

  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-AE", { month: "long", year: "numeric" });

  const props = {
    monthLabel,
    thisMonth: Number(overview?.this_month ?? 0),
    lastMonth: Number(overview?.last_month ?? 0),
    ytd: Number(overview?.ytd ?? 0),
    categories: (byCategory ?? []).map((r: { category: string; total: string }) => ({
      category: r.category,
      total: Number(r.total),
    })),
    monthly: (monthly ?? []).slice(-6).map((r: { month: string; total: string }) => ({
      month: r.month,
      total: Number(r.total),
    })),
    topMerchants: (topMerchants ?? []).slice(0, 5).map((r: { merchant: string; total: string }) => ({
      merchant: r.merchant,
      total: Number(r.total),
    })),
  };

  process.stdout.write(JSON.stringify(props, null, 2));
}

main().catch((e) => {
  process.stderr.write(String(e) + "\n");
  process.exit(1);
});
