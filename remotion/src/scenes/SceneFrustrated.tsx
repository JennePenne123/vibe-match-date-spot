import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Bangers";

const { fontFamily } = loadFont();

// Scene 3: Frustrated close-up — comic anger with speed lines & "ARGH!"
export const SceneFrustrated = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Panel wipe reveal
  const wipeSpring = spring({ frame, fps, config: { damping: 12 } });
  const clipX = interpolate(wipeSpring, [0, 1], [100, 0]);

  // Dramatic zoom into face
  const zoom = interpolate(frame, [0, 100], [1, 1.5], { extrapolateRight: "clamp" });
  const panY = interpolate(frame, [0, 100], [0, -100], { extrapolateRight: "clamp" });

  // Red vignette growing
  const vignetteOpacity = interpolate(frame, [15, 75], [0, 0.35], { extrapolateRight: "clamp" });

  // Screen shake at frustration peak
  const vibeStart = 50;
  const vibeIntensity = frame >= vibeStart && frame < vibeStart + 20
    ? Math.sin(frame * 12) * (vibeStart + 20 - frame) * 0.8 : 0;

  // Speed lines from edges (anger lines)
  const speedLineOpacity = interpolate(frame, [10, 25], [0, 0.5], { extrapolateRight: "clamp" });

  // "ARGH!" comic text
  const arghSpring = spring({ frame: frame - 25, fps, config: { damping: 6, stiffness: 200 } });
  const arghScale = interpolate(arghSpring, [0, 1], [4, 1]);
  const arghOpacity = interpolate(frame, [25, 32], [0, 1], { extrapolateRight: "clamp" });
  const arghRotate = interpolate(arghSpring, [0, 1], [-15, 8]);

  // Anger symbols floating
  const angerSymbols = [
    { emoji: "💢", x: 150, y: 400, delay: 30 },
    { emoji: "😤", x: 800, y: 350, delay: 40 },
    { emoji: "💢", x: 500, y: 250, delay: 50 },
  ];

  // Background gets redder
  const bgRed = interpolate(frame, [0, 80], [0, 30], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ transform: `translateX(${vibeIntensity}px)` }}>
      {/* White-to-red bg */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(180deg, hsl(0, ${bgRed}%, 95%) 0%, hsl(0, ${bgRed}%, 88%) 100%)`,
      }} />
      {/* Red halftone dots */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle, rgba(255,0,0,0.08) 1.5px, transparent 1.5px)",
        backgroundSize: "7px 7px",
      }} />

      {/* Speed lines from corners */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (360 / 16) * i;
        return (
          <div key={i} style={{
            position: "absolute", top: "45%", left: "50%",
            width: 1200, height: 2,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,0,0,0.4) 40%, rgba(255,0,0,0.6) 100%)",
            transform: `rotate(${angle}deg)`,
            transformOrigin: "0 50%",
            opacity: speedLineOpacity,
          }} />
        );
      })}

      {/* Panel with clip reveal */}
      <div style={{
        position: "absolute", top: 100, left: 25, right: 25, bottom: 320,
        overflow: "hidden",
        border: "8px solid black",
        boxShadow: "12px 12px 0 rgba(0,0,0,0.3)",
        clipPath: `inset(0 ${clipX}% 0 0)`,
      }}>
        <Img
          src={staticFile("images/comic-v2-panel2.png")}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${zoom}) translateY(${panY}px)`,
          }}
        />
      </div>

      {/* Red frustration vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 35%, rgba(255,0,0,0.5) 100%)",
        opacity: vignetteOpacity,
        pointerEvents: "none",
      }} />

      {/* "ARGH!" comic text */}
      <div style={{
        position: "absolute", top: 80, left: 60,
        opacity: arghOpacity,
        transform: `scale(${arghScale}) rotate(${arghRotate}deg)`,
      }}>
        <span style={{
          fontFamily, fontSize: 90, color: "#FF0000",
          textShadow: "4px 4px 0 #FFE500, 8px 8px 0 rgba(0,0,0,0.3)",
          letterSpacing: 6,
        }}>
          ARGH!
        </span>
      </div>

      {/* Floating anger symbols */}
      {angerSymbols.map((s, i) => {
        const sOpacity = interpolate(frame, [s.delay, s.delay + 8], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const sY = interpolate(frame, [s.delay, s.delay + 40], [0, -30], { extrapolateRight: "clamp" });
        const sScale = interpolate(
          spring({ frame: frame - s.delay, fps, config: { damping: 6 } }),
          [0, 1], [3, 1]
        );
        return (
          <div key={i} style={{
            position: "absolute", left: s.x, top: s.y,
            fontSize: 50, opacity: sOpacity,
            transform: `translateY(${sY}px) scale(${sScale})`,
          }}>
            {s.emoji}
          </div>
        );
      })}

      {/* Bottom frustration text */}
      <div style={{
        position: "absolute", bottom: 100, left: 0, right: 0,
        display: "flex", justifyContent: "center",
      }}>
        <div style={{
          opacity: interpolate(frame, [35, 48], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(${interpolate(
            spring({ frame: frame - 35, fps, config: { damping: 7 } }),
            [0, 1], [2.5, 1]
          )}) rotate(-3deg)`,
        }}>
          <div style={{
            background: "#FF0000",
            padding: "20px 50px",
            border: "6px solid black",
            boxShadow: "10px 10px 0 black",
          }}>
            <span style={{
              fontFamily, fontSize: 52, color: "white",
              letterSpacing: 3,
            }}>
              ES REICHT! 😤
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
