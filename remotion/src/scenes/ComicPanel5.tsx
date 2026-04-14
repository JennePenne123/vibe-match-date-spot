import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 5: Happy couple — the payoff
export const ComicPanel5 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel wipes in from bottom
  const wipeSpring = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const wipeY = interpolate(wipeSpring, [0, 1], [1920, 0]);

  // Warm glow building
  const glowOpacity = interpolate(frame, [15, 50], [0, 0.3], { extrapolateRight: "clamp" });

  // Slow zoom
  const zoom = interpolate(frame, [0, 120], [1, 1.1], { extrapolateRight: "clamp" });

  // Stars twinkling
  const stars = [
    { x: 150, y: 300, delay: 20, size: 50 },
    { x: 850, y: 250, delay: 30, size: 40 },
    { x: 500, y: 180, delay: 40, size: 55 },
    { x: 300, y: 400, delay: 50, size: 35 },
    { x: 750, y: 350, delay: 25, size: 45 },
  ];

  return (
    <AbsoluteFill style={{ background: "#FF6B35" }}>
      {/* Warm sunset gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #FFE500 0%, #FF6B35 50%, #FF0050 100%)",
        opacity: 0.3,
      }} />

      {/* Main panel */}
      <div style={{
        position: "absolute",
        top: 60, left: 40, right: 40, bottom: 200,
        transform: `translateY(${wipeY}px)`,
        overflow: "hidden",
        border: "6px solid black",
        boxShadow: "10px 10px 0 rgba(0,0,0,0.3)",
      }}>
        <Img
          src={staticFile("images/comic-panel-5.png")}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${zoom})`,
          }}
        />
        {/* Warm glow overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, rgba(255,200,50,0.3), transparent 70%)",
          opacity: glowOpacity,
        }} />
      </div>

      {/* Twinkling stars */}
      {stars.map((star, i) => {
        const twinkle = Math.sin((frame - star.delay) * 0.4) * 0.5 + 0.5;
        const sSpring = spring({ frame: frame - star.delay, fps, config: { damping: 8 } });
        const sScale = interpolate(sSpring, [0, 1], [0, 1]);
        return (
          <div key={i} style={{
            position: "absolute", left: star.x, top: star.y,
            fontSize: star.size, opacity: twinkle,
            transform: `scale(${sScale}) rotate(${frame * 2}deg)`,
          }}>
            ✨
          </div>
        );
      })}

      {/* Bottom caption */}
      <div style={{
        position: "absolute", bottom: 50, left: 0, right: 0,
        display: "flex", justifyContent: "center",
      }}>
        <div style={{
          opacity: interpolate(frame, [30, 42], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(${interpolate(
            spring({ frame: frame - 30, fps, config: { damping: 10 } }),
            [0, 1], [0.5, 1]
          )})`,
        }}>
          <div style={{
            background: "white",
            padding: "16px 40px",
            border: "5px solid black",
            boxShadow: "8px 8px 0 black",
          }}>
            <span style={{
              fontFamily: "sans-serif", fontWeight: 900, fontSize: 34,
              color: "#FF0050", letterSpacing: 1,
            }}>
              PERFEKTES DATE! 💕
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
