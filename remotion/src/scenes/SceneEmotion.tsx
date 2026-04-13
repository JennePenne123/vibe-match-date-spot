import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const features = [
  { emoji: "🍽️", text: "Restaurants", color: "#14b8a6" },
  { emoji: "🍸", text: "Bars & Lounges", color: "#f97316" },
  { emoji: "🎭", text: "Events & Kultur", color: "#14b8a6" },
  { emoji: "☕", text: "Cafés & mehr", color: "#f97316" },
];

export const SceneEmotion = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title with dramatic scale entrance
  const titleSpring = spring({ frame, fps, config: { damping: 10, stiffness: 100 } });
  const titleScale = interpolate(titleSpring, [0, 1], [0.4, 1]);
  const titleOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 50 }}>
      {/* Title */}
      <div
        style={{
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          fontSize: 54,
          fontWeight: 800,
          color: "white",
          textAlign: "center",
          marginBottom: 70,
          fontFamily: "sans-serif",
          lineHeight: 1.2,
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
        }}
      >
        Die besten Venues
        <br />
        <span
          style={{
            background: "linear-gradient(90deg, #14b8a6, #0d9488)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          deiner Stadt
        </span>
      </div>

      {/* Feature cards - alternating left/right slide */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
        {features.map((feat, i) => {
          const delay = 8 + i * 10;
          const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 140 } });
          const slideX = interpolate(s, [0, 1], [i % 2 === 0 ? -500 : 500, 0]);
          const cardOpacity = interpolate(frame, [delay, delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const floatY = Math.sin((frame + i * 30) * 0.07) * 3;

          return (
            <div
              key={feat.text}
              style={{
                transform: `translateX(${slideX}px) translateY(${floatY}px)`,
                opacity: cardOpacity,
                display: "flex",
                alignItems: "center",
                gap: 24,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 24,
                padding: "24px 32px",
                border: `1px solid ${feat.color}33`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  background: `${feat.color}15`,
                  border: `1px solid ${feat.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 42,
                  flexShrink: 0,
                }}
              >
                {feat.emoji}
              </div>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 700,
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
