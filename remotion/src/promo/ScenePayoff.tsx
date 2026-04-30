import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Emoji } from "./Emoji";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"] });

// Scene 3: PAYOFF — 3 schnelle Cuts auf den Beat (120f / 4s)
// Bowling 40f, MiniGolf 40f, Rooftop 40f
export const ScenePayoff = () => {
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Sequence from={0} durationInFrames={40}>
        <PayoffMoment
          emoji="🎳"
          big="STRIKE!"
          sub="Bowling · 22:14 Uhr"
          accent="#F97316"
          bg="linear-gradient(135deg, #7C2D12 0%, #1E293B 100%)"
        />
      </Sequence>
      <Sequence from={40} durationInFrames={40}>
        <PayoffMoment
          emoji="🏌️"
          big="HOLE-IN-ONE"
          sub="Mini-Golf · High Five"
          accent="#0D9488"
          bg="linear-gradient(135deg, #134E4A 0%, #0F172A 100%)"
        />
      </Sequence>
      <Sequence from={80} durationInFrames={40}>
        <PayoffMoment
          emoji="🍹"
          big="CHEERS!"
          sub="Rooftop · Sonnenuntergang"
          accent="#F97316"
          bg="linear-gradient(135deg, #7C2D12 0%, #831843 50%, #1E293B 100%)"
        />
      </Sequence>
    </AbsoluteFill>
  );
};

const PayoffMoment: React.FC<{
  emoji: string; big: string; sub: string; accent: string; bg: string;
}> = ({ emoji, big, sub, accent, bg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Hard cut in (no fade)
  const emojiSpring = spring({ frame, fps, config: { damping: 8, stiffness: 220 } });
  const emojiScale = interpolate(emojiSpring, [0, 1], [2.5, 1]);
  const emojiRotate = interpolate(emojiSpring, [0, 1], [-25, 0]);

  // Flash on cut
  const flash = interpolate(frame, [0, 4, 8], [1, 0.4, 0], { extrapolateRight: "clamp" });

  // Big text slams in at frame 6
  const textSpring = spring({ frame: frame - 6, fps, config: { damping: 10, stiffness: 200 } });
  const textScale = interpolate(textSpring, [0, 1], [0.5, 1]);
  const textOpacity = interpolate(frame, [6, 12], [0, 1], { extrapolateRight: "clamp" });

  // Subtle zoom over time
  const bgZoom = interpolate(frame, [0, 40], [1.05, 1.15]);

  // Confetti dots
  const confetti = Array.from({ length: 12 }, (_, i) => i);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Background */}
      <div style={{
        position: "absolute", inset: 0,
        background: bg,
        transform: `scale(${bgZoom})`,
      }} />

      {/* Flash */}
      <div style={{
        position: "absolute", inset: 0, background: "white",
        opacity: flash,
      }} />

      {/* Confetti */}
      {confetti.map((i) => {
        const delay = i * 0.5;
        const x = (i * 137) % 1080;
        const startY = -100;
        const endY = 1920;
        const y = interpolate(frame - delay, [0, 40], [startY, endY], { extrapolateRight: "clamp" });
        const rotate = interpolate(frame, [0, 40], [0, 360 * (i % 2 === 0 ? 1 : -1)]);
        const colors = ["#F97316", "#0D9488", "#FFE500", "#FFFFFF"];
        return (
          <div key={i} style={{
            position: "absolute",
            left: x, top: y,
            width: 14, height: 20,
            background: colors[i % colors.length],
            transform: `rotate(${rotate}deg)`,
            borderRadius: 2,
          }} />
        );
      })}

      {/* Giant emoji */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", justifyContent: "center", alignItems: "center",
        transform: `scale(${emojiScale}) rotate(${emojiRotate}deg)`,
      }}>
        <Emoji char={emoji} size={480} style={{ filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.8))" }} />
      </div>

      {/* Big text */}
      <div style={{
        position: "absolute", bottom: 380, left: 0, right: 0,
        textAlign: "center",
        opacity: textOpacity,
        transform: `scale(${textScale})`,
      }}>
        <div style={{
          fontFamily, fontSize: 130, fontWeight: 900,
          color: "white", letterSpacing: -3, lineHeight: 1,
          textShadow: `0 0 40px ${accent}, 0 10px 30px rgba(0,0,0,0.8)`,
          WebkitTextStroke: `3px ${accent}`,
        }}>
          {big}
        </div>
        <div style={{
          marginTop: 24,
          fontFamily, fontSize: 36, fontWeight: 700,
          color: accent,
          textShadow: "0 4px 20px rgba(0,0,0,0.8)",
        }}>
          {sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};