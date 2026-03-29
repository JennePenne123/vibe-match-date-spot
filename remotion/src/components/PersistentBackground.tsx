import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const PersistentBackground = () => {
  const frame = useCurrentFrame();

  const hueShift = interpolate(frame, [0, 600], [0, 40]);
  const orb1X = interpolate(frame, [0, 300, 600], [20, 70, 30]);
  const orb1Y = interpolate(frame, [0, 200, 400, 600], [20, 60, 30, 50]);
  const orb2X = interpolate(frame, [0, 250, 500, 600], [70, 30, 60, 40]);
  const orb2Y = interpolate(frame, [0, 300, 600], [70, 25, 65]);
  const orb3X = interpolate(frame, [0, 350, 600], [50, 20, 80]);
  const orb3Y = interpolate(frame, [0, 200, 450, 600], [50, 80, 20, 60]);

  return (
    <AbsoluteFill
      style={{
        background: `hsl(${222 + hueShift * 0.3}, 47%, 8%)`,
      }}
    >
      {/* Orb 1 - Primary indigo */}
      <div
        style={{
          position: "absolute",
          left: `${orb1X}%`,
          top: `${orb1Y}%`,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(239, 84%, 67%, 0.35) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          filter: "blur(80px)",
        }}
      />
      {/* Orb 2 - Violet */}
      <div
        style={{
          position: "absolute",
          left: `${orb2X}%`,
          top: `${orb2Y}%`,
          width: 450,
          height: 450,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(263, 70%, 66%, 0.3) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          filter: "blur(70px)",
        }}
      />
      {/* Orb 3 - Pink accent */}
      <div
        style={{
          position: "absolute",
          left: `${orb3X}%`,
          top: `${orb3Y}%`,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(330, 81%, 60%, 0.25) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          filter: "blur(60px)",
        }}
      />
      {/* Subtle grain overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\"><filter id=\"n\"><feTurbulence baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/></filter><rect width=\"200\" height=\"200\" filter=\"url(%23n)\" opacity=\"0.03\"/></svg>')",
          opacity: 0.4,
        }}
      />
    </AbsoluteFill>
  );
};
