import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 4: SOLUTION — H!Outz brand reveal
export const SceneSocial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo dramatic entrance — scale from huge to normal with rotation
  const logoSpring = spring({ frame: frame - 2, fps, config: { damping: 10, stiffness: 90 } });
  const logoScale = interpolate(logoSpring, [0, 1], [5, 1]);
  const logoRotate = interpolate(logoSpring, [0, 1], [-15, 0]);
  const logoOpacity = interpolate(frame, [2, 10], [0, 1], { extrapolateRight: "clamp" });

  // Dark backdrop for logo contrast
  const backdropOpacity = interpolate(frame, [0, 8], [0, 0.9], { extrapolateRight: "clamp" });

  // Flash at logo entrance
  const flashOpacity = interpolate(frame, [2, 6, 15], [0, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Feature pills appearing
  const pills = [
    { text: "🎯 KI findet euren Spot", delay: 20 },
    { text: "📅 Plant zusammen", delay: 28 },
    { text: "🎁 Exklusive Deals", delay: 36 },
  ];

  // Tagline
  const tagSpring = spring({ frame: frame - 15, fps, config: { damping: 15 } });
  const tagY = interpolate(tagSpring, [0, 1], [40, 0]);
  const tagOpacity = interpolate(frame, [15, 25], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Subtle venue bg with heavy overlay */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Img
          src={staticFile("images/date-scene.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.15,
            filter: "blur(8px)",
          }}
        />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "rgba(5,10,21,0.85)" }} />

      {/* Flash effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 35%, rgba(20,184,166,0.5), transparent 60%)",
          opacity: flashOpacity,
        }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 50 }}>
        {/* Dark backdrop behind logo */}
        <div
          style={{
            position: "absolute",
            top: "18%",
            width: 600,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(5,10,21,1) 0%, transparent 75%)",
            opacity: backdropOpacity,
          }}
        />

        {/* Logo */}
        <div
          style={{
            transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
            opacity: logoOpacity,
            marginBottom: 30,
            position: "relative",
            zIndex: 2,
          }}
        >
          <Img
            src={staticFile("images/hioutz-logo.png")}
            style={{ width: 380, height: "auto" }}
          />
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: tagOpacity,
            transform: `translateY(${tagY}px)`,
            fontSize: 36,
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
            fontFamily: "sans-serif",
            textAlign: "center",
            marginBottom: 60,
            position: "relative",
            zIndex: 2,
            letterSpacing: 1,
          }}
        >
          Dein Date-Planer mit KI
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", position: "relative", zIndex: 2 }}>
          {pills.map((pill, i) => {
            const s = spring({ frame: frame - pill.delay, fps, config: { damping: 12, stiffness: 140 } });
            const x = interpolate(s, [0, 1], [i % 2 === 0 ? -400 : 400, 0]);
            const opacity = interpolate(frame, [pill.delay, pill.delay + 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={pill.text}
                style={{
                  transform: `translateX(${x}px)`,
                  opacity,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 50,
                  padding: "18px 36px",
                  border: "1px solid rgba(20,184,166,0.2)",
                  fontSize: 30,
                  fontWeight: 600,
                  color: "white",
                  fontFamily: "sans-serif",
                }}
              >
                {pill.text}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
