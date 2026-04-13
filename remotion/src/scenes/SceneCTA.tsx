import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 5: CTA — Urgency + waitlist signup
export const SceneCTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Die ersten 500" counter
  const counterProgress = interpolate(frame, [5, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spotsLeft = Math.round(253 - counterProgress * 0);
  const numSpring = spring({ frame: frame - 3, fps, config: { damping: 10 } });
  const numScale = interpolate(numSpring, [0, 1], [0.3, 1]);
  const numOpacity = interpolate(frame, [3, 12], [0, 1], { extrapolateRight: "clamp" });

  // "Early Access" badge
  const badgeSpring = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 130 } });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0, 1]);
  const badgeRotate = interpolate(badgeSpring, [0, 1], [-20, -3]);

  // URL
  const urlOpacity = interpolate(frame, [25, 35], [0, 1], { extrapolateRight: "clamp" });
  const urlText = "hioutz.com/waitlist";
  const charsVisible = Math.min(urlText.length, Math.max(0, Math.floor((frame - 25) * 1.2)));

  // CTA button
  const ctaSpring = spring({ frame: frame - 38, fps, config: { damping: 6, stiffness: 80 } });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0, 1]);
  const ctaOpacity = interpolate(frame, [38, 45], [0, 1], { extrapolateRight: "clamp" });
  const ctaPulse = 1 + Math.sin((frame - 45) * 0.12) * 0.04;

  // Glow
  const glowOpacity = interpolate(Math.sin((frame - 45) * 0.08), [-1, 1], [0.2, 0.7]);

  // Logo
  const logoOpacity = interpolate(frame, [50, 60], [0, 0.8], { extrapolateRight: "clamp" });
  const logoY = interpolate(
    spring({ frame: frame - 50, fps, config: { damping: 20 } }),
    [0, 1],
    [20, 0]
  );

  return (
    <AbsoluteFill>
      {/* Subtle animated bg */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #050a15 0%, #0a1628 40%, #0d1f3c 70%, #050a15 100%)" }} />

      {/* Teal glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "20%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 60%)",
          transform: `translate(${Math.sin(frame * 0.03) * 30}px, ${Math.cos(frame * 0.025) * 20}px)`,
        }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 50 }}>
        {/* "Early Access" rotated badge */}
        <div
          style={{
            position: "absolute",
            top: "12%",
            right: "8%",
            transform: `scale(${badgeScale}) rotate(${badgeRotate}deg)`,
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            borderRadius: 16,
            padding: "14px 28px",
            boxShadow: "0 8px 30px rgba(249,115,22,0.3)",
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 800, color: "white", fontFamily: "sans-serif", letterSpacing: 1 }}>
            EARLY ACCESS
          </span>
        </div>

        {/* Main number */}
        <div
          style={{
            transform: `scale(${numScale})`,
            opacity: numOpacity,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 400,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "sans-serif",
            }}
          >
            Nur noch
          </div>
          <div
            style={{
              fontSize: 140,
              fontWeight: 900,
              fontFamily: "sans-serif",
              background: "linear-gradient(135deg, #14b8a6, #f97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
              filter: "drop-shadow(0 0 40px rgba(20,184,166,0.3))",
            }}
          >
            {spotsLeft}
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: "white",
              fontFamily: "sans-serif",
              marginTop: 8,
            }}
          >
            Plätze frei
          </div>
        </div>

        {/* URL typewriter */}
        <div
          style={{
            opacity: urlOpacity,
            fontSize: 34,
            fontWeight: 700,
            color: "#14b8a6",
            fontFamily: "monospace",
            marginTop: 40,
            marginBottom: 40,
            textShadow: "0 0 20px rgba(20,184,166,0.3)",
          }}
        >
          {urlText.slice(0, charsVisible)}
          {charsVisible < urlText.length && (
            <span style={{ opacity: Math.sin(frame * 0.15) > 0 ? 1 : 0, color: "#f97316" }}>|</span>
          )}
        </div>

        {/* CTA Button with glow */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `scale(${ctaScale * ctaPulse})`,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -24,
              borderRadius: 44,
              background: "linear-gradient(90deg, #14b8a6, #f97316)",
              opacity: frame > 45 ? glowOpacity : 0,
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

        {/* Small logo at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            opacity: logoOpacity,
            transform: `translateY(${logoY}px)`,
          }}
        >
          <Img
            src={staticFile("images/hioutz-logo.png")}
            style={{ width: 160, height: "auto", opacity: 0.6 }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
