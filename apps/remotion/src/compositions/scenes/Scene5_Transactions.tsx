/**
 * Scene 5 — Transactions List  (30–38s / 240 frames)
 * Rows slide up. One row glows and subtly zooms.
 */
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { Background } from "../../components/Background";
import { GlassCard } from "../../components/GlassCard";
import { T } from "../../theme";

const DUR = 240;

const TRANSACTIONS = [
  { date: "Feb 26",  merchant: "Carrefour Mall",     category: "Groceries",     amount: "AED 198.50",  highlight: false },
  { date: "Feb 25",  merchant: "SMILES by Emirates", category: "Dining",        amount: "AED 312.00",  highlight: true  },
  { date: "Feb 24",  merchant: "Salik Top-Up",        category: "Parking",       amount: "AED 100.00",  highlight: false },
  { date: "Feb 23",  merchant: "Netflix",             category: "Subscriptions", amount: "AED 44.99",   highlight: false },
  { date: "Feb 22",  merchant: "Amazon AE",           category: "Shopping",      amount: "AED 562.30",  highlight: false },
];

const CATEGORY_COLORS: Record<string, string> = {
  Groceries:     "#6366f1",
  Dining:        T.accent,
  Parking:       "#38bdf8",
  Subscriptions: "#f59e0b",
  Shopping:      "#a78bfa",
};

export function Scene5_Transactions() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 20, DUR - 18, DUR], [0, 1, 1, 0], { extrapolateRight: "clamp" });

  // Rows slide up in stagger
  const rows = TRANSACTIONS.map((tx, i) => ({
    sp: spring({ frame: frame - 18 - i * 16, fps, config: { damping: 18, mass: 0.85 }, durationInFrames: 40 }),
    op: interpolate(frame, [18 + i * 16, 35 + i * 16], [0, 1], { extrapolateRight: "clamp" }),
  }));

  // Highlighted row glow pulses after it appears
  const highlightIdx = TRANSACTIONS.findIndex(t => t.highlight);
  const glowPulse = interpolate(
    Math.sin((frame - 80) * 0.12),
    [-1, 1], [0.5, 1],
    { extrapolateRight: "clamp" },
  );
  // Subtle zoom on highlighted row
  const rowZoom = interpolate(frame, [95, 130], [1, 1.02], { extrapolateRight: "clamp" });

  // Detail overlay that zooms into the row
  const detailOpacity = interpolate(frame, [150, 172], [0, 1], { extrapolateRight: "clamp" });

  const txt1Op = interpolate(frame, [160, 180], [0, 1], { extrapolateRight: "clamp" });
  const txt2Op = interpolate(frame, [180, 200], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity, fontFamily: T.font }}>
      <Background frame={frame} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 120px",
          gap: 16,
        }}
      >
        {/* Heading */}
        <div style={{ width: "100%", maxWidth: 820 }}>
          <p style={{
            margin: "0 0 4px",
            fontSize: 12,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: T.accentDim,
            opacity: interpolate(frame, [5, 22], [0, 1], { extrapolateRight: "clamp" }),
          }}>
            Recent Transactions
          </p>
        </div>

        {/* Transaction rows */}
        {TRANSACTIONS.map((tx, i) => {
          const isHL  = tx.highlight;
          const glowV = isHL ? glowPulse : 0;

          return (
            <div
              key={tx.merchant}
              style={{
                width: "100%",
                maxWidth: 820,
                opacity: rows[i].op,
                transform: `translateY(${interpolate(rows[i].sp, [0, 1], [48, 0])}px) scale(${isHL ? rowZoom : 1})`,
                // Pass transformOrigin for the zoom to centre on the row
                transformOrigin: "center center",
              }}
            >
              <GlassCard
                glow={isHL}
                padding="18px 24px"
                style={{
                  boxShadow: isHL
                    ? `0 0 ${32 + glowV * 20}px rgba(34,197,94,${0.18 + glowV * 0.12}), 0 8px 32px rgba(0,0,0,0.4)`
                    : undefined,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Date */}
                  <span style={{ fontSize: 12, color: T.textDim, width: 52, flexShrink: 0 }}>{tx.date}</span>

                  {/* Merchant */}
                  <span style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: isHL ? 700 : 500,
                    color: isHL ? T.text : T.textSub,
                  }}>
                    {tx.merchant}
                  </span>

                  {/* Category pill */}
                  <div style={{
                    padding: "4px 12px",
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 600,
                    background: `${CATEGORY_COLORS[tx.category]}18`,
                    border: `1px solid ${CATEGORY_COLORS[tx.category]}44`,
                    color: CATEGORY_COLORS[tx.category],
                  }}>
                    {tx.category}
                  </div>

                  {/* Amount */}
                  <span style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isHL ? T.accent : T.text,
                    textShadow: isHL ? `0 0 20px ${T.accentGlow}` : undefined,
                    minWidth: 120,
                    textAlign: "right",
                  }}>
                    {tx.amount}
                  </span>
                </div>
              </GlassCard>
            </div>
          );
        })}

        {/* Copy */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: T.text, opacity: txt1Op }}>
            Full transparency.
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 20, color: T.textSub, opacity: txt2Op }}>
            Every transaction. Organized.
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
