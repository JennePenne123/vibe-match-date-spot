import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 2: Bored couple — multi-panel comic page with zoom
export const SceneBored = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Full page panel slam
  const panelSpring = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const panelScale = interpolate(panelSpring, [0, 1], [1.5, 1]);
  const panelOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  // Shake on slam
  const shakeX = frame < 10 ? Math.sin(frame * 5) * (10 - frame) * 1.2 : 0;
  const shakeY = frame < 10 ? Math.cos(frame * 7) * (10 - frame) * 0.8 : 0;

  // Ken Burns zoom into the couple
  const zoom = interpolate(frame, [10, 130], [1, 1.25], { extrapolateRight: "clamp" });
  const panX = interpolate(frame, [10, 130], [0, -30], { extrapolateRight: "clamp" });
  const panY = interpolate(frame, [10, 130], [0, -60], { extrapolateRight: "clamp" });

  // Caption bar at top
  const capSpring = spring({ frame: frame - 3, fps, config: { damping: 18 } });
  const capX = interpolate(capSpring, [0, 1], [-600, 0]);

  // "Freitagabend" text pulse
  const textPulse = Math.sin(frame * 0.15) * 0.03 + 1;

  // Desaturation effect — starts colorful, goes grey to emphasize boredom
  const saturation = interpolate(frame, [30, 90], [1, 0.4], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      {/* Yellow comic background */}
      <div style={{ position: "absolute", inset: 0, background: "#FFE500" }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "8px 8px",
      }} />

      {/* Main panel with zoom */}
      <div style={{
        position: "absolute", top: 180, left: 40, right: 40, bottom: 250,
        opacity: panelOpacity,
        overflow: "hidden",
        border: "7px solid black",
        boxShadow: "12px 12px 0 rgba(0,0,0,0.3)",
      }}>
        <Img
          src={staticFile("images/comic-v2-panel1.png")}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${panelScale * zoom}) translate(${panX}px, ${panY}px)`,
            filter: `saturate(${saturation})`,
          }}
        />
      </div>

      {/* Caption bar */}
      <div style={{
        position: "absolute", top: 70, left: 0,
        transform: `translateX(${capX}px) scale(${textPulse})`,
      }}>
        <div style={{
          background: "#FF0000",
          padding: "14px 60px 14px 40px",
          borderRight: "5px solid black",
          borderBottom: "5px solid black",
          boxShadow: "6px 6px 0 rgba(0,0,0,0.2)",
        }}>
          <span style={{
            fontFamily: "sans-serif", fontWeight: 900, fontSize: 40,
            color: "white", textTransform: "uppercase", letterSpacing: 3,
          }}>
            📅 Freitagabend
          </span>
        </div>
      </div>

      {/* Bottom text that fades in */}
      <div style={{
        position: "absolute", bottom: 80, left: 0, right: 0,
        display: "flex", justifyContent: "center",
      }}>
        <div style={{
          opacity: interpolate(frame, [50, 65], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(${interpolate(
            spring({ frame: frame - 50, fps, config: { damping: 10 } }),
            [0, 1], [0.5, 1]
          )})`,
        }}>
          <span style={{
            fontFamily: "sans-serif", fontWeight: 800, fontSize: 52,
            color: "#333", textShadow: "3px 3px 0 rgba(255,229,0,0.8)",
            fontStyle: "italic",
          }}>
            Wohin heute...? 🤷
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
