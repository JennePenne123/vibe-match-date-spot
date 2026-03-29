import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

export const SceneSocial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const countProgress = interpolate(frame, [10, 70], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const usersCount = Math.round(countProgress * 500);
  const matchRate = Math.round(countProgress * 92);
  const rating = (countProgress * 4.8).toFixed(1);

  const stats = [
    { value: `${usersCount}+`, label: "Aktive Nutzer", symbol: "U" },
    { value: `${matchRate}%`, label: "Match-Rate", symbol: "M" },
    { value: rating, label: "Bewertung", symbol: "S" },
  ];

  // Couple image at bottom
  const coupleOpacity = interpolate(frame, [40, 65], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const coupleScale = spring({ frame: frame - 40, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Heading */}
      <div style={{
        position: "absolute",
        top: "10%",
        textAlign: "center",
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
        transform: `translateY(${interpolate(spring({ frame, fps, config: { damping: 20 } }), [0, 1], [40, 0])}px)`,
      }}>
        <p style={{ fontSize: 46, fontWeight: 700, fontFamily: "sans-serif", color: "white" }}>
          Über 500 Nutzer
        </p>
        <p style={{ fontSize: 30, fontWeight: 400, fontFamily: "sans-serif", color: "hsla(210, 40%, 98%, 0.6)", marginTop: 8 }}>
          vertrauen Dzeng
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: -40 }}>
        {stats.map((stat, i) => {
          const delay = 15 + i * 15;
          const s = spring({ frame: frame - delay, fps, config: { damping: 15 } });
          const x = interpolate(s, [0, 1], [i % 2 === 0 ? -200 : 200, 0]);
          const colors = ["hsla(239, 84%, 67%, 0.9)", "hsla(263, 70%, 66%, 0.9)", "hsla(330, 81%, 60%, 0.9)"];

          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 20,
              transform: `translateX(${x}px)`,
              opacity: interpolate(s, [0, 1], [0, 1]),
              background: "hsla(217, 33%, 17%, 0.6)",
              borderRadius: 20, padding: "20px 28px",
              border: `1px solid ${colors[i]!.replace("0.9", "0.2")}`,
              minWidth: 340,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `linear-gradient(135deg, ${colors[i]}, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 800, fontFamily: "sans-serif", color: "white", flexShrink: 0,
              }}>
                {stat.symbol}
              </div>
              <div>
                <p style={{ fontSize: 40, fontWeight: 800, fontFamily: "sans-serif", color: "white", margin: 0 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 20, fontWeight: 400, fontFamily: "sans-serif", color: "hsla(210, 40%, 98%, 0.6)", margin: 0 }}>
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Couple image at bottom as social proof */}
      <div style={{
        position: "absolute",
        bottom: "5%",
        width: 400,
        height: 280,
        borderRadius: 24,
        overflow: "hidden",
        opacity: coupleOpacity,
        transform: `scale(${interpolate(coupleScale, [0, 1], [0.8, 1])})`,
        border: "2px solid hsla(239, 84%, 67%, 0.2)",
        boxShadow: "0 20px 60px hsla(0, 0%, 0%, 0.5)",
      }}>
        <Img
          src={staticFile("images/couple-restaurant.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Gradient overlay at bottom of image */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
          background: "linear-gradient(transparent, hsla(0, 0%, 0%, 0.6))",
          display: "flex", alignItems: "flex-end", padding: "0 16px 12px",
        }}>
          <p style={{ fontSize: 16, fontFamily: "sans-serif", color: "hsla(210, 40%, 98%, 0.9)", margin: 0, fontWeight: 500 }}>
            Anna & Max — Restaurant La Vita
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
