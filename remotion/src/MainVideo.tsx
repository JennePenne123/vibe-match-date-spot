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

// Storytelling structure:
// 1. HOOK: "90% aller Dates sind mittelmäßig" (2s = 60f)
// 2. PAIN: Chat conversation showing frustration (2.5s = 75f)
// 3. TWIST: "Stell dir vor..." + venue reveal (2.5s = 75f)
// 4. SOLUTION: H!Outz brand + features (2s = 60f)
// 5. CTA: Urgency + waitlist (2.5s = 75f)
// Transitions: 4 × 15f = 60f overlap
// Total: 60+75+75+60+75 - 60 = 285 ≈ 300 frames (10s)

export const MainVideo = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        {/* HOOK — provocative stat */}
        <TransitionSeries.Sequence durationInFrames={65}>
          <SceneHook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />

        {/* PAIN — boring chat */}
        <TransitionSeries.Sequence durationInFrames={78}>
          <SceneEmotion />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-top-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />

        {/* TWIST — beautiful venue reveal */}
        <TransitionSeries.Sequence durationInFrames={78}>
          <SceneFeatures />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />

        {/* SOLUTION — H!Outz brand */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <SceneSocial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />

        {/* CTA — urgency + signup */}
        <TransitionSeries.Sequence durationInFrames={80}>
          <SceneCTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
