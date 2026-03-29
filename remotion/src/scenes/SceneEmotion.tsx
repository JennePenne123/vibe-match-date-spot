import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const SceneEmotion = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = [
    { text: "Keine Ideen mehr?", delay: 0 },
    { text: "Immer das Gleiche?", delay: 20 },
    { text: "Wir ändern das.", delay: 50, accent: true },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80 }}>
      {/* Decorative "?" */}
      <div
        style={{
          position: "absolute",
          top: "18%",
          fontSize: 120,
          fontWeight: 200,
          fontFamily: "sans-serif",
          color: "hsla(330, 81%, 60%, 0.15)",
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        }}
      >
        ?
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 30, alignItems: "center" }}>
        {lines.map((line, i) => {
          const s = spring({ frame: frame - line.delay, fps, config: { damping: 14, stiffness: 120 } });
          const y = interpolate(s, [0, 1], [80, 0]);
          const opacity = interpolate(frame, [line.delay, line.delay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const strikeWidth = line.accent ? 0 : interpolate(frame, [60, 80], [0, 100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

          return (
            <div key={i} style={{ position: "relative", transform: `translateY(${y}px)`, opacity }}>
              <p
                style={{
                  fontSize: line.accent ? 60 : 48,
                  fontWeight: line.accent ? 800 : 400,
                  fontFamily: "sans-serif",
                  color: line.accent ? "white" : "hsla(210, 40%, 98%, 0.6)",
                  textAlign: "center",
                  background: line.accent ? "linear-gradient(135deg, hsl(239, 84%, 67%), hsl(330, 81%, 60%))" : "none",
                  WebkitBackgroundClip: line.accent ? "text" : undefined,
                  WebkitTextFillColor: line.accent ? "transparent" : undefined,
                }}
              >
                {line.text}
              </p>
              {!line.accent && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    width: `${strikeWidth}%`,
                    height: 3,
                    background: "hsla(330, 81%, 60%, 0.8)",
                    transform: "translateY(-50%)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Accent dot */}
      <div
        style={{
          position: "absolute",
          bottom: "25%",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "linear-gradient(135deg, hsl(239, 84%, 67%), hsl(330, 81%, 60%))",
          opacity: interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
          transform: `scale(${spring({ frame: frame - 70, fps, config: { damping: 10 } })})`,
          boxShadow: "0 0 30px hsla(330, 81%, 60%, 0.5)",
        }}
      />
    </AbsoluteFill>
  );
};
