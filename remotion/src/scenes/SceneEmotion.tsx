import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const features = [
  { emoji: "🍽️", text: "Restaurants", delay: 0 },
  { emoji: "🍸", text: "Bars & Lounges", delay: 8 },
  { emoji: "🎭", text: "Events", delay: 16 },
  { emoji: "☕", text: "Cafés", delay: 24 },
];

export const SceneEmotion = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(
    spring({ frame, fps, config: { damping: 20 } }),
    [0, 1],
    [50, 0]
  );

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 56,
          fontWeight: 800,
          color: "white",
          textAlign: "center",
          marginBottom: 80,
          fontFamily: "sans-serif",
          lineHeight: 1.2,
        }}
      >
        Die besten Venues
        <br />
        <span style={{ color: "#14b8a6" }}>deiner Stadt</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {features.map((feat) => {
          const s = spring({ frame: frame - feat.delay - 10, fps, config: { damping: 15, stiffness: 150 } });
          const cardX = interpolate(s, [0, 1], [400, 0]);
          const cardOpacity = interpolate(frame, [feat.delay + 10, feat.delay + 25], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={feat.text}
              style={{
                transform: `translateX(${cardX}px)`,
                opacity: cardOpacity,
                display: "flex",
                alignItems: "center",
                gap: 24,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "28px 36px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span style={{ fontSize: 52 }}>{feat.emoji}</span>
              <span
                style={{
                  fontSize: 38,
                  fontWeight: 600,
                  color: "white",
                  fontFamily: "sans-serif",
                }}
              >
                {feat.text}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
