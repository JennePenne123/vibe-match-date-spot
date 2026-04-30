import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Emoji } from "./Emoji";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "900"] });

// Scene 2: PHONE — User tippt "Aktivität", 3 Karten fliegen raus (90f / 3s)
export const ScenePhone = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle Ken-Burns on the photo background
  const bgScale = interpolate(frame, [0, 90], [1.05, 1.12]);
  const bgY = interpolate(frame, [0, 90], [0, -20]);
  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  // App-screen fade-in (sits ON the woman's phone)
  const screenOpacity = interpolate(frame, [10, 22], [0, 1], { extrapolateRight: "clamp" });

  // Tap pulse on "Aktivität" tile at frame 28
  const tapPulse = (() => {
    if (frame < 28 || frame > 42) return 1;
    const t = (frame - 28) / 14;
    return 1 + Math.sin(t * Math.PI) * 0.14;
  })();
  const tapGlow = interpolate(frame, [28, 34, 44], [0, 1, 0], { extrapolateRight: "clamp" });
  const tapRing = interpolate(frame, [28, 44], [0.6, 2.2], { extrapolateRight: "clamp" });
  const tapRingOpacity = interpolate(frame, [28, 38, 44], [0.9, 0.4, 0], { extrapolateRight: "clamp" });

  // After the tap, the screen swaps to results (frame 50+)
  const resultsOpacity = interpolate(frame, [48, 58], [0, 1], { extrapolateRight: "clamp" });
  const homeOpacity = interpolate(frame, [44, 54], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cards = [
    { emoji: "🎳", title: "Bowling Alley", sub: "1.2 km · 94% Match", color: "#F97316" },
    { emoji: "🏌️", title: "Mini-Golf", sub: "2.4 km · 91% Match", color: "#0D9488" },
    { emoji: "🍹", title: "Rooftop-Bar", sub: "0.8 km · 89% Match", color: "#F97316" },
  ];

  // Phone screen geometry inside the woman-phone.jpg (1088x1920)
  // Display roughly: x 170..440, y 790..1320  -> 25.7%..40.4% W, 41.1%..68.7% H
  // We render in a 1080x1920 canvas, scale to match.
  const PHONE = {
    left: "16.5%",
    top: "40.5%",
    width: "26%",
    height: "29%",
  } as const;

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {/* Photo background — woman holding phone */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: fadeIn,
        transform: `scale(${bgScale}) translateY(${bgY}px)`,
        transformOrigin: "center center",
      }}>
        <Img
          src={staticFile("images/woman-phone.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Gradient overlay for legibility */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.05) 30%, rgba(15,23,42,0.55) 100%)",
        }} />
      </div>

      {/* App screen composited onto the woman's phone */}
      <div style={{
        position: "absolute",
        left: PHONE.left, top: PHONE.top,
        width: PHONE.width, height: PHONE.height,
        opacity: screenOpacity,
        borderRadius: 18,
        overflow: "hidden",
        background: "#0F172A",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 20px rgba(13,148,136,0.4)",
      }}>
        {/* HOME screen */}
        <div style={{
          position: "absolute", inset: 0,
          padding: "14px 12px 10px",
          background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
          opacity: homeOpacity,
        }}>
          {/* Logo header */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
            <Img src={staticFile("images/hioutz-logo.png")} style={{ width: 95, height: "auto" }} />
          </div>
          <div style={{
            fontFamily, fontSize: 8, fontWeight: 500,
            color: "rgba(255,255,255,0.55)", textAlign: "center", marginBottom: 10,
          }}>
            Was steht heute an?
          </div>

          {/* 4 tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { e: "🍽️", l: "Essen" },
              { e: "🎳", l: "Aktivität", active: true },
              { e: "🎭", l: "Kultur" },
              { e: "🌃", l: "Nightlife" },
            ].map((tile) => (
              <div key={tile.l} style={{
                position: "relative",
                background: tile.active
                  ? "linear-gradient(135deg, rgba(13,148,136,0.55), rgba(249,115,22,0.35))"
                  : "rgba(255,255,255,0.06)",
                border: tile.active ? "1.5px solid #0D9488" : "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: "12px 4px",
                textAlign: "center",
                transform: tile.active ? `scale(${tapPulse})` : "scale(1)",
                boxShadow: tile.active ? `0 0 ${12 * tapGlow}px rgba(13,148,136,${0.7 * tapGlow})` : "none",
              }}>
                <div style={{ marginBottom: 2 }}>
                  <Emoji char={tile.e} size={22} />
                </div>
                <div style={{ fontFamily, fontSize: 9, fontWeight: 700, color: "white" }}>
                  {tile.l}
                </div>
                {/* Tap ring */}
                {tile.active && tapRingOpacity > 0 && (
                  <div style={{
                    position: "absolute", inset: 0,
                    borderRadius: 10,
                    border: "1.5px solid #0D9488",
                    opacity: tapRingOpacity,
                    transform: `scale(${tapRing})`,
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RESULTS screen */}
        <div style={{
          position: "absolute", inset: 0,
          padding: "14px 10px 10px",
          background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
          opacity: resultsOpacity,
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
            <Img src={staticFile("images/hioutz-logo.png")} style={{ width: 70, height: "auto" }} />
          </div>
          <div style={{
            fontFamily, fontSize: 7, fontWeight: 600,
            color: "#F97316", textAlign: "center", marginBottom: 8,
            letterSpacing: 0.5, textTransform: "uppercase",
          }}>
            Top 3 für euch ✨
          </div>
          {cards.map((c, i) => {
            const cardOp = interpolate(frame, [56 + i * 4, 64 + i * 4], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            const cardX = interpolate(frame, [56 + i * 4, 64 + i * 4], [-20, 0], {
              extrapolateRight: "clamp",
            });
            return (
              <div key={c.title} style={{
                opacity: cardOp,
                transform: `translateX(${cardX}px)`,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${c.color}80`,
                borderRadius: 8, padding: "6px 8px",
                marginBottom: 5,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <Emoji char={c.emoji} size={20} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily, fontSize: 8, fontWeight: 800, color: "white", lineHeight: 1.1 }}>
                    {c.title}
                  </div>
                  <div style={{ fontFamily, fontSize: 6, fontWeight: 600, color: c.color, marginTop: 1 }}>
                    {c.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtle screen reflection */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%)",
          pointerEvents: "none",
        }} />
      </div>

      {/* Big result card flying OUT of the phone toward viewer */}
      {cards.map((card, i) => {
        const startFrame = 65 + i * 5;
        const cardSpring = spring({
          frame: frame - startFrame, fps,
          config: { damping: 16, stiffness: 130 },
        });
        const cardOpacity = interpolate(frame, [startFrame, startFrame + 6, 88, 90], [0, 1, 1, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        // Cards burst from phone position (~ left 25%, top 50%) outward to right side
        const targetY = 250 + i * 280;
        const startY = 950;
        const cardY = interpolate(cardSpring, [0, 1], [startY, targetY]);
        const targetX = [380, 480, 360][i];
        const cardX = interpolate(cardSpring, [0, 1], [-100, targetX]);
        const cardRotate = interpolate(cardSpring, [0, 1], [-20, [-5, 4, -3][i]]);
        const cardScale = interpolate(cardSpring, [0, 1], [0.5, 1]);

        return (
          <div key={card.title} style={{
            position: "absolute",
            left: 0, top: 0,
            width: 440,
            transform: `translateX(${cardX}px) translateY(${cardY}px) rotate(${cardRotate}deg) scale(${cardScale})`,
            opacity: cardOpacity,
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(10px)",
            border: `4px solid ${card.color}`,
            borderRadius: 28,
            padding: 22,
            boxShadow: `0 25px 70px rgba(0,0,0,0.7), 0 0 50px ${card.color}60`,
            display: "flex", alignItems: "center", gap: 18,
          }}>
            <Emoji char={card.emoji} size={80} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily, fontSize: 34, fontWeight: 900,
                color: "white", marginBottom: 4,
              }}>
                {card.title}
              </div>
              <div style={{
                fontFamily, fontSize: 22, fontWeight: 700,
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