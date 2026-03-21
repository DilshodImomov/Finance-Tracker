import { CSSProperties, ReactNode } from "react";
import { T } from "../theme";

interface Props {
  children: ReactNode;
  style?:   CSSProperties;
  /** Emit green glow border */
  glow?:    boolean;
  padding?: number | string;
  radius?:  number;
}

export function GlassCard({ children, style, glow = false, padding = 28, radius = 18 }: Props) {
  return (
    <div
      style={{
        background:           glow ? "rgba(34,197,94,0.045)" : T.surface,
        backdropFilter:       "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border:               `1px solid ${glow ? T.borderGlow : T.border}`,
        borderRadius:         radius,
        padding,
        boxShadow:            glow
          ? `0 0 40px ${T.accentGlow}, 0 8px 32px rgba(0,0,0,0.4)`
          : "0 8px 32px rgba(0,0,0,0.35)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
