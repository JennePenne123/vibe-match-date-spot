import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Bangers";

const { fontFamily } = loadFont();

// Scene 1: Logo intro — explosive Pop Art entrance with speed lines
export const SceneLogoIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background pulse
  const bgHue = interpolate(frame, [0, 75], [168, 175], { extrapolateRight: "clamp" });
  const bgScale = interpolate(frame, [0, 60], [1.3, 1], { extrapolateRight: "clamp" });

  // Logo: massive slam with bounce
  const logoSpring = spring({ frame: frame - 5, fps, config: { damping: 8, stiffness: 100 } });
  const logoScale = interpolate(logoSpring, [0, 1], [10, 1]);
  const logoRotate = interpolate(logoSpring, [0, 1], [-25, 0]);
  const logoOpacity = interpolate(frame, [5, 12], [0, 1], { extrapolateRight: "clamp" });

  // Flash on impact
  const flash = interpolate(frame, [5, 8, 18], [0, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Shake on logo slam
  const shakeX = frame >= 5 && frame < 18 ? Math.sin(frame * 8) * (18 - frame) * 2 : 0;
  const shakeY = frame >= 5 && frame < 18 ? Math.cos(frame * 11) * (18 - frame) * 1.5 : 0;

  // Speed lines radiating from center
  const lineOpacity = interpolate(frame, [5, 15, 50], [0, 0.7, 0.2], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const lineScale = interpolate(frame, [5, 40], [0.5, 1.5], { extrapolateRight: "clamp" });

  // Tagline with Bangers font
  const tagSpring = spring({ frame: frame - 28, fps, config: { damping: 12, stiffness: 120 } });
  const tagY = interpolate(tagSpring, [0, 1], [80, 0]);
  const tagScale = interpolate(tagSpring, [0, 1], [0.5, 1]);
  const tagOpacity = interpolate(frame, [28, 38], [0, 1], { extrapolateRight: "clamp" });

  // Comic dots float
  const dotPulse = Math.sin(frame * 0.1) * 2 + 10;

  // Logo glow pulse after landing
  const glowSize = frame > 20 ? Math.sin(frame * 0.2) * 10 + 30 : 0;

  return (
    <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      {/* Teal gradient background */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(135deg, hsl(${bgHue}, 70%, 30%) 0%, hsl(${bgHue}, 65%, 42%) 50%, hsl(${bgHue}, 75%, 25%) 100%)`,
        transform: `scale(${bgScale})`,
      }} />

      {/* Halftone dots overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle, rgba(0,0,0,0.15) ${dotPulse/10}px, transparent ${dotPulse/10}px)`,
        backgroundSize: `${dotPulse}px ${dotPulse}px`,
      }} />

      {/* Speed lines — radiating */}
      <div style={{
        position: "absolute", inset: -200,
        background: `repeating-conic-gradient(from 0deg, rgba(255,255,255,0.12) 0deg 3deg, transparent 3deg 12deg)`,
        opacity: lineOpacity,
        transform: `scale(${lineScale})`,
      }} />

      {/* Additional starburst lines */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (360 / 12) * i;
        const lineLen = interpolate(frame, [5, 30], [0, 900], { extrapolateRight: "clamp" });
        const lo = interpolate(frame, [5, 12, 45], [0, 0.6, 0.1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        return (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            width: lineLen, height: 3,
            background: "linear-gradient(90deg, rgba(255,255,255,0.8), transparent)",
            transform: `rotate(${angle}deg)`,
            transformOrigin: "0 50%",
            opacity: lo,
          }} />
        );
      })}

      {/* White flash */}
      <div style={{
        position: "absolute", inset: 0, background: "white", opacity: flash, zIndex: 20,
      }} />

      {/* Logo */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{
          transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
          opacity: logoOpacity,
          filter: `drop-shadow(0 0 ${glowSize}px rgba(20,184,166,0.5)) drop-shadow(0 15px 40px rgba(0,0,0,0.5))`,
        }}>
          <Img
            src={staticFile("images/hioutz-logo.png")}
            style={{ width: 520, height: "auto" }}
          />
        </div>

        {/* "BOOM!" comic text on impact */}
        {frame >= 5 && (
          <div style={{
            position: "absolute", top: "22%", right: "8%",
            opacity: interpolate(frame, [5, 10, 35, 45], [0, 1, 1, 0], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            }),
            transform: `scale(${interpolate(
              spring({ frame: frame - 5, fps, config: { damping: 6, stiffness: 200 } }),
              [0, 1], [3, 1]
            )}) rotate(12deg)`,
          }}>
            <span style={{
              fontFamily, fontSize: 80, color: "#FFE500",
              textShadow: "4px 4px 0 #FF0000, 8px 8px 0 rgba(0,0,0,0.3)",
              letterSpacing: 4,
            }}>
              BOOM!
            </span>
          </div>
        )}

        {/* Tagline */}
        <div style={{
          position: "absolute", top: "64%",
          opacity: tagOpacity,
          transform: `translateY(${tagY}px) scale(${tagScale})`,
        }}>
          <div style={{
            background: "rgba(0,0,0,0.85)",
            padding: "18px 52px",
            border: "5px solid white",
            boxShadow: "8px 8px 0 rgba(0,0,0,0.4)",
            transform: "rotate(-1deg)",
          }}>
            <span style={{
              fontFamily, fontSize: 52, color: "white",
              letterSpacing: 4, textTransform: "uppercase",
            }}>
              Dein Date-Planer 💥
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
