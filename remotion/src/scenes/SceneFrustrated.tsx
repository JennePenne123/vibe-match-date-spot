import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 3: Frustrated close-up — dramatic zoom with camera pan
export const SceneFrustrated = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel wipes in from right
  const wipeSpring = spring({ frame, fps, config: { damping: 14 } });
  const clipX = interpolate(wipeSpring, [0, 1], [100, 0]);

  // Dramatic zoom into eyes
  const zoom = interpolate(frame, [0, 100], [1, 1.4], { extrapolateRight: "clamp" });
  const panY = interpolate(frame, [0, 100], [0, -80], { extrapolateRight: "clamp" });

  // Red vignette building (frustration growing)
  const vignetteOpacity = interpolate(frame, [20, 80], [0, 0.25], { extrapolateRight: "clamp" });

  // Screen vibration at the peak of frustration
  const vibeStart = 60;
  const vibeIntensity = frame >= vibeStart && frame < vibeStart + 15 
    ? Math.sin(frame * 10) * (vibeStart + 15 - frame) * 0.5 : 0;

  return (
    <AbsoluteFill style={{ transform: `translateX(${vibeIntensity}px)` }}>
      {/* White bg with halftone */}
      <div style={{ position: "absolute", inset: 0, background: "white" }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle, rgba(255,0,0,0.05) 1px, transparent 1px)",
        backgroundSize: "6px 6px",
      }} />

      {/* Panel with clip reveal */}
      <div style={{
        position: "absolute", top: 100, left: 30, right: 30, bottom: 300,
        overflow: "hidden",
        border: "7px solid black",
        boxShadow: "10px 10px 0 rgba(0,0,0,0.25)",
        clipPath: `inset(0 ${clipX}% 0 0)`,
      }}>
        <Img
          src={staticFile("images/comic-v2-panel2.png")}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${zoom}) translateY(${panY}px)`,
          }}
        />
      </div>

      {/* Red frustration vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.4) 100%)",
        opacity: vignetteOpacity,
        pointerEvents: "none",
      }} />

      {/* Bottom frustration text */}
      <div style={{
        position: "absolute", bottom: 100, left: 0, right: 0,
        display: "flex", justifyContent: "center",
      }}>
        <div style={{
          opacity: interpolate(frame, [35, 50], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(${interpolate(
            spring({ frame: frame - 35, fps, config: { damping: 8 } }),
            [0, 1], [2, 1]
          )})`,
        }}>
          <div style={{
            background: "#FF0000",
            padding: "18px 44px",
            border: "5px solid black",
            boxShadow: "8px 8px 0 black",
            transform: `rotate(-2deg)`,
          }}>
            <span style={{
              fontFamily: "sans-serif", fontWeight: 900, fontSize: 46,
              color: "white", letterSpacing: 2,
            }}>
              ES REICHT! 😤
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
