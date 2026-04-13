import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

// Scene 3: TWIST — "Stell dir vor..." + beautiful venue reveal
export const SceneFeatures = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Stell dir vor..." text
  const stellSpring = spring({ frame, fps, config: { damping: 18 } });
  const stellY = interpolate(stellSpring, [0, 1], [40, 0]);
  const stellOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  // Fade out "Stell dir vor"
  const stellFadeOut = interpolate(frame, [28, 38], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Image reveal — from black to full beautiful venue
  const imgReveal = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const imgScale = interpolate(frame, [20, 70], [1.3, 1.05]);

  // Second image (date scene) slides up
  const img2Spring = spring({ frame: frame - 35, fps, config: { damping: 15 } });
  const img2Y = interpolate(img2Spring, [0, 1], [600, 0]);
  const img2Opacity = interpolate(frame, [35, 45], [0, 1], { extrapolateRight: "clamp" });

  // "Dein Date. Perfekt." text overlay
  const textSpring = spring({ frame: frame - 50, fps, config: { damping: 12 } });
  const textScale = interpolate(textSpring, [0, 1], [0.5, 1]);
  const textOpacity = interpolate(frame, [50, 58], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Rooftop venue image — the aspirational reveal */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Img
          src={staticFile("images/venue-rooftop.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${imgScale})`,
            opacity: imgReveal * 0.7,
          }}
        />
      </div>
      {/* Gradient overlay for text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(5,10,21,${1 - imgReveal * 0.5}) 0%, rgba(5,10,21,0.3) 40%, rgba(5,10,21,0.8) 100%)`,
        }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* "Stell dir vor..." */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            opacity: stellOpacity * stellFadeOut,
            transform: `translateY(${stellY}px)`,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 300,
              color: "white",
              fontFamily: "sans-serif",
              fontStyle: "italic",
              textShadow: "0 4px 30px rgba(0,0,0,0.8)",
            }}
          >
            Stell dir vor...
          </span>
        </div>

        {/* Couple date image — floating card */}
        <div
          style={{
            position: "absolute",
            bottom: "18%",
            transform: `translateY(${img2Y}px)`,
            opacity: img2Opacity,
            width: 700,
            height: 500,
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          <Img
            src={staticFile("images/date-scene.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {/* Gradient at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 120,
              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              display: "flex",
              alignItems: "flex-end",
              padding: "0 28px 24px",
            }}
          >
            <span
              style={{
                fontSize: 24,
                color: "rgba(255,255,255,0.9)",
                fontFamily: "sans-serif",
                fontWeight: 500,
              }}
            >
              📍 Rooftop Bar Luna · Perfekt für euch
            </span>
          </div>
        </div>

        {/* "Dein Date. Perfekt." */}
        <div
          style={{
            position: "absolute",
            top: "22%",
            opacity: textOpacity,
            transform: `scale(${textScale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: "white",
              fontFamily: "sans-serif",
              textShadow: "0 4px 40px rgba(0,0,0,0.8)",
              lineHeight: 1.3,
            }}
          >
            Dein Date.
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #14b8a6, #f97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 20px rgba(20,184,166,0.3))",
              }}
            >
              Perfekt geplant.
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
