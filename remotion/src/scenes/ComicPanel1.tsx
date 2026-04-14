import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 1: Bored couple — panel slides in, then slow zoom
export const ComicPanel1 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel border draws in
  const borderReveal = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  // Panel image scales in with spring
  const panelSpring = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 120 } });
  const panelScale = interpolate(panelSpring, [0, 1], [1.4, 1]);
  const panelOpacity = interpolate(frame, [5, 12], [0, 1], { extrapolateRight: "clamp" });

  // Slow Ken Burns zoom
  const kenBurns = interpolate(frame, [12, 120], [1, 1.08], { extrapolateRight: "clamp" });

  // "Meanwhile..." caption at top
  const captionSpring = spring({ frame: frame - 2, fps, config: { damping: 20 } });
  const captionY = interpolate(captionSpring, [0, 1], [-60, 0]);
  const captionOpacity = interpolate(frame, [2, 10], [0, 1], { extrapolateRight: "clamp" });

  // Screen shake at panel slam
  const shakeX = frame >= 5 && frame < 14 ? Math.sin(frame * 5) * (14 - frame) * 1.2 : 0;
  const shakeY = frame >= 5 && frame < 14 ? Math.cos(frame * 7) * (14 - frame) * 0.8 : 0;

  return (
    <AbsoluteFill style={{ background: "#FFE500" }}>
      {/* Halftone dot pattern background */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)",
        backgroundSize: "12px 12px",
      }} />

      {/* Caption bar */}
      <div style={{
        position: "absolute", top: 60, left: 0, right: 0, zIndex: 10,
        display: "flex", justifyContent: "center",
        opacity: captionOpacity,
        transform: `translateY(${captionY}px)`,
      }}>
        <div style={{
          background: "#FF0000",
          padding: "14px 48px",
          border: "4px solid black",
          boxShadow: "6px 6px 0 black",
        }}>
          <span style={{
            fontFamily: "sans-serif", fontWeight: 900, fontSize: 36,
            color: "white", textTransform: "uppercase", letterSpacing: 4,
          }}>
            Freitagabend...
          </span>
        </div>
      </div>

      {/* Main panel */}
      <div style={{
        position: "absolute",
        top: 160, left: 60, right: 60, bottom: 120,
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}>
        {/* Panel border */}
        <div style={{
          position: "absolute", inset: 0,
          border: "6px solid black",
          boxShadow: "10px 10px 0 rgba(0,0,0,0.3)",
          opacity: borderReveal,
          zIndex: 2,
        }} />

        {/* Panel image */}
        <div style={{
          position: "absolute", inset: 0, overflow: "hidden",
          opacity: panelOpacity,
        }}>
          <Img
            src={staticFile("images/comic-panel-1.png")}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: `scale(${panelScale * kenBurns})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
