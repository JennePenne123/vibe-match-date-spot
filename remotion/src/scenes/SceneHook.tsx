import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

export const SceneHook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dramatic zoom-in entrance for logo
  const logoSpring = spring({ frame, fps, config: { damping: 10, stiffness: 80 } });
  const logoScale = interpolate(logoSpring, [0, 1], [3, 1]);
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const logoRotate = interpolate(logoSpring, [0, 1], [-8, 0]);

  // Bright glow behind logo for contrast
  const glowPulse = interpolate(Math.sin(frame * 0.06), [-1, 1], [0.5, 0.9]);

  // Main text - kinetic reveal with per-word stagger
  const word1Spring = spring({ frame: frame - 22, fps, config: { damping: 12, stiffness: 150 } });
  const word2Spring = spring({ frame: frame - 30, fps, config: { damping: 12, stiffness: 150 } });
  const word1Y = interpolate(word1Spring, [0, 1], [120, 0]);
  const word2Y = interpolate(word2Spring, [0, 1], [120, 0]);
  const word1Opacity = interpolate(frame, [22, 32], [0, 1], { extrapolateRight: "clamp" });
  const word2Opacity = interpolate(frame, [30, 40], [0, 1], { extrapolateRight: "clamp" });

  // "Date" word with dramatic scale
  const dateSpring = spring({ frame: frame - 38, fps, config: { damping: 8, stiffness: 100 } });
  const dateScale = interpolate(dateSpring, [0, 1], [0.3, 1]);
  const dateOpacity = interpolate(frame, [38, 48], [0, 1], { extrapolateRight: "clamp" });

  // Subtitle
  const subSpring = spring({ frame: frame - 55, fps, config: { damping: 18 } });
  const subY = interpolate(subSpring, [0, 1], [30, 0]);
  const subOpacity = interpolate(frame, [55, 65], [0, 1], { extrapolateRight: "clamp" });

  // Flash effect at entrance
  const flashOpacity = interpolate(frame, [0, 5, 12], [0.8, 0.3, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 40%, rgba(20,184,166,0.6), transparent 70%)",
          opacity: flashOpacity,
        }}
      />

      {/* Glow behind logo for contrast */}
      <div
        style={{
          position: "absolute",
          top: "22%",
          width: 500,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(5,10,21,0.95) 0%, rgba(5,10,21,0.7) 50%, transparent 80%)",
          opacity: glowPulse,
          transform: "translateY(-50%)",
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
          opacity: logoOpacity,
          marginBottom: 50,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Img
          src={staticFile("images/hioutz-logo.png")}
          style={{ width: 380, height: "auto" }}
        />
      </div>

      {/* Main headline */}
      <div style={{ textAlign: "center", paddingLeft: 50, paddingRight: 50, position: "relative", zIndex: 2 }}>
        <div style={{ overflow: "hidden", marginBottom: 8 }}>
          <div
            style={{
              transform: `translateY(${word1Y}px)`,
              opacity: word1Opacity,
              fontSize: 68,
              fontWeight: 800,
              color: "white",
              fontFamily: "sans-serif",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
            }}
          >
            Das perfekte
          </div>
        </div>

        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              transform: `translateY(${word2Y}px) scale(${dateScale})`,
              opacity: Math.min(word2Opacity, dateOpacity),
              fontSize: 96,
              fontWeight: 900,
              fontFamily: "sans-serif",
              lineHeight: 1.1,
            }}
          >
            <span
              style={{
                background: "linear-gradient(90deg, #14b8a6, #f97316, #14b8a6)",
                backgroundSize: "200% 100%",
                backgroundPosition: `${interpolate(frame, [30, 80], [100, 0], { extrapolateRight: "clamp" })}% 0`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 30px rgba(20,184,166,0.4))",
              }}
            >
              Date.
            </span>
          </div>
        </div>
      </div>

      {/* Subtitle with accent line */}
      <div
        style={{
          transform: `translateY(${subY}px)`,
          opacity: subOpacity,
          marginTop: 40,
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: interpolate(
              spring({ frame: frame - 58, fps, config: { damping: 20 } }),
              [0, 1],
              [0, 200]
            ),
            height: 2,
            background: "linear-gradient(90deg, transparent, #14b8a6, #f97316, transparent)",
            margin: "0 auto 16px",
          }}
        />
        <span
          style={{
            fontSize: 34,
            color: "rgba(255,255,255,0.7)",
            fontFamily: "sans-serif",
            fontWeight: 400,
            letterSpacing: 2,
          }}
        >
          KI-gesteuert. Unvergesslich.
        </span>
      </div>
    </AbsoluteFill>
  );
};
