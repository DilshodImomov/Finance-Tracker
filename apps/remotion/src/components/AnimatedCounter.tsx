import { useCurrentFrame, interpolate } from "remotion";
import { CSSProperties } from "react";

interface Props {
  target:       number;
  startFrame?:  number;
  duration?:    number;
  decimals?:    number;
  prefix?:      string;
  suffix?:      string;
  style?:       CSSProperties;
}

/** Counts from 0 → target with ease-out-quart easing */
export function AnimatedCounter({
  target,
  startFrame = 0,
  duration   = 90,
  decimals   = 2,
  prefix     = "",
  suffix     = "",
  style,
}: Props) {
  const frame = useCurrentFrame();

  const value = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, target],
    {
      extrapolateLeft:  "clamp",
      extrapolateRight: "clamp",
      easing: (t) => 1 - Math.pow(1 - t, 4),
    },
  );

  const formatted = value.toLocaleString("en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span style={style}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
