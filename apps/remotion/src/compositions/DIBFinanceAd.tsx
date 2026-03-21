/**
 * DIB Purchase Monitor — 50s Premium SaaS Advertisement
 * 1920×1080 · 30fps · Apple × Stripe × Linear energy
 */
import { AbsoluteFill, Series } from "remotion";
import { Scene1_Hook }        from "./scenes/Scene1_Hook";
import { Scene2_Dashboard }   from "./scenes/Scene2_Dashboard";
import { Scene3_Graph }       from "./scenes/Scene3_Graph";
import { Scene4_Categories }  from "./scenes/Scene4_Categories";
import { Scene5_Transactions } from "./scenes/Scene5_Transactions";
import { Scene6_Automation }  from "./scenes/Scene6_Automation";
import { Scene7_CTA }         from "./scenes/Scene7_CTA";

/** Scene durations in frames at 30fps */
export const DURATIONS = {
  hook:          150, //  5s — "Your money deserves clarity."
  dashboard:     210, //  7s — AED counter, glass cards
  graph:         240, //  8s — Monthly line chart draws
  categories:    300, // 10s — Category breakdown cards
  transactions:  240, //  8s — Transaction list + glow row
  automation:    210, //  7s — Auto-rule creation
  cta:           150, //  5s — Final CTA, fade to black
} as const;

export const TOTAL_FRAMES = Object.values(DURATIONS).reduce((a, b) => a + b, 0); // 1500 = 50s

export function DIBFinanceAd() {
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={DURATIONS.hook}>
          <Scene1_Hook />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.dashboard}>
          <Scene2_Dashboard />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.graph}>
          <Scene3_Graph />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.categories}>
          <Scene4_Categories />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.transactions}>
          <Scene5_Transactions />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.automation}>
          <Scene6_Automation />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.cta}>
          <Scene7_CTA />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
