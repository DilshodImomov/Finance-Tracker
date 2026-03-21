"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatXAxisLabel(value: string, mode: "day" | "month") {
  if (mode === "day") {
    return value.slice(-2);
  }

  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString(undefined, {
    month: "short",
  });
}

function formatTooltipLabel(value: string, mode: "day" | "month") {
  if (mode === "day") {
    const date = new Date(`${value}T00:00:00.000Z`);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function MonthlyLineChart({
  rows,
  mode,
}: {
  rows: Array<{ label: string; total: number }>;
  mode: "day" | "month";
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={rows} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="accentFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--accent, #3ecf8e)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--accent, #3ecf8e)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="label"
          tickFormatter={(value) => formatXAxisLabel(String(value), mode)}
          tick={{ fill: "rgba(239,239,239,0.4)", fontSize: 11, fontFamily: "var(--font-mono,'DM Mono',monospace)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(239,239,239,0.4)", fontSize: 11, fontFamily: "var(--font-mono,'DM Mono',monospace)" }}
          axisLine={false}
          tickLine={false}
          width={54}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(10, 10, 10, 0.94)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 10,
            color: "#efefef",
            fontSize: 13,
            fontFamily: "var(--font-mono,'DM Mono',monospace)",
          }}
          labelFormatter={(value) => formatTooltipLabel(String(value), mode)}
          labelStyle={{ color: "rgba(239,239,239,0.55)", marginBottom: 4, fontSize: 11 }}
          formatter={(value) => [
            `AED ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            "Total",
          ]}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#3ecf8e"
          strokeWidth={1.8}
          fill="url(#accentFill)"
          dot={false}
          activeDot={{ r: 4, fill: "#3ecf8e", strokeWidth: 0 }}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const CAT_COLORS = [
  "#3ecf8e", // emerald
  "#38bdf8", // sky
  "#f472b6", // pink
  "#fb923c", // orange
  "#a78bfa", // violet
  "#94a3b8", // slate
];

export function CategorySegments({
  rows,
}: {
  rows: Array<{ category: string; total: number }>;
}) {
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  const sum = sorted.reduce((acc, r) => acc + r.total, 0);

  return (
    <div className="cat-segments">
      <div className="cat-track">
        {sorted.map((row, i) => (
          <div
            key={row.category}
            className="cat-segment"
            style={{
              width: `${sum ? (row.total / sum) * 100 : 0}%`,
              background: CAT_COLORS[i % CAT_COLORS.length],
            }}
            title={`${row.category}: AED ${row.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          />
        ))}
      </div>
      <div className="cat-tiles">
        {sorted.map((row, i) => (
          <div key={row.category} className="cat-tile">
            <div className="cat-tile-accent" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
            <div className="cat-tile-body">
              <p className="cat-tile-name">{row.category}</p>
              <p className="cat-tile-pct">{sum ? ((row.total / sum) * 100).toFixed(1) : "0.0"}%</p>
              <p className="cat-tile-amt">
                AED {row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
