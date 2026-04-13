import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 1: HOOK — "90% aller Dates sind mittelmäßig."
// Provocative statement over a desaturated boring-planning image
export const SceneHook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Image zoom
  const imgScale = interpolate(frame, [0, 80], [1.0, 1.15]);
  const imgOpacity = interpolate(frame, [0, 8], [0, 0.5], { extrapolateRight: "clamp" });

  // "90%" number — dramatic scale entrance
  const numSpring = spring({ frame: frame - 3, fps, config: { damping: 8, stiffness: 100 } });
  const numScale = interpolate(numSpring, [0, 1], [4, 1]);
  const numOpacity = interpolate(frame, [3, 10], [0, 1], { extrapolateRight: "clamp" });

  // Rest of text
  const textSpring = spring({ frame: frame - 18, fps, config: { damping: 15 } });
  const textY = interpolate(textSpring, [0, 1], [60, 0]);
  const textOpacity = interpolate(frame, [18, 28], [0, 1], { extrapolateRight: "clamp" });

  // Red accent underline
  const lineWidth = interpolate(
    spring({ frame: frame - 30, fps, config: { damping: 20 } }),
    [0, 1],
    [0, 480]
  );

  // Screen shake at entrance
  const shakeX = frame < 12 ? Math.sin(frame * 3) * (12 - frame) * 0.8 : 0;
  const shakeY = frame < 12 ? Math.cos(frame * 4) * (12 - frame) * 0.5 : 0;

  return (
    <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      {/* Background image — boring phone scrolling */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Img
          src={staticFile("images/boring-planning.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${imgScale})`,
            opacity: imgOpacity,
            filter: "saturate(0.3) brightness(0.4)",
          }}
        />
      </div>
      {/* Dark vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)" }} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
        {/* Big number */}
        <div
          style={{
            transform: `scale(${numScale})`,
            opacity: numOpacity,
            fontSize: 200,
            fontWeight: 900,
            fontFamily: "sans-serif",
            color: "#f97316",
            lineHeight: 1,
            textShadow: "0 0 60px rgba(249,115,22,0.4)",
          }}
        >
          90%
        </div>

        {/* Text */}
        <div
          style={{
            transform: `translateY(${textY}px)`,
            opacity: textOpacity,
            textAlign: "center",
            marginTop: 20,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "white",
              fontFamily: "sans-serif",
              lineHeight: 1.3,
              textShadow: "0 4px 30px rgba(0,0,0,0.8)",
            }}
          >
            aller Dates sind
            <br />
            <span style={{ position: "relative", display: "inline-block" }}>
              mittelmäßig.
              {/* Underline */}
              <div
                style={{
                  position: "absolute",
                  bottom: -4,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: lineWidth,
                  maxWidth: "100%",
                  height: 4,
                  background: "#f97316",
                  borderRadius: 2,
                }}
              />
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
