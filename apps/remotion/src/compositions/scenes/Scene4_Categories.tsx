/**
 * Scene 4 — Category Breakdown  (20–30s / 300 frames)
 * Category cards animate upward with stagger.
 * Progress bars fill to percentage.
 */
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { Background } from "../../components/Background";
import { GlassCard } from "../../components/GlassCard";
import { T } from "../../theme";

const DUR = 300;

const CATEGORIES = [
  { label: "Dining",        pct: 56.1, amount: "AED 1,401.68", color: T.accent },
  { label: "Groceries",     pct: 16.6, amount: "AED 414.46",   color: "#6366f1" },
  { label: "Parking",       pct:  7.2, amount: "AED 179.77",   color: "#38bdf8" },
  { label: "Subscriptions", pct:  6.5, amount: "AED 162.29",   color: "#f59e0b" },
];

export function Scene4_Categories() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 20, DUR - 18, DUR], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const zoom = interpolate(frame, [0, DUR], [1.0, 1.03], { extrapolateRight: "clamp" });

  // Staggered card spring animations
  const cards = CATEGORIES.map((_, i) => ({
    sp: spring({ frame: frame - 30 - i * 25, fps, config: { damping: 16, mass: 0.9 }, durationInFrames: 45 }),
    op: interpolate(frame, [30 + i * 25, 50 + i * 25], [0, 1], { extrapolateRight: "clamp" }),
    // Bar fill progress
    barW: interpolate(frame, [55 + i * 25, 120 + i * 25], [0, CATEGORIES[i].pct], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
      easing: (t) => 1 - Math.pow(1 - t, 3),
    }),
  }));

  const txt1Op = interpolate(frame, [210, 232], [0, 1], { extrapolateRight: "clamp" });
  const txt2Op = interpolate(frame, [232, 252], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity, fontFamily: T.font }}>
      <Background frame={frame} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${zoom})`,
          padding: "0 120px",
          gap: 16,
        }}
      >
        {/* Section heading */}
        <div style={{ width: "100%", maxWidth: 820, marginBottom: 8 }}>
          <p style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: T.accentDim,
            opacity: interpolate(frame, [5, 22], [0, 1], { extrapolateRight: "clamp" }),
          }}>
            Spending by category
          </p>
        </div>

        {/* Category cards */}
        {CATEGORIES.map((cat, i) => (
          <GlassCard
            key={cat.label}
            padding="22px 28px"
            glow={i === 0}
            style={{
              width: "100%",
              maxWidth: 820,
              opacity: cards[i].op,
              transform: `translateY(${interpolate(cards[i].sp, [0, 1], [60, 0])}px)`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Colour dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: cat.color,
                  boxShadow: `0 0 10px ${cat.color}88`,
                }} />
                <span style={{ fontSize: 18, fontWeight: 600, color: T.text }}>{cat.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: cat.color }}>
                  {cards[i].barW.toFixed(1)}%
                </span>
                <span style={{ fontSize: 16, color: T.textSub }}>{cat.amount}</span>
              </div>
            </div>

            {/* Bar */}
            <div style={{ height: 5, borderRadius: 3, background: T.border, overflow: "hidden" }}>
              <div
                style={{
                  width: `${cards[i].barW}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${cat.color}99, ${cat.color})`,
                  boxShadow: `0 0 14px ${cat.color}66`,
                  transition: "width 0.05s",
                }}
              />
            </div>
          </GlassCard>
        ))}

        {/* Copy */}
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: T.text, opacity: txt1Op }}>
            Know where your money goes.
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 20, color: T.textSub, opacity: txt2Op }}>
            No guessing.
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
