import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 2: Close-up annoyed face — dramatic zoom in
export const ComicPanel2 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel slides in from right
  const slideSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const slideX = interpolate(slideSpring, [0, 1], [1200, 0]);

  // Slow zoom into face
  const zoom = interpolate(frame, [10, 90], [1, 1.15], { extrapolateRight: "clamp" });

  // Thought dots appearing
  const dots = [
    { delay: 25, x: 680, y: 450 },
    { delay: 30, x: 720, y: 380 },
    { delay: 35, x: 760, y: 310 },
  ];

  return (
    <AbsoluteFill style={{ background: "#FFFFFF" }}>
      {/* Ben-Day dots background */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle, #87CEEB22 2px, transparent 2px)",
        backgroundSize: "8px 8px",
      }} />

      {/* Panel */}
      <div style={{
        position: "absolute",
        top: 80, left: 40, right: 40, bottom: 80,
        transform: `translateX(${slideX}px)`,
        overflow: "hidden",
        border: "6px solid black",
        boxShadow: "8px 8px 0 rgba(0,0,0,0.25)",
      }}>
        <Img
          src={staticFile("images/comic-panel-2.png")}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${zoom})`,
          }}
        />
      </div>

      {/* Animated thought dots */}
      {dots.map((dot, i) => {
        const dotSpring = spring({ frame: frame - dot.delay, fps, config: { damping: 8 } });
        const dotScale = interpolate(dotSpring, [0, 1], [0, 1]);
        return (
          <div key={i} style={{
            position: "absolute", left: dot.x, top: dot.y,
            width: 20 - i * 4, height: 20 - i * 4,
            borderRadius: "50%", background: "black",
            transform: `scale(${dotScale})`,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};
