import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const SceneSocial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const counterProgress = interpolate(frame, [10, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const count = Math.round(counterProgress * 247);

  const numScale = spring({ frame: frame - 5, fps, config: { damping: 12 } });
  const numOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" });

  const labelOpacity = interpolate(frame, [25, 40], [0, 1], { extrapolateRight: "clamp" });
  const labelY = interpolate(
    spring({ frame: frame - 25, fps, config: { damping: 20 } }),
    [0, 1],
    [30, 0]
  );

  const subOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div
        style={{
          transform: `scale(${interpolate(numScale, [0, 1], [0.5, 1])})`,
          opacity: numOpacity,
          fontSize: 160,
          fontWeight: 900,
          fontFamily: "sans-serif",
          background: "linear-gradient(135deg, #14b8a6, #f97316)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
        }}
      >
        {count}+
      </div>

      <div
        style={{
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
          fontSize: 44,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          marginTop: 20,
          fontFamily: "sans-serif",
        }}
      >
        auf der Warteliste
      </div>

      <div
        style={{
          opacity: subOpacity,
          fontSize: 30,
          color: "rgba(255,255,255,0.5)",
          textAlign: "center",
          marginTop: 20,
          fontFamily: "sans-serif",
        }}
      >
        Sei auch dabei! 🚀
      </div>
    </AbsoluteFill>
  );
};
