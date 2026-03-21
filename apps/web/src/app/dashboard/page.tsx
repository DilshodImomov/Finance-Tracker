import Link from "next/link";
import { requirePageAuth } from "@/lib/auth";
import {
  getOverviewTotals,
  listCategories,
  listTransactions,
  monthlyTotals,
  totalsByCategory,
} from "@/lib/repo";
import { CategorySegments, MonthlyLineChart } from "@/components/charts";
import { NavLinkButton } from "@/components/nav-link-button";
import { LogoutButton } from "@/components/logout-button";
import { TransactionsTableClient } from "@/components/transactions-table-client";

export const preferredRegion = "sin1";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type TimelineKey = "this_month" | "3m" | "6m" | "12m" | "ytd";
type TimelineRange = {
  from: string;
  to: string;
  granularity: "day" | "month";
  label: string;
};

function value(param: string | string[] | undefined) {
  return typeof param === "string" ? param : undefined;
}

function startOfUtcMonth(date: Date, offsetMonths = 0) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offsetMonths, 1));
}

function resolveTimeline(timeline: TimelineKey): TimelineRange {
  const now = new Date();
  const to = now.toISOString();

  if (timeline === "this_month") {
    return {
      from: startOfUtcMonth(now).toISOString(),
      to,
      granularity: "day",
      label: "This Month",
    };
  }

  if (timeline === "3m") {
    return {
      from: startOfUtcMonth(now, -2).toISOString(),
      to,
      granularity: "month",
      label: "3 Months",
    };
  }

  if (timeline === "6m") {
    return {
      from: startOfUtcMonth(now, -5).toISOString(),
      to,
      granularity: "month",
      label: "6 Months",
    };
  }

  if (timeline === "ytd") {
    return {
      from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString(),
      to,
      granularity: "month",
      label: "Year to Date",
    };
  }

  return {
    from: startOfUtcMonth(now, -11).toISOString(),
    to,
    granularity: "month",
    label: "12 Months",
  };
}

function fillDailySeries(
  rows: Array<{ month: string; total: string }>,
  fromIso: string,
  toIso: string,
) {
  const values = new Map(rows.map((row) => [row.month, Number(row.total)]));
  const start = new Date(fromIso);
  const end = new Date(toIso);
  const filled: Array<{ label: string; total: number }> = [];

  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const label = cursor.toISOString().slice(0, 10);
    filled.push({
      label,
      total: values.get(label) ?? 0,
    });
  }

  return filled;
}

function fmt(value: string) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const TIMELINES: Array<{ key: TimelineKey; label: string }> = [
  { key: "this_month", label: "This Month" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "12m", label: "12M" },
  { key: "ytd", label: "YTD" },
];

export default async function DashboardPage({ searchParams }: Props) {
  await requirePageAuth();
  const params = await searchParams;
  const requestedTimeline = value(params.timeline);
  const timeline: TimelineKey =
    requestedTimeline === "3m" ||
    requestedTimeline === "6m" ||
    requestedTimeline === "12m" ||
    requestedTimeline === "ytd"
      ? requestedTimeline
      : "this_month";
  const range = resolveTimeline(timeline);

  const [overview, series, byCategory, categories, txResult] = await Promise.all([
    getOverviewTotals(),
    monthlyTotals({
      from: range.from,
      to: range.to,
      granularity: range.granularity,
    }),
    totalsByCategory(range.from, range.to),
    listCategories(),
    listTransactions({ page: 1, pageSize: 25, sort: "posted_at_desc" }),
  ]);

  const chartRows =
    range.granularity === "day"
      ? fillDailySeries(series, range.from, range.to)
      : series.map((row) => ({ label: row.month, total: Number(row.total) }));

  const categoryRows = byCategory.map((r) => ({ category: r.category, total: Number(r.total) }));

  const thisMonth = Number(overview.this_month);
  const lastMonth = Number(overview.last_month);
  const delta = lastMonth === 0 ? 0 : ((thisMonth - lastMonth) / lastMonth) * 100;
  const spendDown = delta < 0;

  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-mark">◆</span>
          <div>
            <p className="eyebrow">DIB Purchase Monitor</p>
            <h1>Finance Dashboard</h1>
          </div>
        </div>
        <nav className="topbar-nav">
          <NavLinkButton href="/dashboard/admin" label="Admin" pendingLabel="Opening admin…" />
          <LogoutButton />
        </nav>
      </header>

      <section className="hero-panel">
        <div className="hero-main">
          <p className="hero-label">This Month</p>
          <div className="hero-number-row">
            <span className="hero-currency">AED</span>
            <span className="hero-number">{fmt(overview.this_month)}</span>
          </div>
          <div className={`hero-trend ${spendDown ? "trend-good" : "trend-bad"}`}>
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}% vs last month
          </div>
        </div>
        <div className="hero-secondary">
          <div className="hero-stat">
            <p className="hero-stat-label">Last Month</p>
            <p className="hero-stat-value">AED {fmt(overview.last_month)}</p>
          </div>
          <div className="hero-stat">
            <p className="hero-stat-label">Year to Date</p>
            <p className="hero-stat-value">AED {fmt(overview.ytd)}</p>
          </div>
          <div className="hero-stat">
            <p className="hero-stat-label">All Time</p>
            <p className="hero-stat-value">AED {fmt(overview.all_time)}</p>
          </div>
        </div>
      </section>

      <section className="chart-section">
        <div className="section-header">
          <div className="stack-sm">
            <h2 className="section-title">Spending Trend</h2>
            <p className="subtle">
              {range.granularity === "day" ? "Daily totals for the current month." : `Monthly totals for ${range.label.toLowerCase()}.`}
            </p>
          </div>
          <div className="timeline-pills">
            {TIMELINES.map(({ key, label }) => (
              <Link
                key={key}
                href={`/dashboard?timeline=${key}`}
                className={`timeline-pill${timeline === key ? " active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <MonthlyLineChart rows={chartRows} mode={range.granularity} />
      </section>

      <section className="category-section">
        <div className="section-header">
          <div className="stack-sm">
            <h2 className="section-title">Spending by Category</h2>
            <p className="subtle">{range.label}</p>
          </div>
        </div>
        <CategorySegments rows={categoryRows} />
      </section>

      <TransactionsTableClient categories={categories} initialData={txResult} />
    </div>
  );
}
