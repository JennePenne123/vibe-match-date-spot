import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence, staticFile, Img } from "remotion";

const features = [
  { icon: "AI", label: "KI-Matching", color: "hsla(239, 84%, 67%, 0.9)", img: "couple-restaurant.jpg" },
  { icon: "GO", label: "Top Venues", color: "hsla(263, 70%, 66%, 0.9)", img: "venue-terrace.jpg" },
  { icon: "%", label: "Exklusive Deals", color: "hsla(330, 81%, 60%, 0.9)", img: "venue-bar.jpg" },
];

const FeatureCard = ({ icon, label, color, index, img }: { icon: string; label: string; color: string; index: number; img: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const scale = interpolate(s, [0, 1], [0.3, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const floatY = Math.sin((frame + index * 20) * 0.08) * 4;
  const slideX = interpolate(s, [0, 1], [index % 2 === 0 ? -150 : 150, 0]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        transform: `scale(${scale}) translateY(${floatY}px) translateX(${slideX}px)`,
        opacity,
        background: "hsla(217, 33%, 14%, 0.8)",
        borderRadius: 22,
        padding: "12px 20px 12px 12px",
        border: `1px solid ${color.replace("0.9", "0.25")}`,
        width: 440,
      }}
    >
      {/* Venue thumbnail */}
      <div style={{ width: 80, height: 80, borderRadius: 16, overflow: "hidden", flexShrink: 0 }}>
        <Img src={staticFile(`images/${img}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      {/* Icon badge overlapping thumbnail */}
      <div style={{
        position: "absolute",
        left: 65,
        top: "50%",
        transform: "translateY(-50%)",
        width: 36,
        height: 36,
        borderRadius: 10,
        background: `linear-gradient(135deg, ${color}, transparent)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 800,
        fontFamily: "sans-serif",
        color: "white",
        border: "2px solid hsla(217, 33%, 14%, 0.9)",
      }}>
        {icon}
      </div>
      <div style={{ marginLeft: 16 }}>
        <p style={{ fontSize: 30, fontWeight: 600, fontFamily: "sans-serif", color: "white", margin: 0 }}>
          {label}
        </p>
        <p style={{ fontSize: 16, fontWeight: 400, fontFamily: "sans-serif", color: "hsla(210, 40%, 98%, 0.5)", margin: 0, marginTop: 2 }}>
          {index === 0 ? "Perfekt abgestimmt" : index === 1 ? "Handverlesen für dich" : "Spare bei jedem Date"}
        </p>
      </div>
    </div>
  );
};

export const SceneFeatures = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame, fps, config: { damping: 18 } });
  const titleY = interpolate(titleS, [0, 1], [50, 0]);

  // Background image with parallax
  const bgY = interpolate(frame, [0, 140], [0, -40]);

  return (
    <AbsoluteFill>
      {/* Subtle background venue image */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Img
          src={staticFile("images/cheers.jpg")}
          style={{
            width: "100%",
            height: "120%",
            objectFit: "cover",
            opacity: 0.15,
            transform: `translateY(${bgY}px)`,
          }}
        />
      </div>

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* Title */}
        <div style={{ position: "absolute", top: "18%", textAlign: "center", transform: `translateY(${titleY}px)`, opacity: interpolate(titleS, [0, 1], [0, 1]) }}>
          <p style={{ fontSize: 52, fontWeight: 700, fontFamily: "sans-serif", color: "white" }}>
            Alles was du brauchst
          </p>
        </div>

        {/* Feature cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center", marginTop: 60 }}>
          {features.map((f, i) => (
            <Sequence key={i} from={15 + i * 20} durationInFrames={140 - 15 - i * 20} layout="none">
              <FeatureCard {...f} index={i} />
            </Sequence>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
