// Illustrated storytelling reel: full-screen scene images with slow camera moves,
// cross-dissolves and a centred caption per sentence (synced to the narration).
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Sequence } from "remotion";
import { loadFont as vazir } from "@remotion/google-fonts/Vazirmatn";
const V = vazir("normal", { weights: ["800"], subsets: ["arabic"] }).fontFamily;

export type StoryScene = { text: string; img: string; start: number; dur: number };
export type StoryProps = { scenes: StoryScene[]; seconds: number; title?: string };
const FADE = 0.6;

const Shot: React.FC<{ s: StoryScene; i: number }> = ({ s, i }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const len = (s.dur + FADE) * fps;
  const t = f / len;
  const moves = [[1.05, 1.22, 0, 0], [1.22, 1.05, 0, 0], [1.15, 1.15, -60, 60], [1.15, 1.15, 60, -60], [1.08, 1.25, 0, -80]];
  const [z0, z1, x0, x1] = moves[i % moves.length];
  const op = interpolate(f, [0, FADE * fps, len - FADE * fps, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const words = s.text.split(/\s+/);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img src={staticFile(s.img)} style={{ width: "100%", height: "106%", objectFit: "cover", objectPosition: "top",
          transform: `scale(${interpolate(t, [0, 1], [z0, z1])}) translateX(${interpolate(t, [0, 1], [x0, x1])}px)` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(transparent 55%, rgba(0,0,0,.55) 75%, rgba(0,0,0,.75))" }} />
      <div style={{ position: "absolute", left: 70, right: 70, top: 1180, direction: "rtl", textAlign: "center",
        fontFamily: V, fontWeight: 800, fontSize: 60, lineHeight: 1.6, color: "#fff",
        textShadow: "0 4px 18px rgba(0,0,0,.9), 0 0 3px #000" }}>
        {words.map((w, k) => {
          const p = spring({ frame: f - FADE * fps * 0.5 - k * 2.2, fps, config: { damping: 16 } });
          return <span key={k} style={{ display: "inline-block", marginLeft: 13, opacity: p, transform: `translateY(${(1 - p) * 26}px)` }}>{w}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Story: React.FC<StoryProps> = ({ scenes, seconds, title }) => {
  const { fps } = useVideoConfig(); const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {scenes.map((s, i) => (
        <Sequence key={i} from={Math.round(s.start * fps)} durationInFrames={Math.round((s.dur + FADE) * fps)}>
          <Shot s={s} i={i} />
        </Sequence>
      ))}
      <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center", fontFamily: V, fontWeight: 800,
        fontSize: 44, color: "rgba(255,255,255,.85)", textShadow: "0 3px 12px #000", letterSpacing: 1 }}>⚡ تک‌روز{title ? ` · ${title}` : ""}</div>
      <div style={{ position: "absolute", bottom: 0, right: 0, height: 10, background: "#ffcc00", width: `${(f / (seconds * fps)) * 100}%` }} />
    </AbsoluteFill>
  );
};
