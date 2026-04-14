import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img, Sequence } from "remotion";

// Persistent logo watermark that appears throughout the video
export const LogoWatermark = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo fades in early and stays
  const opacity = interpolate(frame, [0, 20], [0, 0.15], { extrapolateRight: "clamp" });
  // Subtle breathing
  const breathe = Math.sin(frame * 0.03) * 0.02 + 1;

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", justifyContent: "center", alignItems: "center",
      opacity,
      zIndex: 1,
      pointerEvents: "none",
    }}>
      <Img
        src={staticFile("images/hioutz-logo.png")}
        style={{
          width: 500,
          height: "auto",
          transform: `scale(${breathe})`,
          filter: "brightness(2)",
        }}
      />
    </div>
  );
};
