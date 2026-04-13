import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const PersistentBackground = () => {
  const frame = useCurrentFrame();

  const gradientAngle = interpolate(frame, [0, 300], [135, 195]);
  const pulseOpacity = interpolate(
    Math.sin(frame * 0.03),
    [-1, 1],
    [0.08, 0.18]
  );

  return (
    <AbsoluteFill>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(${gradientAngle}deg, #0f172a 0%, #1a1a2e 40%, #16213e 70%, #0f172a 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,184,166,0.25) 0%, transparent 70%)",
          opacity: pulseOpacity + 0.05,
          transform: `translate(${Math.sin(frame * 0.015) * 30}px, ${Math.cos(frame * 0.012) * 20}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-15%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)",
          opacity: pulseOpacity,
          transform: `translate(${Math.cos(frame * 0.02) * 25}px, ${Math.sin(frame * 0.018) * 30}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
};
