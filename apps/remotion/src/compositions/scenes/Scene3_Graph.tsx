/**
 * Scene 3 — Monthly Spending Graph  (12–20s / 240 frames)
 * Green line draws left to right. Camera pans slightly.
 * Animated grid + overlay copy.
 */
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { Background } from "../../components/Background";
import { GlassCard } from "../../components/GlassCard";
import { T } from "../../theme";

const DUR = 240;

const DATA = [
  { month: "Aug", value: 8200  },
  { month: "Sep", value: 9440  },
  { month: "Oct", value: 11800 },
  { month: "Nov", value: 15100 },
  { month: "Dec", value: 13200 },
  { month: "Jan", value: 10600 },
  { month: "Feb", value: 12450 },
];

const SVG_W = 900;
const SVG_H = 240;
const PAD   = { t: 20, b: 44, l: 8, r: 8 };
const cw    = SVG_W - PAD.l - PAD.r;
const ch    = SVG_H - PAD.t - PAD.b;

const minV = Math.min(...DATA.map(d => d.value));
const maxV = Math.max(...DATA.map(d => d.value));

function toX(i: number) { return PAD.l + (i / (DATA.length - 1)) * cw; }
function toY(v: number)  { return PAD.t + ((maxV - v) / (maxV - minV)) * ch; }

/** Smooth cubic bezier path through points */
function buildLinePath() {
  const pts = DATA.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const dx = (pts[i].x - pts[i - 1].x) / 2;
    d += ` C ${pts[i-1].x + dx} ${pts[i-1].y} ${pts[i].x - dx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

/** Area fill path (closes to bottom) */
function buildAreaPath() {
  const pts = DATA.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  let d = `M ${pts[0].x} ${SVG_H - PAD.b}`;
  d += ` L ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const dx = (pts[i].x - pts[i - 1].x) / 2;
    d += ` C ${pts[i-1].x + dx} ${pts[i-1].y} ${pts[i].x - dx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${SVG_H - PAD.b} Z`;
  return d;
}

const LINE_PATH = buildLinePath();
const AREA_PATH = buildAreaPath();
// Grid rows at 25%, 50%, 75%
const GRID_Ys   = [0.25, 0.5, 0.75].map(p => PAD.t + p * ch);

export function Scene3_Graph() {
  const frame = useCurrentFrame();

  const sceneOpacity = interpolate(frame, [0, 20, DUR - 18, DUR], [0, 1, 1, 0], { extrapolateRight: "clamp" });

  // Slow horizontal camera pan via translateX
  const panX = interpolate(frame, [0, DUR], [30, -30], { extrapolateRight: "clamp" });

  // Grid fade
  const gridOpacity = interpolate(frame, [8, 30], [0, 1], { extrapolateRight: "clamp" });

  // Line reveal: left-to-right clip
  const revealPct = interpolate(frame, [25, 145], [0, 100], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2*t) * t, // ease in-out quad
  });
  const revealW = (revealPct / 100) * SVG_W;

  // Data point dots appear after line passes them
  const dotOpacities = DATA.map((_, i) => {
    const lineXFraction = toX(i) / SVG_W * 100;
    return interpolate(frame, [25 + (lineXFraction / 100) * 120, 25 + (lineXFraction / 100) * 120 + 15], [0, 1], { extrapolateRight: "clamp" });
  });

  // Copy
  const txt1Op = interpolate(frame, [155, 178], [0, 1], { extrapolateRight: "clamp" });
  const txt2Op = interpolate(frame, [178, 200], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity, fontFamily: T.font }}>
      <Background frame={frame} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateX(${panX}px)`,
          padding: "0 120px",
          gap: 28,
        }}
      >
        <GlassCard padding="36px 40px" style={{ width: "100%", maxWidth: 980 }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: T.textDim }}>
                Monthly Spending
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 700, color: T.text }}>
                AED 12,450
                <span style={{ fontSize: 14, color: T.accent, marginLeft: 12, fontWeight: 500 }}>
                  ↓ 5.7% YoY
                </span>
              </p>
            </div>
            {/* Timeline pill */}
            <div style={{ display: "flex", gap: 6 }}>
              {["3M","6M","12M"].map((l, i) => (
                <div
                  key={l}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 100,
                    fontSize: 12,
                    background:  i === 2 ? T.accentGlow : "transparent",
                    border:      `1px solid ${i === 2 ? T.borderGlow : T.border}`,
                    color:       i === 2 ? T.accent : T.textDim,
                    fontWeight:  i === 2 ? 600 : 400,
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ overflow: "visible", width: "100%" }}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={T.accent} stopOpacity="0.18" />
                <stop offset="100%" stopColor={T.accent} stopOpacity="0.01" />
              </linearGradient>
              <clipPath id="lineReveal">
                <rect x="0" y="0" width={revealW} height={SVG_H} />
              </clipPath>
            </defs>

            {/* Animated grid lines */}
            {GRID_Ys.map((y, i) => (
              <line
                key={i}
                x1={PAD.l} y1={y} x2={SVG_W - PAD.r} y2={y}
                stroke={T.border}
                strokeWidth="1"
                opacity={gridOpacity}
                strokeDasharray="4 6"
              />
            ))}

            {/* Area fill */}
            <path d={AREA_PATH} fill="url(#areaFill)" clipPath="url(#lineReveal)" />

            {/* Line */}
            <path
              d={LINE_PATH}
              stroke={T.accent}
              strokeWidth="2.5"
              fill="none"
              clipPath="url(#lineReveal)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Glow duplicate line (blur) */}
            <path
              d={LINE_PATH}
              stroke={T.accent}
              strokeWidth="7"
              fill="none"
              clipPath="url(#lineReveal)"
              opacity="0.18"
              strokeLinecap="round"
            />

            {/* Data point dots */}
            {DATA.map((d, i) => (
              <g key={i}>
                <circle
                  cx={toX(i)} cy={toY(d.value)}
                  r="5"
                  fill={T.bg}
                  stroke={T.accent}
                  strokeWidth="2.5"
                  opacity={dotOpacities[i]}
                />
                {/* Outer glow ring */}
                <circle
                  cx={toX(i)} cy={toY(d.value)}
                  r="10"
                  fill="none"
                  stroke={T.accent}
                  strokeWidth="1"
                  opacity={dotOpacities[i] * 0.3}
                />
              </g>
            ))}

            {/* Month labels */}
            {DATA.map((d, i) => (
              <text
                key={i}
                x={toX(i)} y={SVG_H - 6}
                textAnchor="middle"
                fontSize="12"
                fill={T.textDim}
                opacity={gridOpacity}
              >
                {d.month}
              </text>
            ))}
          </svg>
        </GlassCard>

        {/* Overlay copy */}
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: T.text, opacity: txt1Op }}>
            See trends instantly.
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 20, color: T.textSub, opacity: txt2Op }}>
            Make smarter decisions.
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
