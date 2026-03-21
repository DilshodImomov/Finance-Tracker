/**
 * Scene 7 — Final CTA  (45–50s / 150 frames)
 * Dark cinematic close. Dashboard blurred behind.
 * "DIB Purchase Monitor" — "Take control." — "Built for clarity."
 * Fades to black.
 */
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { Background } from "../../components/Background";
import { T } from "../../theme";

const DUR = 150;

export function Scene7_CTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 18, DUR - 22, DUR], [0, 1, 1, 0], { extrapolateRight: "clamp" });

  // Cinematic slow zoom out (scale down slightly for finality)
  const zoom = interpolate(frame, [0, DUR], [1.04, 1.0], { extrapolateRight: "clamp" });

  // Logo mark
  const logoScale = spring({ frame, fps, config: { damping: 14, mass: 0.9 }, durationInFrames: 32 });

  // App name
  const titleSp   = spring({ frame: frame - 14, fps, config: { damping: 14, mass: 0.9 }, durationInFrames: 40 });
  const titleOp   = interpolate(frame, [14, 34], [0, 1], { extrapolateRight: "clamp" });

  // Tagline
  const tagOp     = interpolate(frame, [38, 58], [0, 1], { extrapolateRight: "clamp" });
  const tagY      = interpolate(frame, [38, 58], [14, 0],  { extrapolateRight: "clamp" });

  // "Built for clarity."
  const builtOp   = interpolate(frame, [62, 82], [0, 1], { extrapolateRight: "clamp" });

  // Pills row
  const pillsOp   = interpolate(frame, [85, 105], [0, 1], { extrapolateRight: "clamp" });

  // Large glow behind logo — pulses once
  const glowPulse = interpolate(frame, [0, 25, 60, DUR], [0, 0.7, 0.4, 0.35], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      {/* Deep background */}
      <AbsoluteFill style={{ background: "#01020b" }}>
        <Background frame={frame} tint={T.accent} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: T.font,
          gap: 0,
        }}
      >
        {/* Large central glow */}
        <div style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(34,197,94,${glowPulse}) 0%, transparent 65%)`,
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <div style={{
          fontSize: 44,
          color: T.accent,
          transform: `scale(${logoScale})`,
          marginBottom: 22,
          textShadow: `0 0 40px ${T.accentGlowStrong}, 0 0 80px ${T.accentGlow}`,
          position: "relative",
        }}>
          ◆
        </div>

        {/* App name */}
        <h1 style={{
          margin: 0,
          fontSize: 72,
          fontWeight: 800,
          color: T.text,
          letterSpacing: "-3px",
          position: "relative",
          opacity: titleOp,
          transform: `translateY(${interpolate(titleSp, [0, 1], [44, 0])}px)`,
        }}>
          DIB Purchase Monitor
        </h1>

        {/* Tagline */}
        <p style={{
          margin: "20px 0 0",
          fontSize: 28,
          fontWeight: 400,
          color: T.textSub,
          opacity: tagOp,
          transform: `translateY(${tagY}px)`,
          position: "relative",
        }}>
          Take control of your spending.
        </p>

        {/* Divider */}
        <div style={{
          width: interpolate(frame, [60, 92], [0, 200], { extrapolateRight: "clamp" }),
          height: 1,
          background: `linear-gradient(90deg, transparent, ${T.borderGlow}, transparent)`,
          margin: "32px 0",
          position: "relative",
        }} />

        {/* "Built for clarity." */}
        <p style={{
          margin: 0,
          fontSize: 18,
          letterSpacing: "6px",
          textTransform: "uppercase",
          color: T.accent,
          opacity: builtOp,
          position: "relative",
          textShadow: `0 0 24px ${T.accentGlowStrong}`,
        }}>
          Built for clarity.
        </p>

        {/* Pill row */}
        <div style={{
          display: "flex",
          gap: 10,
          marginTop: 44,
          opacity: pillsOp,
          position: "relative",
        }}>
          {["Open source", "Self-hosted", "Zero data leaks"].map(pill => (
            <div key={pill} style={{
              padding: "8px 22px",
              borderRadius: 100,
              fontSize: 13,
              border: `1px solid ${T.border}`,
              color: T.textSub,
              background: T.surface,
              backdropFilter: "blur(16px)",
              letterSpacing: "0.3px",
            }}>
              {pill}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
