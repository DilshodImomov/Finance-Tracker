import { Composition } from "remotion";
import { DIBFinanceAd, TOTAL_FRAMES } from "./compositions/DIBFinanceAd";

export function Root() {
  return (
    <Composition
      id="DIBFinanceAd"
      component={DIBFinanceAd}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
