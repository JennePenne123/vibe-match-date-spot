import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { SceneHook } from "./scenes/SceneHook";
import { SceneEmotion } from "./scenes/SceneEmotion";
import { SceneFeatures } from "./scenes/SceneFeatures";
import { SceneSocial } from "./scenes/SceneSocial";
import { SceneCTA } from "./scenes/SceneCTA";
import { PersistentBackground } from "./components/PersistentBackground";

export const MainVideo = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={130}>
          <SceneHook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={130}>
          <SceneEmotion />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
        />
        <TransitionSeries.Sequence durationInFrames={140}>
          <SceneFeatures />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={130}>
          <SceneSocial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
        />
        <TransitionSeries.Sequence durationInFrames={135}>
          <SceneCTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
