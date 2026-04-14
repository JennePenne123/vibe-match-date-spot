import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Bangers";

const { fontFamily } = loadFont();

// Scene 4: BLING! — explosive phone notification with comic SFX
export const SceneBling = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Explosive panel entrance
  const explodeSpring = spring({ frame, fps, config: { damping: 7, stiffness: 180 } });
  const explodeScale = interpolate(explodeSpring, [0, 1], [0.03, 1]);
  const rotation = interpolate(explodeSpring, [0, 1], [30, 0]);

  // White flash
  const flash = interpolate(frame, [0, 3, 14], [1, 0.95, 0], { extrapolateRight: "clamp" });

  // Heavy shake
  const shakeIntensity = Math.max(0, 20 - frame) * 3;
  const shakeX = Math.sin(frame * 8) * shakeIntensity;
  const shakeY = Math.cos(frame * 12) * shakeIntensity * 0.5;

  // Phone glow
  const glowPulse = Math.sin(frame * 0.5) * 0.3 + 0.7;

  // "BLING!" comic text — the hero moment
  const blingSpring = spring({ frame: frame - 5, fps, config: { damping: 5, stiffness: 250 } });
  const blingScale = interpolate(blingSpring, [0, 1], [5, 1]);
  const blingRotate = interpolate(blingSpring, [0, 1], [-20, -5]);
  const blingOpacity = interpolate(frame, [5, 10], [0, 1], { extrapolateRight: "clamp" });

  // Sparkle burst around BLING text
  const sparkles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (360 / 8) * i;
    const dist = interpolate(frame, [5, 25], [0, 120], { extrapolateRight: "clamp" });
    const so = interpolate(frame, [5, 12, 30, 40], [0, 1, 1, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
    return { angle, dist, opacity: so };
  });

  // Logo rises from phone — organic integration
  const logoSpring = spring({ frame: frame - 22, fps, config: { damping: 10, stiffness: 90 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.2, 1]);
  const logoY = interpolate(logoSpring, [0, 1], [250, 0]);
  const logoOpacity = interpolate(frame, [22, 32], [0, 1], { extrapolateRight: "clamp" });
  const logoGlow = frame > 30 ? Math.sin(frame * 0.2) * 8 + 20 : 0;

  // "KI-POWERED" badge
  const badgeSpring = spring({ frame: frame - 38, fps, config: { damping: 14 } });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0.5, 1]);
  const badgeOpacity = interpolate(frame, [38, 48], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      {/* Yellow bg */}
      <div style={{ position: "absolute", inset: 0, background: "#FFE500" }} />
      {/* Dot pattern */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "8px 8px",
      }} />

      {/* White flash */}
      <div style={{
        position: "absolute", inset: 0, background: "white", opacity: flash, zIndex: 20,
      }} />

      {/* "BLING!" comic text */}
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0,
        display: "flex", justifyContent: "center",
        opacity: blingOpacity, zIndex: 15,
        transform: `scale(${blingScale}) rotate(${blingRotate}deg)`,
      }}>
        <span style={{
          fontFamily, fontSize: 120, color: "#FF0000",
          textShadow: "5px 5px 0 black, -2px -2px 0 #FFE500, 10px 10px 0 rgba(0,0,0,0.2)",
          letterSpacing: 8,
        }}>
          BLING!
        </span>
        {/* Sparkles around text */}
        {sparkles.map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `calc(50% + ${Math.cos(s.angle * Math.PI / 180) * s.dist}px)`,
            top: `calc(50% + ${Math.sin(s.angle * Math.PI / 180) * s.dist}px)`,
            fontSize: 28, opacity: s.opacity,
          }}>
            ✨
          </div>
        ))}
      </div>

      {/* Phone panel */}
      <div style={{
        position: "absolute", top: 200, left: 25, right: 25, bottom: 480,
        transform: `scale(${explodeScale}) rotate(${rotation}deg)`,
        overflow: "hidden",
        border: "8px solid black",
        boxShadow: `0 0 ${80 * glowPulse}px rgba(20,184,166,0.5), 14px 14px 0 rgba(0,0,0,0.35)`,
      }}>
        <Img
          src={staticFile("images/comic-v2-panel3.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Logo rising from phone */}
      <div style={{
        position: "absolute", bottom: 120, left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
        opacity: logoOpacity,
        transform: `translateY(${logoY}px) scale(${logoScale})`,
      }}>
        <Img
          src={staticFile("images/hioutz-logo.png")}
          style={{
            width: 380, height: "auto",
            filter: `drop-shadow(0 0 ${logoGlow}px rgba(20,184,166,0.6)) drop-shadow(0 10px 30px rgba(0,0,0,0.4))`,
          }}
        />
        <div style={{
          opacity: badgeOpacity,
          transform: `scale(${badgeScale})`,
        }}>
          <div style={{
            background: "rgba(0,0,0,0.9)",
            padding: "12px 36px",
            border: "4px solid #14b8a6",
            boxShadow: "0 0 20px rgba(20,184,166,0.3)",
          }}>
            <span style={{
              fontFamily, fontSize: 34, color: "#14b8a6",
              letterSpacing: 4,
            }}>
              KI-POWERED 🚀
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
