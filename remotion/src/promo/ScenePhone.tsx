import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Emoji } from "./Emoji";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "900"] });

// Scene 2: PHONE — User tippt "Aktivität", 3 Karten fliegen raus (90f / 3s)
export const ScenePhone = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone slides up
  const phoneSpring = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const phoneY = interpolate(phoneSpring, [0, 1], [600, 0]);

  // Tap pulse on "Aktivität" tile at frame 22
  const tapPulse = (() => {
    if (frame < 22 || frame > 35) return 1;
    const t = (frame - 22) / 13;
    return 1 + Math.sin(t * Math.PI) * 0.12;
  })();
  const tapGlow = interpolate(frame, [22, 28, 38], [0, 1, 0], { extrapolateRight: "clamp" });

  // Cards fly out from frame 38
  const cards = [
    { emoji: "🎳", title: "Bowling", sub: "1.2 km · 94% Match", color: "#F97316" },
    { emoji: "🏌️", title: "Mini-Golf", sub: "2.4 km · 91% Match", color: "#0D9488" },
    { emoji: "🍹", title: "Rooftop-Bar", sub: "0.8 km · 89% Match", color: "#F97316" },
  ];

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
      overflow: "hidden",
    }}>
      {/* Teal glow background */}
      <div style={{
        position: "absolute",
        top: "30%", left: "20%",
        width: 700, height: 700,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(13,148,136,0.25) 0%, transparent 60%)",
        filter: "blur(40px)",
      }} />

      {/* Phone mockup */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: 280,
        transform: `translateX(-50%) translateY(${phoneY}px)`,
        width: 520,
        height: 1040,
        background: "#000",
        borderRadius: 60,
        border: "8px solid #1E293B",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(13,148,136,0.3)",
        overflow: "hidden",
      }}>
        {/* Phone screen */}
        <div style={{
          position: "absolute", inset: 12,
          background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
          borderRadius: 48,
          padding: "60px 30px 30px",
        }}>
          {/* H!Outz header */}
          <div style={{
            fontFamily, fontSize: 32, fontWeight: 900,
            color: "white", textAlign: "center", marginBottom: 8,
          }}>
            H!<span style={{ color: "#F97316" }}>✦</span> Outz
          </div>
          <div style={{
            fontFamily, fontSize: 18, fontWeight: 400,
            color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: 40,
          }}>
            Was steht heute an?
          </div>

          {/* 4 category tiles */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
          }}>
            {[
              { e: "🍽️", l: "Essen" },
              { e: "🎳", l: "Aktivität", active: true },
              { e: "🎭", l: "Kultur" },
              { e: "🌃", l: "Nightlife" },
            ].map((tile) => (
              <div key={tile.l} style={{
                background: tile.active
                  ? "linear-gradient(135deg, rgba(13,148,136,0.4), rgba(249,115,22,0.3))"
                  : "rgba(255,255,255,0.05)",
                border: tile.active ? "3px solid #0D9488" : "2px solid rgba(255,255,255,0.1)",
                borderRadius: 24,
                padding: "32px 16px",
                textAlign: "center",
                transform: tile.active ? `scale(${tapPulse})` : "scale(1)",
                boxShadow: tile.active ? `0 0 ${30 * tapGlow}px rgba(13,148,136,${0.6 * tapGlow})` : "none",
              }}>
                <div style={{ marginBottom: 8 }}>
                  <Emoji char={tile.e} size={56} />
                </div>
                <div style={{
                  fontFamily, fontSize: 22, fontWeight: 700,
                  color: "white",
                }}>
                  {tile.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cards flying out */}
      {cards.map((card, i) => {
        const startFrame = 42 + i * 8;
        const cardSpring = spring({
          frame: frame - startFrame, fps,
          config: { damping: 14, stiffness: 110 },
        });
        const cardOpacity = interpolate(frame, [startFrame, startFrame + 8], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const targetY = 380 + i * 220;
        const cardY = interpolate(cardSpring, [0, 1], [800, targetY]);
        const cardX = interpolate(cardSpring, [0, 1], [0, [-280, 280, -260][i]]);
        const cardRotate = interpolate(cardSpring, [0, 1], [30, [-6, 5, -4][i]]);

        return (
          <div key={card.title} style={{
            position: "absolute",
            left: "50%", top: 0,
            width: 380,
            transform: `translateX(calc(-50% + ${cardX}px)) translateY(${cardY}px) rotate(${cardRotate}deg)`,
            opacity: cardOpacity,
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(10px)",
            border: `3px solid ${card.color}`,
            borderRadius: 28,
            padding: 24,
            boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${card.color}40`,
            display: "flex", alignItems: "center", gap: 20,
          }}>
            <Emoji char={card.emoji} size={72} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily, fontSize: 32, fontWeight: 900,
                color: "white", marginBottom: 4,
              }}>
                {card.title}
              </div>
              <div style={{
                fontFamily, fontSize: 20, fontWeight: 600,
                color: card.color,
              }}>
                {card.sub}
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};