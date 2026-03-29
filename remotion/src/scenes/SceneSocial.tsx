import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

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
    { value: rating, label: "Bewertung", symbol: "★" },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div
        style={{
          position: "absolute",
          top: "18%",
          textAlign: "center",
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
          transform: `translateY(${interpolate(spring({ frame, fps, config: { damping: 20 } }), [0, 1], [40, 0])}px)`,
        }}
      >
        <p style={{ fontSize: 48, fontWeight: 700, fontFamily: "sans-serif", color: "white" }}>
          Über 500 Nutzer
        </p>
        <p style={{ fontSize: 32, fontWeight: 400, fontFamily: "sans-serif", color: "hsla(210, 40%, 98%, 0.6)", marginTop: 10 }}>
          vertrauen Dzeng
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 80 }}>
        {stats.map((stat, i) => {
          const delay = 15 + i * 15;
          const s = spring({ frame: frame - delay, fps, config: { damping: 15 } });
          const x = interpolate(s, [0, 1], [i % 2 === 0 ? -200 : 200, 0]);
          const colors = ["hsla(239, 84%, 67%, 0.9)", "hsla(263, 70%, 66%, 0.9)", "hsla(330, 81%, 60%, 0.9)"];

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 25,
                transform: `translateX(${x}px)`,
                opacity: interpolate(s, [0, 1], [0, 1]),
                background: "hsla(217, 33%, 17%, 0.6)",
                borderRadius: 24,
                padding: "25px 35px",
                border: `1px solid ${colors[i]!.replace("0.9", "0.2")}`,
                minWidth: 380,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${colors[i]}, transparent)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 800,
                  fontFamily: "sans-serif",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {stat.symbol}
              </div>
              <div>
                <p style={{ fontSize: 44, fontWeight: 800, fontFamily: "sans-serif", color: "white", margin: 0 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 22, fontWeight: 400, fontFamily: "sans-serif", color: "hsla(210, 40%, 98%, 0.6)", margin: 0 }}>
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
