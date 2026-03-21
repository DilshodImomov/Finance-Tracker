import { interpolate } from "remotion";
import { T } from "../theme";

/** Deterministic pseudo-random particles — no Math.random() in render */
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  x:       (i * 43 + 17) % 100,
  baseY:   (i * 31 + 71) % 100,
  r:       0.5 + ((i * 7) % 3) * 0.5,           // 0.5–1.5 px radius
  opacity: 0.018 + ((i * 13) % 6) * 0.008,      // very subtle
  speed:   2.5 + ((i * 11) % 5),                // px / 30 frames
}));

interface Props {
  frame: number;
  /** Override accent colour for variety between scenes */
  tint?: string;
}

export function Background({ frame, tint = T.accent }: Props) {
  const t = frame * 0.0025; // very slow oscillation

  // Slowly drifting gradient blobs
  const b1x = 12 + Math.sin(t)         * 10;
  const b1y = 18 + Math.cos(t * 0.7)   * 8;
  const b2x = 72 + Math.cos(t * 0.8)   * 12;
  const b2y = 62 + Math.sin(t * 0.6)   * 9;
  const b3x = 44 + Math.sin(t * 0.5+1) * 7;
  const b3y = 82 + Math.cos(t * 0.9)   * 5;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: T.bg }}>

      {/* ── Gradient blobs ─────────────────────────────────── */}
      {[
        { x: b1x, y: b1y, size: 700, color: tint,      opacity: 0.07 },
        { x: b2x, y: b2y, size: 550, color: T.indigo,  opacity: 0.055 },
        { x: b3x, y: b3y, size: 400, color: tint,      opacity: 0.04 },
      ].map((blob, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width:  blob.size,
            height: blob.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 68%)`,
            opacity: blob.opacity,
            left: `${blob.x}%`,
            top:  `${blob.y}%`,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* ── Floating micro-particles ───────────────────────── */}
      {PARTICLES.map((p, i) => {
        const driftY = (frame * p.speed * 0.04) % 120;
        const currentY = (p.baseY - driftY + 120) % 120 - 10;
        const twinkle = 0.6 + 0.4 * Math.sin(frame * 0.04 + i * 1.3);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left:    `${p.x}%`,
              top:     `${currentY}%`,
              width:   p.r * 2,
              height:  p.r * 2,
              borderRadius: "50%",
              background: tint,
              opacity: p.opacity * twinkle,
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* ── Vignette ───────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(0,0,0,0.72) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
