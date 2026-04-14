import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 6: CTA Finale — explosive bullseye with giant logo and waitlist
export const SceneFinale = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Bullseye bg spins in
  const bgSpring = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const bgScale = interpolate(bgSpring, [0, 1], [0.1, 1]);
  const bgRotation = interpolate(frame, [0, 180], [30, 0]);

  // Flash
  const flash = interpolate(frame, [0, 5, 15], [1, 0.6, 0], { extrapolateRight: "clamp" });

  // Shake
  const shakeX = frame < 15 ? Math.sin(frame * 7) * (15 - frame) * 2 : 0;
  const shakeY = frame < 15 ? Math.cos(frame * 10) * (15 - frame) * 1.2 : 0;

  // GIANT logo — this is the hero moment
  const logoSpring = spring({ frame: frame - 10, fps, config: { damping: 8, stiffness: 80 } });
  const logoScale = interpolate(logoSpring, [0, 1], [6, 1]);
  const logoRotate = interpolate(logoSpring, [0, 1], [-15, 0]);
  const logoOpacity = interpolate(frame, [10, 20], [0, 1], { extrapolateRight: "clamp" });

  // Logo glow pulse
  const logoPulse = Math.sin(frame * 0.15) * 5 + 25;

  // "Nie wieder langweilig" text
  const textSpring = spring({ frame: frame - 30, fps, config: { damping: 12 } });
  const textScale = interpolate(textSpring, [0, 1], [0.3, 1]);
  const textOpacity = interpolate(frame, [30, 40], [0, 1], { extrapolateRight: "clamp" });

  // Waitlist CTA
  const ctaSpring = spring({ frame: frame - 55, fps, config: { damping: 15 } });
  const ctaY = interpolate(ctaSpring, [0, 1], [100, 0]);
  const ctaOpacity = interpolate(frame, [55, 65], [0, 1], { extrapolateRight: "clamp" });

  // Counter
  const countTo = 847;
  const countProgress = interpolate(frame, [70, 120], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const currentCount = Math.round(countProgress * countTo);

  // Bouncing arrow
  const arrowBounce = Math.sin(frame * 0.25) * 10;

  return (
    <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      {/* Bullseye background */}
      <div style={{
        position: "absolute", inset: 0,
        transform: `scale(${bgScale}) rotate(${bgRotation}deg)`,
        overflow: "hidden",
      }}>
        <Img
          src={staticFile("images/comic-v2-finale.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Dark overlay for readability */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)",
      }} />

      {/* Flash */}
      <div style={{
        position: "absolute", inset: 0, background: "white", opacity: flash, zIndex: 20,
      }} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* GIANT Logo */}
        <div style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
          filter: `drop-shadow(0 0 ${logoPulse}px rgba(20,184,166,0.6))`,
          marginTop: -200,
        }}>
          <Img
            src={staticFile("images/hioutz-logo.png")}
            style={{ width: 500, height: "auto" }}
          />
        </div>

        {/* "Nie wieder langweilig" */}
        <div style={{
          position: "absolute", top: "48%",
          opacity: textOpacity,
          transform: `scale(${textScale})`,
          textAlign: "center",
        }}>
          <div style={{
            background: "rgba(255,0,0,0.9)",
            padding: "18px 50px",
            border: "5px solid white",
            boxShadow: "8px 8px 0 rgba(0,0,0,0.4)",
            transform: "rotate(-2deg)",
          }}>
            <span style={{
              fontFamily: "sans-serif", fontWeight: 900, fontSize: 50,
              color: "white", letterSpacing: 2,
            }}>
              NIE WIEDER LANGWEILIG!
            </span>
          </div>
        </div>

        {/* Waitlist CTA */}
        <div style={{
          position: "absolute", bottom: 200,
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        }}>
          <div style={{
            background: "rgba(0,0,0,0.9)",
            padding: "20px 50px",
            border: "4px solid #FFE500",
            boxShadow: "0 0 40px rgba(255,229,0,0.3)",
          }}>
            <span style={{
              fontFamily: "sans-serif", fontWeight: 900, fontSize: 44,
              color: "#FFE500",
            }}>
              {currentCount}+ warten schon!
            </span>
          </div>

          <div style={{
            background: "#14b8a6",
            padding: "16px 44px",
            border: "4px solid black",
            boxShadow: "6px 6px 0 black",
          }}>
            <span style={{
              fontFamily: "sans-serif", fontWeight: 900, fontSize: 36,
              color: "white", letterSpacing: 1,
            }}>
              JETZT AUF DIE WAITLIST →
            </span>
          </div>

          {/* Bouncing arrow */}
          <div style={{
            transform: `translateY(${arrowBounce}px)`,
            fontSize: 50,
          }}>
            ⬇️
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
