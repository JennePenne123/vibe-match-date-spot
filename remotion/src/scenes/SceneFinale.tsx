import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Bangers";

const { fontFamily } = loadFont();

// Scene 6: CTA Finale — explosive bullseye, giant logo, waitlist counter
export const SceneFinale = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Bullseye bg spin
  const bgSpring = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const bgScale = interpolate(bgSpring, [0, 1], [0.1, 1]);
  const bgRotation = interpolate(frame, [0, 160], [40, 0], { extrapolateRight: "clamp" });

  // Flash
  const flash = interpolate(frame, [0, 5, 15], [1, 0.6, 0], { extrapolateRight: "clamp" });

  // Shake
  const shakeX = frame < 18 ? Math.sin(frame * 8) * (18 - frame) * 2.5 : 0;
  const shakeY = frame < 18 ? Math.cos(frame * 11) * (18 - frame) * 1.5 : 0;

  // GIANT logo
  const logoSpring = spring({ frame: frame - 8, fps, config: { damping: 7, stiffness: 90 } });
  const logoScale = interpolate(logoSpring, [0, 1], [8, 1]);
  const logoRotate = interpolate(logoSpring, [0, 1], [-20, 0]);
  const logoOpacity = interpolate(frame, [8, 18], [0, 1], { extrapolateRight: "clamp" });
  const logoPulse = Math.sin(frame * 0.15) * 8 + 30;

  // "Nie wieder langweilig!" text
  const textSpring = spring({ frame: frame - 28, fps, config: { damping: 10, stiffness: 140 } });
  const textScale = interpolate(textSpring, [0, 1], [0.2, 1]);
  const textOpacity = interpolate(frame, [28, 38], [0, 1], { extrapolateRight: "clamp" });

  // Waitlist counter
  const countTo = 847;
  const countProgress = interpolate(frame, [60, 110], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const currentCount = Math.round(countProgress * countTo);

  // CTA block
  const ctaSpring = spring({ frame: frame - 50, fps, config: { damping: 14 } });
  const ctaY = interpolate(ctaSpring, [0, 1], [120, 0]);
  const ctaOpacity = interpolate(frame, [50, 60], [0, 1], { extrapolateRight: "clamp" });

  // CTA button pulse
  const ctaPulse = frame > 80 ? Math.sin(frame * 0.2) * 3 + 1 : 1;

  // Arrow bounce
  const arrowBounce = Math.sin(frame * 0.3) * 12;

  // Speed lines in finale
  const finaleLines = interpolate(frame, [0, 15, 40], [0.5, 0.3, 0.08], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

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

      {/* Dark overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)",
      }} />

      {/* Speed lines */}
      <div style={{
        position: "absolute", inset: -200,
        background: `repeating-conic-gradient(from 0deg, rgba(255,255,255,0.1) 0deg 2deg, transparent 2deg 10deg)`,
        opacity: finaleLines,
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
          marginTop: -220,
        }}>
          <div style={{
            position: "absolute", inset: -50,
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 45%, transparent 72%)",
            borderRadius: 40,
          }} />
          <Img
            src={staticFile("images/hioutz-logo.png")}
            style={{ width: 540, height: "auto", position: "relative", zIndex: 1 }}
          />
        </div>

        {/* "Nie wieder langweilig!" */}
        <div style={{
          position: "absolute", top: "47%",
          opacity: textOpacity,
          transform: `scale(${textScale})`,
          textAlign: "center",
        }}>
          <div style={{
            background: "rgba(255,0,0,0.92)",
            padding: "20px 55px",
            border: "6px solid white",
            boxShadow: "10px 10px 0 rgba(0,0,0,0.45)",
            transform: "rotate(-2deg)",
          }}>
            <span style={{
              fontFamily, fontSize: 56, color: "white",
              letterSpacing: 4,
            }}>
              NIE WIEDER LANGWEILIGE DATES!
            </span>
          </div>
        </div>

        {/* Waitlist CTA */}
        <div style={{
          position: "absolute", bottom: 180,
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 22,
        }}>
          <div style={{
            background: "rgba(0,0,0,0.92)",
            padding: "22px 55px",
            border: "5px solid #FFE500",
            boxShadow: "0 0 40px rgba(255,229,0,0.3)",
          }}>
            <span style={{
              fontFamily, fontSize: 50, color: "#FFE500",
              letterSpacing: 2,
            }}>
              {currentCount}+ warten schon!
            </span>
          </div>

          <div style={{
            background: "#14b8a6",
            padding: "18px 48px",
            border: "5px solid black",
            boxShadow: "8px 8px 0 black",
            transform: `scale(${ctaPulse})`,
          }}>
            <span style={{
              fontFamily, fontSize: 40, color: "white",
              letterSpacing: 2,
            }}>
              JETZT AUF DIE WAITLIST →
            </span>
          </div>

          {/* Bouncing arrow */}
          <div style={{
            transform: `translateY(${arrowBounce}px)`,
            fontSize: 55,
          }}>
            ⬇️
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
