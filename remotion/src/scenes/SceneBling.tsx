import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 4: BLING! — phone notification with Logo integration
export const SceneBling = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Explosive panel entrance
  const explodeSpring = spring({ frame, fps, config: { damping: 8, stiffness: 150 } });
  const explodeScale = interpolate(explodeSpring, [0, 1], [0.05, 1]);
  const rotation = interpolate(explodeSpring, [0, 1], [25, 0]);

  // White flash
  const flash = interpolate(frame, [0, 3, 12], [1, 0.9, 0], { extrapolateRight: "clamp" });

  // Heavy shake
  const shakeIntensity = Math.max(0, 18 - frame) * 2.5;
  const shakeX = Math.sin(frame * 7) * shakeIntensity;
  const shakeY = Math.cos(frame * 11) * shakeIntensity * 0.6;

  // Pulsing glow on phone
  const glowPulse = Math.sin(frame * 0.4) * 0.3 + 0.7;

  // Logo appears FROM the phone — integrated not slapped on
  const logoSpring = spring({ frame: frame - 20, fps, config: { damping: 12 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.3, 1]);
  const logoY = interpolate(logoSpring, [0, 1], [200, 0]);
  const logoOpacity = interpolate(frame, [20, 30], [0, 1], { extrapolateRight: "clamp" });

  // "Powered by" text
  const poweredOpacity = interpolate(frame, [35, 45], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      {/* Yellow bg */}
      <div style={{ position: "absolute", inset: 0, background: "#FFE500" }} />

      {/* White flash */}
      <div style={{
        position: "absolute", inset: 0, background: "white", opacity: flash, zIndex: 20,
      }} />

      {/* Phone panel */}
      <div style={{
        position: "absolute", top: 100, left: 30, right: 30, bottom: 450,
        transform: `scale(${explodeScale}) rotate(${rotation}deg)`,
        overflow: "hidden",
        border: "8px solid black",
        boxShadow: `0 0 ${80 * glowPulse}px rgba(20,184,166,0.5), 12px 12px 0 rgba(0,0,0,0.3)`,
      }}>
        <Img
          src={staticFile("images/comic-v2-panel3.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Logo rising from phone */}
      <div style={{
        position: "absolute", bottom: 120, left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        opacity: logoOpacity,
        transform: `translateY(${logoY}px) scale(${logoScale})`,
      }}>
        <Img
          src={staticFile("images/hioutz-logo.png")}
          style={{
            width: 350, height: "auto",
            filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.4))",
          }}
        />
        <div style={{
          opacity: poweredOpacity,
          background: "rgba(0,0,0,0.85)",
          padding: "10px 30px",
          border: "3px solid #14b8a6",
        }}>
          <span style={{
            fontFamily: "sans-serif", fontWeight: 700, fontSize: 28,
            color: "#14b8a6", letterSpacing: 2,
          }}>
            KI-POWERED 🚀
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
