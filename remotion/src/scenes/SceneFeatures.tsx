import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const highlights = [
  { icon: "⚡", label: "KI-Matching", color: "#14b8a6" },
  { icon: "🤝", label: "Zusammen planen", color: "#f97316" },
  { icon: "🎁", label: "Exklusive Voucher", color: "#14b8a6" },
];

export const SceneFeatures = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 15 } });
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div
        style={{
          transform: `scale(${interpolate(titleScale, [0, 1], [0.8, 1])})`,
          opacity: titleOpacity,
          fontSize: 52,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          fontFamily: "sans-serif",
          marginBottom: 80,
          lineHeight: 1.2,
        }}
      >
        Warum{" "}
        <span
          style={{
            background: "linear-gradient(90deg, #14b8a6, #f97316)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          H!Outz
        </span>
        ?
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 40, alignItems: "center" }}>
        {highlights.map((h, i) => {
          const s = spring({ frame: frame - 15 - i * 12, fps, config: { damping: 12, stiffness: 100 } });
          const scale = interpolate(s, [0, 1], [0, 1]);
          const opacity = interpolate(frame, [15 + i * 12, 25 + i * 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={h.label}
              style={{
                transform: `scale(${scale})`,
                opacity,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: `${h.color}22`,
                  border: `2px solid ${h.color}55`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 52,
                }}
              >
                {h.icon}
              </div>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "white",
                  fontFamily: "sans-serif",
                }}
              >
                {h.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
