import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { ComicPanel1 } from "./scenes/ComicPanel1";
import { ComicPanel2 } from "./scenes/ComicPanel2";
import { ComicPanel3 } from "./scenes/ComicPanel3";
import { ComicPanel4 } from "./scenes/ComicPanel4";
import { ComicPanel5 } from "./scenes/ComicPanel5";
import { ComicCTA } from "./scenes/ComicCTA";

// Comic video — ~18 seconds at 30fps
// 1. Bored couple: 105f (3.5s)
// 2. Annoyed face: 90f (3s)
// 3. BLING! phone: 75f (2.5s)
// 4. AI recommendation: 105f (3.5s)
// 5. Happy couple: 100f (3.3s)
// 6. CTA: 120f (4s)
// Transitions: 5 × 15f = 75f overlap
// Total: 105+90+75+105+100+120 - 75 = 520 frames

export const MainVideo = () => {
  return (
    <AbsoluteFill style={{ background: "#FFE500" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={105}>
          <ComicPanel1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <ComicPanel2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={75}>
          <ComicPanel3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={105}>
          <ComicPanel4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={100}>
          <ComicPanel5 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={120}>
          <ComicCTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
