import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 2: PAIN — "Wohin gehen wir?" frustration
export const SceneEmotion = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Chat bubble messages appearing one by one
  const messages = [
    { text: "Wohin gehen wir heute?", delay: 5, align: "left" as const },
    { text: "Mir egal, du?", delay: 18, align: "right" as const },
    { text: "Keine Ahnung 🤷", delay: 30, align: "left" as const },
    { text: "Pizza wie immer?", delay: 40, align: "right" as const },
    { text: "...", delay: 50, align: "left" as const },
  ];

  // Boring image in background
  const bgOpacity = interpolate(frame, [0, 10], [0, 0.25], { extrapolateRight: "clamp" });

  // "Kommt dir bekannt vor?" text
  const revealSpring = spring({ frame: frame - 58, fps, config: { damping: 15 } });
  const revealOpacity = interpolate(frame, [58, 65], [0, 1], { extrapolateRight: "clamp" });
  const revealScale = interpolate(revealSpring, [0, 1], [0.7, 1]);

  return (
    <AbsoluteFill>
      {/* Subtle bg */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Img
          src={staticFile("images/boring-planning.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: bgOpacity,
            filter: "saturate(0.2) brightness(0.3)",
          }}
        />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,10,21,0.9) 0%, rgba(5,10,21,0.95) 100%)" }} />

      <AbsoluteFill style={{ justifyContent: "center", padding: "0 50px" }}>
        {/* Chat bubbles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: -100 }}>
          {messages.map((msg, i) => {
            const s = spring({ frame: frame - msg.delay, fps, config: { damping: 14, stiffness: 160 } });
            const scale = interpolate(s, [0, 1], [0.3, 1]);
            const opacity = interpolate(frame, [msg.delay, msg.delay + 6], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const isLeft = msg.align === "left";

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: isLeft ? "flex-start" : "flex-end",
                }}
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    opacity,
                    background: isLeft ? "rgba(255,255,255,0.1)" : "#14b8a620",
                    borderRadius: isLeft ? "20px 20px 20px 6px" : "20px 20px 6px 20px",
                    padding: "18px 28px",
                    maxWidth: "75%",
                    border: isLeft ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(20,184,166,0.2)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 32,
                      color: isLeft ? "rgba(255,255,255,0.8)" : "rgba(20,184,166,0.9)",
                      fontFamily: "sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {msg.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* "Kommt dir bekannt vor?" */}
        <div
          style={{
            opacity: revealOpacity,
            transform: `scale(${revealScale})`,
            textAlign: "center",
            marginTop: 80,
          }}
        >
          <span
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "sans-serif",
              fontStyle: "italic",
            }}
          >
            Kommt dir bekannt vor?
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
