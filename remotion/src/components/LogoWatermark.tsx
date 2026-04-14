import { useCurrentFrame, interpolate, staticFile, Img } from "remotion";

// Persistent logo watermark — subtle but branded
export const LogoWatermark = () => {
  const frame = useCurrentFrame();

  // Delayed fade in, stays subtle
  const opacity = interpolate(frame, [30, 60], [0, 0.12], { extrapolateRight: "clamp" });
  // Subtle breathing
  const breathe = Math.sin(frame * 0.025) * 0.015 + 1;
  // Very slow rotation
  const rotate = Math.sin(frame * 0.008) * 1;

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", justifyContent: "center", alignItems: "center",
      opacity,
      zIndex: 1,
      pointerEvents: "none",
    }}>
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", inset: -30,
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 65%)",
          borderRadius: 30,
        }} />
        <Img
          src={staticFile("images/hioutz-logo.png")}
          style={{
            width: 480,
            height: "auto",
            transform: `scale(${breathe}) rotate(${rotate}deg)`,
            filter: "brightness(2.2) saturate(0.4) drop-shadow(0 0 8px rgba(0,0,0,0.4))",
            position: "relative", zIndex: 1,
          }}
        />
      </div>
    </div>
  );
};
