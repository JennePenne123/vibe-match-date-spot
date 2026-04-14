import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 4: AI recommendation — phone + thought bubble
export const ComicPanel4 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel fades in with scale
  const panelSpring = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });
  const panelScale = interpolate(panelSpring, [0, 1], [0.8, 1]);
  const panelOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // Slow parallax — image moves slightly
  const parallaxX = interpolate(frame, [0, 120], [10, -10]);
  const parallaxY = interpolate(frame, [0, 120], [5, -5]);

  // Hearts floating up
  const hearts = [
    { delay: 20, x: 200, size: 40 },
    { delay: 28, x: 500, size: 32 },
    { delay: 35, x: 800, size: 36 },
    { delay: 42, x: 350, size: 28 },
  ];

  // Caption at bottom
  const capSpring = spring({ frame: frame - 15, fps, config: { damping: 18 } });
  const capY = interpolate(capSpring, [0, 1], [80, 0]);
  const capOpacity = interpolate(frame, [15, 25], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#FFE500" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)",
        backgroundSize: "10px 10px",
      }} />

      {/* Main panel */}
      <div style={{
        position: "absolute",
        top: 80, left: 50, right: 50, bottom: 200,
        opacity: panelOpacity,
        transform: `scale(${panelScale})`,
        overflow: "hidden",
        border: "6px solid black",
        boxShadow: "10px 10px 0 rgba(0,0,0,0.25)",
      }}>
        <Img
          src={staticFile("images/comic-panel-4.png")}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `translate(${parallaxX}px, ${parallaxY}px) scale(1.05)`,
          }}
        />
      </div>

      {/* Floating hearts */}
      {hearts.map((heart, i) => {
        const hSpring = spring({ frame: frame - heart.delay, fps, config: { damping: 10 } });
        const hY = interpolate(frame, [heart.delay, heart.delay + 60], [1600, 400]);
        const hOpacity = interpolate(frame, [heart.delay, heart.delay + 8, heart.delay + 50, heart.delay + 60], [0, 1, 1, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const hScale = interpolate(hSpring, [0, 1], [0, 1]);
        return (
          <div key={i} style={{
            position: "absolute", left: heart.x, top: hY,
            fontSize: heart.size, opacity: hOpacity,
            transform: `scale(${hScale})`,
          }}>
            ❤️
          </div>
        );
      })}

      {/* Caption */}
      <div style={{
        position: "absolute", bottom: 60, left: 0, right: 0,
        display: "flex", justifyContent: "center",
        opacity: capOpacity,
        transform: `translateY(${capY}px)`,
      }}>
        <div style={{
          background: "#14b8a6",
          padding: "16px 44px",
          border: "4px solid black",
          boxShadow: "6px 6px 0 black",
        }}>
          <span style={{
            fontFamily: "sans-serif", fontWeight: 900, fontSize: 32,
            color: "white", letterSpacing: 2,
          }}>
            KI FINDET EUREN SPOT! ✨
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
