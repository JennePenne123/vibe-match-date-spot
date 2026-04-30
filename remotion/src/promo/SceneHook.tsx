import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"] });

// Scene 1: HOOK — "Schon wieder Pizza?" (45f / 1.5s)
export const SceneHook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Glitchy zoom in
  const zoomSpring = spring({ frame, fps, config: { damping: 12, stiffness: 180 } });
  const scale = interpolate(zoomSpring, [0, 1], [1.4, 1]);

  // Text knallt ab Frame 8 rein
  const textSpring = spring({ frame: frame - 8, fps, config: { damping: 8, stiffness: 220 } });
  const textScale = interpolate(textSpring, [0, 1], [0.3, 1]);
  const textOpacity = interpolate(frame, [8, 14], [0, 1], { extrapolateRight: "clamp" });

  // Subtle shake
  const shakeX = frame >= 8 && frame < 20 ? Math.sin(frame * 4) * (20 - frame) * 0.6 : 0;

  // Bored emoji floats up
  const emojiY = interpolate(frame, [0, 45], [0, -40]);
  const emojiOpacity = interpolate(frame, [0, 8, 35, 45], [0, 1, 1, 0.5], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>
      {/* Dark vignette gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, #1E293B 0%, #000000 80%)",
        transform: `scale(${scale})`,
      }} />

      {/* Floating bored emoji */}
      <div style={{
        position: "absolute", top: 380, left: 0, right: 0,
        textAlign: "center",
        fontSize: 180,
        opacity: emojiOpacity,
        transform: `translateY(${emojiY}px)`,
      }}>
        😪
      </div>

      {/* Knall-Text */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: 60,
        opacity: textOpacity,
        transform: `translateX(${shakeX}px) scale(${textScale})`,
      }}>
        <div style={{
          fontFamily,
          fontSize: 110,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          lineHeight: 1.05,
          letterSpacing: -2,
          textShadow: "0 10px 40px rgba(0,0,0,0.8)",
        }}>
          Schon wieder<br />
          <span style={{ color: "#F97316" }}>Pizza?</span>
        </div>
      </div>

      {/* Bottom subtitle */}
      <div style={{
        position: "absolute", bottom: 280, left: 0, right: 0,
        textAlign: "center",
        fontFamily,
        fontSize: 36,
        fontWeight: 400,
        color: "rgba(255,255,255,0.5)",
        opacity: textOpacity,
      }}>
        Freitagabend. Wieder mal.
      </div>
    </AbsoluteFill>
  );
};