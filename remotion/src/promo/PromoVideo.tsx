import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { SceneHook } from "./SceneHook";
import { ScenePhone } from "./ScenePhone";
import { ScenePayoff } from "./ScenePayoff";
import { SceneCTA } from "./SceneCTA";

// 12s @ 30fps = 360 frames
// Hook 45 + Phone 90 + Payoff 120 + CTA 135 = 390, minus 3×10f transitions = 360
export const PromoVideo = () => {
  return (
    <AbsoluteFill style={{ background: "#0F172A" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={45}>
          <SceneHook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <ScenePhone />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />
        <TransitionSeries.Sequence durationInFrames={120}>
          <ScenePayoff />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />
        <TransitionSeries.Sequence durationInFrames={135}>
          <SceneCTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};