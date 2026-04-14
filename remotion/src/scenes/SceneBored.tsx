import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Bangers";

const { fontFamily } = loadFont();

// Scene 2: Bored couple — comic page with Ken Burns + thought bubbles
export const SceneBored = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel slam entrance
  const panelSpring = spring({ frame, fps, config: { damping: 10, stiffness: 160 } });
  const panelScale = interpolate(panelSpring, [0, 1], [1.6, 1]);
  const panelOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });

  // Shake on slam
  const shakeX = frame < 12 ? Math.sin(frame * 6) * (12 - frame) * 1.5 : 0;
  const shakeY = frame < 12 ? Math.cos(frame * 8) * (12 - frame) * 1 : 0;

  // Ken Burns zoom
  const zoom = interpolate(frame, [10, 130], [1, 1.3], { extrapolateRight: "clamp" });
  const panX = interpolate(frame, [10, 130], [0, -40], { extrapolateRight: "clamp" });
  const panY = interpolate(frame, [10, 130], [0, -70], { extrapolateRight: "clamp" });

  // Caption bar slides in
  const capSpring = spring({ frame: frame - 3, fps, config: { damping: 15, stiffness: 120 } });
  const capX = interpolate(capSpring, [0, 1], [-700, 0]);

  // Desaturation — color drains to show boredom
  const saturation = interpolate(frame, [25, 100], [1, 0.3], { extrapolateRight: "clamp" });

  // Thought bubble "..." appearing
  const bubbleOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });
  const bubbleScale = interpolate(
    spring({ frame: frame - 40, fps, config: { damping: 10 } }),
    [0, 1], [0.3, 1]
  );

  // Dots animate one by one
  const dot1 = interpolate(frame, [50, 58], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dot2 = interpolate(frame, [58, 66], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dot3 = interpolate(frame, [66, 74], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Bottom text
  const textSpring = spring({ frame: frame - 55, fps, config: { damping: 8 } });
  const textScale = interpolate(textSpring, [0, 1], [0.4, 1]);
  const textOpacity = interpolate(frame, [55, 68], [0, 1], { extrapolateRight: "clamp" });

  // Yawn emoji floating
  const yawnY = interpolate(frame, [80, 130], [0, -60], { extrapolateRight: "clamp" });
  const yawnOpacity = interpolate(frame, [80, 90, 120, 130], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      {/* Yellow comic background */}
      <div style={{ position: "absolute", inset: 0, background: "#FFE500" }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)",
        backgroundSize: "8px 8px",
      }} />

      {/* Main panel */}
      <div style={{
        position: "absolute", top: 180, left: 35, right: 35, bottom: 280,
        opacity: panelOpacity,
        overflow: "hidden",
        border: "8px solid black",
        boxShadow: "14px 14px 0 rgba(0,0,0,0.35)",
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

      {/* Thought bubble */}
      <div style={{
        position: "absolute", top: 120, right: 80,
        opacity: bubbleOpacity,
        transform: `scale(${bubbleScale})`,
      }}>
        <div style={{
          background: "white", borderRadius: "50%",
          width: 200, height: 120,
          border: "5px solid black",
          display: "flex", justifyContent: "center", alignItems: "center",
          gap: 12,
          boxShadow: "6px 6px 0 rgba(0,0,0,0.2)",
        }}>
          <span style={{ fontSize: 40, opacity: dot1 }}>•</span>
          <span style={{ fontSize: 40, opacity: dot2 }}>•</span>
          <span style={{ fontSize: 40, opacity: dot3 }}>•</span>
        </div>
        {/* Small bubble connectors */}
        <div style={{
          position: "absolute", bottom: -20, left: 40,
          width: 22, height: 22, borderRadius: "50%",
          background: "white", border: "4px solid black",
        }} />
        <div style={{
          position: "absolute", bottom: -38, left: 20,
          width: 14, height: 14, borderRadius: "50%",
          background: "white", border: "3px solid black",
        }} />
      </div>

      {/* Caption bar */}
      <div style={{
        position: "absolute", top: 70, left: 0,
        transform: `translateX(${capX}px)`,
      }}>
        <div style={{
          background: "#FF0000",
          padding: "16px 65px 16px 40px",
          borderRight: "6px solid black",
          borderBottom: "6px solid black",
          boxShadow: "6px 6px 0 rgba(0,0,0,0.25)",
        }}>
          <span style={{
            fontFamily, fontSize: 46, color: "white",
            textTransform: "uppercase", letterSpacing: 4,
          }}>
            📅 Freitagabend
          </span>
        </div>
      </div>

      {/* Floating yawn */}
      <div style={{
        position: "absolute", top: 350, left: 120,
        fontSize: 60, opacity: yawnOpacity,
        transform: `translateY(${yawnY}px)`,
      }}>
        😴
      </div>

      {/* Bottom text */}
      <div style={{
        position: "absolute", bottom: 80, left: 0, right: 0,
        display: "flex", justifyContent: "center",
        opacity: textOpacity,
        transform: `scale(${textScale})`,
      }}>
        <div style={{
          background: "rgba(0,0,0,0.85)",
          padding: "14px 40px",
          border: "4px solid #FFE500",
          boxShadow: "6px 6px 0 rgba(0,0,0,0.3)",
          transform: "rotate(-1deg)",
        }}>
          <span style={{
            fontFamily, fontSize: 54, color: "#FFE500",
            letterSpacing: 2,
          }}>
            Wohin heute...? 🤷
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
