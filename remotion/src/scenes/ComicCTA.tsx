import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 6: CTA — explosive finale with logo
export const ComicCTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background panel explodes in
  const bgSpring = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const bgScale = interpolate(bgSpring, [0, 1], [0.2, 1]);
  const bgRotation = interpolate(bgSpring, [0, 1], [10, 0]);

  // Flash
  const flash = interpolate(frame, [0, 5, 15], [1, 0.6, 0], {
    extrapolateRight: "clamp",
  });

  // Shake
  const shakeX = frame < 12 ? Math.sin(frame * 6) * (12 - frame) * 1.5 : 0;
  const shakeY = frame < 12 ? Math.cos(frame * 9) * (12 - frame) * 1 : 0;

  // Logo entrance
  const logoSpring = spring({ frame: frame - 10, fps, config: { damping: 8, stiffness: 100 } });
  const logoScale = interpolate(logoSpring, [0, 1], [5, 1]);
  const logoOpacity = interpolate(frame, [10, 18], [0, 1], { extrapolateRight: "clamp" });

  // Waitlist counter
  const counterSpring = spring({ frame: frame - 35, fps, config: { damping: 15 } });
  const counterY = interpolate(counterSpring, [0, 1], [80, 0]);
  const counterOpacity = interpolate(frame, [35, 45], [0, 1], { extrapolateRight: "clamp" });

  // Pulsing arrow
  const arrowBounce = Math.sin(frame * 0.2) * 8;

  // Animated counter number
  const countTo = 847;
  const countProgress = interpolate(frame, [40, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const currentCount = Math.round(countProgress * countTo);

  return (
    <AbsoluteFill style={{ background: "#FF0000" }}>
      {/* White flash */}
      <div style={{
        position: "absolute", inset: 0, background: "white",
        opacity: flash, zIndex: 20,
      }} />

      {/* Main CTA panel */}
      <div style={{
        position: "absolute", inset: 0,
        transform: `translate(${shakeX}px, ${shakeY}px) scale(${bgScale}) rotate(${bgRotation}deg)`,
        overflow: "hidden",
      }}>
        <Img
          src={staticFile("images/comic-panel-6.png")}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
          }}
        />
      </div>

      {/* Logo overlay */}
      <div style={{
        position: "absolute", top: 120, left: 0, right: 0,
        display: "flex", justifyContent: "center",
        transform: `scale(${logoScale})`,
        opacity: logoOpacity,
      }}>
        <Img
          src={staticFile("images/hioutz-logo.png")}
          style={{ width: 300, height: "auto" }}
        />
      </div>

      {/* Waitlist counter */}
      <div style={{
        position: "absolute", bottom: 180, left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        opacity: counterOpacity,
        transform: `translateY(${counterY}px)`,
      }}>
        <div style={{
          background: "rgba(0,0,0,0.85)",
          padding: "20px 50px",
          border: "4px solid #FFE500",
          boxShadow: "0 0 30px rgba(255,229,0,0.4)",
        }}>
          <span style={{
            fontFamily: "sans-serif", fontWeight: 900, fontSize: 48,
            color: "#FFE500",
          }}>
            {currentCount}+ warten schon!
          </span>
        </div>

        {/* Pulsing arrow */}
        <div style={{
          transform: `translateY(${arrowBounce}px)`,
          fontSize: 60, color: "white",
        }}>
          ⬇️
        </div>
      </div>
    </AbsoluteFill>
  );
};
