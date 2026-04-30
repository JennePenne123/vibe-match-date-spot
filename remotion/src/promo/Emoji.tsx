import React from "react";

// Render emoji as Twemoji PNG (Chromium-headless in NixOS sandbox has no emoji font).
// Maps unicode -> twemoji codepoint URL.
const toCodepoint = (emoji: string): string => {
  const codepoints: string[] = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp && cp !== 0xfe0f) codepoints.push(cp.toString(16));
  }
  return codepoints.join("-");
};

export const Emoji: React.FC<{ char: string; size: number; style?: React.CSSProperties }> = ({
  char, size, style,
}) => {
  const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${toCodepoint(char)}.png`;
  return (
    <img
      src={url}
      width={size}
      height={size}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
      alt=""
    />
  );
};