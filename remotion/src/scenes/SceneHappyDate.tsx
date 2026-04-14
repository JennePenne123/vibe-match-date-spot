import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Bangers";

const { fontFamily } = loadFont();

// Scene 5: Happy couple — warm payoff with hearts & "PERFEKT!" stamp
export const SceneHappyDate = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel rises with bounce
  const riseSpring = spring({ frame, fps, config: { damping: 10, stiffness: 70 } });
  const riseY = interpolate(riseSpring, [0, 1], [1920, 0]);

  // Ken Burns slow zoom
  const zoom = interpolate(frame, [15, 130], [1, 1.15], { extrapolateRight: "clamp" });

  // Warm glow
  const warmGlow = interpolate(frame, [20, 80], [0, 0.25], { extrapolateRight: "clamp" });

  // Hearts and stars — more varied
  const particles = [
    { emoji: "❤️", x: 100, delay: 15, size: 55 },
    { emoji: "✨", x: 320, delay: 22, size: 45 },
    { emoji: "💕", x: 580, delay: 30, size: 50 },
    { emoji: "⭐", x: 820, delay: 18, size: 42 },
    { emoji: "❤️", x: 220, delay: 38, size: 48 },
    { emoji: "✨", x: 700, delay: 26, size: 38 },
    { emoji: "💖", x: 450, delay: 35, size: 52 },
    { emoji: "🌟", x: 950, delay: 42, size: 40 },
  ];

  // "WOW!" comic text
  const wowSpring = spring({ frame: frame - 10, fps, config: { damping: 6, stiffness: 180 } });
  const wowScale = interpolate(wowSpring, [0, 1], [4, 1]);
  const wowOpacity = interpolate(frame, [10, 16], [0, 1], { extrapolateRight: "clamp" });
  const wowFade = interpolate(frame, [40, 55], [1, 0], { extrapolateRight: "clamp" });

  // "PERFEKT!" stamp — delayed big impact
  const stampSpring = spring({ frame: frame - 50, fps, config: { damping: 7, stiffness: 220 } });
  const stampScale = interpolate(stampSpring, [0, 1], [5, 1]);
  const stampRotation = interpolate(stampSpring, [0, 1], [-25, -8]);
  const stampOpacity = interpolate(frame, [50, 56], [0, 1], { extrapolateRight: "clamp" });

  // Shake on stamp
  const stampShakeX = frame >= 50 && frame < 60 ? Math.sin(frame * 7) * (60 - frame) * 1.2 : 0;
  const stampShakeY = frame >= 50 && frame < 60 ? Math.cos(frame * 10) * (60 - frame) * 0.8 : 0;

  // Background warm pulse
  const bgWarm = interpolate(frame, [0, 60], [0, 10], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ transform: `translate(${stampShakeX}px, ${stampShakeY}px)` }}>
      {/* Warm orange gradient bg */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(180deg, hsl(20, 100%, ${60 + bgWarm}%) 0%, #FFE500 100%)`,
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)",
        backgroundSize: "8px 8px",
      }} />

      {/* Main panel */}
      <div style={{
        position: "absolute", top: 80, left: 30, right: 30, bottom: 380,
        transform: `translateY(${riseY}px)`,
        overflow: "hidden",
        border: "8px solid black",
        boxShadow: "14px 14px 0 rgba(0,0,0,0.35)",
      }}>
        <Img
          src={staticFile("images/comic-v2-panel4.png")}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${zoom})`,
          }}
        />
        {/* Warm golden overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, rgba(255,200,50,0.3), transparent 70%)",
          opacity: warmGlow,
        }} />
      </div>

      {/* "WOW!" comic text */}
      <div style={{
        position: "absolute", top: 50, right: 60,
        opacity: wowOpacity * wowFade,
        transform: `scale(${wowScale}) rotate(15deg)`,
      }}>
        <span style={{
          fontFamily, fontSize: 100, color: "#FFE500",
          textShadow: "4px 4px 0 #FF6B35, 8px 8px 0 rgba(0,0,0,0.3)",
        }}>
          WOW!
        </span>
      </div>

      {/* Floating particles */}
      {particles.map((p, i) => {
        const pY = interpolate(frame, [p.delay, p.delay + 90], [1900, -80]);
        const pOpacity = interpolate(frame, [p.delay, p.delay + 10, p.delay + 75, p.delay + 90], [0, 1, 1, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const wobble = Math.sin((frame - p.delay) * 0.12) * 25;
        const spin = (frame - p.delay) * 2;
        return (
          <div key={i} style={{
            position: "absolute", left: p.x + wobble, top: pY,
            fontSize: p.size, opacity: pOpacity,
            transform: `rotate(${spin}deg)`,
          }}>
            {p.emoji}
          </div>
        );
      })}

      {/* PERFEKT stamp */}
      <div style={{
        position: "absolute", bottom: 110, left: 0, right: 0,
        display: "flex", justifyContent: "center",
        opacity: stampOpacity,
        transform: `scale(${stampScale}) rotate(${stampRotation}deg)`,
      }}>
        <div style={{
          border: "7px solid #FF0000",
          borderRadius: 18,
          padding: "16px 55px",
          background: "rgba(255,255,255,0.95)",
          boxShadow: "10px 10px 0 rgba(0,0,0,0.25)",
        }}>
          <span style={{
            fontFamily, fontSize: 64, color: "#FF0000",
            letterSpacing: 8,
          }}>
            PERFEKT! 💯
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
