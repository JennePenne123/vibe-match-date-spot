import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 5: Happy couple — the payoff with warm tones
export const SceneHappyDate = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel rises from bottom
  const riseSpring = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const riseY = interpolate(riseSpring, [0, 1], [1920, 0]);

  // Ken Burns slow zoom
  const zoom = interpolate(frame, [15, 130], [1, 1.12], { extrapolateRight: "clamp" });

  // Warm glow intensifying
  const warmGlow = interpolate(frame, [20, 80], [0, 0.2], { extrapolateRight: "clamp" });

  // Hearts and stars
  const particles = [
    { emoji: "❤️", x: 120, delay: 20, speed: 2.5, size: 50 },
    { emoji: "✨", x: 350, delay: 28, speed: 2, size: 42 },
    { emoji: "💕", x: 600, delay: 35, speed: 3, size: 46 },
    { emoji: "⭐", x: 850, delay: 22, speed: 2.2, size: 38 },
    { emoji: "❤️", x: 250, delay: 42, speed: 1.8, size: 44 },
    { emoji: "✨", x: 750, delay: 30, speed: 2.8, size: 40 },
  ];

  // "PERFEKT!" stamp
  const stampSpring = spring({ frame: frame - 45, fps, config: { damping: 8, stiffness: 200 } });
  const stampScale = interpolate(stampSpring, [0, 1], [4, 1]);
  const stampRotation = interpolate(stampSpring, [0, 1], [-20, -8]);
  const stampOpacity = interpolate(frame, [45, 52], [0, 1], { extrapolateRight: "clamp" });

  // Shake on stamp
  const stampShakeX = frame >= 45 && frame < 55 ? Math.sin(frame * 6) * (55 - frame) * 1 : 0;
  const stampShakeY = frame >= 45 && frame < 55 ? Math.cos(frame * 8) * (55 - frame) * 0.7 : 0;

  return (
    <AbsoluteFill style={{ transform: `translate(${stampShakeX}px, ${stampShakeY}px)` }}>
      {/* Warm orange gradient bg */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #FF6B35 0%, #FFE500 100%)",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)",
        backgroundSize: "8px 8px",
      }} />

      {/* Main panel */}
      <div style={{
        position: "absolute", top: 100, left: 35, right: 35, bottom: 350,
        transform: `translateY(${riseY}px)`,
        overflow: "hidden",
        border: "7px solid black",
        boxShadow: "12px 12px 0 rgba(0,0,0,0.3)",
      }}>
        <Img
          src={staticFile("images/comic-v2-panel4.png")}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${zoom})`,
          }}
        />
        {/* Warm overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, rgba(255,200,50,0.25), transparent 70%)",
          opacity: warmGlow,
        }} />
      </div>

      {/* Floating particles */}
      {particles.map((p, i) => {
        const pY = interpolate(frame, [p.delay, p.delay + 80], [1800, -100]);
        const pOpacity = interpolate(frame, [p.delay, p.delay + 10, p.delay + 70, p.delay + 80], [0, 1, 1, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const wobble = Math.sin((frame - p.delay) * 0.15) * 20;
        return (
          <div key={i} style={{
            position: "absolute", left: p.x + wobble, top: pY,
            fontSize: p.size, opacity: pOpacity,
          }}>
            {p.emoji}
          </div>
        );
      })}

      {/* PERFEKT stamp */}
      <div style={{
        position: "absolute", bottom: 130, left: 0, right: 0,
        display: "flex", justifyContent: "center",
        opacity: stampOpacity,
        transform: `scale(${stampScale}) rotate(${stampRotation}deg)`,
      }}>
        <div style={{
          border: "6px solid #FF0000",
          borderRadius: 16,
          padding: "14px 50px",
          background: "rgba(255,255,255,0.9)",
          boxShadow: "8px 8px 0 rgba(0,0,0,0.2)",
        }}>
          <span style={{
            fontFamily: "sans-serif", fontWeight: 900, fontSize: 56,
            color: "#FF0000", letterSpacing: 6,
            textTransform: "uppercase",
          }}>
            PERFEKT! 💯
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
