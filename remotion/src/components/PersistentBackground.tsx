import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const PersistentBackground = () => {
  const frame = useCurrentFrame();

  const gradientAngle = interpolate(frame, [0, 300], [120, 240]);
  
  // Faster, more dramatic pulse
  const pulse1 = interpolate(Math.sin(frame * 0.05), [-1, 1], [0.1, 0.35]);
  const pulse2 = interpolate(Math.cos(frame * 0.04), [-1, 1], [0.08, 0.28]);

  return (
    <AbsoluteFill>
      {/* Deep base with richer color */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(${gradientAngle}deg, #050a15 0%, #0a1628 30%, #0d1f3c 60%, #050a15 100%)`,
        }}
      />

      {/* Large teal orb - dramatic movement */}
      <div
        style={{
          position: "absolute",
          top: `${20 + Math.sin(frame * 0.02) * 15}%`,
          left: `${-5 + Math.cos(frame * 0.015) * 10}%`,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(13,148,136,0.35) 0%, rgba(13,148,136,0.1) 40%, transparent 70%)",
          opacity: pulse1,
        }}
      />

      {/* Orange orb - opposing movement */}
      <div
        style={{
          position: "absolute",
          bottom: `${-10 + Math.sin(frame * 0.025) * 12}%`,
          right: `${-10 + Math.cos(frame * 0.02) * 15}%`,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.3) 0%, rgba(249,115,22,0.08) 40%, transparent 70%)",
          opacity: pulse2,
        }}
      />

      {/* Center accent glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 60%)",
          transform: `translate(-50%, -50%) scale(${1 + Math.sin(frame * 0.06) * 0.15})`,
        }}
      />

      {/* Animated diagonal streaks */}
      {[0, 1, 2].map((i) => {
        const streakProgress = ((frame * 1.5 + i * 100) % 300) / 300;
        const streakY = interpolate(streakProgress, [0, 1], [-200, 2200]);
        const streakOpacity = interpolate(streakProgress, [0, 0.3, 0.7, 1], [0, 0.06, 0.06, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: streakY,
              left: -100,
              width: 1400,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${i === 1 ? "rgba(249,115,22,0.4)" : "rgba(20,184,166,0.4)"}, transparent)`,
              transform: "rotate(-35deg)",
              opacity: streakOpacity,
            }}
          />
        );
      })}

      {/* Subtle dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};
