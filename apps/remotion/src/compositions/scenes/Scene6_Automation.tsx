/**
 * Scene 6 — Automation / Admin  (38–45s / 210 frames)
 * Category list + auto-rule being added with green highlight flash.
 */
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { Background } from "../../components/Background";
import { GlassCard } from "../../components/GlassCard";
import { T } from "../../theme";

const DUR = 210;

const CATEGORIES = ["Dining", "Groceries", "Parking", "Subscriptions", "Shopping", "Health"];

const EXISTING_RULES = [
  { pattern: "CARREFOUR",  category: "Groceries"     },
  { pattern: "SALIK",      category: "Parking"        },
  { pattern: "NETFLIX",    category: "Subscriptions"  },
];

// The rule being "added" during the scene
const NEW_RULE = { pattern: "SMILES", category: "Dining" };

export function Scene6_Automation() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 22, DUR - 18, DUR], [0, 1, 1, 0], { extrapolateRight: "clamp" });

  // Categories panel slides in
  const catPanelSp = spring({ frame: frame - 12, fps, config: { damping: 16, mass: 0.9 }, durationInFrames: 45 });

  // Rules panel slides in
  const rulesPanelSp = spring({ frame: frame - 30, fps, config: { damping: 16, mass: 0.9 }, durationInFrames: 45 });

  // Existing rules stagger
  const existingRows = EXISTING_RULES.map((_, i) => ({
    op: interpolate(frame, [50 + i * 14, 68 + i * 14], [0, 1], { extrapolateRight: "clamp" }),
    y:  spring({ frame: frame - 50 - i * 14, fps, config: { damping: 18 }, durationInFrames: 35 }),
  }));

  // "Add rule" form appears
  const formOpacity = interpolate(frame, [105, 125], [0, 1], { extrapolateRight: "clamp" });

  // Rule creation flash — bright green pulse
  const ruleCreated    = frame >= 148;
  const flashIntensity = interpolate(frame, [148, 155, 172, 185], [0, 1, 0.6, 0], { extrapolateRight: "clamp" });
  const newRowOpacity  = interpolate(frame, [148, 162], [0, 1], { extrapolateRight: "clamp" });

  const txt1Op = interpolate(frame, [165, 185], [0, 1], { extrapolateRight: "clamp" });
  const txt2Op = interpolate(frame, [185, 205], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity, fontFamily: T.font }}>
      <Background frame={frame} tint={T.accent} />

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 100px",
          gap: 24,
        }}
      >
        {/* ── Left: Categories ──────────────────────────── */}
        <GlassCard
          padding="24px 28px"
          style={{
            width: 260,
            flexShrink: 0,
            alignSelf: "flex-start",
            opacity: spring({ frame: frame - 12, fps, config: { damping: 16 }, durationInFrames: 45 }),
            transform: `translateX(${interpolate(catPanelSp, [0, 1], [-40, 0])}px)`,
          }}
        >
          <p style={{ margin: "0 0 16px", fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: T.textDim }}>
            Categories
          </p>
          {CATEGORIES.map((cat, i) => {
            const op = interpolate(frame, [25 + i * 10, 40 + i * 10], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div
                key={cat}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  marginBottom: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  color: cat === "Dining" ? T.accent : T.textSub,
                  background: cat === "Dining" ? T.accentGlow : "transparent",
                  border: `1px solid ${cat === "Dining" ? T.borderGlow : "transparent"}`,
                  opacity: op,
                }}
              >
                {cat}
              </div>
            );
          })}
        </GlassCard>

        {/* ── Right: Auto-rules panel ───────────────────── */}
        <GlassCard
          padding="24px 28px"
          style={{
            flex: 1,
            opacity: spring({ frame: frame - 30, fps, config: { damping: 16 }, durationInFrames: 45 }),
            transform: `translateX(${interpolate(rulesPanelSp, [0, 1], [40, 0])}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: T.textDim }}>
              Auto-categorization rules
            </p>
            <div style={{
              padding: "5px 14px", borderRadius: 100, fontSize: 11,
              background: T.accentGlow, border: `1px solid ${T.borderGlow}`,
              color: T.accent, fontWeight: 600,
            }}>
              Active
            </div>
          </div>

          {/* Existing rules */}
          {EXISTING_RULES.map((rule, i) => (
            <div
              key={rule.pattern}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 10,
                marginBottom: 8,
                border: `1px solid ${T.border}`,
                background: T.surface,
                opacity: existingRows[i].op,
                transform: `translateY(${interpolate(existingRows[i].y, [0, 1], [24, 0])}px)`,
              }}
            >
              <code style={{ fontSize: 13, color: "#38bdf8", flex: 1, fontFamily: "monospace" }}>
                {rule.pattern}
              </code>
              <span style={{ fontSize: 13, color: T.textDim }}>→</span>
              <span style={{
                padding: "3px 12px", borderRadius: 100, fontSize: 12,
                background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
                color: T.indigo, fontWeight: 600,
              }}>
                {rule.category}
              </span>
            </div>
          ))}

          {/* New rule input (types in) */}
          {frame >= 105 && (
            <div style={{ opacity: formOpacity }}>
              <div style={{ display: "flex", gap: 10, marginTop: 12, marginBottom: 8 }}>
                {/* Pattern input — simulates typed text */}
                <div style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  border: `1px solid ${T.borderGlow}`,
                  background: "rgba(34,197,94,0.06)",
                  fontSize: 13, color: T.text, fontFamily: "monospace",
                  display: "flex", alignItems: "center",
                }}>
                  {NEW_RULE.pattern.slice(0, Math.floor(interpolate(frame, [118, 145], [0, NEW_RULE.pattern.length], { extrapolateRight: "clamp" })))}
                  <span style={{
                    display: "inline-block", width: 1, height: 14,
                    background: T.accent, marginLeft: 1,
                    opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                  }} />
                </div>
                <div style={{
                  padding: "10px 16px", borderRadius: 10,
                  border: `1px solid ${T.border}`, background: T.surface,
                  fontSize: 13, color: T.textSub,
                }}>
                  Dining
                </div>
              </div>
            </div>
          )}

          {/* Newly added rule — appears with green flash */}
          {ruleCreated && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 10,
                marginBottom: 8,
                border: `1px solid rgba(34,197,94,${0.3 + flashIntensity * 0.5})`,
                background: `rgba(34,197,94,${0.06 + flashIntensity * 0.12})`,
                boxShadow: `0 0 ${20 + flashIntensity * 30}px rgba(34,197,94,${flashIntensity * 0.3})`,
                opacity: newRowOpacity,
              }}
            >
              <code style={{ fontSize: 13, color: "#38bdf8", flex: 1, fontFamily: "monospace" }}>
                {NEW_RULE.pattern}
              </code>
              <span style={{ fontSize: 13, color: T.textDim }}>→</span>
              <span style={{
                padding: "3px 12px", borderRadius: 100, fontSize: 12,
                background: T.accentGlow, border: `1px solid ${T.borderGlow}`,
                color: T.accent, fontWeight: 600,
              }}>
                {NEW_RULE.category}
              </span>
              <span style={{ fontSize: 11, color: T.accent, opacity: flashIntensity }}>✓ Saved</span>
            </div>
          )}
        </GlassCard>
      </AbsoluteFill>

      {/* Copy */}
      <div
        style={{
          position: "absolute",
          bottom: 52,
          left: 0, right: 0,
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: T.text, opacity: txt1Op }}>
          Smart automation.
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 20, color: T.textSub, opacity: txt2Op }}>
          Zero manual work.
        </p>
      </div>
    </AbsoluteFill>
  );
}
