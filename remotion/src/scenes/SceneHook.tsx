import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

export const SceneHook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const tagY = interpolate(
    spring({ frame: frame - 25, fps, config: { damping: 20 } }),
    [0, 1],
    [60, 0]
  );
  const tagOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });

  const subOpacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(
    spring({ frame: frame - 45, fps, config: { damping: 20 } }),
    [0, 1],
    [40, 0]
  );

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          marginBottom: 60,
        }}
      >
        <Img
          src={staticFile("images/hioutz-logo.png")}
          style={{ width: 320, height: "auto" }}
        />
      </div>

      <div
        style={{
          transform: `translateY(${tagY}px)`,
          opacity: tagOpacity,
          fontSize: 72,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          lineHeight: 1.1,
          paddingLeft: 60,
          paddingRight: 60,
          fontFamily: "sans-serif",
        }}
      >
        Das perfekte
        <br />
        <span
          style={{
            background: "linear-gradient(90deg, #14b8a6, #f97316)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Date.
        </span>
      </div>

      <div
        style={{
          transform: `translateY(${subY}px)`,
          opacity: subOpacity,
          fontSize: 36,
          color: "rgba(255,255,255,0.6)",
          textAlign: "center",
          marginTop: 30,
          fontFamily: "sans-serif",
          fontWeight: 400,
        }}
      >
        KI-gesteuert. Unvergesslich.
      </div>
    </AbsoluteFill>
  );
};
