import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const SceneHook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "D" letter scales in dramatically
  const dScale = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });
  const dRotate = interpolate(dScale, [0, 1], [180, 0]);

  // "zeng" slides in from right
  const zengX = spring({ frame: frame - 12, fps, config: { damping: 18, stiffness: 120 } });
  const zengSlide = interpolate(zengX, [0, 1], [300, 0]);
  const zengOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Tagline fades up
  const tagY = spring({ frame: frame - 35, fps, config: { damping: 20, stiffness: 100 } });
  const tagSlide = interpolate(tagY, [0, 1], [60, 0]);
  const tagOpacity = interpolate(frame, [33, 50], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Pulse ring
  const ringScale = interpolate(frame, [50, 100], [0.8, 2.5], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const ringOpacity = interpolate(frame, [50, 100], [0.6, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Subtle floating sparkles
  const sparkle1Y = interpolate(frame, [0, 130], [0, -80]);
  const sparkle2Y = interpolate(frame, [0, 130], [0, -120]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Pulse ring behind logo */}
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: "2px solid hsla(239, 84%, 67%, 0.5)",
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
        }}
      />

      {/* Sparkle elements */}
      <div style={{ position: "absolute", top: `${35 + sparkle1Y * 0.1}%`, left: "25%", width: 8, height: 8, borderRadius: "50%", background: "hsla(239, 84%, 67%, 0.6)", opacity: interpolate(frame, [20, 40, 100, 120], [0, 0.8, 0.8, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) }} />
      <div style={{ position: "absolute", top: `${60 + sparkle2Y * 0.1}%`, right: "20%", width: 6, height: 6, borderRadius: "50%", background: "hsla(330, 81%, 60%, 0.6)", opacity: interpolate(frame, [30, 50, 110, 130], [0, 0.7, 0.7, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) }} />
      <div style={{ position: "absolute", top: `${45 + sparkle1Y * 0.05}%`, right: "30%", width: 5, height: 5, borderRadius: "50%", background: "hsla(263, 70%, 66%, 0.5)", opacity: interpolate(frame, [15, 35, 90, 110], [0, 0.6, 0.6, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) }} />

      {/* Logo text */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
        <span
          style={{
            fontSize: 160,
            fontWeight: 800,
            fontFamily: "sans-serif",
            color: "white",
            transform: `scale(${dScale}) rotate(${dRotate}deg)`,
            display: "inline-block",
            textShadow: "0 0 60px hsla(239, 84%, 67%, 0.5)",
          }}
        >
          D
        </span>
        <span
          style={{
            fontSize: 140,
            fontWeight: 700,
            fontFamily: "sans-serif",
            color: "white",
            transform: `translateX(${zengSlide}px)`,
            opacity: zengOpacity,
            display: "inline-block",
          }}
        >
          zeng
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          top: "58%",
          textAlign: "center",
          transform: `translateY(${tagSlide}px)`,
          opacity: tagOpacity,
        }}
      >
        <p
          style={{
            fontSize: 38,
            fontWeight: 400,
            fontFamily: "sans-serif",
            color: "hsla(210, 40%, 98%, 0.7)",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Dein perfektes Date
        </p>
      </div>

      {/* Decorative line */}
      <div
        style={{
          position: "absolute",
          top: "65%",
          width: interpolate(frame, [55, 80], [0, 200], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
          height: 2,
          background: "linear-gradient(90deg, transparent, hsla(239, 84%, 67%, 0.8), hsla(330, 81%, 60%, 0.8), transparent)",
        }}
      />
    </AbsoluteFill>
  );
};
