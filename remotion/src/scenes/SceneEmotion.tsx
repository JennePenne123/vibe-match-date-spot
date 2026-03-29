import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

export const SceneEmotion = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = [
    { text: "Keine Ideen mehr?", delay: 0 },
    { text: "Immer das Gleiche?", delay: 20 },
    { text: "Wir ändern das.", delay: 50, accent: true },
  ];

  // Venue images reveal
  const img1Opacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const img1Scale = spring({ frame: frame - 60, fps, config: { damping: 15 } });
  const img2Opacity = interpolate(frame, [75, 95], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const img2Scale = spring({ frame: frame - 75, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80 }}>
      {/* Decorative "?" */}
      <div style={{ position: "absolute", top: "12%", fontSize: 120, fontWeight: 200, fontFamily: "sans-serif", color: "hsla(330, 81%, 60%, 0.12)", opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) }}>
        ?
      </div>

      {/* Text lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 30, alignItems: "center", marginTop: -120 }}>
        {lines.map((line, i) => {
          const s = spring({ frame: frame - line.delay, fps, config: { damping: 14, stiffness: 120 } });
          const y = interpolate(s, [0, 1], [80, 0]);
          const opacity = interpolate(frame, [line.delay, line.delay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const strikeWidth = line.accent ? 0 : interpolate(frame, [60, 80], [0, 100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

          return (
            <div key={i} style={{ position: "relative", transform: `translateY(${y}px)`, opacity }}>
              <p style={{
                fontSize: line.accent ? 60 : 48,
                fontWeight: line.accent ? 800 : 400,
                fontFamily: "sans-serif",
                color: line.accent ? "white" : "hsla(210, 40%, 98%, 0.6)",
                textAlign: "center",
                background: line.accent ? "linear-gradient(135deg, hsl(239, 84%, 67%), hsl(330, 81%, 60%))" : "none",
                WebkitBackgroundClip: line.accent ? "text" : undefined,
                WebkitTextFillColor: line.accent ? "transparent" : undefined,
              }}>
                {line.text}
              </p>
              {!line.accent && (
                <div style={{ position: "absolute", top: "50%", left: 0, width: `${strikeWidth}%`, height: 3, background: "hsla(330, 81%, 60%, 0.8)", transform: "translateY(-50%)" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Venue preview images that appear after "Wir ändern das" */}
      <div style={{ position: "absolute", bottom: "10%", display: "flex", gap: 20, justifyContent: "center" }}>
        <div style={{
          width: 200,
          height: 260,
          borderRadius: 20,
          overflow: "hidden",
          opacity: img1Opacity,
          transform: `scale(${interpolate(img1Scale, [0, 1], [0.7, 1])}) rotate(-5deg)`,
          border: "2px solid hsla(239, 84%, 67%, 0.3)",
          boxShadow: "0 20px 50px hsla(0, 0%, 0%, 0.4)",
        }}>
          <Img src={staticFile("images/venue-bar.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{
          width: 200,
          height: 260,
          borderRadius: 20,
          overflow: "hidden",
          opacity: img2Opacity,
          transform: `scale(${interpolate(img2Scale, [0, 1], [0.7, 1])}) rotate(4deg) translateY(-20px)`,
          border: "2px solid hsla(330, 81%, 60%, 0.3)",
          boxShadow: "0 20px 50px hsla(0, 0%, 0%, 0.4)",
        }}>
          <Img src={staticFile("images/venue-terrace.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
