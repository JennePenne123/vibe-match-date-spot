import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { SceneHook } from "./scenes/SceneHook";
import { SceneEmotion } from "./scenes/SceneEmotion";
import { SceneFeatures } from "./scenes/SceneFeatures";
import { SceneSocial } from "./scenes/SceneSocial";
import { SceneCTA } from "./scenes/SceneCTA";
import { PersistentBackground } from "./components/PersistentBackground";

// Slower pacing — ~14 seconds
// 1. HOOK: 90f (3s)
// 2. PAIN: 105f (3.5s)
// 3. TWIST: 100f (3.3s)
// 4. SOLUTION: 85f (2.8s)
// 5. CTA: 105f (3.5s)
// Transitions: 4 × 18f = 72f overlap
// Total: 90+105+100+85+105 - 72 = 413 ≈ 420 frames

export const MainVideo = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <SceneHook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={105}>
          <SceneEmotion />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-top-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={100}>
          <SceneFeatures />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={85}>
          <SceneSocial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={105}>
          <SceneCTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
