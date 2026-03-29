import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

export const SceneCTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background image collage with slow zoom
  const bgScale = interpolate(frame, [0, 135], [1.05, 1.2]);

  // Logo entrance
  const logoS = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const logoScale = interpolate(logoS, [0, 1], [0, 1]);

  // Text reveal
  const textS = spring({ frame: frame - 15, fps, config: { damping: 18 } });
  const textY = interpolate(textS, [0, 1], [50, 0]);
  const textOpacity = interpolate(textS, [0, 1], [0, 1]);

  // CTA button
  const btnS = spring({ frame: frame - 40, fps, config: { damping: 12 } });
  const btnScale = interpolate(btnS, [0, 1], [0.5, 1]);
  const btnOpacity = interpolate(btnS, [0, 1], [0, 1]);
  const pulse = Math.sin(frame * 0.1) * 0.15 + 0.85;

  // Sparkle burst
  const sparkles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const burstProgress = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
    const radius = burstProgress * 300;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: interpolate(frame, [60, 75, 100, 120], [0, 0.8, 0.4, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
      size: 6 + (i % 3) * 3,
    };
  });

  return (
    <AbsoluteFill>
      {/* Background venue image */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Img
          src={staticFile("images/couple-walking.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${bgScale})`,
            opacity: 0.25,
          }}
        />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, hsla(222, 47%, 8%, 0.6) 0%, hsla(222, 47%, 8%, 0.8) 50%, hsla(222, 47%, 8%, 0.6) 100%)" }} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* Sparkles */}
        {sparkles.map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `calc(50% + ${s.x}px)`,
            top: `calc(38% + ${s.y}px)`,
            width: s.size, height: s.size, borderRadius: "50%",
            background: i % 2 === 0 ? "hsla(239, 84%, 67%, 0.8)" : "hsla(330, 81%, 60%, 0.8)",
            opacity: s.opacity,
            transform: "translate(-50%, -50%)",
          }} />
        ))}

        {/* Logo */}
        <div style={{ transform: `scale(${logoScale})`, marginBottom: 40 }}>
          <span style={{
            fontSize: 120, fontWeight: 800, fontFamily: "sans-serif",
            background: "linear-gradient(135deg, hsl(239, 84%, 67%), hsl(263, 70%, 66%), hsl(330, 81%, 60%))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 40px hsla(239, 84%, 67%, 0.3))",
          }}>
            Dzeng
          </span>
        </div>

        {/* Tagline */}
        <div style={{ transform: `translateY(${textY}px)`, opacity: textOpacity, textAlign: "center", marginBottom: 50 }}>
          <p style={{ fontSize: 40, fontWeight: 500, fontFamily: "sans-serif", color: "hsla(210, 40%, 98%, 0.85)" }}>
            Dein nächstes Date
          </p>
          <p style={{ fontSize: 40, fontWeight: 500, fontFamily: "sans-serif", color: "hsla(210, 40%, 98%, 0.85)" }}>
            wartet schon
          </p>
        </div>

        {/* CTA Button */}
        <div style={{
          transform: `scale(${btnScale * pulse})`,
          opacity: btnOpacity,
          background: "linear-gradient(135deg, hsl(239, 84%, 67%), hsl(263, 70%, 66%))",
          borderRadius: 25,
          padding: "22px 60px",
          boxShadow: `0 15px 50px hsla(239, 84%, 67%, ${0.3 * pulse})`,
        }}>
          <p style={{ fontSize: 34, fontWeight: 700, fontFamily: "sans-serif", color: "white", margin: 0 }}>
            Jetzt starten
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
