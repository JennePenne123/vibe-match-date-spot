import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Emoji } from "./Emoji";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "900"] });

// Scene 4: CTA — Logo + Counter + Waitlist (135f / 4.5s)
export const SceneCTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo entrance
  const logoSpring = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.4, 1]);
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  // Tagline at frame 18
  const tagSpring = spring({ frame: frame - 18, fps, config: { damping: 18, stiffness: 130 } });
  const tagY = interpolate(tagSpring, [0, 1], [40, 0]);
  const tagOpacity = interpolate(frame, [18, 28], [0, 1], { extrapolateRight: "clamp" });

  // Counter card at frame 35
  const counterSpring = spring({ frame: frame - 35, fps, config: { damping: 14, stiffness: 130 } });
  const counterScale = interpolate(counterSpring, [0, 1], [0.7, 1]);
  const counterOpacity = interpolate(frame, [35, 45], [0, 1], { extrapolateRight: "clamp" });

  // Counter ticks 320 -> 347
  const countProgress = interpolate(frame, [40, 80], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const currentCount = Math.round(320 + countProgress * 27);
  const progressPct = (currentCount / 500) * 100;

  // URL at frame 70
  const urlSpring = spring({ frame: frame - 70, fps, config: { damping: 16 } });
  const urlY = interpolate(urlSpring, [0, 1], [30, 0]);
  const urlOpacity = interpolate(frame, [70, 80], [0, 1], { extrapolateRight: "clamp" });

  // Pulsing glow
  const pulse = 0.7 + Math.sin(frame * 0.15) * 0.3;

  // Floating particles
  const particles = Array.from({ length: 8 }, (_, i) => i);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(180deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
      overflow: "hidden",
    }}>
      {/* Animated teal glow */}
      <div style={{
        position: "absolute",
        top: "30%", left: "50%",
        width: 900, height: 900,
        marginLeft: -450, marginTop: -450,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(13,148,136,${0.25 * pulse}) 0%, transparent 65%)`,
        filter: "blur(20px)",
      }} />

      {/* Orange accent glow */}
      <div style={{
        position: "absolute",
        bottom: "20%", right: "10%",
        width: 500, height: 500,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(249,115,22,${0.15 * pulse}) 0%, transparent 60%)`,
        filter: "blur(30px)",
      }} />

      {/* Floating particles */}
      {particles.map((i) => {
        const baseX = (i * 137) % 1080;
        const baseY = ((i * 211) % 1920);
        const driftX = Math.sin((frame + i * 30) * 0.04) * 40;
        const driftY = Math.cos((frame + i * 30) * 0.03) * 30;
        return (
          <div key={i} style={{
            position: "absolute",
            left: baseX + driftX,
            top: baseY + driftY,
            width: 6, height: 6,
            borderRadius: "50%",
            background: i % 2 === 0 ? "#0D9488" : "#F97316",
            opacity: 0.6,
            boxShadow: `0 0 20px ${i % 2 === 0 ? "#0D9488" : "#F97316"}`,
          }} />
        );
      })}

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        padding: 60,
      }}>
        {/* H!Outz Logo (text) */}
        <div style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 30,
        }}>
          <div style={{
            fontFamily, fontSize: 180, fontWeight: 900,
            color: "white",
            letterSpacing: -6,
            lineHeight: 1,
            textAlign: "center",
            textShadow: `0 0 ${60 * pulse}px rgba(13,148,136,0.6)`,
          }}>
            H!<span style={{ color: "#F97316" }}>✦</span>Outz
          </div>
        </div>

        {/* Tagline */}
        <div style={{
          opacity: tagOpacity,
          transform: `translateY(${tagY}px)`,
          marginBottom: 60,
          textAlign: "center",
        }}>
          <div style={{
            fontFamily, fontSize: 38, fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: -0.5,
          }}>
            Keine Listen. Keine Diskussion.
          </div>
          <div style={{
            fontFamily, fontSize: 38, fontWeight: 900,
            background: "linear-gradient(90deg, #0D9488, #F97316)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginTop: 4,
          }}>
            Nur rausgehen.
          </div>
        </div>

        {/* Counter card */}
        <div style={{
          opacity: counterOpacity,
          transform: `scale(${counterScale})`,
          background: "rgba(15,23,42,0.85)",
          border: "3px solid rgba(13,148,136,0.5)",
          borderRadius: 32,
          padding: "32px 50px",
          marginBottom: 40,
          minWidth: 700,
          boxShadow: `0 0 ${50 * pulse}px rgba(13,148,136,0.4), 0 20px 60px rgba(0,0,0,0.6)`,
        }}>
          <div style={{
            fontFamily, fontSize: 26, fontWeight: 600,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            marginBottom: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
            display: "flex", justifyContent: "center", alignItems: "center", gap: 10,
          }}>
            <Emoji char="🔥" size={28} /> Founder-Access
          </div>
          <div style={{
            fontFamily, fontSize: 84, fontWeight: 900,
            textAlign: "center",
            color: "white",
            lineHeight: 1,
            marginBottom: 16,
          }}>
            <span style={{ color: "#0D9488" }}>{currentCount}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 56 }}> / 500</span>
          </div>
          {/* Progress bar */}
          <div style={{
            width: "100%", height: 14,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 7,
            overflow: "hidden",
            marginBottom: 12,
          }}>
            <div style={{
              width: `${progressPct}%`, height: "100%",
              background: "linear-gradient(90deg, #0D9488, #F97316)",
              borderRadius: 7,
              boxShadow: "0 0 20px rgba(13,148,136,0.6)",
            }} />
          </div>
          <div style={{
            fontFamily, fontSize: 22, fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
          }}>
            Plätze auf der Warteliste
          </div>
        </div>

        {/* URL */}
        <div style={{
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
          background: "linear-gradient(135deg, #0D9488, #F97316)",
          padding: "24px 60px",
          borderRadius: 100,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 ${40 * pulse}px rgba(249,115,22,0.5)`,
        }}>
          <div style={{
            fontFamily, fontSize: 44, fontWeight: 900,
            color: "white",
            letterSpacing: 1,
          }}>
            hioutz.app ↗
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};