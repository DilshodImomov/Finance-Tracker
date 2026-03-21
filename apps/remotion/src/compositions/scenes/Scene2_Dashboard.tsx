/**
 * Scene 2 — Dashboard Reveal  (5–12s / 210 frames)
 * Slow cinematic zoom into the Finance Dashboard.
 * AED counter counts up. Cards fade in with glass blur.
 */
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { Background } from "../../components/Background";
import { GlassCard } from "../../components/GlassCard";
import { AnimatedCounter } from "../../components/AnimatedCounter";
import { T } from "../../theme";

const DUR = 210;

const STAT_CARDS = [
  { label: "Last Month",    value: "AED 3,120.50" },
  { label: "Year to Date",  value: "AED 28,941.20" },
  { label: "All Time",      value: "AED 89,334.85" },
];

export function Scene2_Dashboard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 20, DUR - 18, DUR], [0, 1, 1, 0], { extrapolateRight: "clamp" });

  // Cinematic slow zoom in
  const zoom = interpolate(frame, [0, DUR], [1.0, 1.07], { extrapolateRight: "clamp" });

  // Hero card
  const heroSpring = spring({ frame: frame - 10, fps, config: { damping: 16, mass: 1 }, durationInFrames: 45 });

  // Delta badge
  const deltaOpacity = interpolate(frame, [55, 78], [0, 1], { extrapolateRight: "clamp" });
  const deltaY       = interpolate(frame, [55, 78], [12, 0],  { extrapolateRight: "clamp" });

  // Stat cards stagger
  const statCards = STAT_CARDS.map((_, i) => ({
    sp:  spring({ frame: frame - 75 - i * 18, fps, config: { damping: 15, mass: 0.8 }, durationInFrames: 40 }),
    op:  interpolate(frame, [75 + i * 18, 90 + i * 18], [0, 1], { extrapolateRight: "clamp" }),
  }));

  // Overlay text
  const txt1Op = interpolate(frame, [128, 150], [0, 1], { extrapolateRight: "clamp" });
  const txt2Op = interpolate(frame, [152, 172], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity, fontFamily: T.font }}>
      <Background frame={frame} />

      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 120px",
          gap: 24,
        }}
      >
        {/* ── Dashboard label ─────────────────────────────── */}
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: T.accentDim,
            opacity: interpolate(frame, [5, 22], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          ◆ DIB Purchase Monitor
        </p>

        {/* ── Hero card ───────────────────────────────────── */}
        <div style={{ width: "100%", maxWidth: 900 }}>
          <GlassCard
            glow
            padding="36px 44px"
            style={{
              opacity: heroSpring,
              transform: `translateY(${interpolate(heroSpring, [0, 1], [50, 0])}px)`,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, letterSpacing: "3px", textTransform: "uppercase", color: T.textSub }}>
              This Month
            </p>

            {/* AED Counter */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 300, color: T.textSub }}>AED</span>
              <AnimatedCounter
                target={2496.75}
                startFrame={20}
                duration={80}
                decimals={2}
                style={{
                  fontSize: 84,
                  fontWeight: 800,
                  letterSpacing: "-3px",
                  lineHeight: 1,
                  color: T.text,
                  textShadow: `0 0 50px ${T.accentGlowStrong}`,
                }}
              />
            </div>

            {/* Delta */}
            <div
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(34,197,94,0.1)",
                border: `1px solid ${T.accentGlow}`,
                borderRadius: 100,
                padding: "6px 16px",
                opacity: deltaOpacity,
                transform: `translateY(${deltaY}px)`,
              }}
            >
              <span style={{ fontSize: 14, color: T.accent, fontWeight: 600 }}>↓ 19.9%</span>
              <span style={{ fontSize: 13, color: T.textSub }}>vs last month</span>
            </div>
          </GlassCard>
        </div>

        {/* ── Stat cards row ──────────────────────────────── */}
        <div style={{ display: "flex", gap: 20, width: "100%", maxWidth: 900 }}>
          {STAT_CARDS.map((card, i) => (
            <GlassCard
              key={card.label}
              padding="22px 26px"
              style={{
                flex: 1,
                opacity: statCards[i].op,
                transform: `translateY(${interpolate(statCards[i].sp, [0, 1], [40, 0])}px)`,
              }}
            >
              <p style={{ margin: 0, fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: T.textDim }}>
                {card.label}
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 700, color: T.text }}>
                {card.value}
              </p>
            </GlassCard>
          ))}
        </div>

        {/* ── Overlay text ────────────────────────────────── */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: T.text, opacity: txt1Op }}>
            Track every dirham.
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 20, color: T.textSub, opacity: txt2Op }}>
            In real time.
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
