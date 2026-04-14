import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { SceneLogoIntro } from "./scenes/SceneLogoIntro";
import { SceneBored } from "./scenes/SceneBored";
import { SceneFrustrated } from "./scenes/SceneFrustrated";
import { SceneBling } from "./scenes/SceneBling";
import { SceneHappyDate } from "./scenes/SceneHappyDate";
import { SceneFinale } from "./scenes/SceneFinale";
import { LogoWatermark } from "./components/LogoWatermark";

// Pop Art Comic v2 — ~22 seconds
// 1. LOGO INTRO: 75f (2.5s) — dramatic brand entrance
// 2. BORED COUPLE: 130f (4.3s) — slow zoom, desaturation
// 3. FRUSTRATED FACE: 100f (3.3s) — dramatic close-up
// 4. BLING! PHONE: 90f (3s) — explosive notification + logo from phone
// 5. HAPPY DATE: 110f (3.7s) — payoff with hearts
// 6. CTA FINALE: 160f (5.3s) — giant logo + waitlist counter
// Transitions: 5 × 18f = 90f overlap
// Total: 75+130+100+90+110+160 - 90 = 575 frames

export const MainVideo = () => {
  return (
    <AbsoluteFill style={{ background: "#050A15" }}>
      {/* Subtle logo watermark throughout */}
      <LogoWatermark />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={75}>
          <SceneLogoIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={130}>
          <SceneBored />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={100}>
          <SceneFrustrated />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <SceneBling />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={110}>
          <SceneHappyDate />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={160}>
          <SceneFinale />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
