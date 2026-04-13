import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

export const SceneCTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo with bounce entrance
  const logoSpring = spring({ frame, fps, config: { damping: 8, stiffness: 100 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoRotate = interpolate(logoSpring, [0, 1], [20, 0]);
  const logoOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // Dark backdrop behind logo for maximum contrast
  const glowPulse = interpolate(Math.sin(frame * 0.07), [-1, 1], [0.6, 1]);

  // URL with typewriter effect
  const urlText = "hioutz.com/waitlist";
  const charsVisible = Math.min(
    urlText.length,
    Math.max(0, Math.floor((frame - 18) * 0.8))
  );
  const urlOpacity = interpolate(frame, [18, 22], [0, 1], { extrapolateRight: "clamp" });

  // CTA button with dramatic entrance
  const ctaSpring = spring({ frame: frame - 40, fps, config: { damping: 6, stiffness: 80 } });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0, 1]);
  const ctaOpacity = interpolate(frame, [40, 48], [0, 1], { extrapolateRight: "clamp" });

  // Pulsing glow
  const glowScale = 1 + Math.sin((frame - 50) * 0.1) * 0.05;
  const glowOpacity = interpolate(Math.sin((frame - 50) * 0.08), [-1, 1], [0.3, 0.8]);

  // Sparkle ring
  const sparkles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2 + frame * 0.02;
    const radius = 280 + Math.sin(frame * 0.05 + i) * 20;
    const sparkleOpacity = interpolate(frame, [50, 60], [0, 0.5], { extrapolateRight: "clamp" });
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: sparkleOpacity * (0.3 + Math.sin(frame * 0.1 + i * 2) * 0.3),
      size: 3 + (i % 4),
    };
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      {/* Rotating sparkles */}
      {sparkles.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `calc(50% + ${s.x}px)`,
            top: `calc(35% + ${s.y}px)`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: i % 3 === 0 ? "#14b8a6" : i % 3 === 1 ? "#f97316" : "#ffffff",
            opacity: s.opacity,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Dark backdrop behind logo */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          width: 600,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(5,10,21,0.95) 0%, rgba(5,10,21,0.6) 60%, transparent 85%)",
          opacity: glowPulse,
          transform: "translateY(-30%)",
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
          opacity: logoOpacity,
          marginBottom: 50,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Img
          src={staticFile("images/hioutz-logo.png")}
          style={{ width: 320, height: "auto" }}
        />
      </div>

      {/* URL typewriter */}
      <div
        style={{
          opacity: urlOpacity,
          fontSize: 36,
          fontWeight: 700,
          color: "#14b8a6",
          textAlign: "center",
          fontFamily: "monospace",
          marginBottom: 50,
          position: "relative",
          zIndex: 2,
          textShadow: "0 0 20px rgba(20,184,166,0.3)",
        }}
      >
        {urlText.slice(0, charsVisible)}
        {charsVisible < urlText.length && (
          <span
            style={{
              opacity: Math.sin(frame * 0.15) > 0 ? 1 : 0,
              color: "#f97316",
            }}
          >
            |
          </span>
        )}
      </div>

      {/* CTA Button */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale * glowScale})`,
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Animated glow */}
        <div
          style={{
            position: "absolute",
            inset: -24,
            borderRadius: 44,
            background: "linear-gradient(90deg, #14b8a6, #f97316)",
            opacity: frame > 50 ? glowOpacity : 0,
            filter: "blur(30px)",
          }}
        />
        <div
          style={{
            position: "relative",
            background: "linear-gradient(135deg, #14b8a6, #0d9488, #f97316)",
            borderRadius: 32,
            padding: "32px 72px",
            fontSize: 38,
            fontWeight: 900,
            color: "white",
            fontFamily: "sans-serif",
            textAlign: "center",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
            letterSpacing: 1,
          }}
        >
          Jetzt eintragen! 🔥
        </div>
      </div>
    </AbsoluteFill>
  );
};
