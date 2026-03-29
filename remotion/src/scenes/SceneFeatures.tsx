import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";

const features = [
  { icon: "AI", label: "KI-Matching", color: "hsla(239, 84%, 67%, 0.9)" },
  { icon: "GO", label: "Top Venues", color: "hsla(263, 70%, 66%, 0.9)" },
  { icon: "%", label: "Exklusive Deals", color: "hsla(330, 81%, 60%, 0.9)" },
];

const FeatureCard = ({ icon, label, color, index }: { icon: string; label: string; color: string; index: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const scale = interpolate(s, [0, 1], [0.3, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const floatY = Math.sin((frame + index * 20) * 0.08) * 5;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 25,
        transform: `scale(${scale}) translateY(${floatY}px)`,
        opacity,
        background: "hsla(217, 33%, 17%, 0.6)",
        borderRadius: 28,
        padding: "28px 35px",
        border: `1px solid ${color.replace("0.9", "0.3")}`,
        width: 420,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          background: `linear-gradient(135deg, ${color}, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          fontWeight: 800,
          fontFamily: "sans-serif",
          color: "white",
          flexShrink: 0,
          boxShadow: `0 10px 30px ${color.replace("0.9", "0.2")}`,
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: 32, fontWeight: 600, fontFamily: "sans-serif", color: "white" }}>
        {label}
      </p>
    </div>
  );
};

export const SceneFeatures = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame, fps, config: { damping: 18 } });
  const titleY = interpolate(titleS, [0, 1], [50, 0]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "22%",
          textAlign: "center",
          transform: `translateY(${titleY}px)`,
          opacity: interpolate(titleS, [0, 1], [0, 1]),
        }}
      >
        <p style={{ fontSize: 52, fontWeight: 700, fontFamily: "sans-serif", color: "white" }}>
          Alles was du brauchst
        </p>
      </div>

      {/* Feature cards staggered */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          alignItems: "center",
          marginTop: 80,
        }}
      >
        {features.map((f, i) => (
          <Sequence key={i} from={15 + i * 18} durationInFrames={140 - 15 - i * 18} layout="none">
            <FeatureCard {...f} index={i} />
          </Sequence>
        ))}
      </div>
    </AbsoluteFill>
  );
};
