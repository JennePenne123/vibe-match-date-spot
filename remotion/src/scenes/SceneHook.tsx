import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

export const SceneHook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background image (couple walking) with slow zoom
  const bgScale = interpolate(frame, [0, 130], [1.1, 1.25]);
  const bgOpacity = interpolate(frame, [0, 20], [0, 0.5], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Logo animation
  const dScale = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });
  const dRotate = interpolate(dScale, [0, 1], [180, 0]);
  const zengX = spring({ frame: frame - 12, fps, config: { damping: 18, stiffness: 120 } });
  const zengSlide = interpolate(zengX, [0, 1], [300, 0]);
  const zengOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Tagline
  const tagY = spring({ frame: frame - 35, fps, config: { damping: 20, stiffness: 100 } });
  const tagSlide = interpolate(tagY, [0, 1], [60, 0]);
  const tagOpacity = interpolate(frame, [33, 50], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Pulse ring
  const ringScale = interpolate(frame, [50, 100], [0.8, 2.5], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const ringOpacity = interpolate(frame, [50, 100], [0.6, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Decorative line
  const lineWidth = interpolate(frame, [55, 80], [0, 200], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill>
      {/* Background couple image */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Img
          src={staticFile("images/couple-walking.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${bgScale})`,
            opacity: bgOpacity,
          }}
        />
      </div>
      {/* Dark overlay for text readability */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, hsla(222, 47%, 8%, 0.7) 0%, hsla(222, 47%, 8%, 0.85) 50%, hsla(222, 47%, 8%, 0.7) 100%)" }} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* Pulse ring */}
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", border: "2px solid hsla(239, 84%, 67%, 0.5)", transform: `scale(${ringScale})`, opacity: ringOpacity }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 160, fontWeight: 800, fontFamily: "sans-serif", color: "white", transform: `scale(${dScale}) rotate(${dRotate}deg)`, display: "inline-block", textShadow: "0 0 60px hsla(239, 84%, 67%, 0.5)" }}>
            D
          </span>
          <span style={{ fontSize: 140, fontWeight: 700, fontFamily: "sans-serif", color: "white", transform: `translateX(${zengSlide}px)`, opacity: zengOpacity, display: "inline-block" }}>
            zeng
          </span>
        </div>

        {/* Tagline */}
        <div style={{ position: "absolute", top: "58%", textAlign: "center", transform: `translateY(${tagSlide}px)`, opacity: tagOpacity }}>
          <p style={{ fontSize: 38, fontWeight: 400, fontFamily: "sans-serif", color: "hsla(210, 40%, 98%, 0.8)", letterSpacing: 3, textTransform: "uppercase" }}>
            Dein perfektes Date
          </p>
        </div>

        {/* Decorative line */}
        <div style={{ position: "absolute", top: "65%", width: lineWidth, height: 2, background: "linear-gradient(90deg, transparent, hsla(239, 84%, 67%, 0.8), hsla(330, 81%, 60%, 0.8), transparent)" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
