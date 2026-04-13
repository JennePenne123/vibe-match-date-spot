import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const highlights = [
  { icon: "⚡", label: "KI-Matching", desc: "Perfekt auf euch abgestimmt", color: "#14b8a6" },
  { icon: "🤝", label: "Zusammen planen", desc: "Gemeinsam entscheiden", color: "#f97316" },
  { icon: "🎁", label: "Exklusive Deals", desc: "Voucher & Specials", color: "#0d9488" },
];

export const SceneFeatures = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title with rotation entrance
  const titleSpring = spring({ frame, fps, config: { damping: 12 } });
  const titleY = interpolate(titleSpring, [0, 1], [-80, 0]);
  const titleOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 50 }}>
      {/* Title */}
      <div
        style={{
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          fontSize: 52,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          fontFamily: "sans-serif",
          marginBottom: 70,
          lineHeight: 1.2,
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
        }}
      >
        Warum{" "}
        <span
          style={{
            background: "linear-gradient(90deg, #14b8a6, #f97316)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 20px rgba(20,184,166,0.3))",
          }}
        >
          H!Outz
        </span>
        ?
      </div>

      {/* Feature cards with dramatic pop-in */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center", width: "100%" }}>
        {highlights.map((h, i) => {
          const delay = 12 + i * 14;
          const s = spring({ frame: frame - delay, fps, config: { damping: 8, stiffness: 120 } });
          const scale = interpolate(s, [0, 1], [0, 1]);
          const rotate = interpolate(s, [0, 1], [i % 2 === 0 ? -12 : 12, 0]);
          const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const floatY = Math.sin((frame + i * 25) * 0.06) * 4;

          return (
            <div
              key={h.label}
              style={{
                transform: `scale(${scale}) rotate(${rotate}deg) translateY(${floatY}px)`,
                opacity,
                display: "flex",
                alignItems: "center",
                gap: 24,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 24,
                padding: "24px 32px",
                border: `1px solid ${h.color}30`,
                boxShadow: `0 12px 40px rgba(0,0,0,0.3), 0 0 60px ${h.color}10`,
                width: "100%",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: `${h.color}18`,
                  border: `2px solid ${h.color}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  flexShrink: 0,
                }}
              >
                {h.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: "white",
                    fontFamily: "sans-serif",
                  }}
                >
                  {h.label}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "sans-serif",
                    marginTop: 4,
                  }}
                >
                  {h.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
