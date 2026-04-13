import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

export const SceneCTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 15 } });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const urlOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const urlY = interpolate(
    spring({ frame: frame - 20, fps, config: { damping: 18 } }),
    [0, 1],
    [40, 0]
  );

  const ctaOpacity = interpolate(frame, [35, 50], [0, 1], { extrapolateRight: "clamp" });
  const ctaScale = spring({ frame: frame - 35, fps, config: { damping: 10, stiffness: 80 } });

  const glowOpacity = interpolate(Math.sin((frame - 50) * 0.08), [-1, 1], [0.3, 0.7]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div
        style={{
          transform: `scale(${interpolate(logoScale, [0, 1], [0.6, 1])})`,
          opacity: logoOpacity,
          marginBottom: 60,
        }}
      >
        <Img
          src={staticFile("images/hioutz-logo.png")}
          style={{ width: 260, height: "auto" }}
        />
      </div>

      <div
        style={{
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
          fontSize: 38,
          fontWeight: 700,
          color: "#14b8a6",
          textAlign: "center",
          fontFamily: "sans-serif",
          marginBottom: 50,
        }}
      >
        hioutz.com/waitlist
      </div>

      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${interpolate(ctaScale, [0, 1], [0.7, 1])})`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: 40,
            background: "linear-gradient(90deg, #14b8a6, #f97316)",
            opacity: frame > 50 ? glowOpacity : 0,
            filter: "blur(25px)",
          }}
        />
        <div
          style={{
            position: "relative",
            background: "linear-gradient(90deg, #14b8a6, #f97316)",
            borderRadius: 28,
            padding: "28px 64px",
            fontSize: 36,
            fontWeight: 800,
            color: "white",
            fontFamily: "sans-serif",
            textAlign: "center",
          }}
        >
          Jetzt eintragen! 🔥
        </div>
      </div>
    </AbsoluteFill>
  );
};
