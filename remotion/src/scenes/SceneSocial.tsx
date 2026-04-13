import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const SceneSocial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Counter with dramatic scale
  const counterProgress = interpolate(frame, [5, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const count = Math.round(counterProgress * 247);

  const numSpring = spring({ frame: frame - 3, fps, config: { damping: 8, stiffness: 80 } });
  const numScale = interpolate(numSpring, [0, 1], [0.2, 1]);
  const numRotate = interpolate(numSpring, [0, 1], [-15, 0]);
  const numOpacity = interpolate(frame, [3, 15], [0, 1], { extrapolateRight: "clamp" });

  // Radial burst effect
  const burstParticles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const burstProgress = interpolate(frame, [8, 35], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const radius = burstProgress * 350;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: interpolate(frame, [8, 20, 40, 55], [0, 0.6, 0.3, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
      size: 4 + (i % 3) * 3,
    };
  });

  const labelSpring = spring({ frame: frame - 20, fps, config: { damping: 15 } });
  const labelY = interpolate(labelSpring, [0, 1], [40, 0]);
  const labelOpacity = interpolate(frame, [20, 32], [0, 1], { extrapolateRight: "clamp" });

  const subOpacity = interpolate(frame, [35, 48], [0, 1], { extrapolateRight: "clamp" });
  const subScale = spring({ frame: frame - 35, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      {/* Burst particles */}
      {burstParticles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `calc(50% + ${p.x}px)`,
            top: `calc(42% + ${p.y}px)`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: i % 2 === 0 ? "#14b8a6" : "#f97316",
            opacity: p.opacity,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Number */}
      <div
        style={{
          transform: `scale(${numScale}) rotate(${numRotate}deg)`,
          opacity: numOpacity,
          fontSize: 180,
          fontWeight: 900,
          fontFamily: "sans-serif",
          background: "linear-gradient(135deg, #14b8a6, #f97316)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
          filter: "drop-shadow(0 0 40px rgba(20,184,166,0.3))",
        }}
      >
        {count}+
      </div>

      {/* Label */}
      <div
        style={{
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
          fontSize: 44,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          marginTop: 16,
          fontFamily: "sans-serif",
          textShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        auf der Warteliste
      </div>

      {/* Subtext with bounce */}
      <div
        style={{
          opacity: subOpacity,
          transform: `scale(${interpolate(subScale, [0, 1], [0.5, 1])})`,
          fontSize: 32,
          color: "rgba(255,255,255,0.6)",
          textAlign: "center",
          marginTop: 24,
          fontFamily: "sans-serif",
        }}
      >
        Sei auch dabei! 🚀
      </div>
    </AbsoluteFill>
  );
};
