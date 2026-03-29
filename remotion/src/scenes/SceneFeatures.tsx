import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";

const features = [
  { icon: "🤖", label: "KI-Matching", color: "hsla(239, 84%, 67%, 0.9)" },
  { icon: "📍", label: "Top Venues", color: "hsla(263, 70%, 66%, 0.9)" },
  { icon: "🎟️", label: "Exklusive Deals", color: "hsla(330, 81%, 60%, 0.9)" },
];

const FeatureCard = ({ icon, label, color, index }: { icon: string; label: string; color: string; index: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const scale = interpolate(s, [0, 1], [0.3, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const rotate = interpolate(s, [0, 1], [-15, 0]);

  // Subtle hover-like float
  const floatY = Math.sin((frame + index * 20) * 0.08) * 5;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        transform: `scale(${scale}) rotate(${rotate}deg) translateY(${floatY}px)`,
        opacity,
      }}
    >
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: 35,
          background: `linear-gradient(135deg, ${color}, transparent)`,
          border: `2px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 60,
          boxShadow: `0 20px 60px ${color.replace('0.9', '0.3')}`,
        }}
      >
        {icon}
      </div>
      <p
        style={{
          fontSize: 32,
          fontWeight: 600,
          fontFamily: "sans-serif",
          color: "white",
          textAlign: "center",
        }}
      >
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
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          textAlign: "center",
          transform: `translateY(${titleY}px)`,
          opacity: interpolate(titleS, [0, 1], [0, 1]),
        }}
      >
        <p
          style={{
            fontSize: 52,
            fontWeight: 700,
            fontFamily: "sans-serif",
            color: "white",
          }}
        >
          Alles was du brauchst
        </p>
      </div>

      {/* Feature cards staggered */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 50,
          alignItems: "center",
          marginTop: 60,
        }}
      >
        {features.map((f, i) => (
          <Sequence key={i} from={15 + i * 18} durationInFrames={140 - 15 - i * 18}>
            <FeatureCard {...f} index={i} />
          </Sequence>
        ))}
      </div>

      {/* Connecting line */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "32%",
          width: 2,
          height: interpolate(frame, [30, 90], [0, 450], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
          background: "linear-gradient(180deg, hsla(239, 84%, 67%, 0.4), hsla(330, 81%, 60%, 0.4), transparent)",
          transform: "translateX(-50%)",
          zIndex: -1,
        }}
      />
    </AbsoluteFill>
  );
};
