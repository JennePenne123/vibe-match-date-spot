import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 3: BLING! Phone notification — explosive entrance
export const ComicPanel3 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Explosive scale from center
  const explodeSpring = spring({ frame, fps, config: { damping: 8, stiffness: 150 } });
  const explodeScale = interpolate(explodeSpring, [0, 1], [0.1, 1]);
  const rotation = interpolate(explodeSpring, [0, 1], [20, 0]);

  // Flash effect
  const flashOpacity = interpolate(frame, [0, 4, 12], [1, 0.8, 0], {
    extrapolateRight: "clamp",
  });

  // Screen shake
  const shakeIntensity = Math.max(0, 15 - frame) * 2;
  const shakeX = Math.sin(frame * 8) * shakeIntensity;
  const shakeY = Math.cos(frame * 11) * shakeIntensity * 0.6;

  // Action lines radiating — done via the panel image itself
  const lineRotation = interpolate(frame, [0, 90], [0, 15]);

  // Pulsing glow
  const glowPulse = Math.sin(frame * 0.3) * 0.15 + 0.85;

  return (
    <AbsoluteFill style={{ background: "#FFE500" }}>
      {/* White flash */}
      <div style={{
        position: "absolute", inset: 0,
        background: "white",
        opacity: flashOpacity,
        zIndex: 10,
      }} />

      {/* Main panel — explosive entrance */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", justifyContent: "center", alignItems: "center",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}>
        <div style={{
          width: "92%", height: "85%",
          transform: `scale(${explodeScale}) rotate(${rotation}deg)`,
          overflow: "hidden",
          border: "8px solid black",
          boxShadow: `0 0 ${60 * glowPulse}px rgba(255,200,0,0.6), 12px 12px 0 rgba(0,0,0,0.3)`,
        }}>
          <Img
            src={staticFile("images/comic-panel-3.png")}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: `rotate(${lineRotation}deg) scale(1.1)`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
