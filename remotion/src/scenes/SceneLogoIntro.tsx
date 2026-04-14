import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 1: Logo intro — big dramatic entrance
export const SceneLogoIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background: comic halftone pattern
  const bgScale = interpolate(frame, [0, 60], [1.2, 1], { extrapolateRight: "clamp" });

  // Logo: massive scale-down with rotation
  const logoSpring = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 80 } });
  const logoScale = interpolate(logoSpring, [0, 1], [8, 1]);
  const logoRotate = interpolate(logoSpring, [0, 1], [-20, 0]);
  const logoOpacity = interpolate(frame, [5, 15], [0, 1], { extrapolateRight: "clamp" });

  // Flash
  const flash = interpolate(frame, [5, 10, 20], [0, 0.8, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Tagline slides up
  const tagSpring = spring({ frame: frame - 25, fps, config: { damping: 15 } });
  const tagY = interpolate(tagSpring, [0, 1], [60, 0]);
  const tagOpacity = interpolate(frame, [25, 35], [0, 1], { extrapolateRight: "clamp" });

  // Shake on logo slam
  const shakeX = frame >= 5 && frame < 15 ? Math.sin(frame * 6) * (15 - frame) * 1.5 : 0;
  const shakeY = frame >= 5 && frame < 15 ? Math.cos(frame * 9) * (15 - frame) * 1 : 0;

  // Action lines radiating
  const lineOpacity = interpolate(frame, [5, 12, 40], [0, 0.6, 0.3], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      {/* Teal background */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #0f766e 100%)",
        transform: `scale(${bgScale})`,
      }} />

      {/* Halftone overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)",
        backgroundSize: "10px 10px",
      }} />

      {/* Action lines */}
      <div style={{
        position: "absolute", inset: 0,
        background: `repeating-conic-gradient(from 0deg, rgba(255,255,255,0.1) 0deg 5deg, transparent 5deg 15deg)`,
        opacity: lineOpacity,
      }} />

      {/* White flash */}
      <div style={{
        position: "absolute", inset: 0, background: "white", opacity: flash, zIndex: 20,
      }} />

      {/* Logo */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{
          transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
          opacity: logoOpacity,
          filter: "drop-shadow(0 10px 40px rgba(0,0,0,0.4))",
        }}>
          <Img
            src={staticFile("images/hioutz-logo.png")}
            style={{ width: 500, height: "auto" }}
          />
        </div>

        {/* Tagline */}
        <div style={{
          position: "absolute", top: "62%",
          opacity: tagOpacity,
          transform: `translateY(${tagY}px)`,
        }}>
          <div style={{
            background: "rgba(0,0,0,0.8)",
            padding: "16px 48px",
            border: "4px solid white",
            boxShadow: "6px 6px 0 rgba(0,0,0,0.3)",
          }}>
            <span style={{
              fontFamily: "sans-serif", fontWeight: 900, fontSize: 42,
              color: "white", letterSpacing: 3, textTransform: "uppercase",
            }}>
              Dein Date-Planer
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
