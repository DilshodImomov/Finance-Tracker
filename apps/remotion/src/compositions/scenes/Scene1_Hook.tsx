/**
 * Scene 1 — Hook  (0–5s / 150 frames)
 * "Your money deserves clarity. Not chaos."
 * Calm, centered, cinematic open.
 */
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { Background } from "../../components/Background";
import { T } from "../../theme";

const DUR = 150;

export function Scene1_Hook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene fade in / out
  const sceneOpacity = interpolate(
    frame,
    [0, 18, DUR - 18, DUR],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" },
  );

  // "Your money deserves" — slides up + fades in
  const line1Spring = spring({ frame: frame - 20, fps, config: { damping: 18, mass: 1.1 }, durationInFrames: 45 });
  const line1Opacity = interpolate(frame, [20, 42], [0, 1], { extrapolateRight: "clamp" });

  // "clarity." — with glow
  const line2Spring = spring({ frame: frame - 45, fps, config: { damping: 16, mass: 0.9 }, durationInFrames: 40 });
  const line2Opacity = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });

  // "Not chaos." — fades in underneath
  const line3Opacity = interpolate(frame, [85, 108], [0, 1], { extrapolateRight: "clamp" });
  const line3Y       = interpolate(frame, [85, 108], [16, 0], { extrapolateRight: "clamp" });

  // Slow cinematic zoom
  const zoom = interpolate(frame, [0, DUR], [1.0, 1.04], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <Background frame={frame} />

      <AbsoluteFill
        style={{
          transform:  `scale(${zoom})`,
          display:    "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: T.font,
          gap: 0,
        }}
      >
        {/* Line 1 */}
        <p
          style={{
            margin: 0,
            fontSize: 52,
            fontWeight: 300,
            color:   T.textSub,
            letterSpacing: "0.5px",
            opacity: line1Opacity,
            transform: `translateY(${interpolate(line1Spring, [0, 1], [36, 0])}px)`,
          }}
        >
          Your money deserves
        </p>

        {/* Line 2 — "clarity." in glowing green */}
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: "-3.5px",
            lineHeight: 1.05,
            color:  T.accent,
            textShadow: `0 0 60px ${T.accentGlowStrong}, 0 0 120px ${T.accentGlow}`,
            opacity: line2Opacity,
            transform: `translateY(${interpolate(line2Spring, [0, 1], [40, 0])}px)`,
          }}
        >
          clarity.
        </p>

        {/* Divider line */}
        <div
          style={{
            width: interpolate(frame, [80, 115], [0, 160], { extrapolateRight: "clamp" }),
            height: 1,
            background: `linear-gradient(90deg, transparent, ${T.borderGlow}, transparent)`,
            margin: "28px 0",
          }}
        />

        {/* Line 3 — "Not chaos." */}
        <p
          style={{
            margin: 0,
            fontSize: 38,
            fontWeight: 400,
            color:   T.textSub,
            letterSpacing: "6px",
            textTransform: "uppercase",
            opacity: line3Opacity,
            transform: `translateY(${line3Y}px)`,
          }}
        >
          Not chaos.
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
